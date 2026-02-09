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
  specialties: any; // ⚠️ 改为 any，为了容错
  isOnline: boolean;
  pricePerMinute: number;
  category: string;
  name_zh?: string;
  title_zh?: string;
  bio_zh?: string;
  specialties_zh?: string;
  bookingQrUrl?: string;
  certificates?: any; // ⚠️ 改为 any
  sort_order?: number;
  email?: string;
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
  const [newTag, setNewTag] = useState('');

  // 🛡️ 核心修复：防弹背心函数
  // 不管 data 是什么，永远返回一个数组，防止白屏
  const safeTags = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      // 处理 Postgres 数组格式 "{tag1,tag2}"
      if (data.startsWith('{') && data.endsWith('}')) {
        return data.slice(1, -1).split(',').filter(s => s.trim() !== '');
      }
      // 处理 JSON 格式 "['tag1', 'tag2']"
      try { return JSON.parse(data); } catch { return data.split(','); }
    }
    return [];
  };

  const fetchAdvisors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    
    if (data) setAdvisors(data as Advisor[]);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchAdvisors(); }, []);

  const handleEdit = (advisor?: Advisor) => {
    if (advisor) {
      // 编辑时，先用 safeTags 清洗一下数据
      setForm({ 
        ...advisor, 
        specialties: safeTags(advisor.specialties),
        certificates: safeTags(advisor.certificates)
      });
    } else {
      setForm({
        name: 'New', rating: 5, isOnline: true, specialties: [],
        pricePerMinute: 1.99, imageUrl: 'https://ui-avatars.com/api/?name=New',
        yearsExperience: 1, sort_order: 100
      });
    }
    setNewTag('');
    setIsModalOpen(true);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const currentTags = safeTags(form.specialties);
    setForm({ ...form, specialties: [...currentTags, newTag.trim()] });
    setNewTag('');
  };
  
  const removeTag = (indexToRemove: number) => {
    const currentTags = safeTags(form.specialties);
    setForm({ ...form, specialties: currentTags.filter((_, index) => index !== indexToRemove) });
  };

  const handleSave = async () => {
    const { id, ...updates } = form;
    
    // 确保保存进去的是标准数组
    const cleanUpdates = {
        ...updates,
        specialties: safeTags(updates.specialties),
        // 如果需要兼容旧字段，把数组转回逗号分隔字符串
        specialties_zh: safeTags(updates.specialties).join(',')
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
      alert('✅ 保存成功');
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

        {loading ? <p className="text-center text-gray-500">加载中...</p> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-gray-500">
                <tr>
                  <th className="p-4 w-20">排序</th>
                  <th className="p-4">顾问</th>
                  <th className="p-4">绑定邮箱</th>
                  <th className="p-4">分类</th>
                  <th className="p-4">标签 (话题)</th>
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
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{adv.name_zh || adv.name}</span>
                        <span className="text-xs text-gray-400">{adv.title_zh}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {adv.email ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">{adv.email}</span> : <span className="text-gray-300 text-xs">未绑定</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{adv.category}</td>
                    {/* 🛡️ 这里使用 safeTags 并在 join 前确保是数组 */}
                    <td className="p-4 text-sm text-gray-500 max-w-xs truncate">
                        {safeTags(adv.specialties).join(', ')}
                    </td>
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
            <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-2xl h-[90vh] overflow-y-auto relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
              <h2 className="text-xl font-bold mb-6 text-gray-800">编辑顾问资料</h2>
              
              <div className="space-y-6">
                
                {/* 邮箱绑定 (恢复) */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <label className="block text-sm font-bold text-blue-800 mb-1">📧 绑定谷歌邮箱</label>
                  <input type="text" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="advisor@gmail.com" className="w-full p-2 border border-blue-300 rounded font-mono text-blue-900"/>
                </div>

                {/* 核心排序 */}
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-center justify-between">
                    <div>
                        <span className="font-bold text-yellow-800">🔥 排序权重</span>
                        <span className="text-xs text-yellow-600 ml-2">(数字越小，排名越靠前)</span>
                    </div>
                    <input type="number" value={form.sort_order || 100} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="w-24 p-2 border border-yellow-400 rounded bg-white font-bold text-center"/>
                </div>

                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">姓名 (中文)</label>
                        <input type="text" value={form.name_zh || ''} onChange={e => setForm({...form, name_zh: e.target.value})} className="w-full p-2 border rounded-lg"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">头衔/标签</label>
                        <input type="text" value={form.title_zh || ''} onChange={e => setForm({...form, title_zh: e.target.value})} className="w-full p-2 border rounded-lg"/>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">个人简介</label>
                  <textarea value={form.bio_zh || ''} onChange={e => setForm({...form, bio_zh: e.target.value})} className="w-full p-2 border rounded-lg h-24"></textarea>
                </div>

                {/* 分类 & 标签 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">擅长话题 (标签)</label>
                        <div className="flex gap-2 flex-wrap mb-2">
                            {/* 🛡️ 再次使用 safeTags 确保 map 正常工作 */}
                            {safeTags(form.specialties).map((tag, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1 border">
                                    {tag} <button onClick={() => removeTag(idx)} className="text-gray-400 hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="输入新话题..." className="flex-1 p-2 text-sm border rounded"/>
                            <button onClick={addTag} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">+</button>
                        </div>
                    </div>
                </div>

                {/* 价格与经验 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">价格 ($/分)</label>
                    <input type="number" value={form.pricePerMinute || 0} onChange={e => setForm({...form, pricePerMinute: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">从业年限</label>
                    <input type="number" value={form.yearsExperience || 0} onChange={e => setForm({...form, yearsExperience: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">评分</label>
                     <input type="number" value={form.rating || 5} onChange={e => setForm({...form, rating: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                  </div>
                </div>
                
                {/* 图片配置 */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800">图片配置</h3>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">头像 URL</label>
                        <input type="text" value={form.imageUrl || ''} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full p-2 border rounded text-xs text-gray-600 bg-gray-50"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">微信二维码 URL</label>
                        <input type="text" value={form.bookingQrUrl || ''} onChange={e => setForm({...form, bookingQrUrl: e.target.value})} className="w-full p-2 border rounded text-xs text-gray-600 bg-gray-50"/>
                    </div>
                    {/* 证书，简化为单行输入 */}
                    <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1">证书 URL (多张请用逗号分隔)</label>
                         <input type="text" value={safeTags(form.certificates).join(',')} onChange={e => setForm({...form, certificates: e.target.value})} className="w-full p-2 border rounded text-xs text-gray-600 bg-gray-50"/>
                    </div>
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
