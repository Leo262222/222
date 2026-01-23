import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Advisor } from './types';

// ✅ 智能清洗函数：把各种乱七八糟的数据都洗成干净的数组
const getSafeTags = (input: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    const clean = input.replace(/[\[\]"']/g, ''); // 去掉方括号和引号
    return clean.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

function App() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 获取顾问数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: advisorsData, error } = await supabase
          .from('advisors')
          .select('*')
          .order('isOnline', { ascending: false })
          .order('rating', { ascending: false });

        if (error) throw error;
        setAdvisors(advisorsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. 筛选逻辑
  const filteredAdvisors = selectedCategory === 'All' 
    ? advisors 
    : advisors.filter(a => a.category === selectedCategory);

  // 分类列表
  const categories = [
    { id: 'All', label: '全部' },
    { id: 'Tarot', label: '塔罗, 雷诺曼' },
    { id: 'Astrology', label: '占星' },
    { id: 'Love', label: '情感咨询' },
    { id: 'Career', label: '事业学业' },
    { id: 'Life Abroad', label: '海外生活' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 顶部导航 */}
      <header className="bg-[#1a202c] text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌲</span>
              <h1 className="text-xl font-bold tracking-wide">留子树洞</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 pl-9">树洞藏秘密，神谕断情关。</p>
          </div>
          <div className="text-right">
             <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
             <span className="text-xs font-medium text-green-400">{advisors.filter(a => a.isOnline).length} 人在线</span>
          </div>
        </div>
      </header>

      {/* 搜索与分类 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white p-2 rounded-xl shadow-sm border border
