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

  // 4. 打开弹窗 (🛡️ 数据清洗)
  const openModal = (advisor: Advisor | null = null) => {
    if (advisor) {
      setEditingAdvisor({ ...advisor });
      
      // 处理擅长话题显示：
      let safeText = '';
      const raw = advisor.specialties_zh;

      if (Array.isArray(raw)) {
        safeText = raw.join(', ');
      } else if (typeof raw === 'string') {
        // 清洗 ["xxx"] 格式
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

    // 提示一下
    // alert("正在处理图片，请稍等...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 创建画布
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 📏 强制缩放：最大宽度或高度不超过 800px
        // (网页头像 800px 已经是非常非常清晰了)
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
      
      // 清洗输入内容
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

      if
