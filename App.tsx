import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 🟢 生产环境类型定义 ---
interface Advisor {
  id: number;
  name: string;
  title: string;
  imageUrl: string;
  yearsExperience: number;
  rating: number;
  specialties: any;
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  name_zh?: string;
  title_zh?: string;
  bio_zh?: string;
  specialties_zh?: string;
  bookingQrUrl?: string;
  certificates?: any;
  sort_order?: number; 
}

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

const safeTags = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
        const clean = data.replace(/[\[\]"'{}]/g, '');
        return clean.split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
};

function App() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: advisorsData } = await supabase
          .from('advisors')
          .select('*')
          .order('sort_order', { ascending: true }) 
          .order('id', { ascending: true });
          
        setAdvisors((advisorsData as any) || []);
        
        const { data: catData } = await supabase.from('categories').select('*').order('id', { ascending: true });
        setCategories([{ id: 0, value: 'All', label: '全部' }, ...(catData || [])]);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🌟 2. 核心体验优化：弹窗防穿透滚动
  useEffect(() => {
    if (selectedAdvisor || selectedCertificate) {
      document.body.style.overflow = 'hidden'; 
    } else {
      document.body.style.overflow = 'unset';  
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedAdvisor, selectedCertificate]);

  // 🌟 3. 核心体验优化：手机侧滑/物理返回键支持
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash === '#detail') {
        setSelectedCertificate(null);
      } else if (hash === '' || hash === '#') {
        setSelectedAdvisor(null);
        setSelectedCertificate(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdvisorDetail = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    window.history.pushState({ modal: 'detail' }, '', '#detail');
  };

  const closeAdvisorDetail = () => {
    setSelectedAdvisor(null);
    if (window.location.hash === '#detail') {
      window.history.back(); 
    }
  };

  const openCertDetail = (cert: string) => {
    setSelectedCertificate(cert);
    window.history.pushState({ modal: 'cert' }, '', '#cert');
  };

  const closeCertDetail = () => {
    setSelectedCertificate(null);
    if (window.location.hash === '#cert') {
      window.history.back();
    }
  };

  const filteredAdvisors = selectedCategory === 'All' ? advisors : advisors.filter(a => (a.category || '').includes(selectedCategory));

  return (
    <div className="min-h-screen bg-[#0f111a] font-sans text-gray-200 pb-20 transition-colors duration-500">
      
      <header className={`bg-[#090b10]/95 backdrop-blur-md border-b border-purple-900/30 px-4 sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'py-3 shadow-[0_4px_30px_rgba(88,28,135,0.15)]' : 'py-6'}`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🔮</span>
              <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">留子树洞</h1>
            </div>
            <p className={`text-xs text-purple-300/60 mt-1 pl-9 transition-all duration-300 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>树洞藏秘密，神谕断情关。</p>
          </div>
        </div>
        {!isScrolled && (
          <div className="max-w-6xl mx-auto mt-4 md:mt-6 animate-slide-down">
            <div className="bg-[#161925]/80 rounded-lg border border-purple-800/30 text-xs sm:text-sm text-gray-400 p-3 leading-relaxed shadow-inner">
              留子专属的情感避风港。无论是异地恋的煎熬、无法言说的Crush、还是亲朋关系&学业工作，连线懂你的玄学导师，将心中困惑化为指引的灯塔。
            </div>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6 sticky top-[70px] z-30"> 
        <div className="bg-[#161925]/90 backdrop-blur-sm p-2 rounded-xl border border-[#232738] flex gap-2 overflow-x-auto no-scrollbar shadow-lg"> 
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.value)} 
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.value 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] border border-transparent' 
                  : 'bg-transparent text-gray-400 border border-transparent hover:text-gray-200 hover:bg-[#232738]'
              }`}
            >
              {cat.label.includes('(') ? cat.label.split('(')[0] : cat.label}
            </button>
          ))} 
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="text-center py-20 text-purple-400/50 flex flex-col items-center gap-3">
            <span className="text-3xl animate-spin">✨</span>
            <p className="animate-pulse tracking-widest text-sm">正在连接宇宙能量...</p>
          </div>
        ) : (
          <div className="grid grid
