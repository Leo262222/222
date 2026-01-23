import React, { useState, useEffect } from 'react';
import AdvisorCard from './components/AdvisorCard';
import SpiritGuideChat from './components/SpiritGuideChat';
import AdvisorModal from './components/AdvisorModal';
import QrCodeModal from './components/QrCodeModal';
import { Advisor, Category, ConnectionType, Language } from './types';
import { dataService } from './services/dataService';

const Header = () => (
  <header className="bg-white shadow-sm sticky top-0 z-10">
    <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔮</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Lumina 树洞</h1>
      </div>
    </div>
  </header>
);

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelectCategory }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
    <button onClick={() => onSelectCategory('All')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === 'All' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}>全部</button>
    {categories.map((cat) => (
      <button key={cat.id} onClick={() => onSelectCategory(cat.name)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.name ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}>{cat.name_zh}</button>
    ))}
  </div>
);

function App() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrAdvisor, setQrAdvisor] = useState<Advisor | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedAdvisors = await dataService.getAdvisors();
        const fetchedCategories = await dataService.getCategories();
        setAdvisors(fetchedAdvisors);
        setCategories(fetchedCategories);
      } catch (error) { console.error("加载失败", error); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const filteredAdvisors = activeCategory === 'All' ? advisors : advisors.filter(advisor => advisor.category === activeCategory);

  const handleSelectAdvisor = (advisor: Advisor) => { setSelectedAdvisor(advisor); };
  const handleCloseModal = () => { setSelectedAdvisor(null); };

  // --- 关键修改：打开二维码 ---
  const handleConnect = (advisor: Advisor, type: ConnectionType) => {
    setQrAdvisor(advisor);
    setIsQrOpen(true);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 font-bold animate-pulse">正在连接神秘宇宙...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header />
      <main className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
        <CategoryFilter categories={categories} activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
        {advisors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdvisors.map((advisor) => (
              <AdvisorCard key={advisor.id} advisor={advisor} language={language} onSelect={handleSelectAdvisor} onConnect={handleConnect} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10"><p>暂无顾问数据</p></div>
        )}
      </main>
      <AdvisorModal advisor={selectedAdvisor} language={language} onClose={handleCloseModal} onConnect={handleConnect} />
      
      {/* 扫码弹窗 */}
      <QrCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} imageUrl={qrAdvisor?.bookingQrUrl || ''} advisorName={qrAdvisor?.name || '顾问'} />

      {!isGuideOpen && (
        <button onClick={() => setIsGuideOpen(true)} className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-green-700 to-emerald-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all">
          <i className="fas fa-leaf text-xl"></i>
        </button>
      )}
      <SpiritGuideChat isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} advisors={advisors} language={language} />
    </div>
  );
}

export default App;
