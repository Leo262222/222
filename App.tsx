import React, { useState, useEffect, useMemo } from 'react';
import AdvisorCard from './components/AdvisorCard';
import SpiritGuideChat from './components/SpiritGuideChat';
import AdvisorModal from './components/AdvisorModal';
import QrCodeModal from './components/QrCodeModal';
import { Advisor, Category, ConnectionType, Language } from './types';
import { dataService } from './services/dataService';

// --- 紧凑版 Hero 头部 ---
const HeroSection = ({ onSearch }: { onSearch: (term: string) => void }) => (
  <div className="bg-gradient-to-r from-[#0f392b] to-[#2e1a47] text-white pt-4 pb-8 px-3 relative overflow-hidden shadow-md">
    {/* 顶部导航：高度压缩 */}
    <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
      <div className="flex items-center gap-1.5 text-lg font-bold tracking-wide">
        <span className="text-xl">🌲</span> 
        <span>留子树洞</span>
      </div>
      <div className="flex gap-2">
        <button className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] transition-colors">
          En
        </button>
        <button className="w-6 h-6 rounded-full bg-pink-600 hover:bg-pink-700 flex items-center justify-center text-[10px] transition-colors shadow-lg">
          中
        </button>
      </div>
    </div>

    {/* 主标题：字号调小，间距调小 */}
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-serif font-bold mb-3 tracking-wide leading-tight">
        树洞藏秘密，神谕断情关。
      </h1>
      <p className="text-gray-300 mb-6 max-w-xl text-xs md:text-sm leading-relaxed opacity-90 line-clamp-2 md:line-clamp-none">
        留子专属情感避风港。连线懂你的玄学导师，将异乡秘密化为指引情路的答案。
      </p>

      {/* 搜索框：高度更小，更精致 */}
      <div className="relative max-w-sm group">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs group-focus-within:text-white transition-colors"></i>
        <input 
          type="text" 
          placeholder="搜索倾听者..." 
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-white/10 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all backdrop-blur-md shadow-inner"
        />
      </div>
    </div>
  </div>
);

// --- 紧凑版分类过滤器 ---
interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelectCategory }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
    <button
      onClick={() => onSelectCategory('All')}
      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border ${
        activeCategory === 'All'
          ? 'bg-[#2e1a47] text-white border-[#2e1a47]'
          : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
      }`}
    >
      全部
    </button>
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onSelectCategory(cat.name)}
        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border ${
          activeCategory === cat.name
            ? 'bg-[#2e1a47] text-white border-[#2e1a47]'
            : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
        }`}
      >
        {cat.name_zh}
      </button>
    ))}
  </div>
);

// --- 主程序 App ---
function App() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
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
      } catch (error) {
        console.error("加载数据失败", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredAdvisors = useMemo(() => {
    return advisors.filter(advisor => {
      const matchCategory = activeCategory === 'All' || advisor.category === activeCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || 
        advisor.name.toLowerCase().includes(term) ||
        (advisor.bio && advisor.bio.toLowerCase().includes(term)) ||
        (advisor.specialties && advisor.specialties.some(s => s.toLowerCase().includes(term)));
      
      return matchCategory && matchSearch;
    });
  }, [advisors, activeCategory, searchTerm]);

  const onlineCount = advisors.filter(a => a.isOnline).length;
  const handleSelectAdvisor = (advisor: Advisor) => setSelectedAdvisor(advisor);
  const handleCloseModal = () => setSelectedAdvisor(null);
  const handleConnect = (advisor: Advisor, type: ConnectionType) => {
    setQrAdvisor(advisor);
    setIsQrOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[#2e1a47] font-bold animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2e1a47] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">连接宇宙中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] relative font-sans">
      <HeroSection onSearch={setSearchTerm} />
      
      <main className="max-w-5xl mx-auto px-3 -mt-4 relative z-10 pb-20">
        
        {/* 过滤器：更加紧凑 */}
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm mb-4 border border-gray-100 flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
             <CategoryFilter 
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </div>
          {/* 在线人数放这里更省空间 */}
          <div className="pl-2 border-l border-gray-100 ml-2 hidden md:block">
             <span className="text-[10px] text-gray-400 whitespace-nowrap">
              <span className="text-green-500 font-bold mr-1">●</span>
              {onlineCount}在线
            </span>
          </div>
        </div>
        
        {/* 移动端显示的简易在线人数 */}
        <div className="flex md:hidden justify-end mb-2 px-1">
           <span className="text-[10px] text-gray-400">
              <span className="text-green-500 font-bold mr-1">●</span>
              {onlineCount}人在线
            </span>
        </div>

        {/* 顾问列表：核心修改 */}
        {/* grid-cols-2 (手机双列) | md:grid-cols-3 (平板三列) | lg:grid-cols-4 (电脑四列) */}
        {/* gap-3 (间距由6改为3，更密) */}
        {advisors.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredAdvisors.map((advisor) => (
              <AdvisorCard 
                key={advisor.id} 
                advisor={advisor}
                language={language}        
                onSelect={handleSelectAdvisor} 
                onConnect={handleConnect}      
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12 flex flex-col items-center bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
            <i className="fas fa-wind text-2xl mb-2 opacity-20"></i>
            <p className="text-sm">暂无顾问</p>
          </div>
        )}
      </main>

      <AdvisorModal 
        advisor={selectedAdvisor}
        language={language}
        onClose={handleCloseModal}
        onConnect={handleConnect}
      />

      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        imageUrl={qrAdvisor?.bookingQrUrl || ''}
        advisorName={qrAdvisor?.name || '顾问'}
      />

      {!isGuideOpen && (
        <button
          onClick={() => setIsGuideOpen(true)}
          className="fixed bottom-6 right-4 z-40 bg-[#2e1a47] text-white p-3 rounded-full shadow-lg hover:scale-105 transition-all duration-300 border border-white/20"
        >
          <i className="fas fa-leaf text-lg"></i>
        </button>
      )}

      <SpiritGuideChat 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        advisors={advisors} 
        language={language}
      />
    </div>
  );
}

export default App;
