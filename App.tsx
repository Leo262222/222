import React, { useState, useEffect } from 'react';
import AdvisorCard from './components/AdvisorCard';       // 引用您已有的组件
import SpiritGuideChat from './components/SpiritGuideChat'; // 引用您已有的聊天组件
import { Advisor, Category } from './types';
import { dataService } from './services/dataService';

// --- 1. 补全缺失的顶部栏 (Header) ---
const Header = () => (
  <header className="bg-white shadow-sm sticky top-0 z-10">
    <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔮</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Lumina 树洞
        </h1>
      </div>
    </div>
  </header>
);

// --- 2. 补全缺失的分类过滤器 (CategoryFilter) ---
interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelectCategory }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      onClick={() => onSelectCategory('All')}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        activeCategory === 'All'
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      全部
    </button>
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onSelectCategory(cat.name)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          activeCategory === cat.name
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        {cat.name_zh}
      </button>
    ))}
  </div>
);

// --- 3. 补全顾问列表 (AdvisorList) ---
interface AdvisorListProps {
  advisors: Advisor[];
  onSelectAdvisor: (advisor: Advisor) => void;
}
const AdvisorList: React.FC<AdvisorListProps> = ({ advisors, onSelectAdvisor }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {advisors.map((advisor) => (
      <div key={advisor.id} onClick={() => onSelectAdvisor(advisor)} className="cursor-pointer">
        {/* 使用您项目里真实存在的 AdvisorCard 组件 */}
        <AdvisorCard advisor={advisor} />
      </div>
    ))}
  </div>
);

// --- 主程序 App ---
function App() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 异步加载数据
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

  const handleBack = () => {
    setSelectedAdvisor(null);
  };

  const filteredAdvisors = activeCategory === 'All' 
    ? advisors 
    : advisors.filter(advisor => advisor.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-bold animate-pulse">正在连接神秘宇宙...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedAdvisor ? (
        // 使用您项目里真实存在的 SpiritGuideChat 组件
        <SpiritGuideChat advisor={selectedAdvisor} onBack={handleBack} />
      ) : (
        <>
          <Header />
          <main className="max-w-4xl mx-auto p-4 space-y-6">
            <CategoryFilter 
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
            {advisors.length > 0 ? (
              <AdvisorList 
                advisors={filteredAdvisors}
                onSelectAdvisor={setSelectedAdvisor}
              />
            ) : (
              <div className="text-center text-gray-400 py-10">
                暂无顾问数据，请去后台添加
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
