import React, { useState, useEffect, useRef } from 'react';
import { Advisor, ConnectionType, Language, User, ChatMessage } from '../types';
import { TRANSLATIONS } from '../constants';

interface ActiveSessionProps {
  advisor: Advisor;
  type: ConnectionType;
  language: Language;
  user: User;
  onEndSession: (duration: number, cost: number) => void;
  onUpdateBalance: (cost: number) => void;
  onMessageSent: () => void;
  onTriggerPayment: () => void;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ 
  advisor, 
  type, 
  language, 
  user,
  onEndSession, 
  onUpdateBalance,
  onMessageSent,
  onTriggerPayment
}) => {
  const [seconds, setSeconds] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  // Billing Tick (Only for Voice, or potentially Paid Chat later)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    // Only charge time for VOICE, or if we decide paid chat is time-based.
    // Requirement: Chat is "5 free messages", so we don't charge time for Chat initially.
    if (type === ConnectionType.VOICE) {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1);
        
        // Calculate cost per second (simplified)
        const costPerSecond = advisor.pricePerMinute / 60;
        
        // Update local cost
        setTotalCost(prev => prev + costPerSecond);
        
        // Deduct from main wallet
        onUpdateBalance(costPerSecond);

      }, 1000);
    } else {
        // Just track duration for Chat without billing time
        timer = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }

    return () => clearInterval(timer);
  }, [type, advisor.pricePerMinute, onUpdateBalance]);

  // Auto-end if balance runs out (Only applicable for Voice in this new logic)
  useEffect(() => {
    if (type === ConnectionType.VOICE && user.balance <= 0) {
      onEndSession(seconds, totalCost);
      alert(t.insufficient_funds);
    }
  }, [user.balance, type, onEndSession, seconds, totalCost, t.insufficient_funds]);

  // Chat Auto-scroll
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
      if (!chatInput.trim()) return;

      // Logic: 5 Free Messages Limit
      // If user hasn't paid (bound card), enforce limit.
      if (!user.hasPaymentMethod) {
          if (user.dailyMessagesCount >= 5) {
              alert(t.limit_reached + " " + t.bind_card_prompt);
              onTriggerPayment();
              return;
          }
      }

      // Send Message
      const newMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: chatInput,
          timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
      onMessageSent(); // Increment counter in App state

      // Simulate Advisor Reply
      setTimeout(() => {
        const reply: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: language === 'zh' ? "我感受到了你的能量..." : "I sense your energy...",
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, reply]);
      }, 1500);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col items-center justify-center animate-[fadeIn_0.5s]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lumina-purple rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className={`relative z-10 w-full max-w-lg p-6 ${type === ConnectionType.CHAT ? 'h-full flex flex-col' : ''}`}>
        
        {/* Header Section */}
        <div className="text-center mb-6 shrink-0">
            <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-tr from-lumina-gold to-lumina-purple mb-4 animate-spin-slow">
                <img src={advisor.imageUrl} alt={advisor.name} className="w-full h-full rounded-full object-cover border-4 border-gray-900" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-white mb-1">{advisor.name}</h2>
            <p className="text-lumina-light flex items-center justify-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {type === ConnectionType.VOICE ? t.call : t.chat} {t.session_active}
            </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
             <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t.duration}</div>
             <div className="text-xl font-mono text-white">{formatTime(seconds)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
             <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                {type === ConnectionType.VOICE ? t.cost : t.free_msgs_left}
             </div>
             <div className="text-xl font-mono text-lumina-gold">
                {type === ConnectionType.VOICE 
                  ? `$${totalCost.toFixed(2)}` 
                  : (!user.hasPaymentMethod ? Math.max(0, 5 - user.dailyMessagesCount) : '∞')
                }
             </div>
          </div>
        </div>

        {/* VOICE UI */}
        {type === ConnectionType.VOICE && (
            <div className="flex justify-center items-center gap-6 mt-4">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
                <i className={`fas fa-${isMuted ? 'microphone-slash' : 'microphone'}`}></i>
            </button>
            
            <button 
                onClick={() => onEndSession(seconds, totalCost)}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 flex items-center justify-center text-3xl text-white transition transform hover:scale-105"
            >
                <i className="fas fa-phone-slash"></i>
            </button>

            <button className="w-14 h-14 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xl transition">
                <i className="fas fa-volume-up"></i>
            </button>
            </div>
        )}

        {/* CHAT UI */}
        {type === ConnectionType.CHAT && (
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex flex-col overflow-hidden">
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10 italic">
                        {language === 'zh' ? '开始咨询...' : 'Start your reading...'}
                    </div>
                )}
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-lumina-purple text-white' : 'bg-white text-gray-900'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black/20 border-t border-white/10">
                <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 transition" 
                        placeholder={language === 'zh' ? "输入消息..." : "Type a message..."}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="w-10 h-10 rounded-full bg-lumina-gold text-lumina-dark font-bold flex items-center justify-center hover:bg-white transition"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>

             {/* Close Chat Button (Top Right Absolute) */}
             <button 
                onClick={() => onEndSession(seconds, totalCost)}
                className="absolute top-[-10px] right-[-10px] w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-red-600 z-50 md:hidden"
             >
                <i className="fas fa-times"></i>
             </button>
             <button 
                onClick={() => onEndSession(seconds, totalCost)}
                className="hidden md:block absolute top-4 right-4 text-white/50 hover:text-white"
             >
                <i className="fas fa-times text-2xl"></i>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSession;
