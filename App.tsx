import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 类型定义 ---
interface Advisor {
  id: number;
  name: string;
  name_zh?: string;
  title: string;
  title_zh?: string;
  imageUrl: string;
  yearsExperience: number;
  rating: number;
  specialties: any;
  specialties_zh?: any;
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  bio: string;
  bio_zh?: string;
  bookingQrUrl?: string;
  certificates?: any;
  // ✅ 核心字段：排序
  sort_order?: number;
}

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

// 🛡️ 防白屏工具 (处理标签数据)
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
  const [selectedCert, setSelectedCert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
       setLoading(true);
       try {
         // ✅ 核心排序逻辑：sort_order 越小越靠前
         const { data: adv } = await supabase.from('advisors').select('*')
            .order('sort_order', { ascending: true }) 
            .order('rating', { ascending: false });
            
         const { data: cat } = await supabase.from('categories').select('*').order('id', { ascending: true });
         
         if (adv) setAdvisors(adv as Advisor[]);
         if (cat) setCategories([{ id: 0, value: 'All', label: '全部' }, ...(cat as CategoryItem[])]);
       } catch (error) {
         console.error("加载失败:", error);
       } finally {
         setLoading(false);
       }
    };
    load();
  }, []);

  // 筛选逻辑
  const filtered = selectedCategory === 'All' ? advisors : advisors.filter(a => (a.category||'').includes(selectedCategory));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 头部展示区 */}
      <header className="bg-[#1a202c] text-white px-6 py-6 shadow-lg sticky top-0 z-40">
         <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                <span className="text-3xl">🌲</span>
                <div>
                    <h1 className="font-bold text-xl tracking-wide">留子树洞</h1>
                    <p className="text-[10px] text-gray-400 mt-0.5">树洞藏秘密，神谕断情关</p>
                </div>
            </div>
         </div>
      </header>

      {/* 分类栏 */}
      <div className="max-w-6xl mx-auto px-4 mt-4 sticky top-[80px] z-30 overflow-x-auto no-scrollbar flex gap-2 pb-2">
         {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.value)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors shadow-sm ${selectedCategory === c.value ? 'bg-purple-900 text-white shadow-md transform scale-105' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>
               {c.label.split('(')[0]}
            </button>
         ))}
      </div>

      {/* 顾问列表 */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
         {loading ? <div className="text-center py-20 text-gray-400 animate-pulse">✨ 正在连接宇宙能量...</div> : 
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map(adv => (
                <div key={adv.id} onClick={() => setSelectedAdvisor(adv)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                   <div className="relative shrink-0">
                      <img src={adv.imageUrl} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-gray-100"/>
                      {adv.isOnline && <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h3 className="font-bold text-lg truncate text-gray-900">{adv.name_zh || adv.name}</h3>
                         <span className="text-xs font-bold text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">★ {adv.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-2">{adv.title_zh || adv.title}</p>
                      
                      {/* 标签展示 */}
                      <div className="flex flex-wrap gap-1 mb-3">
                         {safeTags(adv.specialties_zh || adv.specialties).slice(0,3).map((t,i) => <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-50">{t}</span>)}
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                         <span className="font-bold text-gray-900">$ {adv.pricePerMinute}<span className="text-[10px] text-gray-400 font-normal">/分</span></span>
                         <span className="text-xs bg-[#10B981] text-white px-3 py-1.5 rounded-full font-bold shadow-sm">查看详情</span>
                      </div>
                   </div>
                </div>
            ))}
         </div>}
      </main>

      {/* --- 详情弹窗 (无交互版) --- */}
      {selectedAdvisor && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedAdvisor(null)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up flex flex-col">
               
               {/* 弹窗头部 */}
               <div className="p-4 border-b flex justify-between items-center bg-white/95 backdrop-blur z-10 sticky top-0">
                  <h3 className="font-bold text-lg">顾问详情</h3>
                  <button onClick={() => setSelectedAdvisor(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">✕</button>
               </div>

               <div className="p-6 space-y-6">
                  {/* 核心信息 */}
                  <div className="text-center">
                     <img src={selectedAdvisor.imageUrl} className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-purple-50 shadow-lg mb-4"/>
                     <h2 className="text-2xl font-bold text-gray-900">{selectedAdvisor.name_zh || selectedAdvisor.name}</h2>
                     <p className="text-purple-600 font-medium text-sm mt-1">{selectedAdvisor.title_zh || selectedAdvisor.title}</p>
                     
                     <div className="flex justify-center gap-6 mt-6">
                        <div className="text-center"><div className="text-xl font-bold text-gray-900">${selectedAdvisor.pricePerMinute}</div><div className="text-xs text-gray-400">每分钟</div></div>
                        <div className="w-px bg-gray-200 h-10"></div>
                        <div className="text-center"><div className="text-xl font-bold text-gray-900">{selectedAdvisor.yearsExperience}年</div><div className="text-xs text-gray-400">经验</div></div>
                        <div className="w-px bg-gray-200 h-10"></div>
                        <div className="text-center"><div className="text-xl font-bold text-gray-900">{selectedAdvisor.rating}</div><div className="text-xs text-gray-400">评分</div></div>
                     </div>
                  </div>

                  {/* 简介 */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                     <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span> 关于我
                     </h4>
                     <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {selectedAdvisor.bio_zh || selectedAdvisor.bio || "暂无简介"}
                     </p>
                  </div>
                  
                  {/* 资质认证 */}
                  {safeTags(selectedAdvisor.certificates).length > 0 && <div>
                     <h4 className="font-bold text-sm mb-3 text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-yellow-500 rounded-full"></span> 资质认证
                     </h4>
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{safeTags(selectedAdvisor.certificates).map((c,i) => <img key={i} src={c} onClick={() => setSelectedCert(c)} className="h-20 rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition"/>)}</div>
                  </div>}

                  {/* 底部联系方式 (唯一入口) */}
                  <div className="bg-purple-50 rounded-xl p-6 text-center border border-purple-100 mt-4">
                     {selectedAdvisor.bookingQrUrl ? (
                        <>
                           <p className="text-sm font-bold text-purple-900 mb-2">想咨询TA？</p>
                           <img src={selectedAdvisor.bookingQrUrl} className="w-32 h-32 mx-auto mix-blend-multiply mb-2 rounded-lg border border-purple-100"/>
                           <p className="text-xs text-purple-500">长按识别二维码，添加微信预约</p>
                        </>
                     ) : (
                        <div className="py-4">
                           <p className="text-gray-400 text-xs">暂无直接联系方式</p>
                           <p className="text-gray-400 text-xs mt-1">请联系平台客服代为转达</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
      
      {/* 证书大图查看 */}
      {selectedCert && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in" onClick={() => setSelectedCert(null)}><img src={selectedCert} className="max-w-full max-h-full rounded-lg shadow-2xl"/></div>}
      
      <footer className="text-center text-gray-300 text-[10px] py-8">
        <p>© 2026 Liuzi Tree Hollow. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
