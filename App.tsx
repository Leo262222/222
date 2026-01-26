import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Advisor } from './types';

// 智能清洗函数
const getSafeTags = (input: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    const clean = input.replace(/[\[\]"']/g, ''); 
    return clean.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

function App() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 新增状态：检测页面是否发生了滚动
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // 1. 数据加载逻辑 (保持不变)
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: advisorsData, error: advError } = await supabase
          .from('advisors')
          .select('id, name_zh, title_zh, imageUrl, isOnline, rating, pricePerMinute, yearsExperience, specialties_zh, category')
          .order('rating', { ascending: false });

        if (advError) throw advError;
        setAdvisors((advisorsData as any) || []);

        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true });
        
        if (catError) throw catError;
        
        const allCat: CategoryItem = { id: 0, value: 'All', label: '全部' };
        setCategories([allCat, ...(catData || [])]);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // 2. ✅ 新增：极速滚动监听器
    const handleScroll = () => {
      // 当滚动超过 20px 时，认为是“正在浏览”，收起头部
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // 添加监听
    window.addEventListener('scroll', handleScroll);
    // 清理监听
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCardClick = async (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisors')
        .select('bio_zh, bookingQrUrl, certificates')
        .eq('id', advisor.id)
        .single();
      if (!error && data) {
        setSelectedAdvisor(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (err) {
      console.error("Failed to load details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredAdvisors = selectedCategory === 'All' 
    ? advisors 
    : advisors.filter(a => {
        const cats = (a.category || '').split(','); 
        return cats.includes(selectedCategory);
      });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 🟢 动态头部核心区域 
          sticky top-0: 确保头部吸顶
          transition-all: 保证变化时的丝滑动画
      */}
      <header className={`bg-[#1a202c] text-white px-4 shadow-lg sticky top-0 z-40 transition-all duration-300 ease-in-out ${
        isScrolled ? 'py-3' : 'py-6' // 滚动时减少上下内边距
      }`}>
        <div className="max-w-4xl mx-auto">
          {/* Logo 栏 - 永远显示，但滚动时微调边距 */}
          <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'mb-0' : 'mb-3'}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌲</span>
                <h1 className="text-xl font-bold tracking-wide">留子树洞</h1>
              </div>
              {/* 副标题：滚动时隐藏 */}
              <p className={`text-xs text-gray-400 mt-1 pl-9 transition-all duration-300 overflow-hidden ${
                isScrolled ? 'h-0 opacity-0' : 'h-auto opacity-100'
              }`}>
                树洞藏秘密，神谕断情关。
              </p>
            </div>
          </div>

          {/* 🟢 Slogan 区域 
             核心逻辑：
             1. 移动端 (默认)：根据 isScrolled 状态切换高度 (max-h-0 vs max-h-40) 和透明度。
             2. PC端 (md:前缀)：强制覆盖为永远显示 (max-h-full opacity-100)。
          */}
          <div className={`
            bg-white/5 rounded-lg border border-white/10 text-xs sm:text-sm text-gray-300 leading-relaxed shadow-inner overflow-hidden transition-all duration-500 ease-in-out
            ${isScrolled ? 'max-h-0 opacity-0 mt-0 border-none' : 'max-h-40 opacity-100 mt-2 p-3 border'}
            md:max-h-full md:opacity-100 md:mt-2 md:p-3 md:border
          `}>
            留子专属的情感避风港。无论是异地恋的煎熬、无法言说的Crush、还是亲朋关系&学业工作，连线懂你的玄学导师，将心中困惑化为指引的灯塔。
          </div>
        </div>
      </header>

      {/* 分类栏 (吸顶时紧贴 Header) */}
      <div className="max-w-4xl mx-auto px-4 mt-4 sticky top-[60px] z-30 transition-all"> 
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
