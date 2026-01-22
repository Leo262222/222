import { supabase } from '../supabaseClient';
import { Advisor, Category } from '../types';

// 辅助工具：把数据库里的字符串 "A,B,C" 转成数组 ["A", "B", "C"]
const parseList = (str: string | null | undefined): string[] => {
  if (!str) return [];
  return str.split(/[,，]/).map(s => s.trim()).filter(s => s);
};

export const dataService = {
  // --- 1. 获取顾问列表 ---
  getAdvisors: async (): Promise<Advisor[]> => {
    const { data, error } = await supabase.from('advisors').select('*').order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching advisors:', error);
      return [];
    }
    
    // 数据格式转换：数据库 -> 前端
    return (data || []).map(item => ({
      ...item,
      specialties: parseList(item.specialties),
      specialties_zh: parseList(item.specialties_zh),
      reviews: [], 
      certificates: [] 
    })) as Advisor[];
  },

  // --- 2. 获取分类列表 ---
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return (data || []) as Category[];
  },

  // --- 3. 添加顾问 ---
  addAdvisor: async (advisor: Advisor) => {
    const dbPayload = {
      name: advisor.name,
      title: advisor.title,
      category: advisor.category,
      pricePerMinute: advisor.pricePerMinute,
      imageUrl: advisor.imageUrl,
      bio: advisor.bio,
      yearsExperience: advisor.yearsExperience,
      isOnline: advisor.isOnline,
      rating: advisor.rating || 5.0,
      bookingQrUrl: advisor.bookingQrUrl,
      specialties: advisor.specialties.join(','),
      specialties_zh: advisor.specialties_zh?.join(',') || ''
    };
    const { error } = await supabase.from('advisors').insert([dbPayload]);
    if (error) throw error;
  },

  // --- 4. 更新顾问 ---
  updateAdvisor: async (advisor: Advisor) => {
    const dbPayload = {
      name: advisor.name,
      title: advisor.title,
      category: advisor.category,
      pricePerMinute: advisor.pricePerMinute,
      imageUrl: advisor.imageUrl,
      bio: advisor.bio,
      yearsExperience: advisor.yearsExperience,
      isOnline: advisor.isOnline,
      rating: advisor.rating,
      bookingQrUrl: advisor.bookingQrUrl,
      specialties: advisor.specialties.join(','),
      specialties_zh: advisor.specialties_zh?.join(',') || ''
    };
    const { error } = await supabase.from('advisors').update(dbPayload).eq('id', advisor.id);
    if (error) throw error;
  },

  // --- 5. 删除顾问 ---
  deleteAdvisor: async (id: string) => {
    const { error } = await supabase.from('advisors').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 6. 分类管理 ---
  addCategory: async (category: Category) => {
    const { error } = await supabase.from('categories').insert([{
        name: category.name,
        name_zh: category.name_zh
    }]);
    if (error) throw error;
  },

  updateCategory: async (category: Category) => {
    const { error } = await supabase.from('categories').update({
        name: category.name,
        name_zh: category.name_zh
    }).eq('id', category.id);
    if (error) throw error;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
};
