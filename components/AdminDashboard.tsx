import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Advisor } from '../types';

const AdminDashboard = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Partial<Advisor> | null>(null);

  // 专门用于编辑中文擅长话题的文本状态
  const [specialtiesText, setSpecialtiesText] = useState('');

  // 1. 加载数据
  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .order('created_at', { ascending: false });
      
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

  // 2. 退出登录
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await supabase.auth.signOut();
    }
  };

  // 3. 删除
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

  // 4. 打开弹窗 (🛡️ 数据清洗 - 修复 ["xxx"] 显示问题)
  const openModal = (advisor: Advisor | null = null) => {
    if (advisor) {
      setEditingAdvisor({ ...advisor });
      
      // 处理擅长话题显示：
      let safeText = '';
      const raw = advisor.specialties_zh;

      if (Array.isArray(raw)) {
        safeText = raw.join(', ');
      } else if (typeof raw === 'string') {
        // 清洗 ["xxx"] 格式，防止出现 ["22222"] 这种怪字符
        const cleaned = (raw as string).replace(/[\[\]"']/g, '');
        safeText = cleaned;
      }
      setSpecialtiesText(safeText);

    } else {
      // 新增默认值
      setEditingAdvisor({ 
        isOnline: true, 
        pricePerMinute: 1.99, 
        rating: 5, 
        reviewCount: 0,
        yearsExperience: 1,
        category: 'Tarot'
      });
      setSpecialtiesText('');
    }
    setIsModalOpen(true);
  };

  // 5. 🟢 核心升级：智能图片压缩 (解决 Failed to fetch)
  // 无论您传多大的图，这里都会把它“瘦身”到 800px 宽，体积骤降 90%，但肉眼看不出区别。
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'bookingQrUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 创建读取器
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 创建画布进行压缩
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 📏 强制缩放：最大宽度或高度不超过 800px
        // (网页头像 800px 已经是非常非常清晰了，再大就是浪费流量且会导致报错)
        const MAX_DIMENSION = 800;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘图并压缩
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // 📦 压缩为 JPEG，质量 0.8 (体积会变很小，且兼容性好)
            // 这就是解决报错的关键！
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8); 
            
            // 存入状态
            handleChange(field, dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 6. 保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvisor) return;

    try {
      const isEdit = !!editingAdvisor.id;
      
      // 清洗输入内容 (去掉可能存在的 [" "] 符号)
      const cleanInput = specialtiesText.replace(/[\[\]"']/g, ''); 
      const specialtiesArray = cleanInput.split(/[,，、]/).map(s => s.trim()).filter(Boolean);

      // 整理数据
      const saveData = {
        ...editingAdvisor,
        
        // 中英自动填充
        name_zh: editingAdvisor.name_zh,
        title_zh: editingAdvisor.title_zh,
        bio_zh: editingAdvisor.bio_zh,
        specialties_zh: specialtiesArray,

        // 英文兜底
        name: editingAdvisor.name_zh, 
        title: editingAdvisor.title_zh,
        bio: editingAdvisor.bio_zh,
        specialties: specialtiesArray, 
        
        // 数值转换
        pricePerMinute: Number(editingAdvisor.pricePerMinute) || 0,
        yearsExperience: Number(editingAdvisor.yearsExperience) || 1,
        rating: Number(editingAdvisor.rating) || 5,
        reviewCount: Number(editingAdvisor.reviewCount) || 0,
        isOnline: Boolean(editingAdvisor.isOnline)
      };

      if (isEdit) {
        const { error } = await supabase.from('advisors').update(saveData).eq('id', editingAdvisor.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = saveData as any; 
        const { error } = await supabase.from('advisors').insert([insertData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchAdvisors(); // 刷新列表
      alert('保存成功！');

    } catch (error: any) {
      console.error('Save error:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleChange = (field: keyof Advisor, value: any) => {
    setEditingAdvisor(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-10 text-center text-gray-500">正在加载数据...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">留子树洞 - 顾问管理</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => openModal()} className="px-6 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 font-medium shadow-md transition">
              + 添加顾问
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition">
              退出
            </button>
          </div>
        </div>

        {/* 列表区域 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="p-4">头像</th>
                <th className="p-4">顾问信息</th>
                <th className="p-4">擅长分类</th>
                <th className="p-4">价格</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {advisors.map(advisor => (
                <tr key={advisor.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <img src={advisor.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{advisor.name_zh || advisor.name}</div>
                    <div className="text-xs text-gray-500">{advisor.title_zh || advisor.title}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                      {advisor.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-600">
                    $ {advisor.pricePerMinute}
                  </td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => openModal(advisor)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">编辑</button>
                    <button onClick={() => handleDelete(advisor.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && editingAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editingAdvisor.id ? '编辑顾问' : '添加顾问'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">姓名 (中文)</label>
                  <input required type="text" value={editingAdvisor.name_zh || ''} onChange={e => handleChange('name_zh', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="例如：刘洋" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">头衔/标签</label>
                  <input type="text" value={editingAdvisor.title_zh || ''} onChange={e => handleChange('title_zh', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="例如：资深塔罗师" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">个人简介 (详细介绍)</label>
                <textarea rows={4} value={editingAdvisor.bio_zh || ''} onChange={e => handleChange('bio_zh', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="请在这里填写详细的个人经历..." />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">擅长话题 (用逗号分隔)</label>
                  <input 
                    type="text" 
                    value={specialtiesText} 
                    onChange={e => setSpecialtiesText(e.target.value)} 
                    className="w-full border p-2 rounded-lg" 
                    placeholder="例如: 情感复合, 事业发展" 
                  />
                  <p className="text-xs text-gray-400 mt-1">请只输入文字，不需要输入 [""] 等符号</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">分类</label>
                    <select value={editingAdvisor.category || ''} onChange={e => handleChange('category', e.target.value)} className="w-full border p-2 rounded-lg text-sm">
                      <option value="Tarot">塔罗 (Tarot)</option>
                      <option value="Astrology">占星 (Astrology)</option>
                      <option value="Love">情感 (Love)</option>
                      <option value="Career">事业 (Career)</option>
                      <option value="Study">学业 (Study)</option>
                      <option value="Life Abroad">海外生活</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">从业年限</label>
                    <input type="number" value={editingAdvisor.yearsExperience || 0} onChange={e => handleChange('yearsExperience', e.target.value)} className="w-full border p-2 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">价格 ($/分)</label>
                    <input type="number" step="0.01" value={editingAdvisor.pricePerMinute || 0} onChange={e => handleChange('pricePerMinute', e.target.value)} className="w-full border p-2 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-sm font-bold text-gray-700 mb-2">头像 (支持大图自动压缩)</div>
                  {editingAdvisor.imageUrl ? (
                    <img src={editingAdvisor.imageUrl} alt="Avatar" className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageUrl')} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-purple-100 file:text-purple-700" />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-sm font-bold text-gray-700 mb-2">二维码 (支持大图自动压缩)</div>
                  {editingAdvisor.bookingQrUrl ? (
                    <img src={editingAdvisor.bookingQrUrl} alt="QR" className="w-16 h-16 mx-auto mb-2 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 mx-auto mb-2 flex items-center justify-center text-xs text-gray-400">无图</div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bookingQrUrl')} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-purple-100 file:text-purple-700" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t mt-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="online" checked={editingAdvisor.isOnline || false} onChange={e => handleChange('isOnline', e.target.checked)} className="w-5 h-5 text-purple-600 rounded" />
                  <label htmlFor="online" className="text-sm font-bold text-gray-700">设为在线</label>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100">取消</button>
                  <button type="submit" className="px-6 py-2 rounded-lg bg-purple-900 text-white font-bold hover:bg-purple-800">保存</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
