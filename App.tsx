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
  sort_order?: number; // ✅ 排序字段
}

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

// 🛡️ 核心修复：前台防白屏函数
const safeTags = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
        const clean = data.replace(/[\[\]"'{}]/g, '');
        return clean.split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
};

// --- 主程序 ---
function App() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ✅ 核心：生产环境按 sort_order 排序
        const { data: advisorsData } = await supabase
          .from('advisors')
          .select('*')
          .order('sort_order', { ascending: true }) 
          .order('rating', { ascending: false });
          
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

  const filteredAdvisors = selectedCategory === 'All' ? advisors : advisors.filter(a => (a.category || '').includes(selectedCategory));

  return (
    // 🌌 全局暗夜背景
    <div className="min-h-screen bg-[#0f111a] font-sans text-gray-200 pb-20 transition-colors duration-500">
      
      {/* 🌌 头部：深渊黑 + 紫色光晕边界 */}
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

      {/* 🌌 分类栏：玻璃态暗色质感 */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            {filteredAdvisors.map(advisor => {
               const tags = safeTags(advisor.specialties_zh || advisor.specialties);
               
               return <div key={advisor.id} onClick={() => setSelectedAdvisor(advisor)} className="group bg-[#161925] rounded-2xl p-4 md:p-6 shadow-lg border border-[#232738] hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)] hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-row md:flex-col items-start md:items-center md:text-center gap-4 md:gap-6 relative overflow-hidden">
                 
                 {/* 🌌 光晕背景特效 (仅在 hover 时显现) */}
                 <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                 <div className="relative shrink-0 z-10">
                   {/* 🌌 导师头像：深色边框 */}
                   <img src={advisor.imageUrl} className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-2 border-[#232738] shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-[#0f111a] group-hover:scale-105 group-hover:border-purple-500/50 transition-all duration-500" loading="lazy" />
                   {advisor.isOnline && <div className="hidden md:block absolute bottom-2 right-2 w-4 h-4 bg-emerald-400 border-2 border-[#161925] rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]"></div>}
                 </div>
                 
                 <div className="flex-1 min-w-0 w-full flex flex-col md:items-center z-10">
                   <div className="flex md:flex-col justify-between md:justify-center items-start md:items-center w-full mb-1 md:mb-3">
                     <h3 className="text-lg md:text-2xl font-bold text-gray-100 truncate group-hover:text-purple-300 transition-colors">{advisor.name_zh || advisor.name}</h3>
                     <div className="flex items-center text-yellow-400 text-xs md:text-sm font-bold bg-yellow-400/10 px-2 py-0.5 rounded md:mt-2 border border-yellow-400/20">
                       <span className="drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">★ {advisor.rating}</span>
                       <span className="hidden md:inline text-gray-500 font-normal ml-1">({advisor.yearsExperience}年)</span>
                     </div>
                   </div>
                   <p className="text-xs md:text-sm text-purple-300/80 font-medium mb-2 md:mb-4 truncate">{advisor.title_zh || advisor.title}</p>
               
                   {/* 🌌 标签展示：暗紫底色 + 霓虹紫文字 */}
                   <div className="flex flex-wrap gap-1.5 md:justify-center mt-2 mb-3">
                     {tags.slice(0, 3).map((tag, i) => (
                       <span key={i} className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-700/30 backdrop-blur-sm">{tag}</span>
                     ))}
                   </div>
                   
                   <div className="flex md:flex-col justify-between items-center w-full border-t md:border-t-0 border-[#232738] pt-3 md:pt-0 mt-auto">
                     <div className="md:mb-4">
                       <span className="text-sm md:text-3xl font-bold text-gray-100">$ {advisor.pricePerMinute}</span>
                       <span className="text-xs md:text-sm text-gray-500"> / 分钟</span>
                     </div>
                     {/* 🌌 主要按钮：紫色渐变光泽 */}
                     <div className="hidden md:block w-full">
                       <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(147,51,234,0.3)] transition-all duration-300 flex items-center justify-center gap-2">
                         <span className="text-xl">✨</span> 立即连线
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            })}
          </div>
        )}
      </main>

      {/* --- 🌌 详情弹窗 (暗黑神秘版) --- */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          {/* 极深遮罩层 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedAdvisor(null)}></div>
          
          <div className="relative bg-[#161925] border border-[#232738] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up">
            
            <div className="sticky top-0 bg-[#161925]/90 backdrop-blur-xl z-20 border-b border-[#232738] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-200 tracking-wider">神谕解析者</h3>
              <button onClick={() => setSelectedAdvisor(null)} className="w-8 h-8 rounded-full bg-[#232738] text-gray-400 flex items-center justify-center hover:bg-gray-700 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-6 relative">
              {/* 背景装饰光晕 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="text-center relative z-10">
                <img src={selectedAdvisor.imageUrl} className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-[#232738] shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-4 bg-[#0f111a]"/>
                <h2 className="text-2xl font-bold text-gray-100">{selectedAdvisor.name_zh || selectedAdvisor.name}</h2>
                <p className="text-purple-400 font-medium text-sm mt-1">{selectedAdvisor.title_zh || selectedAdvisor.title}</p>
                
                <div className="flex justify-center gap-6 mt-6">
                  <div className="text-center"><div className="text-xl font-bold text-gray-100">${selectedAdvisor.pricePerMinute}</div><div className="text-xs text-gray-500">每分钟</div></div>
                  <div className="w-px bg-[#232738] h-10"></div>
                  <div className="text-center"><div className="text-xl font-bold text-gray-100">{selectedAdvisor.yearsExperience}年</div><div className="text-xs text-gray-500">修行经验</div></div>
                  <div className="w-px bg-[#232738] h-10"></div>
                  <div className="text-center"><div className="text-xl font-bold text-yellow-400">{selectedAdvisor.rating}</div><div className="text-xs text-gray-500">宇宙评分</div></div>
                </div>
              </div>
          
              {/* 🌌 简介背景：深不见底的黑 */}
              <div className="bg-[#0f111a] p-5 rounded-xl text-sm text-gray-300 leading-relaxed border border-[#232738] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent"></div>
                {selectedAdvisor.bio_zh || selectedAdvisor.bio || "这位导师很神秘，暂时没有留下简介。"}
              </div>
          
              {/* 证书展示 */}
              {safeTags(selectedAdvisor.certificates).length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-300 mb-3 mt-2 tracking-wider flex items-center gap-2">
                    <span className="text-purple-500">✦</span> 灵性资质
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {safeTags(selectedAdvisor.certificates).map((cert, idx) => (
                      <img key={idx} src={cert} onClick={() => setSelectedCertificate(cert)} className="h-20 rounded-lg border border-[#232738] cursor-zoom-in hover:border-purple-500/50 transition-colors opacity-80 hover:opacity-100" />
                    ))}
                  </div>
                </div>
              )}
          
              {/* 🌌 二维码区域：暗紫晶格质感 */}
              <div className="bg-gradient-to-b from-[#1a142c] to-[#0f111a] rounded-xl p-6 border border-purple-900/40 text-center relative overflow-hidden shadow-inner">
                {selectedAdvisor.bookingQrUrl ? (
                  <>
                    <p className="text-sm font-bold text-purple-300 mb-3 tracking-widest">扫描星阵 · 建立连线</p>
                    <div className="inline-block p-2 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 mb-2">
                      <img src={selectedAdvisor.bookingQrUrl} className="w-32 h-32 mx-auto rounded-lg"/>
                    </div>
                    <p className="text-xs text-gray-500">长按识别上方阵纹，添加导师微信</p>
                  </>
                ) : <p className="text-gray-500 text-sm">星象屏蔽中，暂无直接联系方式</p>}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 证书大图放大 */}
      {selectedCertificate && <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedCertificate(null)}><img src={selectedCertificate} className="max-w-full max-h-full rounded-lg shadow-[0_0_30px_rgba(147,51,234,0.3)] border border-gray-800"/></div>}
      
      <footer className="text-center text-gray-600 text-[10px] py-10">
        <p>© 2026 Liuzi Tree Hollow. Production Environment.</p>
        <p className="mt-1 opacity-50">Powered by Mystic Stars.</p>
      </footer>

    </div>
  );
}

export default App;
