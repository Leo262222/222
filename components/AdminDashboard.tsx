import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Advisor } from '../types';

// 预设的分类选项 (对应前端的页签)
const CATEGORY_OPTIONS = [
  { value: 'Tarot', label: '塔罗/雷诺曼 (Tarot)' },
  { value: 'Astrology', label: '占星 (Astrology)' },
  { value: 'Love', label: '情感咨询 (Love)' },
  { value: 'Career', label: '事业学业 (Career)' },
  { value: 'Life Abroad', label: '海外生活 (Life Abroad)' }
];

// 预设的擅长话题 (快捷标签)
const PRESET_SPECIALTIES = [
  "情感复合", "正缘桃花", "分手挽回", "暗恋", 
  "事业发展", "跳槽求职", "学业考试", "留学申请",
  "原生家庭", "人际关系", "个人成长", "灵性疗愈"
];

const AdminDashboard = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Partial<Advisor> | null>(null);

  // 状态：用于编辑擅长话题的文本
  const [specialtiesText, setSpecialtiesText] = useState('');
  // 状态：用于编辑多选分类
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
      console.error('Error fetching:', error);
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

  // 4. 打开弹窗 (初始化数据)
  const openModal = (advisor: Advisor | null = null) => {
    if (advisor) {
      setEditingAdvisor({ ...advisor });
      
      // A. 处理擅长话题 (数组转文本)
      let safeText = '';
      const rawTags = advisor.specialties_zh;
      if (Array.isArray(rawTags)) safeText = rawTags.join(', ');
      else if (typeof rawTags === 'string') safeText = rawTags.replace(/[\[\]"']/g, '');
      setSpecialtiesText(safeText);

      // B. 处理分类 (字符串转数组)
      // 数据库里存的是 "Tarot,Astrology"，我们需要把它拆开变成勾选状态
      const rawCat = advisor.category || '';
      setSelectedCategories(rawCat.split(',').filter(Boolean));

    } else {
      // 新增默认值
      setEditingAdvisor({ 
        isOnline: true, 
        pricePerMinute: 1.99, 
        rating: 5, 
        reviewCount: 0,
        yearsExperience: 1,
        certificates: []
      });
      setSpecialtiesText('');
      setSelectedCategories([]);
    }
    setIsModalOpen(true);
  };

  // 5. 图片处理
  const processImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
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
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8); 
            callback(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'bookingQrUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImage(file, (base64) => handleChange(field, base64));
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingAdvisor) return;
    const currentCerts = editingAdvisor.certificates || [];
    if (currentCerts.length >= 5) {
      alert("最多只能上传 5 张证书！");
      return;
    }
    processImage(file, (base64) => {
      const updatedCerts = [...currentCerts, base64];
      setEditingAdvisor(prev => ({ ...prev, certificates: updatedCerts }));
    });
  };

  const removeCertificate = (indexToRemove: number) => {
    if (!editingAdvisor) return;
    const currentCerts = editingAdvisor.certificates || [];
    const updatedCerts = currentCerts.filter((_, index) => index !== indexToRemove);
    setEditingAdvisor(prev => ({ ...prev, certificates: updatedCerts }));
  };

  // ✅ 处理分类勾选
  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(value)) {
        return prev.filter(c => c !== value); // 取消勾选
      } else {
        return [...prev, value]; // 勾选
      }
    });
  };

  // ✅ 处理快捷标签点击
  const addPresetTag = (tag: string) => {
    if (!specialtiesText.includes(tag)) {
      setSpecialtiesText(prev => prev ? `${prev}, ${tag}` : tag);
    }
  };

  // 6. 保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvisor) return;

    try {
      const isEdit = !!editingAdvisor.id;
      
      // 1. 清洗擅长话题
      const cleanInput = specialtiesText.replace(/[\[\]"']/g, ''); 
      const specialtiesArray = cleanInput.split(/[,，、]/).map(s => s.trim()).filter(Boolean);

      // 2. 整理分类 (将数组 ["Tarot", "Love"] 变成字符串 "Tarot,Love" 存入数据库)
      const categoryString = selectedCategories.join(',');

      // 3. 整理数据
      const saveData = {
        ...editingAdvisor,
        category: categoryString, // ✅ 存多选结果
        certificates: editingAdvisor.certificates || [],
        name_zh: editingAdvisor.name_zh,
        title_zh: editingAdvisor.title_zh,
        bio_zh: editingAdvisor.bio_zh,
        specialties_zh: specialtiesArray,
        name: editingAdvisor.name_zh, 
        title: editingAdvisor.title_zh,
        bio: editingAdvisor.bio_zh,
        specialties: specialtiesArray, 
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
      fetchAdvisors(); 
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
          <div><h1 className="text-2xl font-bold text-gray-800">留子树洞 - 顾问管理</h1></div>
          <div className="flex gap-3">
            <button onClick={() => openModal()} className="px-6 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 font-medium shadow-md transition">+ 添加顾问</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition">退出</button>
          </div>
        </div>

        {/* 列表区域 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="p-4">头像</th>
                <th className="p-4">顾问信息</th>
                <th className="p-4">分类标签</th>
                <th className="p-4">价格</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {advisors.map(advisor => (
                <tr key={advisor.id} className="hover:bg-gray-50 transition">
                  <td className="p-4"><img src={advisor.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" /></td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{advisor.name_zh || advisor.name}</div>
                    <div className="text-xs text-gray-500">{advisor.title_zh || advisor.title}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {/* 显示多选分类 */}
                      {(advisor.category || '').split(',').filter(Boolean).map(cat => (
                         <span key={cat} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium border border-purple-100">{cat}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-600">$ {advisor.pricePerMinute}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">{editingAdvisor.id ? '编辑顾问' : '添加顾问'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">姓名 (中文)</label>
                  <input required autoComplete="off" type="text" value={editingAdvisor.name_zh || ''} onChange={e => handleChange('name_zh', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="例如：刘洋" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">头衔/标签</label>
                  <input type="text" autoComplete="off" value={editingAdvisor.title_zh || ''} onChange={e => handleChange('title_zh', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="例如：资深塔罗师" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">个人简介 (详细介绍)</label>
                <textarea rows={4} autoComplete="off" value={editingAdvisor.bio_zh || ''} onChange={e => handleChange('bio_zh', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="请在这里填写详细的个人经历..." />
              </div>

              <div className="bg-gray-50 p-5 rounded-xl space-y-5 border border-gray-100">
                
                {/* 🔴 改动点1：多选分类 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">所属分类 (可多选)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${selectedCategories.includes(opt.value) ? 'bg-purple-100 border-purple-400 text-purple-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedCategories.includes(opt.value)}
                          onChange={() => toggleCategory(opt.value)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-xs font-bold">{opt.label.split('(')[0]}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCategories.length === 0 && <p className="text-xs text-red-400 mt-1">* 请至少选择一个分类</p>}
                </div>

                {/* 🔴 改动点2：快捷话题标签 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">擅长话题</label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    value={specialtiesText} 
                    onChange={e => setSpecialtiesText(e.target.value)} 
                    className="w-full border p-2 rounded-lg mb-2" 
                    placeholder="例如: 情感复合, 事业发展" 
                  />
                  {/* 快捷按钮区 */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SPECIALTIES.map(tag => (
                      <button 
                        type="button" 
                        key={tag}
                        onClick={() => addPresetTag(tag)}
                        className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-500 hover:border-purple-300 hover:text-purple-600 transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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

              {/* 背景认证 (证书) */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-700">背景认证 (证书/资质)</label>
                  <span className="text-xs text-gray-400">{(editingAdvisor.certificates || []).length} / 5</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(editingAdvisor.certificates || []).map((cert, idx) => (
                    <div key={idx} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img src={cert} alt={`Cert ${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeCertificate(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-sm">✕</button>
                    </div>
                  ))}
                  {(editingAdvisor.certificates || []).length < 5 && (
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-purple-300 transition">
                      <span className="text-2xl text-gray-400">+</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCertificateUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-sm font-bold text-gray-700 mb-2">头像</div>
                  {editingAdvisor.imageUrl ? <img src={editingAdvisor.imageUrl} alt="Avatar" className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" /> : <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>}
                  <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload(e, 'imageUrl')} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-purple-100 file:text-purple-700" />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-sm font-bold text-gray-700 mb-2">预约二维码</div>
                  {editingAdvisor.bookingQrUrl ? <img src={editingAdvisor.bookingQrUrl} alt="QR" className="w-16 h-16 mx-auto mb-2 object-contain" /> : <div className="w-16 h-16 bg-gray-200 mx-auto mb-2 flex items-center justify-center text-xs text-gray-400">无图</div>}
                  <input type="file" accept="image/*" onChange={(e) => handleSingleImageUpload(e, 'bookingQrUrl')} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-purple-100 file:text-purple-700" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t mt-4">
                <div className="flex items-center gap-2"><input type="checkbox" id="online" checked={editingAdvisor.isOnline || false} onChange={e => handleChange('isOnline', e.target.checked)} className="w-5 h-5 text-purple-600 rounded" /><label htmlFor="online" className="text-sm font-bold text-gray-700">设为在线</label></div>
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
