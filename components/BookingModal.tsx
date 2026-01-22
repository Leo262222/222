import React from 'react';
import { Advisor, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  advisor: Advisor | null;
  language: Language;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, advisor, language, onClose }) => {
  if (!isOpen || !advisor) return null;

  const t = TRANSLATIONS[language];
  const name = (language === 'zh' && advisor.name_zh) ? advisor.name_zh : advisor.name;
  
  // Default QR if not provided
  const qrUrl = advisor.bookingQrUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LuminaDefaultCS';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition text-gray-500"
        >
            <i className="fas fa-times"></i>
        </button>

        <div className="w-20 h-20 rounded-full p-1 bg-lumina-purple mb-4">
            <img src={advisor.imageUrl} alt={name} className="w-full h-full rounded-full object-cover border-2 border-white" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-1">{t.scan_to_book}</h3>
        <p className="text-lumina-purple font-semibold mb-6">{name}</p>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 shadow-inner">
            <img src={qrUrl} alt="Booking QR Code" className="w-48 h-48 object-contain" />
        </div>

        <p className="text-sm text-gray-500 leading-relaxed">
            {t.booking_desc}
        </p>
      </div>
    </div>
  );
};

export default BookingModal;