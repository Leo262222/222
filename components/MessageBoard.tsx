import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

interface MessageBoardProps {
  advisorId: number | string;
  advisorName: string;
  bookingQrUrl?: string;
  onClose: () => void;
}

interface PrivateMessage {
  id: string;
  advisor_id: number;
  session_id: string;
  sender_type: 'user' | 'advisor';
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessageSession {
  id: string;
  advisor_id: number;
  session_id: string;
  user_msg_count: number;
  last_msg_at: string | null;
}

const SESSION_KEY = 'liuzi_session_id';
const FREE_MSG_LIMIT = 10;
const MAX_MSG_LENGTH = 500;
const MIN_SEND_INTERVAL_MS = 5000;

const SENSITIVE_PATTERNS: [RegExp, string][] = [
  [/1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}/g, '手机号'],
  [/\+?\d{2,4}[\s-]\d{6,}/g, '电话号码'],
  [/[\w.+-]+@[\w-]+\.[\w.]{2,}/g, '邮箱地址'],
  [/微信|wx|wechat|vx|v信|威信|加我|加个|私聊/gi, '联系方式关键词'],
  [/[Qq]{2}\s*[:：]?\s*\d{5,}/g, 'QQ号'],
  [/抖音号|小红书号|ins(tagram)?|telegram|tg群|飞机群|whatsapp/gi, '社交平台'],
];

let lastSendTime = 0;

const checkSensitive = (text: string): string | null => {
  for (const [pattern, label] of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return label;
  }

  return null;
};

const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

const fetchMessages = async (
  advisorId: number | string,
  sessionId: string
): Promise<PrivateMessage[]> => {
  const { data, error } = await supabase
    .from('private_messages')
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('获取消息失败:', error);
    return [];
  }

  return (data || []) as PrivateMessage[];
};

const getOrCreateSession = async (
  advisorId: number | string,
  sessionId: string
): Promise<MessageSession | null> => {
  const { data: existing } = await supabase
    .from('message_sessions')
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existing) return existing as MessageSession;

  const { data: created, error } = await supabase
    .from('message_sessions')
    .insert([{ advisor_id: advisorId, session_id: sessionId }])
    .select()
    .single();

  if (error) {
    console.error('创建会话失败:', error);
    return null;
  }

  return created as MessageSession;
};

const sendMessage = async (
  advisorId: number | string,
  sessionId: string,
  content: string,
  honeypot?: string
): Promise<{
  success: boolean;
  error?: string;
  remainingFree?: number;
  limitReached?: boolean;
}> => {
  if (honeypot) {
    return { success: true, remainingFree: FREE_MSG_LIMIT };
  }

  const trimmed = content.trim();

  if (!trimmed) {
    return { success: false, error: '消息不能为空' };
  }

  if (trimmed.length > MAX_MSG_LENGTH) {
    return { success: false, error: `消息最多 ${MAX_MSG_LENGTH} 字` };
  }

  const sensitiveHit = checkSensitive(trimmed);

  if (sensitiveHit) {
    return { success: false, error: '为保护双方权益，消息中不能包含联系方式哦 💜' };
  }

  const now = Date.now();

  if (now - lastSendTime < MIN_SEND_INTERVAL_MS) {
    const waitSec = Math.ceil((MIN_SEND_INTERVAL_MS - (now - lastSendTime)) / 1000);
    return { success: false, error: `发送太快，请 ${waitSec} 秒后再试` };
  }

  const session = await getOrCreateSession(advisorId, sessionId);

  if (!session) {
    return { success: false, error: '创建会话失败，请重试' };
  }

  if (session.user_msg_count >= FREE_MSG_LIMIT) {
    return { success: false, limitReached: true, remainingFree: 0 };
  }

  const { error: insertError } = await supabase
    .from('private_messages')
    .insert([
      {
        advisor_id: advisorId,
        session_id: sessionId,
        sender_type: 'user',
        content: trimmed,
      },
    ]);

  if (insertError) {
    console.error('发送失败:', insertError);
    return { success: false, error: '发送失败，请重试' };
  }

  const newCount = session.user_msg_count + 1;

  await supabase
    .from('message_sessions')
    .update({
      user_msg_count: newCount,
      last_msg_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  lastSendTime = Date.now();

  return {
    success: true,
    remainingFree: FREE_MSG_LIMIT - newCount,
    limitReached: newCount >= FREE_MSG_LIMIT,
  };
};

const subscribeToMessages = (
  advisorId: number | string,
  sessionId: string,
  onNewMessage: (msg: PrivateMessage) => void
) => {
  const channel = supabase
    .channel(`pm-${advisorId}-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `advisor_id=eq.${advisorId}`,
      },
      (payload) => {
        const msg = payload.new as PrivateMessage;

        if (msg.session_id === sessionId) {
          onNewMessage(msg);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

const MessageBoard: React.FC<MessageBoardProps> = ({
  advisorId,
  advisorName,
  bookingQrUrl,
  onClose,
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(FREE_MSG_LIMIT);
  const [limitReached, setLimitReached] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getOrCreateSessionId());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const [msgs, session] = await Promise.all([
        fetchMessages(advisorId, sessionId.current),
        getOrCreateSession(advisorId, sessionId.current),
      ]);

      setMessages(msgs);

      if (session) {
        const rem = FREE_MSG_LIMIT - session.user_msg_count;
        setRemaining(Math.max(0, rem));
        setLimitReached(session.user_msg_count >= FREE_MSG_LIMIT);
      }

      setLoading(false);
    };

    init();
  }, [advisorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(advisorId, sessionId.current, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return unsubscribe;
  }, [advisorId]);

  const handleSend = async () => {
    if (!input.trim() || sending || limitReached) return;

    setError('');
    setSending(true);

    const result = await sendMessage(advisorId, sessionId.current, input.trim(), honeypot);

    if (result.success) {
      const optimisticMsg: PrivateMessage = {
        id: `temp-${Date.now()}`,
        advisor_id: Number(advisorId),
        session_id: sessionId.current,
        sender_type: 'user',
        content: input.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInput('');

      if (result.remainingFree !== undefined) {
        setRemaining(result.remainingFree);
      }

      if (result.limitReached) {
        setLimitReached(true);
      }
    } else if (result.limitReached) {
      setLimitReached(true);
      setRemaining(0);
    } else {
      setError(result.error || '发送失败');
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    return d.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-white">给 {advisorName} 留言</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {limitReached ? '免费额度已用完' : `还剩 ${remaining} 条免费消息`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
          >
            关闭
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <span className="mb-2 text-4xl">💬</span>
              <p className="text-sm">向 {advisorName} 发送第一条消息吧</p>
              <p className="mt-1 text-xs text-slate-600">您的留言是匿名的，只有顾问可见</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender_type === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`mt-1 text-xs ${
                      msg.sender_type === 'user' ? 'text-purple-200' : 'text-slate-500'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {limitReached ? (
          <div className="border-t border-slate-800 bg-slate-900/80 px-5 py-5 text-center">
            <p className="text-sm text-slate-300">
              您的 {FREE_MSG_LIMIT} 条免费留言已用完
            </p>
            <p className="mt-1 text-xs text-slate-500">
              如需继续咨询，请联系客服为您安排深度服务
            </p>

            {bookingQrUrl ? (
              <button
                onClick={() => setShowQr(true)}
                className="mt-4 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
              >
                扫码联系客服
              </button>
            ) : (
              <p className="mt-3 text-xs text-slate-600">暂无客服二维码</p>
            )}
          </div>
        ) : (
          <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-3">
            {error && <p className="mb-2 text-center text-xs text-red-400">{error}</p>}

            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
              aria-hidden="true"
            />

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_MSG_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题..."
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="rounded-2xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-40"
              >
                {sending ? '...' : '发送'}
              </button>
            </div>

            <p className="mt-1.5 text-right text-xs text-slate-600">
              {input.length}/{MAX_MSG_LENGTH}
            </p>
          </div>
        )}

        {showQr && bookingQrUrl && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-2xl">
              <h4 className="mb-2 text-lg font-bold text-gray-800">联系客服</h4>
              <p className="mb-4 text-center text-sm text-gray-500">
                扫描下方二维码添加客服
                <br />
                我们会协助您安排{' '}
                <span className="font-bold text-purple-700">{advisorName}</span> 的咨询服务
              </p>

              <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-2">
                <img
                  src={bookingQrUrl}
                  alt="客服二维码"
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>

              <button
                onClick={() => setShowQr(false)}
                className="mt-4 rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBoard;
