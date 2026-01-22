import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Advisor, Category } from './types';
import { dataService } from './services/dataService';

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 从云端加载数据
  const loadData = async () => {
    setLoading(true);
    try {
        const fetchedAdvisors = await dataService.getAdvisors();
        const fetchedCategories = await dataService.getCategories();
        setAdvisors(fetchedAdvisors);
        setCategories(fetchedCategories);
    } catch (error) {
        console.error("加载数据出错", error);
        alert("连接数据库失败，请刷新重试。");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        loadData();
    }
  }, [isAuthenticated]);

  const handleUpdateAdvisor = async (updatedAdvisor: Advisor) => {
    try {
        await dataService.updateAdvisor(updatedAdvisor);
        await loadData(); 
    } catch (e) { alert("更新失败: " + e); }
  };

  const handleAddAdvisor = async (newAdvisor: Advisor) => {
    try {
        await dataService.addAdvisor(newAdvisor);
        await loadData();
    } catch (e) { alert("添加失败: " + e); }
  };

  const handleDeleteAdvisor = async (id: string) => {
    if(!window.confirm("确定要删除吗？")) return;
    try {
        await dataService.deleteAdvisor(id);
        await loadData();
    } catch (e) { alert("删除失败: " + e); }
  };

  const handleAddCategory = async (newCategory: Category) => {
     try {
        await dataService.addCategory(newCategory);
        await loadData();
     } catch (e) { alert("添加分类失败: " + e); }
  };

  const handleDeleteCategory = async (id: string) => {
     if(!window.confirm("确定要删除此分类吗？")) return;
     try {
        await dataService.deleteCategory(id);
        await loadData();
     } catch (e) { alert("删除分类失败: " + e); }
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
     try {
        await dataService.updateCategory(updatedCategory);
        await loadData();
     } catch (e) { alert("更新分类失败: " + e); }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  if (loading && advisors.length === 0 && categories.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600 font-bold">
            正在连接云端数据库...
        </div>
      );
  }

  return (
    <AdminDashboard 
      advisors={advisors}
      categories={categories}
      language="zh"
      onUpdateAdvisor={handleUpdateAdvisor}
      onAddAdvisor={handleAddAdvisor}
      onDeleteAdvisor={handleDeleteAdvisor}
      onAddCategory={handleAddCategory}
      onDeleteCategory={handleDeleteCategory}
      onUpdateCategory={handleUpdateCategory}
      onExit={handleLogout}
    />
  );
};

export default AdminApp;
