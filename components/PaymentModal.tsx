import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface PaymentModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, language, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(amount);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.3s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i className="fas fa-times"></i>
        </button>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-wallet text-lumina-purple"></i> {t.payment_title}
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[10, 20, 50].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`py-3 rounded-lg border-2 font-bold transition ${
                amount === val 
                ? 'border-lumina-purple bg-lumina-light text-lumina-purple' 
                : 'border-gray-200 hover:border-lumina-purple/50'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          <div className="space-y-2">
            <input 
              placeholder={t.card_name}
              className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lumina-purple"
              required
            />
            <div className="relative">
               <input 
                placeholder={t.card_number}
                className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lumina-purple pl-10"
                required
              />
              <i className="fab fa-cc-visa absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder={t.expiry}
                className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lumina-purple"
                required
              />
              <input 
                placeholder={t.cvc}
                type="password"
                maxLength={3}
                className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lumina-purple"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-lumina-dark text-white font-bold rounded-lg hover:bg-black transition shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <>
                <i className="fas fa-lock"></i> {t.pay_now} ${amount}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
