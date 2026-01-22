import React from 'react';
import { Advisor, ConnectionType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AdvisorModalProps {
  advisor: Advisor | null;
  language: Language;
  onClose: () => void;
  onConnect: (advisor: Advisor, type: ConnectionType) => void;
}

const AdvisorModal: React.FC<AdvisorModalProps> = ({ advisor, language, onClose, onConnect }) => {
  if (!advisor) return null;

  const t = TRANSLATIONS[language];
  const name = (language === 'zh' && advisor.name_zh) ? advisor.name_zh : advisor.name;
  const title = (language === 'zh' && advisor.title_zh) ? advisor.title_zh : advisor.title;
  const bio = (language === 'zh' && advisor.bio_zh) ? advisor.bio_zh : advisor.bio;
  const specialties = (language === 'zh' && advisor.specialties_zh) ? advisor.specialties_zh : advisor.specialties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-[fadeIn_0.3s_ease-out]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full transition-colors"
        >
          <i className="fas fa-times text-gray-700"></i>
        </button>

        {/* Left Side: Photo & Quick Stats */}
        <div className="md:w-1/3 bg-gray-50 p-6 flex flex-col items-center border-r border-gray-100">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
            <img src={advisor.imageUrl} alt={name} className="w-full h-full object-cover" />
          </div>
          
          <h2 className="text-2xl font-serif font-bold text-lumina-dark text-center mb-1">{name}</h2>
          <p className="text-sm text-lumina-purple font-semibold mb-4 text-center">{title}</p>
          
          <div className="w-full space-y-3 mb-6">
             <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">{t.rate}</span>
                <span className="font-bold">${advisor.pricePerMinute.toFixed(2)}/{t.min}</span>
             </div>
             <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">{t.experience}</span>
                <span className="font-bold">{advisor.yearsExperience} {t.years}</span>
             </div>
             <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">{t.reviews}</span>
                <span className="font-bold">{advisor.reviewCount}</span>
             </div>
          </div>

          <div className="w-full flex flex-col gap-2 mt-auto">
             <button 
                onClick={() => onConnect(advisor, ConnectionType.CHAT)}
                className="w-full py-3 bg-white border-2 border-lumina-purple text-lumina-purple font-bold rounded-lg hover:bg-lumina-light transition-colors flex items-center justify-center gap-2"
             >
               <i className="far fa-comment-dots"></i> {t.chat_now}
             </button>
             <button 
                onClick={() => onConnect(advisor, ConnectionType.VOICE)}
                className="w-full py-3 bg-lumina-purple text-white font-bold rounded-lg hover:bg-lumina-dark transition-colors shadow-lg flex items-center justify-center gap-2"
             >
               <i className="fas fa-phone-alt"></i> {t.call_now}
             </button>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="md:w-2/3 p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-l-4 border-lumina-gold pl-3">{t.about_me}</h3>
            <p className="text-gray-600 leading-relaxed">{bio}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-lumina-gold pl-3">{t.specialties}</h3>
            <div className="flex flex-wrap gap-2">
              {specialties.map((spec, index) => (
                <span key={index} className="px-3 py-1 bg-lumina-light text-lumina-purple text-sm rounded-full font-medium">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Certificates Section */}
          {advisor.certificates && advisor.certificates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-lumina-gold pl-3">{t.credentials}</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {advisor.certificates.map((cert, index) => (
                  <div key={index} className="flex-shrink-0 w-32 h-24 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative">
                    <img src={cert} alt={`Certificate ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-lumina-gold pl-3">{t.recent_reviews}</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {advisor.reviews.length > 0 ? advisor.reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-gray-800">{review.user}</span>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                  <div className="text-lumina-gold text-xs mb-2">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`fas fa-star ${i < review.rating ? '' : 'text-gray-300'}`}></i>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                </div>
              )) : (
                <p className="text-gray-400 italic">{t.no_reviews}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorModal;
