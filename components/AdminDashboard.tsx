import React, { useState, useEffect, useMemo } from 'react';
import AdvisorCard from './components/AdvisorCard';
import SpiritGuideChat from './components/SpiritGuideChat';
import AdvisorModal from './components/AdvisorModal';
import QrCodeModal from './components/QrCodeModal';
import { Advisor, Category, ConnectionType, Language } from './types';
import { dataService } from './services/dataService';

// --- 新版 Hero 头部组件 (还原最初设计) ---
const HeroSection = ({ onSearch }: { onSearch: (term: string) => void }) => (
  <div className="bg-gradient-to-r from-[#0f392b] to-[#2e1a47] text-white pt-6 pb-16 px-4 relative overflow-hidden">
    {/* 顶部导航 */}
    <div className="max-w-7xl mx-auto flex justify-between items-center mb-16">
      <div className="flex items-center gap-2 text-xl font-bold tracking-wide">
        <span className="text-2xl">🌲</span> 
        <span>留子树洞</span>
      </div>
      <div className="flex gap-3">
        <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs transition-colors">
          En
        </button>
        <button className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-700 flex items-center justify-center text-xs transition-colors shadow-lg">
          中
        </button>
      </div>
    </div>

    {/* 主标题内容 */}
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-wide leading-tight">
        树洞藏秘密，神谕断情关。
      </h1>
      <p className="text-gray-300 mb-10 max-w-2xl text-sm md:text-base leading-relaxed opacity-90">
        留子专属的情感避风港。无论是异地恋的煎熬、无法言说的Crush、还是深夜的孤独，连线懂你的玄学导师，将异乡秘密化为指引情路的答案。
      </p>

      {/* 半透明搜索框 */}
      <div className="relative max-w-lg group">
        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors"></i>
        <input 
          type="text" 
          placeholder="搜索倾听者 or 话题..." 
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-white/10 border border-white/10 rounded-full py-3.5 pl-12 pr-6 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all backdrop-blur-md shadow-lg"
        />
      </div>
    </div>
  </div>
);

// --- 分类过滤器组件 ---
interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelectCategory }) => (
  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide py-2">
    <button
      onClick={() => onSelectCategory('All')}
      className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
        activeCategory === 'All'
          ? 'bg-[#2e1a47] text-white shadow-md transform scale-105'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      全部
    </button>
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onSelectCategory(cat.name)}
        className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
          activeCategory === cat.name
            ? 'bg-[#2e1a47] text-white shadow-md transform scale-105'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
  const [searchTerm, setSearchTerm] = useState(''); // 新增：搜索状态
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrAdvisor, setQrAdvisor] = useState<Advisor | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  // 加载数据
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

  // --- 增强版筛选逻辑 (分类 + 搜索) ---
  const filteredAdvisors = useMemo(() => {
    return advisors.filter(advisor => {
      // 1. 匹配分类
      const matchCategory = activeCategory === 'All' || advisor.category === activeCategory;
      // 2. 匹配搜索词 (名字、标签、简介)
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || 
        advisor.name.toLowerCase().includes(term) ||
        (advisor.bio && advisor.bio.toLowerCase().includes(term)) ||
        (advisor.specialties && advisor.specialties.some(s => s.toLowerCase().includes(term)));
      
      return matchCategory && matchSearch;
    });
  }, [advisors, activeCategory, searchTerm]);

  // 计算在线人数
  const onlineCount = advisors.filter(a => a.isOnline).length;

  // --- 交互处理 ---
  const handleSelectAdvisor = (advisor: Advisor) => setSelectedAdvisor(advisor);
  const handleCloseModal = () => setSelectedAdvisor(null);
  
  const handleConnect = (advisor: Advisor, type: ConnectionType) => {
    setQrAdvisor(advisor);
    setIsQrOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[#2e1a47] font-bold animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2e1a47] border-t-transparent rounded-full animate-spin"></div>
          <span>正在连接神秘宇宙...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] relative font-sans">
      {/* 1. Hero 区域 */}
      <HeroSection onSearch={setSearchTerm} />
      
      {/* 2. 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 -mt-6 relative z-10 pb-24">
        
        {/* 分类过滤器 (白色背景条) */}
        <div className="bg-white p-2 rounded-xl shadow-lg mb-8 border border-gray-100">
          <CategoryFilter 
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </div>

        {/* 列表标题栏 */}
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-xl font-bold text-gray-800">暖心倾听者</h2>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
            <span className="text-green-500 font-bold mr-1">●</span>
            {onlineCount} 位倾听者在线
          </span>
        </div>

        {/* 顾问列表 */}
        {advisors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center text-gray-400 py-20 flex flex-col items-center bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
            <i className="fas fa-wind text-4xl mb-4 opacity-20"></i>
            <p>暂无相关顾问，换个词试试？</p>
          </div>
        )}
      </main>

      {/* 全局弹窗组件 */}
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

      {/* 树洞守护者 */}
      {!isGuideOpen && (
        <button
          onClick={() => setIsGuideOpen(true)}
          className="fixed bottom-8 right-8 z-40 bg-[#2e1a47] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group border-2 border-white/20"
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          <i className="fas fa-leaf text-xl group-hover:rotate-12 transition-transform"></i>
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
