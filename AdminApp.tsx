import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ==========================================
// 🔐 在这里配置你的后台账号密码
// ==========================================
const ADMIN_USERNAME = '2399518';
const ADMIN_PASSWORD = '2399518';
// ==========================================

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
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  bio: string;
  bio_zh?: string;
  bookingQrUrl?: string;
  certificates?: any;
  
  // ✅ 测试字段
  sort_order?: number; 
  email?: string;
}

interface Category {
  id: number;
  value: string;
  label: string;
}

export default function AdminApp() {
  // 🔐 登录状态管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // 数据状态
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  const [form, setForm] = useState<Partial<Advisor>>({});
  const [newTag, setNewTag] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatValue, setNewCatValue] = useState('');

  // 🛡️ 防白屏工具
  const safeTags = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      const clean = data.replace(/[\[\]"'{}]/g, '');
      return clean.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: advData } = await supabase.from('advisors').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });
    const { data: catData } = await supabase.from('categories').select('*').order('id', { ascending: true });
    if (advData) setAdvisors(advData as Advisor[]);
    if (catData) setCategories(catData as Category[]);
    setLoading(false);
  };

  // 监听登录成功后加载数据
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // 🔐 处理登录
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('❌ 账号或密码错误');
    }
  };

  // --- 如果未登录，显示登录页 ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="bg-purple-900 p-6 text-center">
            <span className="text-4xl">🌲</span>
            <h1 className="text-xl font-bold text-white mt-2">树洞后台管理</h1>
            <p className="text-purple-200 text-xs">Test Environment</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">管理员账号</label>
              <input 
                type="text" 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">密码</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="••••••"
              />
            </div>
            <button type="submit" className="w-full bg-purple-900 text-white font-bold py-3 rounded-lg hover:bg-purple-800 transition">
              安全登录
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 以下是原本的后台逻辑 (已登录状态) ---

  const handleEdit = (advisor?: Advisor) => {
    if (advisor) {
      setForm({ 
        ...advisor, 
        specialties: safeTags(advisor.specialties),
        certificates: safeTags(advisor.certificates)
      });
    } else {
      setForm({
        name: 'New', rating: 5, isOnline: true, specialties: [],
        pricePerMinute: 1.99, imageUrl: 'https://ui-avatars.com/api/?name=New',
        yearsExperience: 1, sort_order: 100, category: ''
      });
    }
    setNewTag('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const { id, ...updates } = form;
    const cleanUpdates = {
        ...updates,
        specialties: safeTags(updates.specialties),
        specialties_zh: safeTags(updates.specialties).join(','),
        pricePerMinute: Number(updates.pricePerMinute),
        yearsExperience: Number(updates.yearsExperience),
        rating: Number(updates.rating),
        sort_order: Number(updates.sort_order || 100)
    };

    let error;
    if (id) {
      const { error: err } = await supabase.from('advisors').update(cleanUpdates).eq('id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('advisors').insert([cleanUpdates]);
      error = err;
    }

    if (error) alert('保存失败: ' + error.message);
    else {
      setIsModalOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除?')) return;
    await supabase.from('advisors').delete().eq('id', id);
    fetchData();
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const cur = safeTags(form.specialties);
    setForm({ ...form, specialties: [...cur, newTag.trim()] });
    setNewTag('');
  };
  const removeTag = (idx: number) => {
    const cur = safeTags(form.specialties);
    setForm({ ...form, specialties: cur.filter((_, i) => i !== idx) });
  };
  const toggleCategory = (val: string) => {
    const cats = form.category ? form.category.split(',') : [];
    if (cats.includes(val)) setForm({ ...form, category: cats.filter(c => c !== val).join(',') });
    else setForm({ ...form, category: [...cats, val].join(',') });
  };
  
  const handleAddCat = async () => {
    if(!newCatLabel || !newCatValue) return;
    await supabase.from('categories').insert([{ label: newCatLabel, value: newCatValue }]);
    setNewCatLabel(''); setNewCatValue('');
    fetchData();
  };
  const handleDelCat = async (id: number) => {
    if(confirm('删除此分类?')) {
        await supabase.from('categories').delete().eq('id', id);
        fetchData();
    }
  };

  // 🔐 登出功能
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      
      <div className="bg-white px-8 py-5 flex justify-between items-center shadow-sm mb-6 sticky top-0 z-20">
         <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🌲 留子树洞 <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-200">Test Env</span>
         </h1>
         <div className="flex gap-3">
            <button onClick={() => setIsCatModalOpen(true)} className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 text-sm">🗂️ 分类管理</button>
            <button onClick={() => handleEdit()} className="bg-purple-700 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-800 shadow-md text-sm">+ 添加顾问</button>
            {/* 🔐 退出按钮 */}
            <button onClick={handleLogout} className="bg-red-50 text-red-500 border border-red-100 px-4 py-2 rounded-lg font-bold hover:bg-red-100 text-sm">退出</button>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6">
        {loading ? <div className="text-center py-20 text-gray-400">加载数据中...</div> : 
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           {/* 表头 */}
           <div className="grid grid-cols-12 bg-gray-50 p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
              <div className="col-span-1">头像</div>
              <div className="col-span-3">顾问信息</div>
              <div className="col-span-4">分类 / 账号</div>
              <div className="col-span-2">价格</div>
              <div className="col-span-2 text-right">操作</div>
           </div>
           
           {/* 列表 */}
           {advisors.map(adv => (
             <div key={adv.id} className="grid grid-cols-12 p-4 border-b hover:bg-gray-50 items-center transition-colors">
                <div className="col-span-1">
                   <img src={adv.imageUrl} className="w-12 h-12 rounded-full object-cover border bg-gray-100"/>
                </div>
                <div className="col-span-3 pr-4">
                   <div className="font-bold text-gray-900 text-sm">{adv.name_zh || adv.name}</div>
                   <div className="text-xs text-gray-500 mt-1">{adv.title_zh}</div>
                   {/* 显示排序 */}
                   <div className="mt-1">
                      <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">Sort: {adv.sort_order || 100}</span>
                   </div>
                </div>
                <div className="col-span-4">
                   {/* 显示邮箱 */}
                   <div className="mb-2">
                      {adv.email ? 
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-mono">📧 {adv.email}</span> : 
                        <span className="text-[10px] text-gray-400">未绑定</span>
                      }
                   </div>
                   <div className="flex flex-wrap gap-1">
                      {(adv.category || '').split(',').filter(Boolean).map((c, i) => {
                         const label = categories.find(cat => cat.value === c)?.label || c;
                         return <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">{label}</span>
                      })}
                   </div>
                </div>
                <div className="col-span-2 font-bold text-gray-700 text-sm">
                   $ {adv.pricePerMinute}
                </div>
                <div className="col-span-2 text-right space-x-2">
                   <button onClick={() => handleEdit(adv)} className="text-blue-600 font-bold text-xs hover:underline">编辑</button>
                   <button onClick={() => handleDelete(adv.id)} className="text-red-400 font-bold text-xs hover:underline">删除</button>
                </div>
             </div>
           ))}
        </div>}
      </main>

      {/* --- 编辑弹窗 --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                 <h2 className="font-bold text-lg text-gray-800">{form.id ? '编辑顾问' : '添加顾问'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 
                 {/* 测试环境配置区 */}
                 <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 grid grid-cols-2 gap-6 shadow-sm">
                    <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-bold text-blue-800 mb-1">📧 绑定谷歌邮箱 (顾问凭证)</label>
                       <input type="text" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none font-mono text-blue-900" placeholder="advisor@gmail.com"/>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-bold text-blue-800 mb-1">🔥 排序权重 (越小越前)</label>
                       <input type="number" value={form.sort_order || 100} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="w-full p-2 text-sm border border-blue-200 rounded-lg font-bold text-blue-900"/>
                    </div>
                 </div>

                 {/* 基础信息 */}
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">姓名 (中文)</label>
                       <input type="text" value={form.name_zh || ''} onChange={e => setForm({...form, name_zh: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"/>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">头衔/标签</label>
                       <input type="text" value={form.title_zh || ''} onChange={e => setForm({...form, title_zh: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"/>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-sm font-bold text-gray-700 mb-2">个人简介</label>
                       <textarea value={form.bio_zh || ''} onChange={e => setForm({...form, bio_zh: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl h-24 focus:ring-2 focus:ring-purple-500 outline-none resize-none"></textarea>
                    </div>
                 </div>

                 {/* 分类 */}
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">所属分类</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {categories.map(cat => (
                          <label key={cat.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.category?.includes(cat.value) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
                             <input type="checkbox" className="hidden" checked={form.category?.includes(cat.value)} onChange={() => toggleCategory(cat.value)}/>{cat.label}
                          </label>
                       ))}
                    </div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">标签</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                       {safeTags(form.specialties).map((tag, i) => (
                          <span key={i} className="bg-white border border-gray-200 px-2 py-1 rounded text-xs flex items-center gap-1 text-gray-600">
                             {tag} <button onClick={() => removeTag(i)} className="text-gray-400 hover:text-red-500">×</button>
                          </span>
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="输入新话题..." className="p-2 text-sm border rounded-lg"/>
                       <button onClick={addTag} className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-black">添加</button>
                    </div>
                 </div>

                 {/* 图片与价格 */}
                 <div className="space-y-3 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" placeholder="头像 URL" value={form.imageUrl || ''} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-gray-50 text-gray-600"/>
                       <input type="text" placeholder="二维码 URL" value={form.bookingQrUrl || ''} onChange={e => setForm({...form, bookingQrUrl: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-gray-50 text-gray-600"/>
                    </div>
                    <input type="text" placeholder="证书 URL" value={safeTags(form.certificates).join(',')} onChange={e => setForm({...form, certificates: e.target.value.split(',')})} className="w-full p-2 border rounded-lg text-xs bg-gray-50 text-gray-600"/>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                    <input type="number" placeholder="价格" value={form.pricePerMinute} onChange={e => setForm({...form, pricePerMinute: parseFloat(e.target.value)})} className="p-3 border rounded-xl text-sm"/>
                    <input type="number" placeholder="年限" value={form.yearsExperience} onChange={e => setForm({...form, yearsExperience: parseFloat(e.target.value)})} className="p-3 border rounded-xl text-sm"/>
                    <input type="number" placeholder="评分" value={form.rating} onChange={e => setForm({...form, rating: parseFloat(e.target.value)})} className="p-3 border rounded-xl text-sm"/>
                 </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200">取消</button>
                 <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-purple-900 text-white font-bold hover:bg-purple-800 shadow-lg">保存</button>
              </div>
           </div>
        </div>
      )}

      {/* --- 分类弹窗 --- */}
      {isCatModalOpen && (
         <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl animate-fade-in">
               <h3 className="font-bold mb-4 text-gray-800">📂 分类管理</h3>
               <div className="space-y-2 mb-4 bg-purple-50 p-3 rounded-lg">
                  <input placeholder="分类名" value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} className="w-full p-2 border rounded text-sm"/>
                  <input placeholder="Code" value={newCatValue} onChange={e => setNewCatValue(e.target.value)} className="w-full p-2 border rounded text-sm"/>
                  <button onClick={handleAddCat} className="w-full bg-purple-600 text-white py-2 rounded font-bold text-sm hover:bg-purple-700">添加</button>
               </div>
               <div className="max-h-48 overflow-y-auto space-y-1">
                  {categories.map(c => (
                     <div key={c.id} className="flex justify-between p-2 hover:bg-gray-50 border rounded items-center">
                        <div><div className="text-xs font-bold">{c.label}</div></div>
                        <button onClick={() => handleDelCat(c.id)} className="text-red-400 text-xs hover:text-red-600">删除</button>
                     </div>
                  ))}
               </div>
               <button onClick={() => setIsCatModalOpen(false)} className="w-full mt-4 text-gray-400 text-xs hover:text-gray-600">关闭</button>
            </div>
         </div>
      )}
    </div>
  );
}
