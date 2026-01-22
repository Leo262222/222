import React, { useState, useMemo, useEffect } from 'react';
import { TRANSLATIONS } from './constants';
import { Advisor, ConnectionType, Language, Category } from './types';
import AdvisorCard from './components/AdvisorCard';
import AdvisorModal from './components/AdvisorModal';
import SpiritGuideChat from './components/SpiritGuideChat';
import BookingModal from './components/BookingModal';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  // Application State - Load from Service
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState<Language>('zh');

  // Load Data on Mount
  useEffect(() => {
    const loadData = () => {
        setAdvisors(dataService.getAdvisors());
        setCategories(dataService.getCategories());
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Modal States
  const [bookingModal, setBookingModal] = useState<{isOpen: boolean, advisor: Advisor | null}>({isOpen: false, advisor: null});
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [isSpiritGuideOpen, setIsSpiritGuideOpen] = useState(false);

  // Translations
  const t = TRANSLATIONS[language];

  // Filter Logic
  const filteredAdvisors = useMemo(() => {
    return advisors.filter(advisor => {
      const matchesCategory = selectedCategory === 'All' || advisor.category === selectedCategory;
      
      const name = (language === 'zh' && advisor.name_zh) ? advisor.name_zh : advisor.name;
      const specialties = (language === 'zh' && advisor.specialties_zh) ? advisor.specialties_zh : advisor.specialties;

      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, advisors, language]);

  // Helper to get displayed category name
  const getCategoryDisplayName = (catKey: string) => {
      if (catKey === 'All') return language === 'zh' ? '全部' : 'All';
      const cat = categories.find(c => c.name === catKey);
      return cat ? (language === 'zh' ? cat.name_zh : cat.name) : catKey;
  };

  // --- Handlers ---

  const handleConnect = (advisor: Advisor, type: ConnectionType) => {
    setBookingModal({ isOpen: true, advisor });
    if(selectedAdvisor) setSelectedAdvisor(null);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleNavigateAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    const event = new CustomEvent('lumina-route-change', { detail: { view: 'admin' } });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            {/* Tree Icon for Tree Hollow */}
            <i className="fas fa-tree text-green-700 text-2xl"></i>
            <span className="text-2xl font-serif font-bold text-gray-800 tracking-wide">{t.app_name}</span>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={toggleLanguage}
               className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
             >
               {t.switch_lang}
             </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-lumina-dark text-white py-16 overflow-hidden">
        {/* Changed BG ID to something more tree/nature like or just abstract */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/id/1018/1920/600')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-lumina-dark/80 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
              {t.hero_title}
            </h1>
            <p className="text-lg text-gray-200 mb-8 font-light">
              {t.hero_subtitle}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <input 
                type="text" 
                placeholder={t.search_placeholder} 
                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fas fa-search absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        
        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-8 scrollbar-hide">
          <button
              onClick={() => setSelectedCategory('All')}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === 'All'
                  ? 'bg-lumina-purple text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
             {language === 'zh' ? '全部' : 'All'}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === cat.name 
                  ? 'bg-lumina-purple text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {language === 'zh' ? cat.name_zh : cat.name}
            </button>
          ))}
        </div>

        {/* Advisor Grid */}
        <div className="mb-4 flex items-center justify-between">
           <h2 className="text-xl font-bold text-gray-800">
             {selectedCategory === 'All' 
               ? t.top_rated 
               : `${getCategoryDisplayName(selectedCategory)} ${t.experts}`}
           </h2>
           <span className="text-sm text-gray-500">{filteredAdvisors.length} {t.advisors_available}</span>
        </div>

        {filteredAdvisors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAdvisors.map(advisor => (
              <AdvisorCard 
                key={advisor.id} 
                advisor={advisor} 
                language={language}
                onSelect={setSelectedAdvisor}
                onConnect={handleConnect}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <i className="fas fa-tree text-4xl mb-4 text-gray-300"></i>
            <p>{t.no_results}</p>
            <button 
               onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
               className="mt-4 text-lumina-purple font-bold hover:underline"
            >
              {t.clear_filters}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-tree text-green-600 text-xl"></i>
              <span className="text-xl font-serif font-bold text-white tracking-wide">{t.app_name}</span>
            </div>
            <p className="text-sm text-gray-400">
              {t.footer_text}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">{t.discover}</h4>
            <ul className="space-y-2 text-sm">
               {categories.slice(0, 3).map(cat => (
                  <li key={cat.id}><a href="#" className="hover:text-white">{language === 'zh' ? cat.name_zh : cat.name}</a></li>
               ))}
            </ul>
          </div>

          <div>
             <h4 className="font-bold text-white mb-4">{t.support}</h4>
             <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">{language === 'zh' ? '帮助中心' : 'Help Center'}</a></li>
              <li><a href="#" className="hover:text-white">{language === 'zh' ? '申请成为倾听者' : 'Apply to Listen'}</a></li>
              <li><a href="#" className="hover:text-white">{language === 'zh' ? '隐私政策' : 'Privacy Policy'}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">{t.download}</h4>
            <div className="flex gap-2">
               <button className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700 transition">
                 <i className="fab fa-apple"></i>
               </button>
               <button className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700 transition">
                 <i className="fab fa-google-play"></i>
               </button>
            </div>
          </div>
        </div>
        
        {/* Copyright Bar with Admin Link */}
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">&copy; 2024 Liuzi Tree Hollow. All rights reserved.</p>
            {/* 
              Clicking this will now dynamically switch the root view to Admin without full reload
            */}
            <a href="?app=admin" onClick={handleNavigateAdmin} className="text-xs text-gray-600 hover:text-white transition mt-4 md:mt-0 flex items-center gap-2 cursor-pointer">
                <i className="fas fa-lock"></i> {t.staff_login}
            </a>
        </div>
      </footer>

      {/* --- Overlays & Modals --- */}
      
      <BookingModal 
        isOpen={bookingModal.isOpen}
        advisor={bookingModal.advisor}
        language={language}
        onClose={() => setBookingModal({isOpen: false, advisor: null})}
      />

      <AdvisorModal 
        advisor={selectedAdvisor} 
        language={language}
        onClose={() => setSelectedAdvisor(null)} 
        onConnect={handleConnect}
      />

      <SpiritGuideChat 
        isOpen={isSpiritGuideOpen} 
        onClose={() => setIsSpiritGuideOpen(false)}
        advisors={advisors}
        language={language}
      />

      {/* Mobile Floating Action Button for AI */}
      {!isSpiritGuideOpen && (
        <button 
          onClick={() => setIsSpiritGuideOpen(true)}
          className="fixed bottom-4 right-4 md:hidden z-40 bg-lumina-purple text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-lumina-dark transition-colors animate-bounce"
        >
          <i className="fas fa-sparkles text-xl"></i>
        </button>
      )}
    </div>
  );
};

export default App;