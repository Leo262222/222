import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { AdvisorList } from './components/AdvisorList';
import { ChatInterface } from './components/ChatInterface';
import { Advisor, Category } from './types';
import { dataService } from './services/dataService';

function App() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  
  // 数据状态
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 核心修复：异步加载数据 ---
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

  // 加载时的显示
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
        <ChatInterface advisor={selectedAdvisor} onBack={handleBack} />
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
