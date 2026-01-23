import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Advisor } from '../types';

const AdminDashboard = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Partial<Advisor> | null>(null);

  // 加载数据
  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('advisors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAdvisors(data || []);
    } catch (error) {
      console.error('Error fetching advisors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这位顾问吗？')) return;
    try {
      const { error } = await supabase.from('advisors').delete().eq('id', id);
      if (error) throw error;
      setAdvisors(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      alert('删除失败: ' + error.message);
    }
  };

  const openModal = (advisor: Advisor | null = null) => {
    setEditingAdvisor(advisor ? { ...advisor } : { isOnline: true, pricePerMinute: 1.99, rating: 5, reviewCount: 0 });
    setIsModalOpen(true);
  };

  // ✅ 新增：处理图片上传 (转为 Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ⚠️ 限制图片大小为 500KB，防止数据库报错
    if (file.size > 500 * 1024) {
      alert("图片太大了！为了网站速度，请上传小于 500KB 的图片。\n或者您可以先用微信/QQ截图一下再上传，体积会小很多。");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // 把读取到的图片数据存入状态
      handleChange('imageUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvisor) return;

    try {
      const isEdit = !!editingAdvisor.id;
      
      const saveData = {
        ...editingAdvisor,
        specialties: typeof editingAdvisor.specialties === 'string' 
          ? (editingAdvisor.specialties as string).split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
          : (editingAdvisor.specialties || []),
        specialties_zh: typeof editingAdvisor.specialties_zh === 'string'
          ? (editingAdvisor.specialties_zh as string).split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
          : (editingAdvisor.specialties_zh || []),
        pricePerMinute: Number(editingAdvisor.pricePerMinute) || 0,
        yearsExperience: Number(editingAdvisor.yearsExperience) || 1,
        rating: Number(editingAdvisor.rating) || 5,
        // ✅ 修复：确保 reviewCount 存在，如果没填就默认为 0
        reviewCount: Number(editingAdvisor.reviewCount) || 0,
        isOnline: Boolean(editingAdvisor.isOnline)
      };

      if (isEdit) {
        const { error } = await supabase.from('advisors').update(saveData).eq('id', editingAdvisor.id);
        if (error) throw error;
      } else {
        // ID 是自动生成的，插入时不需要
        const { id, ...insertData } = saveData as any; 
        const { error } = await supabase.from('advisors').insert([insertData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchAdvisors(); 
    } catch (error: any) {
      console.error('Save error:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleChange = (field: keyof Advisor, value: any) => {
    setEditingAdvisor(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">树洞顾问管理后台</h1>
          <button onClick={() => openModal()} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            + 添加顾问
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4">头像</th>
                <th className="p-4">姓名 (中/英)</th>
                <th className="p-4">分类</th>
                <th className="p-4">状态</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {advisors.map(advisor => (
                <tr key={advisor.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <img src={advisor.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{advisor.name_zh || '-'}</div>
                    <div className="text-xs text-gray-400">{advisor.name}</div>
                  </td>
                  <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{advisor.category}</span></td>
                  <td className="p-4">
                    {advisor.isOnline ? 
                      <span className="text-green-600 text-xs font-bold">● 在线</span> : 
                      <span className="text-gray-400 text-xs">○ 离线</span>
                    }
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openModal(advisor)} className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                    <button onClick={() => handleDelete(advisor.id)} className="text-red-500 hover:text-red-700 text-sm">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingAdvisor.id ? '编辑顾问' : '添加顾问'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">英文名 (必填)</label>
                  <input required type="text" value={editingAdvisor.name || ''} onChange={e => handleChange('name', e.target.value)} className="w-full border p-2 rounded" placeholder="Liu PangPang" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-purple-700">中文名 (关键)</label>
                  <input type="text" value={editingAdvisor.name_zh || ''} onChange={e => handleChange('name_zh', e.target.value)} className="w-full border p-2 rounded border-purple-200" placeholder="刘胖胖" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">英文头衔</label>
                  <input type="text" value={editingAdvisor.title || ''} onChange={e => handleChange('title', e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-purple-700">中文头衔</label>
                  <input type="text" value={editingAdvisor.title_zh || ''} onChange={e => handleChange('title_zh', e.target.value)} className="w-full border p-2 rounded border-purple-200" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">分类 (必选)</label>
                <select value={editingAdvisor.category || ''} onChange={e => handleChange('category', e.target.value)} className="w-full border p-2 rounded">
                  <option value="">请选择...</option>
                  <option value="Tarot">塔罗 (Tarot)</option>
                  <option value="Astrology">占星 (Astrology)</option>
                  <option value="Love">情感 (Love)</option>
                  <option value="Career">事业 (Career)</option>
                  <option value="Study">学业 (Study)</option>
                </select>
              </div>

              {/* ✅ 改回：本地图片上传 */}
              <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                <label className="block text-xs font-bold mb-2">头像图片 (点击上传)</label>
                
                {/* 图片预览 */}
                {editingAdvisor.imageUrl && (
                  <div className="mb-2">
                    <img src={editingAdvisor.imageUrl} alt="预览" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                />
                <p className="text-[10px] text-gray-400 mt-1">⚠️ 提示：请上传小于 500KB 的图片，否则可能无法保存。</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="online" checked={editingAdvisor.isOnline || false} onChange={e => handleChange('isOnline', e.target.checked)} className="w-4 h-4" />
                <label htmlFor="online" className="text-sm font-bold text-green-700">设为在线状态 (在前端显示)</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100">取消</button>
                <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white font-bold hover:bg-purple-700">保存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
