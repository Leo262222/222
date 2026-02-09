import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import emailjs from '@emailjs/browser';

// =================================================================
// ✅ EmailJS 配置 (保持你之前的正确配置)
// =================================================================
const EMAILJS_SERVICE_ID = 'service_p6mrruk';   
const EMAILJS_TEMPLATE_ID = 'template_91gwpom'; 
const EMAILJS_PUBLIC_KEY = 'DyTU_U5PGsEAaiz6B'; 
// =================================================================

// --- 类型定义 ---
interface Advisor {
  id: number;
  name: string;
  title: string;
  imageUrl: string;
  yearsExperience: number;
  rating: number;
  specialties: string[];
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  name_zh?: string;
  title_zh?: string;
  bio_zh?: string;
  specialties_zh?: string;
  bookingQrUrl?: string;
  certificates?: string[];
  email?: string; 
  sort_order?: number; // ✅ 新增：排序字段
}

interface Question {
  id: number;
  created_at: string;
  content: string;
  user_email: string;
  advisor_id: number;
  status: string;
}

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

// --- 组件：顾问信箱 (只有顾问能看到) ---
const AdvisorInbox = ({ isOpen, onClose, currentAdvisorId }: { isOpen: boolean, onClose: () => void, currentAdvisorId: number | null }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentAdvisorId) {
      const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('advisor_id', currentAdvisorId) 
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setQuestions(data as Question[]);
        }
        setLoading(false);
      };
      fetchQuestions();
    }
  }, [isOpen, currentAdvisorId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">📬 我的信箱 (顾问端)</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-4">
          {loading ? <div className="text-center text-gray-400 mt-10">加载信件中...</div> : questions.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">📭 暂无新消息</div>
          ) : (
            questions.map(q => (
              <div key={q.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-md font-bold">来自: {q.user_email || '匿名'}</span>
                  <span className="text-xs text-gray-400">{new Date(q.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.content}</p>
                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                   <span className={`text-xs px-2 py-1 rounded ${q.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                     {q.status === 'replied' ? '已回复' : '待处理'}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- 组件：提问箱 (QuestionBox) ---
const QuestionBox = ({ advisor, user, onLoginRequest }: { advisor: Advisor, user: any, onLoginRequest: () => void }) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('questions')
        .insert([{ user_id: user.id, advisor_id: advisor.id, content: content, user_email: user.email }]);

      if (error) throw error;
      
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { to_name: advisor.name_zh, from_email: user.email, message: content },
        EMAILJS_PUBLIC_KEY
      );

      setSentSuccess(true);
      setContent('');
      setTimeout(() => setSentSuccess(false), 5000);
    } catch (err: any) {
      alert('消息保存成功，但邮件通知失败: ' + err.message); 
      setSentSuccess(true); 
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 mb-6"> 
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><span className="bg-purple-100 text-purple-600 p-1 rounded-md">💌</span> 向TA提问</h4>
        <span className="text-[10px] text-gray-400">仅你和顾问可见</span>
      </div>
      <div className="bg-white border border-purple-100 rounded-xl shadow-sm overflow-hidden relative">
        {!user ? (
          <div className="bg-gray-50 p-6 text-center border-dashed border-2 border-gray-200 rounded-xl">
            <p className="text-xs text-gray-500 mb-3 font-medium">登录后即可发送私信</p>
            <button onClick={onLoginRequest} className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 mx-auto"><span>🔒</span> 登录并提问</button>
          </div>
        ) : sentSuccess ? (
          <div className="p-8 text-center bg-green-50 animate-fade-in"><div className="text-4xl mb-2">✅</div><h5 className="text-sm font-bold text-green-800">发送成功！</h5></div>
        ) : (
          <div className="p-1">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Hi ${advisor.name_zh || '老师'}...`} className="w-full h-28 p-4 text-sm border-none focus:ring-0 outline-none resize-none bg-transparent placeholder-gray-400"/>
            <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-t border-gray-100">
              <span className="text-[10px] text-gray-400">系统将即时通知顾问</span>
              <button onClick={handleSend} disabled={sending || !content.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-bold px-4 py-2 rounded-lg">{sending ? '...' : '发送'} ➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- LoginModal ---
const LoginModal = ({ isOpen, onClose, onLoginSuccess }: any) => {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [step, setStep] = useState<'email' | 'code'>('email'); const [token, setToken] = useState('');
  if (!isOpen) return null;
  const handleSendCode = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setMessage(''); const { error } = await supabase.auth.signInWithOtp({ email }); if (error) setMessage(error.message); else { setStep('code'); setMessage('✅ 验证码已发送'); } setLoading(false); };
  const handleVerifyCode = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' }); if (error) setMessage(error.message); else { onLoginSuccess(); onClose(); } setLoading(false); };
  const handleGoogleLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div><div className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-bounce-in"><button onClick={onClose} className="absolute top-4 right-4 text-gray-400">✕</button><h2 className="text-2xl font-bold mb-2">欢迎来到树洞</h2>{step === 'email' && (<><button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-2.5 rounded-xl mb-4"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Google 一键登录</button><div className="text-center text-sm text-gray-400 mb-4">- 或使用邮箱 -</div></>)}{step === 'email' ? (<form onSubmit={handleSendCode} className="space-y-4"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" className="w-full px-4 py-3 rounded-xl border" required /><button type="submit" disabled={loading} className="w-full bg-[#1a202c] text-white font-bold py-3 rounded-xl">{loading ? '...' : '发送验证码'}</button></form>) : (<form onSubmit={handleVerifyCode} className="space-y-4"><input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="6位验证码" className="w-full px-4 py-3 rounded-xl border text-center font-bold" required /><button type="submit" disabled={loading} className="w-full bg-[#1a202c] text-white font-bold py-3 rounded-xl">{loading ? '...' : '登录'}</button></form>)}{message && <p className="mt-4 text-center text-xs text-red-500">{message}</p>}</div></div>
  );
};

// --- UserMenu ---
const UserMenu = ({ user, onLogout, onOpenInbox, matchedAdvisorId }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const handleClickOutside = (event: any) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
  const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=10B981&color=fff`;

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 hover:opacity-80 transition-opacity"><img src={avatarUrl} alt="User" className="w-9 h-9 rounded-full border-2 border-green-500 shadow-sm" /></button>
      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-scale-in origin-top-right">
          <div className="px-5 py-3 border-b border-gray-50"><p className="text-xs text-gray-400 font-medium">当前账号</p><p className="text-sm font-bold text-gray-900 truncate mt-1">{user.email}</p></div>
          <div className="py-1">
            {matchedAdvisorId && (
              <button onClick={() => { setIsOpen(false); onOpenInbox(); }} className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2">
                <span className="text-lg">📬</span> 我的顾问信箱
              </button>
            )}
            <button onClick={onLogout} className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"><span className="text-lg">🚪</span> 退出登录</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 主程序 (App) ---
function App() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [myAdvisorId, setMyAdvisorId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    // ✅ 数据加载逻辑：加入自定义排序
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: advisorsData } = await supabase
          .from('advisors')
          .select('*')
          // ⚠️ 核心修改：先按 sort_order (升序: 1在前)，再按 rating (降序: 高分在前)
          .order('sort_order', { ascending: true }) 
          .order('rating', { ascending: false });
          
        setAdvisors((advisorsData as any) || []);
        
        const { data: catData } = await supabase.from('categories').select('*').order('id', { ascending: true });
        setCategories([{ id: 0, value: 'All', label: '全部' }, ...(catData || [])]);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (user && advisors.length > 0) {
      const me = advisors.find(adv => adv.email === user.email);
      setMyAdvisorId(me ? me.id : null);
    } else {
      setMyAdvisorId(null);
    }
  }, [user, advisors]);

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const filteredAdvisors = selectedCategory === 'All' ? advisors : advisors.filter(a => (a.category || '').includes(selectedCategory));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsLoginOpen(false)} />
      <AdvisorInbox isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} currentAdvisorId={myAdvisorId} />

      <header className={`bg-[#1a202c] text-white px-4 shadow-lg sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex-1"><div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}><span className="text-2xl">🌲</span><h1 className="text-xl font-bold tracking-wide">留子树洞</h1></div><p className={`text-xs text-gray-400 mt-1 pl-9 transition-all duration-300 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>树洞藏秘密，神谕断情关。</p></div>
          <div className="flex-shrink-0 ml-4">
            {user ? (
              <UserMenu user={user} onLogout={handleLogout} onOpenInbox={() => setIsInboxOpen(true)} matchedAdvisorId={myAdvisorId} />
            ) : (
              <button onClick={() => setIsLoginOpen(true)} className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><span>🚀</span> 登录 / 注册</button>
            )}
          </div>
        </div>
        {!isScrolled && (<div className="max-w-6xl mx-auto mt-4 md:mt-6 animate-slide-down"><div className="bg-white/5 rounded-lg border border-white/10 text-xs sm:text-sm text-gray-300 p-3 leading-relaxed">留子专属的情感避风港。无论是异地恋的煎熬、无法言说的Crush、还是亲朋关系&学业工作，连线懂你的玄学导师，将心中困惑化为指引的灯塔。</div></div>)}
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-4 sticky top-[70px] z-30"> 
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar"> {categories.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.value)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat.value ? 'bg-purple-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{cat.label.includes('(') ? cat.label.split('(')[0] : cat.label}</button>))} </div>
      </div>
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {loading ? (<div className="text-center py-20 text-gray-400"><p className="animate-pulse">✨ 正在连接宇宙能量...</p></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {filteredAdvisors.map(advisor => {
               return <div key={advisor.id} onClick={() => setSelectedAdvisor(advisor)} className="group bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-row md:flex-col items-start md:items-center md:text-center gap-4 md:gap-6 relative overflow-hidden"><div className="relative shrink-0"><img src={advisor.imageUrl} className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-2 border-white shadow-md bg-gray-100 group-hover:scale-105 transition-transform duration-500" loading="lazy" />{advisor.isOnline && <div className="hidden md:block absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}</div><div className="flex-1 min-w-0 w-full flex flex-col md:items-center"><div className="flex md:flex-col justify-between md:justify-center items-start md:items-center w-full mb-1 md:mb-3"><h3 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{advisor.name_zh || advisor.name}</h3><div className="flex items-center text-yellow-500 text-xs md:text-sm font-bold bg-yellow-50 px-2 py-0.5 rounded md:mt-2"><span>★ {advisor.rating}</span><span className="hidden md:inline text-gray-400 font-normal ml-1">({advisor.yearsExperience}年)</span></div></div><p className="text-xs md:text-base text-gray-500 font-medium mb-2 md:mb-4 truncate">{advisor.title_zh || advisor.title}</p><div className="flex md:flex-col justify-between items-center w-full border-t md:border-t-0 border-gray-50 pt-3 md:pt-0 mt-auto"><div className="md:mb-4"><span className="text-sm md:text-3xl font-bold text-gray-900">$ {advisor.pricePerMinute}</span><span className="text-xs md:text-sm text-gray-400"> / 分</span></div><div className="hidden md:block w-full"><button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"><span className="text-xl">📞</span> 立即连线</button></div></div></div></div>
            })}
          </div>
        )}
      </main>

      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAdvisor(null)}></div><div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up"><div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b px-6 py-4 flex justify-between items-center"><h3 className="font-bold text-lg">顾问详情</h3><button onClick={() => setSelectedAdvisor(null)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200">✕</button></div><div className="p-6 space-y-6"><div className="text-center"><img src={selectedAdvisor.imageUrl} className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-purple-50 shadow-lg mb-4"/><h2 className="text-2xl font-bold text-gray-900">{selectedAdvisor.name_zh}</h2><p className="text-purple-600 font-medium text-sm mt-1">{selectedAdvisor.title_zh}</p><div className="flex justify-center gap-6 mt-6"><div className="text-center"><div className="text-xl font-bold text-gray-900">${selectedAdvisor.pricePerMinute}</div><div className="text-xs text-gray-400">每分钟</div></div><div className="w-px bg-gray-200 h-10"></div><div className="text-center"><div className="text-xl font-bold text-gray-900">{selectedAdvisor.yearsExperience}年</div><div className="text-xs text-gray-400">经验</div></div><div className="w-px bg-gray-200 h-10"></div><div className="text-center"><div className="text-xl font-bold text-gray-900">{selectedAdvisor.rating}</div><div className="text-xs text-gray-400">评分</div></div></div></div><div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed">{selectedAdvisor.bio_zh || "暂无简介"}</div>{(selectedAdvisor.certificates || []).length > 0 && (<div><h4 className="text-sm font-bold text-gray-900 mb-3 mt-2">资质认证</h4><div className="flex gap-3 overflow-x-auto pb-2">{selectedAdvisor.certificates?.map((cert, idx) => (<img key={idx} src={cert} onClick={() => setSelectedCertificate(cert)} className="h-20 rounded-lg border cursor-zoom-in" />))}</div></div>)}<QuestionBox advisor={selectedAdvisor} user={user} onLoginRequest={() => { setSelectedAdvisor(null); setIsLoginOpen(true); }} /><div className="bg-purple-50 rounded-xl p-6 border border-purple-100 text-center">{selectedAdvisor.bookingQrUrl ? (<><img src={selectedAdvisor.bookingQrUrl} className="w-32 h-32 mx-auto mix-blend-multiply mb-2"/><p className="text-xs text-purple-500">长按识别二维码，添加顾问微信</p></>) : <p className="text-gray-400 text-sm">暂无联系方式</p>}</div></div></div></div>
      )}
      {selectedCertificate && <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedCertificate(null)}><img src={selectedCertificate} className="max-w-full max-h-full rounded-lg"/></div>}
      <footer className="text-center text-gray-300 text-[10px] py-8"><p>© 2026 Liuzi Tree Hollow.</p></footer>
    </div>
  );
}

export default App;
