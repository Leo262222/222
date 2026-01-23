import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Advisor } from './types';

// ✅ 新增：智能数据清洗函数 (防白屏核心)
// 无论数据库里存的是 ["a","b"] 还是 "a,b" 还是 "['a']"，通通洗成标准数组
const getSafeTags = (input: any): string[] => {
  if (!input) return [];
  
  // 1. 如果本来就是数组，直接返回
  if (Array.isArray(input)) return input;
  
  // 2. 如果是字符串，进行清洗
  if (typeof input === 'string') {
    // 去掉方括号、引号等脏字符
    const clean = input.replace(/[\[\]"']/g, '');
    // 按逗号、顿号分割
    return clean.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }
  
  return [];
};

function App() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 获取顾问数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: advisorsData, error } = await supabase
          .from('advisors')
          .select('*')
          .order('isOnline', { ascending: false })
          .order('rating', { ascending: false });

        if (error) throw error;
        setAdvisors(advisorsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. 筛选逻辑
  const filteredAdvisors = selectedCategory === 'All' 
    ? advisors 
    : advisors.filter(a => a.category === selectedCategory);

  // 分类列表
  const categories = [
    { id: 'All', label: '全部' },
    { id: 'Tarot', label: '塔罗, 雷诺曼' },
    { id: 'Astrology', label: '占星' },
    { id: 'Love', label: '情感咨询' },
    { id: 'Career', label: '事业学业' },
    { id: 'Life Abroad', label: '海外生活' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 顶部导航 */}
      <header className="bg-[#1a202c] text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌲</span>
              <h1 className="text-xl font-bold tracking-wide">留子树洞</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 pl-9">树洞藏秘密，神谕断情关。</p>
          </div>
          <div className="text-right">
             <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
             <span className="text-xs font-medium text-green-400">{advisors.filter(a => a.isOnline).length} 人在线</span>
          </div>
        </div>
      </header>

      {/* 搜索与分类 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-purple-900 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 顾问列表 */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载神谕中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAdvisors.map(advisor => {
              // ✅ 使用清洗函数获取标签
              const safeTags = getSafeTags(advisor.specialties_zh);
              
              return (
                <div 
                  key={advisor.id}
                  onClick={() => setSelectedAdvisor(advisor)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex gap-4 items-start relative overflow-hidden"
                >
                  {/* 头像区 */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={advisor.imageUrl} 
                      alt={advisor.name_zh} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm bg-gray-100"
                    />
                    {advisor.isOnline && (
                      <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        在线
                      </div>
                    )}
                  </div>

                  {/* 信息区 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                        {advisor.name_zh || advisor.name}
                      </h3>
                      <div className="flex items-center text-yellow-500 text-xs font-bold bg-yellow-50 px-1.5 py-0.5 rounded">
                        <span>★ {advisor.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-purple-600 font-medium mt-0.5 mb-2 truncate">
                      {advisor.title_zh || advisor.title}
                    </p>

                    {/* ✅ 使用 safeTags 渲染，防止报错 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {safeTags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                      <span className="text-xs font-bold text-gray-400">
                        经验 {advisor.yearsExperience} 年
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        $ {advisor.pricePerMinute}<span className="text-xs font-normal text-gray-400">/分</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 顾问详情
