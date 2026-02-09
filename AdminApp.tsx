import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 类型定义 ---
interface Advisor {
  id: number;
  name: string;
  title: string;
  imageUrl: string;
  yearsExperience: number;
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
  sort_order?: number; // ✅ 保留：排序字段
}

const CATEGORIES = [
  { value: 'Tarot', label: '塔罗/雷诺曼' },
  { value: 'Astrology', label: '占星' },
  { value: 'Emotional', label: '情感咨询' },
  { value: 'Career', label: '职业学业' },
  { value: 'Overseas', label: '海外生活' },
];

export default function AdminApp() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Advisor>>({});

  // 1. 加载顾问列表
  const fetchAdvisors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .order('sort_order', { ascending: true }) // ✅ 保留：按权重排序
      .order('id', { ascending: true });
      
    if (data) setAdvisors(data as Advisor[]);
    if (error) alert('加载失败: ' + error.message);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  // 2. 打开弹窗
  const handleEdit = (advisor?: Advisor) => {
    if (advisor) {
      setForm({ ...advisor });
    } else {
      setForm({
        name: 'New Advisor',
        rating: 5,
        isOnline: true,
        specialties: [],
        pricePerMinute: 1.99,
        imageUrl: 'https://ui-avatars.com/api/?name=New',
        yearsExperience: 1,
        sort_order: 100 // 默认排序
      });
    }
    setIsModalOpen(true);
  };

  // 3. 保存
  const handleSave = async () => {
    const { id, ...updates } = form;
    let error;
    if (id) {
      const { error: updateError } = await supabase.from('advisors').update(updates).eq('id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('advisors').insert([updates]);
      error = insertError;
    }

    if (error) {
      alert('❌ 保存失败: ' + error.message);
    } else {
      alert('✅ 保存成功！');
      setIsModalOpen(false);
      fetchAdvisors();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除?')) return;
    await supabase.from('advisors').delete().eq('id', id);
    fetchAdvisors();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🛠️ 顾问管理后台</h1>
          <button onClick={() => handleEdit()} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow">+ 新增顾问</button>
        </div>

        {loading ? <p className="text-center text-gray-500">加载数据中...</p> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-gray-500">
                <tr>
                  <th className="p-4">排序</th>
                  <th className="p-4">顾问</th>
                  <th className="p-4">分类</th>
                  <th className="p-4">价格</th>
                  <th className="p-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {advisors.map(adv => (
                  <tr key={adv.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                        <span className={`font-bold px-2 py-1 rounded ${adv.sort_order && adv.sort_order < 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            {adv.sort_order || 100}
                        </span>
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <img src={adv.imageUrl} className="w-10 h-10 rounded-full object-cover bg-gray-200"/>
                      <span className="font-bold text-gray-800">{adv.name_zh || adv.name}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{adv.category}</td>
                    <td className="p-4 font-bold">${adv.pricePerMinute}</td>
                    <td className="p-4 space-x-2 text-sm">
                      <button onClick={() => handleEdit(adv)} className="text-blue-600 hover:underline font-bold">编辑</button>
                      <button onClick={() => handleDelete(adv.id)} className="text-red-400 hover:underline">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 编辑弹窗 --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl h-[90vh] overflow-y-auto relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
              <h2 className="text-xl font-bold mb-6 text-gray-800">编辑顾问资料</h2>
              
              <div className="space-y-5">
                
                {/* 1. 基本信息 + 排序权重 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">姓名 (中文)</label>
                        <input type="text" value={form.name_zh || ''} onChange={e => setForm({...form, name_zh: e.target.value})} className="w-full p-2 border rounded-lg"/>
                    </div>
                    {/* ✅ 保留：排序权重输入框 */}
                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                        <label className="block text-sm font-bold text-yellow-800 mb-1">🔥 排序权重 (越小越靠前)</label>
                        <input type="number" value={form.sort_order || 100} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="w-full p-2 border border-yellow-400 rounded bg-white font-bold"/>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">头衔/标签</label>
                    <input type="text" value={form.title_zh || ''} onChange={e => setForm({...form, title_zh: e.target.value})} className="w-full p-2 border rounded-lg"/>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">个人简介</label>
                  <textarea value={form.bio_zh || ''} onChange={e => setForm({...form, bio_zh: e.target.value})} className="w-full p-2 border rounded-lg h-24"></textarea>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">所属分类</label>
                   <div className="flex gap-2 flex-wrap">
                     {CATEGORIES.map(cat => (
                       <label key={cat.value} className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-bold border ${form.category?.includes(cat.value) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                         <input type="checkbox" className="hidden" checked={form.category?.includes(cat.value)} onChange={() => setForm({...form, category: cat.value})}/>{cat.label}
                       </label>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">价格 ($/分)</label>
                    <input type="number" value={form.pricePerMinute || 0} onChange={e => setForm({...form, pricePerMinute: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">从业年限</label>
                    <input type="number" value={form.yearsExperience || 0} onChange={e => setForm({...form, yearsExperience: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                  </div>
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">头像 URL</label>
                   <input type="text" value={form.imageUrl || ''} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full p-2 border rounded text-xs text-gray-400"/>
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-4 border-t">
                <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg">💾 保存修改</button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200">取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
