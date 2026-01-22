import React, { useState, useEffect, useRef } from 'react';
import { getSpiritGuideResponse } from '../services/geminiService';
import { ChatMessage, Advisor, Language } from '../types';

interface SpiritGuideChatProps {
  isOpen: boolean;
  onClose: () => void;
  advisors: Advisor[]; 
  language: Language;
}

const SpiritGuideChat: React.FC<SpiritGuideChatProps> = ({ isOpen, onClose, advisors, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message based on language
  useEffect(() => {
    const welcomeText = language === 'zh' 
      ? '你好，远行的游子。我是树洞守护者。这里是安全的避风港。你有什么心事想说，或者想找哪类前辈聊聊？'
      : 'Hello, traveler. I am the Tree Hollow Guardian. This is a safe space. What is on your mind, or what kind of mentor are you looking for?';

    setMessages([{
      id: 'welcome',
      role: 'model',
      text: welcomeText,
      timestamp: new Date()
    }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Pass language to service
      const responseText = await getSpiritGuideResponse(history, userMsg.text, advisors, language);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-green-900/20 animate-[slideInUp_0.3s_ease-out]">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-800 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-serif font-bold">Tree Hollow Guardian</span>
        </div>
        <button onClick={onClose} className="hover:text-gray-300">
          <i className="fas fa-chevron-down"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 h-80 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-700 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'zh' ? "说说你的心事..." : "What's on your mind..."}
            className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-emerald-700 text-white rounded-full hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpiritGuideChat;