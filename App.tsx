import React, { useState, useEffect } from 'react';
import AdvisorCard from './components/AdvisorCard';
import SpiritGuideChat from './components/SpiritGuideChat';
import { Advisor, Category, ConnectionType, Language } from './types';
import { dataService } from './services/dataService';

// --- 1. 内置 Header 组件 ---
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

// --- 2. 内置 CategoryFilter 组件 ---
interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelectCategory }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
    <button
      onClick={() => onSelectCategory('All')}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        activeCategory === 'All'
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
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
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
        }`}
      >
        {cat.name_zh}
      </button>
    ))}
  </div>
);

// --- 主程序 App ---
function App() {
  // 状态管理
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 新增状态：控制树洞守护者聊天窗口
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  // 新增状态：语言设置（默认为中文）
  const [language, setLanguage] = useState<Language>('zh');

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

  // 筛选逻辑
  const filteredAdvisors = activeCategory === 'All' 
    ? advisors 
    : advisors.filter(advisor => advisor.category === activeCategory);

  // --- 处理函数 (修复报错的关键) ---
  
  const handleSelectAdvisor = (advisor: Advisor) => {
    // 暂时打印日志，或者这里可以弹出一个详情 Modal
    console.log("Selected advisor:", advisor.name);
    alert(`您选择了：${advisor.name}\n(详情页功能开发中...)`);
  };

  const handleConnect = (advisor: Advisor, type: ConnectionType) => {
    console.log("Connect via:", type, "with", advisor.name);
    alert(`即将与 ${advisor.name} 进行 ${type === 'chat' ? '文字聊天' : '语音通话'}...`);
  };

  // 加载中界面
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-bold animate-pulse flex flex-col items-center gap-2">
          <i className="fas fa-spinner fa-spin text-2xl"></i>
          <span>正在连接神秘宇宙...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header />
      
      <main className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
        {/* 分类过滤器 */}
        <CategoryFilter 
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* 顾问列表 */}
        {advisors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdvisors.map((advisor) => (
              <AdvisorCard 
                key={advisor.id} 
                advisor={advisor}
                language={language}        // 修复：传入语言
                onSelect={handleSelectAdvisor} // 修复：传入选择回调
                onConnect={handleConnect}      // 修复：传入连接回调
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10 flex flex-col items-center">
            <i className="fas fa-inbox text-4xl mb-2 opacity-30"></i>
            <p>暂无顾问数据，请去后台添加</p>
          </div>
        )}
      </main>

      {/* 树洞守护者 (Spirit Guide) 悬浮按钮 */}
      {!isGuideOpen && (
        <button
          onClick={() => setIsGuideOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-green-700 to-emerald-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
        >
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
          <i className="fas fa-leaf text-xl group-hover:rotate-12 transition-transform"></i>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap ml-0 group-hover:ml-2">
            树洞守护者
          </span>
        </button>
      )}

      {/* 树洞守护者聊天窗口 */}
      <SpiritGuideChat 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        advisors={advisors} // 修复：传入所有顾问列表，而不是单个
        language={language}
      />
    </div>
  );
}

export default App;
