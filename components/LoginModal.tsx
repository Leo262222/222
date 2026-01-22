import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LoginModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onLogin: (email: string, name: string) => void;
}

type LoginMethod = 'password' | 'otp';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, language, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<LoginMethod>('otp'); // Default to OTP for user growth
  
  // OTP State
  const [verificationCode, setVerificationCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const t = TRANSLATIONS[language];

  // Timer Countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!isOpen) return null;

  const handleSendCode = () => {
    if (!email || !email.includes('@')) {
      alert(t.enter_valid_email);
      return;
    }
    // Simulate Sending Code
    setIsCodeSent(true);
    setTimer(60); // 60 seconds cooldown
    
    // Mock Alert for Demo Purposes
    setTimeout(() => {
      alert(t.code_alert);
    }, 500);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (method === 'password') {
      // Simple Password Mock Login
      onLogin(email, email.split('@')[0]);
    } else {
      // OTP Mock Login
      if (verificationCode === '123456') {
        onLogin(email, email.split('@')[0]);
      } else {
        alert(language === 'zh' ? '验证码错误 (Try 123456)' : 'Invalid Code (Try 123456)');
      }
    }
  };

  const handleGoogleLogin = () => {
    onLogin('user@gmail.com', 'Google User');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-[fadeIn_0.3s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i className="fas fa-times"></i>
        </button>

        <h2 className="text-2xl font-serif font-bold text-center mb-6 text-lumina-dark">{t.login_title}</h2>

        {/* Google Login (Always visible) */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 mb-6 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm font-bold text-gray-700"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          {t.login_google}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm text-gray-400">OR</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setMethod('otp')}
            className={`flex-1 py-2 text-sm font-bold transition-colors border-b-2 ${
              method === 'otp' 
                ? 'border-lumina-purple text-lumina-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.tab_otp}
          </button>
          <button
            onClick={() => setMethod('password')}
            className={`flex-1 py-2 text-sm font-bold transition-colors border-b-2 ${
              method === 'password' 
                ? 'border-lumina-purple text-lumina-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.tab_password}
          </button>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              required
              placeholder={t.email_placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-lumina-purple focus:outline-none"
            />
          </div>

          {method === 'password' ? (
            // Password Mode
            <div className="animate-[fadeIn_0.2s_ease-out]">
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password_placeholder}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-lumina-purple focus:outline-none"
              />
            </div>
          ) : (
            // OTP Mode
            <div className="flex gap-2 animate-[fadeIn_0.2s_ease-out]">
              <input 
                type="text" 
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder={t.code_placeholder}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-lumina-purple focus:outline-none tracking-widest text-center"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={timer > 0 || !email}
                className="px-4 py-2 bg-gray-100 text-lumina-purple font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
              >
                {timer > 0 ? `${t.resend_in} ${timer}s` : (isCodeSent ? t.resend_in : t.send_code)}
              </button>
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-3 bg-lumina-purple text-white font-bold rounded-lg hover:bg-lumina-dark transition shadow-lg mt-4"
          >
            {method === 'otp' ? t.login_register : t.login_email}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
