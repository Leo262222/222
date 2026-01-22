import React from 'react';
import { Advisor, ConnectionType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AdvisorCardProps {
  advisor: Advisor;
  language: Language;
  onSelect: (advisor: Advisor) => void;
  onConnect: (advisor: Advisor, type: ConnectionType) => void;
}

const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor, language, onSelect, onConnect }) => {
  const t = TRANSLATIONS[language];
  const name = (language === 'zh' && advisor.name_zh) ? advisor.name_zh : advisor.name;
  const title = (language === 'zh' && advisor.title_zh) ? advisor.title_zh : advisor.title;
  const bio = (language === 'zh' && advisor.bio_zh) ? advisor.bio_zh : advisor.bio;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col">
      {/* Upper Card: Image and Status */}
      <div className="relative h-48 bg-gray-200 cursor-pointer" onClick={() => onSelect(advisor)}>
        <img 
          src={advisor.imageUrl} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold shadow-sm">
          ${advisor.pricePerMinute.toFixed(2)} / {t.min}
        </div>
        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${advisor.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
          <div className={`w-2 h-2 rounded-full bg-white ${advisor.isOnline ? 'animate-pulse' : ''}`}></div>
          {advisor.isOnline ? t.online : t.offline}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-lg font-serif font-bold text-lumina-dark hover:text-lumina-purple cursor-pointer truncate"
            onClick={() => onSelect(advisor)}
          >
            {name}
          </h3>
          <div className="flex items-center text-lumina-gold text-sm">
            <i className="fas fa-star mr-1"></i>
            <span className="font-bold text-gray-800">{advisor.rating}</span>
            <span className="text-gray-400 text-xs ml-1">({advisor.reviewCount})</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-2 font-medium">{title}</p>
        
        <p className="text-xs text-gray-400 mb-4 line-clamp-2 flex-1">
          {bio}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={() => onConnect(advisor, ConnectionType.CHAT)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-lumina-purple text-lumina-purple rounded-lg font-bold text-sm hover:bg-lumina-light transition-colors"
          >
            <i className="far fa-comment-dots"></i> {t.chat}
          </button>
          <button
            onClick={() => onConnect(advisor, ConnectionType.VOICE)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-lumina-purple text-white rounded-lg font-bold text-sm hover:bg-lumina-dark transition-colors shadow-md hover:shadow-lg"
          >
            <i className="fas fa-phone-alt"></i> {t.call}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorCard;
