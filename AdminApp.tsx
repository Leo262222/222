import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Advisor, Category } from './types';
import { dataService } from './services/dataService';

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data State
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load Data on Mount
  useEffect(() => {
    const loadData = () => {
        setAdvisors(dataService.getAdvisors());
        setCategories(dataService.getCategories());
    };
    loadData();
    
    // Listen for cross-tab updates if testing on same origin
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Handlers for Data Mutation
  const handleUpdateAdvisor = (updatedAdvisor: Advisor) => {
    const newAdvisors = advisors.map(a => a.id === updatedAdvisor.id ? updatedAdvisor : a);
    setAdvisors(newAdvisors);
    dataService.saveAdvisors(newAdvisors);
  };

  const handleAddAdvisor = (newAdvisor: Advisor) => {
    const newAdvisors = [...advisors, newAdvisor];
    setAdvisors(newAdvisors);
    dataService.saveAdvisors(newAdvisors);
  };

  const handleDeleteAdvisor = (id: string) => {
    const newAdvisors = advisors.filter(a => a.id !== id);
    setAdvisors(newAdvisors);
    dataService.saveAdvisors(newAdvisors);
  };

  const handleAddCategory = (newCategory: Category) => {
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    dataService.saveCategories(newCategories);
  };

  const handleDeleteCategory = (id: string) => {
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    dataService.saveCategories(newCategories);
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    const newCategories = categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
    setCategories(newCategories);
    dataService.saveCategories(newCategories);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminDashboard 
      advisors={advisors}
      categories={categories}
      language="zh" // Default Admin Language
      onUpdateAdvisor={handleUpdateAdvisor}
      onAddAdvisor={handleAddAdvisor}
      onDeleteAdvisor={handleDeleteAdvisor}
      onAddCategory={handleAddCategory}
      onDeleteCategory={handleDeleteCategory}
      onUpdateCategory={handleUpdateCategory}
      onExit={handleLogout} // Re-purposed to Logout
    />
  );
};

export default AdminApp;
