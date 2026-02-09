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
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  bio: string;
  bio_zh?: string;
  bookingQrUrl?: string;
  certificates?: any;
  
  // ✅ 核心字段：排序权重 (默认 100)
  sort_order?: number; 
  email?: string; // (暂时保留，不作为重点)
}

interface Category {
  id: number;
  value: string;
  label: string;
}

export default function AdminApp() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
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
    // ✅ 核心逻辑：按 sort_order 升序排列 (1 在 2 前面)
    const { data: advData } = await supabase
      .from('advisors')
      .select('*')
      .order('sort_order', { ascending: true }) 
      .order('id', { ascending: true });
      
    const { data: catData } = await supabase.from('categories').select('*').order('id', { ascending: true });

    if (advData) setAdvisors(advData as Advisor[]);
    if (catData) setCategories(catData as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- 操作逻辑 ---
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
        yearsExperience: 1, 
        sort_order: 100, // 默认排序
        category: ''
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
        // 确保数值正确
        pricePerMinute: Number(updates.pricePerMinute),
        yearsExperience: Number(updates.yearsExperience),
        rating: Number(updates.rating),
        // ✅ 保存排序权重
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      
      <div className="bg-white px-8 py-5 flex justify-between items-center shadow-sm mb-6">
         <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🌲 顾问排序管理系统 <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Test</span>
         </h1>
         <div className="flex gap-3">
            <button onClick={() => setIsCatModalOpen(true)} className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 text-sm">🗂️ 分类管理</button>
            <button onClick={() => handleEdit()} className="bg-purple-700 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-800 shadow-md text-sm">+ 添加顾问</button>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6">
        {loading ? <div className="text-center py-20 text-gray-400">加载数据中...</div> : 
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           {/* 表头：新增“排序”列 */}
           <div className="grid grid-cols-12 bg-gray-50 p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
              <div className="col-span-1">排序</div>
              <div className="col-span-1">头像</div>
              <div className="col-span-4">顾问信息</div>
              <div className="col-span-3">分类标签</div>
              <div className="col-span-1">价格</div>
              <div className="col-span-2 text-right">操作</div>
           </div>
           
           {/* 列表 */}
           {advisors.map(adv => (
             <div key={adv.id} className="grid grid-cols-12 p-4 border-b hover:bg-gray-50 items-center transition-colors">
                <div className="col-span-1 pl-2">
                   {/* ✅ 醒目的排序数字展示 */}
                   <span className={`font-bold text-sm px-2 py-1 rounded ${adv.sort_order! <= 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      #{adv.sort_order || 100}
                   </span>
                </div>
                <div className="col-span-1">
                   <img src={adv.imageUrl} className="w-10 h-10 rounded-full object-cover border bg-gray-100"/>
                </div>
                <div className="col-span-4 pr-4">
                   <div className="font-bold text-gray-900 text-sm">{adv.name_zh || adv.name}</div>
                   <div className="text-xs text-gray-500 mt-1">{adv.title_zh}</div>
                </div>
                <div className="col-span-3 flex flex-wrap gap-1">
                   {(adv.category || '').split(',').filter(Boolean).map((c, i) => (
                      <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">{c}</span>
                   ))}
                </div>
                <div className="col-span-1 font-bold text-gray-700 text-sm">
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
                 
                 {/* ✅ 排序配置区 (高亮显示) */}
                 <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 shadow-sm flex items-center justify-between">
                    <div>
                       <label className="block text-sm font-bold text-yellow-800 mb-1">🔥 排序权重 (核心功能)</label>
                       <p className="text-xs text-yellow-600">数字越小越靠前。例如：填 "1" 会排在第一位。</p>
                    </div>
                    <div className="w-32">
                       <input 
                          type="number" 
                          value={form.sort_order || 100} 
                          onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} 
                          className="w-full p-2 text-xl font-bold text-center border-2 border-yellow-400 rounded-lg text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                       />
                    </div>
                 </div>

                 {/* 邮箱配置 (次要) */}
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 mb-1">绑定邮箱 (用于登录)</label>
                    <input type="text" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 text-sm border rounded" placeholder="advisor@gmail.com"/>
                 </div>

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

                 {/* 分类与标签 */}
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">所属分类</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {categories.map(cat => (
                          <label key={cat.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.category?.includes(cat.value) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
                             <input type="checkbox" className="hidden" checked={form.category?.includes(cat.value)} onChange={() => toggleCategory(cat.value)}/>{cat.label}
                          </label>
                       ))}
                    </div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">擅长话题</label>
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

                 <div className="space-y-3 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" placeholder="头像 URL" value={form.imageUrl || ''} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-gray-50"/>
                       <input type="text" placeholder="二维码 URL" value={form.bookingQrUrl || ''} onChange={e => setForm({...form, bookingQrUrl: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-gray-50"/>
                    </div>
                    <input type="text" placeholder="证书 URL" value={safeTags(form.certificates).join(',')} onChange={e => setForm({...form, certificates: e.target.value.split(',')})} className="w-full p-2 border rounded-lg text-xs bg-gray-50"/>
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
