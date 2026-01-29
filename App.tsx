import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 类型定义 (防止报错) ---
interface Advisor {
  id: number;
  name: string;
  title: string;
  imageUrl: string;
  yearsExperience: number;
  reviewCount: number;
  price: number;
  rating: number;
  specialties: string[];
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  name_zh?: string;
  title_zh?: string;
  bio_zh?: string;
  specialties_zh?: string;
  bookingQrUrl?: string;
  certificates?: string[];
}

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

// --- 登录弹窗组件 ---
const LoginModal = ({ isOpen, onClose, onLoginSuccess }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email'); // email=填邮箱, code=填验证码
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  // 1. 发送验证码
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    // 发送 OTP
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage('发送失败: ' + error.message);
    } else {
      setStep('code'); // 切换到输入验证码界面
      setMessage('✅ 验证码已发送！请查收邮件 (包括垃圾箱)');
    }
    setLoading(false);
  };

  // 2. 验证登录
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // 验证 OTP
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      setMessage('验证失败: ' + error.message);
    } else {
      onLoginSuccess(); // 通知父组件登录成功
      onClose(); // 关闭弹窗
    }
    setLoading(false);
  };

  // 3. 谷歌登录
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // 登录成功后跳回当前页面
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 黑色背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* 弹窗主体 */}
      <div className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-bounce-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎来到树洞</h2>
        <p className="text-sm text-gray-500 mb-6">登录以连接你的专属顾问</p>

        {/* 谷歌登录按钮 */}
        {step === 'email' && (
          <>
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition-all mb-4"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
              使用 Google 一键登录
            </button>
            
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">或使用邮箱验证码</span></div>
            </div>
          </>
        )}

        {/* 邮箱登录表单 */}
        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱 (name@example.com)"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#1a202c] hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">已发送至 <span className="font-bold">{email}</span></p>
              <button type="button" onClick={() => setStep('email')} className="text-xs text-purple-600 hover:underline mt-1">换个邮箱?</button>
            </div>
            <div>
              <input 
                type="text" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 text-center tracking-widest text-lg font-bold"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#1a202c] hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? '验证中...' : '登录'}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-center text-xs text-red-500 bg-red-50 p-2 rounded">{message}</p>}
      </div>
    </div>
  );
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
  
  // 新增：用户登录状态
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // 工具：处理字符串标签
  const getSafeTags = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      const clean = input.replace(/[\[\]"']/g, ''); 
      return clean.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    // 1. 初始化时检查是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. 监听登录/登出变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 3. 加载数据
    const fetchData = async () => {
      try {
        setLoading(true);
        // 读取顾问
        const { data: advisorsData, error: advError } = await supabase
          .from('advisors')
          .select('*')
          .order('rating', { ascending: false });
        
        if (advError) throw advError;
        setAdvisors((advisorsData as any) || []);

        // 读取分类
        const { data: catData, error: catError } = await supabase.from('categories').select('*').order('id', { ascending: true });
        if (!catError) {
          setCategories([{ id: 0, value: 'All', label: '全部' }, ...(catData || [])]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 滚动监听
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 筛选逻辑
  const filteredAdvisors = selectedCategory === 'All' 
    ? advisors 
    : advisors.filter(a => (a.category || '').includes(selectedCategory));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 插入登录弹窗 */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={() => setIsLoginOpen(false)} 
      />

      {/* 头部 Header */}
      <header className={`bg-[#1a202c] text-white px-4 shadow-lg sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌲</span>
              <h1 className="text-xl font-bold tracking-wide">留子树洞</h1>
            </div>
            <p className={`text-xs text-gray-400 mt-1 pl-9 transition-all duration-300 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
              树洞藏秘密，神谕断情关。
            </p>
          </div>

          {/* 右上角：登录/用户信息 */}
          <div>
            {user ? (
              <div className="flex items-center gap-3 animate-fade-in">
                 {/* 显示用户头像(如果是Google登录)或邮箱 */}
                 {user.user_metadata?.avatar_url ? (
                   <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-gray-600" alt="avatar"/>
                 ) : (
                   <span className="text-xs text-gray-300 hidden sm:inline">{user.email?.split('@')[0]}</span>
                 )}
                 <button 
                   onClick={handleLogout} 
                   className="text-xs bg-gray-700 hover:bg-red-600 px-3 py-1.5 rounded-full transition-colors"
                 >
                   登出
                 </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-green-900/20 transition-transform hover:scale-105"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
        
        {/* Slogan */}
        {!isScrolled && (
           <div className="max-w-6xl mx-auto mt-4 md:mt-6 animate-slide-down">
            <div className="bg-white/5 rounded-lg border border-white/10 text-xs sm:text-sm text-gray-300 p-3 leading-relaxed">
              留子专属的情感避风港。无论是异地恋的煎熬、无法言说的Crush、还是亲朋关系&学业工作，连线懂你的玄学导师，将心中困惑化为指引的灯塔。
            </div>
          </div>
        )}
      </header>

      {/* 分类栏 */}
      <div className="max-w-6xl mx-auto px-4 mt-4 sticky top-[70px] z-30"> 
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.value ? 'bg-purple-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat.label.includes('(') ? cat.label.split('(')[0] : cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 顾问列表 */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400"><p className="animate-pulse">✨ 正在连接宇宙能量...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {filteredAdvisors.map(advisor => {
              const safeTags = getSafeTags(advisor.specialties_zh || advisor.specialties);
              return (
                <div 
                  key={advisor.id}
                  onClick={() => setSelectedAdvisor(advisor)}
                  className="group bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-row md:flex-col items-start md:items-center md:text-center gap-4 md:gap-6 relative overflow-hidden"
                >
                  <div className="relative shrink-0">
                    <img src={advisor.imageUrl} alt="Avatar" className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-2 border-white shadow-md bg-gray-100 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {advisor.isOnline && <div className="hidden md:block absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}
                  </div>
                  <div className="flex-1 min-w-0 w-full flex flex-col md:items-center">
                    <div className="flex md:flex-col justify-between md:justify-center items-start md:items-center w-full mb-1 md:mb-3">
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{advisor.name_zh || advisor.name}</h3>
                      <div className="flex items-center text-yellow-500 text-xs md:text-sm font-bold bg-yellow-50 px-2 py-0.5 rounded md:mt-2">
                        <span>★ {advisor.rating}</span>
                        <span className="hidden md:inline text-gray-400 font-normal ml-1">({advisor.yearsExperience}年)</span>
                      </div>
                    </div>
                    <p className="text-xs md:text-base text-gray-500 font-medium mb-2 md:mb-4 truncate">{advisor.title_zh || advisor.title}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3 md:justify-center">
                      {safeTags.slice(0, 3).map((tag, i) => <span key={i} className="text-[10px] md:text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100">{tag}</span>)}
                    </div>
                    <div className="flex md:flex-col justify-between items-center w-full border-t md:border-t-0 border-gray-50 pt-3 md:pt-0 mt-auto">
                      <div className="md:mb-4"><span className="text-sm md:text-3xl font-bold text-gray-900">$ {advisor.pricePerMinute}</span><span className="text-xs md:text-sm text-gray-400"> / 分</span></div>
                      <div className="hidden md:block w-full">
                        <button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-xl shadow-lg shadow-green-100 transition-colors flex items-center justify-center gap-2"><span className="text-xl">📞</span> 立即连线</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAdvisor(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* ...详情内容(省略以节省长度, 功能保持不变)... */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">顾问详情</h3>
              <button onClick={() => setSelectedAdvisor(null)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-8">
               <div className="text-center">
                <img src={selectedAdvisor.imageUrl} className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-purple-50 shadow-lg mb-4"/>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAdvisor.name_zh}</h2>
                <p className="text-purple-600 font-medium text-sm mt-1">{selectedAdvisor.title_zh}</p>
                <div className="flex justify-center gap-6 mt-6">
                   <div className="text-center"><div className="text-xl font-bold text-gray-900">${selectedAdvisor.pricePerMinute}</div><div className="text-xs text-gray-400">每分钟</div></div>
                   <div className="w-px bg-gray-200 h-10"></div>
                   <div className="text-center"><div className="text-xl font-bold text-gray-900">{selectedAdvisor.yearsExperience}年</div><div className="text-xs text-gray-400">经验</div></div>
                   <div className="w-px bg-gray-200 h-10"></div>
                   <div className="text-center"><div className="text-xl font-bold text-gray-900">{selectedAdvisor.rating}</div><div className="text-xs text-gray-400">评分</div></div>
                </div>
               </div>
               
               {/* 简介 */}
               <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed">
                 {selectedAdvisor.bio_zh || "暂无简介"}
               </div>

               {/* 证书展示 */}
               {(selectedAdvisor.certificates || []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">资质认证</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedAdvisor.certificates?.map((cert, idx) => (
                        <img key={idx} src={cert} onClick={() => setSelectedCertificate(cert)} className="h-20 rounded-lg border cursor-zoom-in" />
                      ))}
                    </div>
                  </div>
               )}

               {/* 二维码 */}
               <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 text-center">
                  {selectedAdvisor.bookingQrUrl ? (
                    <>
                      <img src={selectedAdvisor.bookingQrUrl} className="w-32 h-32 mx-auto mix-blend-multiply mb-2"/>
                      <p className="text-xs text-purple-500">长按识别二维码，添加顾问微信</p>
                    </>
                  ) : <p className="text-gray-400 text-sm">暂无联系方式</p>}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 证书大图 */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedCertificate(null)}>
          <img src={selectedCertificate} className="max-w-full max-h-full rounded-lg"/>
        </div>
      )}

      <footer className="text-center text-gray-300 text-[10px] py-8"><p>© 2026 Liuzi Tree Hollow.</p></footer>
    </div>
  );
}

export default App;
