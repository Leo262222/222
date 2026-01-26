import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Advisor } from '../types';

interface CategoryItem {
  id: number;
  value: string;
  label: string;
}

const PRESET_SPECIALTIES = [
  "情感复合", "正缘桃花", "分手挽回", "暗恋", 
  "事业发展", "跳槽求职", "学业考试", "留学申请",
  "原生家庭", "人际关系", "个人成长", "灵性疗愈"
];

const AdminDashboard = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  const [editingAdvisor, setEditingAdvisor] = useState<Partial<Advisor> | null>(null);

  const [specialtiesText, setSpecialtiesText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatValue, setNewCatValue] = useState('');

  // 1. 加载数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: advData, error: advError } = await supabase
        .from('advisors')
        .select('*')
        .order('created_at', { ascending: false });
      if (advError) throw advError;
      setAdvisors(advData || []);

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });
      if (catError) throw catError;
      setCategories(catData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await supabase.auth.signOut();
    }
  };

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

  // 4. 打开顾问弹窗
  const openModal = (advisor: Advisor | null = null) => {
    if (advisor) {
      setEditingAdvisor({ ...advisor });
      
      let safeText = '';
      const rawTags = advisor.specialties_zh as any; 
      
      if (Array.isArray(rawTags)) {
        safeText = rawTags.join(', ');
      } else if (typeof rawTags === 'string') {
        safeText = rawTags.replace(/[\[\]"']/g, ''); 
      }
      setSpecialtiesText(safeText);

      const rawCat = advisor.category || '';
      setSelectedCategories(rawCat.split(',').filter(Boolean));

    } else {
      setEditingAdvisor({ 
        // 默认为 true 或 false 都可以，反正前端不显示了
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault
