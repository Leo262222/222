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
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取顾问
        const { data: advisorsData, error: advError } = await supabase
          .from('advisors')
          .select('*')
          .order('rating', { ascending: false });

        if (advError) throw advError;
        setAdvisors(advisorsData || []);

        // 获取分类
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
  }, []);

  const filteredAdvisors = selectedCategory === 'All' 
    ? advisors 
    : advisors.filter(a => {
        const cats = (a.category || '').split(','); 
        return cats.includes(selectedCategory);
      });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 顶部导航 */}
      <header className="bg-[#1a202c] text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌲</span>
                <h1 className="text-xl font-bold tracking-wide">留子树洞</h1>
              </div>
              <p className="text-xs text-gray-400 mt-1 pl-9">树洞藏秘密，神谕断情关。</p>
            </div>
          </div>

          {/* ✅ 已恢复 Slogan (带一点透明背景，更精致) */}
          <div className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10 text-xs sm:text-sm text-gray-300 leading-relaxed shadow-inner">
            异乡留学生们的专属情感避树洞。无论是异地恋的煎熬、无法言说的Crush、还是亲朋关系与血液工作的迷茫，连线懂你的玄学老师，将异乡的秘密化为指引情路的灯塔。
          </div>
        </div>
      </header>

      {/* 分类栏 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.value 
                  ? 'bg-purple-900 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat.label.includes('(') ? cat.label.split('(')[0] : cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表区 */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载神谕中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAdvisors.map(advisor => {
              const safeTags = getSafeTags(advisor.specialties_zh);
              return (
                <div 
                  key={advisor.id}
                  onClick={() => setSelectedAdvisor(advisor)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex gap-4 items-start relative overflow-hidden"
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={advisor.imageUrl} 
                      alt={advisor.name_zh} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm bg-gray-100"
                    />
                  </div>

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

      {/* 弹窗 */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedAdvisor(null)}
          ></div>
          
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up">
            
            <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">顾问详情</h3>
              <button 
                onClick={() => setSelectedAdvisor(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* 个人卡片 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img src={selectedAdvisor.imageUrl} className="w-full h-full rounded-full object-cover border-4 border-purple-50 shadow-lg" alt="Avatar"/>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAdvisor.name_zh}</h2>
                <p className="text-purple-600 font-medium text-sm mt-1">{selectedAdvisor.title_zh}</p>
                
                <div className="flex justify-center gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">${selectedAdvisor.pricePerMinute}</div>
                    <div className="text-xs text-gray-400">每分钟</div>
                  </div>
                  <div className="w-px bg-gray-200 h-10"></div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{selectedAdvisor.yearsExperience}年</div>
                    <div className="text-xs text-gray-400">从业经验</div>
                  </div>
                  <div className="w-px bg-gray-200 h-10"></div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{selectedAdvisor.rating}</div>
                    <div className="text-xs text-gray-400">评分</div>
                  </div>
                </div>
              </div>

              {/* 关于我 */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-400 pl-3">关于我</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {selectedAdvisor.bio_zh || "这位顾问很神秘，暂时没有留下简介。"}
                </p>
              </div>

              {/* 擅长话题 */}
              {getSafeTags(selectedAdvisor.specialties_zh).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-400 pl-3">擅长话题</h4>
                  <div className="flex flex-wrap gap-2">
                    {getSafeTags(selectedAdvisor.specialties_zh).map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 背景认证 */}
              {(selectedAdvisor.certificates || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-400 pl-3">背景认证</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                    {selectedAdvisor.certificates?.map((cert, idx) => (
                      <div key={idx} className="flex-shrink-0 snap-center">
                        <img 
                          src={cert} 
                          alt="Certificate" 
                          className="h-24 w-auto rounded-lg border border-gray-200 shadow-sm object-cover cursor-zoom-in hover:opacity-90 transition"
                          onClick={() => setSelectedCertificate(cert)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400">已通过平台资质审核，点击可查看大图</p>
                </div>
              )}

              {/* 底部操作 */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                 {selectedAdvisor.bookingQrUrl ? (
                   <div className="text-center bg-purple-50 rounded-xl p-6 border border-purple-100">
                     <p className="text-sm font-bold text-purple-900 mb-3">扫描二维码，立即联系</p>
                     <img src={selectedAdvisor.bookingQrUrl} className="w-40 h-40 mx-auto rounded-lg shadow-sm mix-blend-multiply" alt="QR Code"/>
                     <p className="text-xs text-purple-400 mt-3">添加时请注明来源</p>
                   </div>
                 ) : (
                   <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-sm">
                     暂无联系方式，请私信平台客服。
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 全屏图片查看 */}
      {selectedCertificate && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setSelectedCertificate(null)} 
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img 
            src={selectedCertificate} 
            alt="Full Certificate" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in"
          />
        </div>
      )}

      {/* 版权 */}
      <footer className="text-center text-gray-300 text-[10px] py-8">
        <p>© 2026 Liuzi Tree Hollow. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
