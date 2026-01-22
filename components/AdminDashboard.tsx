import React, { useState } from 'react';
import { Advisor, Category, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AdminDashboardProps {
  advisors: Advisor[];
  categories: Category[];
  language: Language;
  onUpdateAdvisor: (updatedAdvisor: Advisor) => void;
  onAddAdvisor: (newAdvisor: Advisor) => void;
  onDeleteAdvisor: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (category: Category) => void;
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  advisors,
  categories,
  language, 
  onUpdateAdvisor, 
  onAddAdvisor, 
  onDeleteAdvisor,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onExit 
}) => {
  const [activeTab, setActiveTab] = useState<'advisors' | 'categories'>('advisors');

  // Advisor Form State
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [isAddingAdvisor, setIsAddingAdvisor] = useState(false);
  const [advisorFormData, setAdvisorFormData] = useState<Partial<Advisor>>({});

  // Category Form State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({});

  const t = TRANSLATIONS[language];

  // --- Advisor Handlers ---

  const handleEditAdvisorClick = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    setAdvisorFormData({ ...advisor });
    setIsAddingAdvisor(false);
  };

  const handleAddAdvisorClick = () => {
    setIsAddingAdvisor(true);
    setEditingAdvisor(null);
    setAdvisorFormData({
      id: Date.now().toString(),
      name: '',
      title: '',
      category: categories.length > 0 ? categories[0].name : '', 
      imageUrl: 'https://picsum.photos/300/300', // Default placeholder
      rating: 5.0,
      reviewCount: 0,
      pricePerMinute: 1.99,
      isOnline: true,
      specialties: [],
      bio: '',
      reviews: [],
      yearsExperience: 1,
      certificates: [],
      bookingQrUrl: ''
    });
  };

  const handleAdvisorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdvisorFormData(prev => ({
      ...prev,
      [name]: name === 'pricePerMinute' || name === 'yearsExperience' ? parseFloat(value) : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'bookingQrUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to prevent localStorage quota issues (e.g., 2MB limit check could be added here)
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdvisorFormData(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecialtiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const specs = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
    setAdvisorFormData(prev => ({ ...prev, specialties: specs }));
  };

  const handleSpecialtiesZhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const specs = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
    setAdvisorFormData(prev => ({ ...prev, specialties_zh: specs }));
  };

  const handleCertificateAdd = () => {
    const url = prompt(t.add_url);
    if (url) {
        setAdvisorFormData(prev => ({
        ...prev,
        certificates: [...(prev.certificates || []), url]
      }));
    }
  };

  const handleCertificateRemove = (index: number) => {
    setAdvisorFormData(prev => ({
      ...prev,
      certificates: prev.certificates?.filter((_, i) => i !== index)
    }));
  };

  const handleSaveAdvisor = () => {
    if (!advisorFormData.name || !advisorFormData.title) {
      alert("Name and Title are required");
      return;
    }

    if (isAddingAdvisor) {
      onAddAdvisor(advisorFormData as Advisor);
    } else {
      onUpdateAdvisor(advisorFormData as Advisor);
    }
    setEditingAdvisor(null);
    setIsAddingAdvisor(false);
  };

  // --- Category Handlers ---

  const handleAddCategoryClick = () => {
      setIsAddingCategory(true);
      setEditingCategory(null);
      setCategoryFormData({
          id: Date.now().toString(),
          name: '',
          name_zh: ''
      });
  };

  const handleEditCategoryClick = (cat: Category) => {
      setEditingCategory(cat);
      setCategoryFormData({ ...cat });
      setIsAddingCategory(false);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setCategoryFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCategory = () => {
      if(!categoryFormData.name || !categoryFormData.name_zh) {
          alert("Both English and Chinese names are required.");
          return;
      }
      if(isAddingCategory) {
          onAddCategory(categoryFormData as Category);
      } else {
          onUpdateCategory(categoryFormData as Category);
      }
      setIsAddingCategory(false);
      setEditingCategory(null);
  };
  
  const handleExit = () => {
      onExit();
      // Also trigger route change
      const event = new CustomEvent('lumina-route-change', { detail: { view: 'app' } });
      window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Admin Header */}
      <div className="bg-lumina-dark text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <i className="fas fa-tree text-2xl text-green-400"></i>
          <h1 className="text-xl font-bold font-serif">{t.admin_title}</h1>
        </div>
        <button 
          onClick={handleExit}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition text-white font-bold"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> {t.logout}
        </button>
      </div>

      <div className="container mx-auto p-6">
        
        {/* Top Tab Navigation */}
        <div className="flex mb-6 gap-4 border-b border-gray-300 pb-2">
            <button 
                onClick={() => setActiveTab('advisors')}
                className={`text-lg font-bold pb-2 px-4 ${activeTab === 'advisors' ? 'text-lumina-purple border-b-4 border-lumina-purple' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t.manage_advisors}
            </button>
            <button 
                onClick={() => setActiveTab('categories')}
                className={`text-lg font-bold pb-2 px-4 ${activeTab === 'categories' ? 'text-lumina-purple border-b-4 border-lumina-purple' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t.manage_categories}
            </button>
        </div>
        
        {/* ================= ADVISORS TAB ================= */}
        {activeTab === 'advisors' && (
            <>
                {/* Main List View (Hide if editing) */}
                {!editingAdvisor && !isAddingAdvisor && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{t.manage_advisors}</h2>
                    <button 
                        onClick={handleAddAdvisorClick}
                        className="bg-lumina-purple text-white px-4 py-2 rounded-lg font-bold hover:bg-lumina-dark transition shadow-md flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> {t.add_advisor}
                    </button>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                            <th className="p-4">{t.profile}</th>
                            <th className="p-4">{t.name_title}</th>
                            <th className="p-4">{t.category}</th>
                            <th className="p-4">{t.rate}</th>
                            <th className="p-4 text-center">{t.actions}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {advisors.map(advisor => (
                            <tr key={advisor.id} className="border-b hover:bg-gray-50 transition">
                            <td className="p-4">
                                <img src={advisor.imageUrl} alt={advisor.name} className="w-12 h-12 rounded-full object-cover border-2 border-lumina-light" />
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-lumina-dark">{advisor.name}</div>
                                <div className="text-xs text-gray-500">{advisor.title}</div>
                            </td>
                            <td className="p-4">
                                <span className="px-2 py-1 bg-lumina-light text-lumina-purple rounded-full text-xs font-bold">
                                {advisor.category}
                                </span>
                            </td>
                            <td className="p-4 font-mono text-sm">
                                ${advisor.pricePerMinute.toFixed(2)}/{t.min}
                            </td>
                            <td className="p-4 text-center space-x-2">
                                <button 
                                onClick={() => handleEditAdvisorClick(advisor)}
                                className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg"
                                title="Edit"
                                >
                                <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                onClick={() => {
                                    if(window.confirm(`Delete ${advisor.name}?`)) onDeleteAdvisor(advisor.id);
                                }}
                                className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg"
                                title="Delete"
                                >
                                <i className="fas fa-trash"></i>
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}

                {/* Edit/Add Advisor Form */}
                {(editingAdvisor || isAddingAdvisor) && (
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                    <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isAddingAdvisor ? t.create_profile : `${t.editing}: ${advisorFormData.name}`}
                    </h2>
                    <button 
                        onClick={() => {setEditingAdvisor(null); setIsAddingAdvisor(false);}}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Basic Info */}
                    <div className="space-y-4">
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.display_name}</label>
                        <input 
                            name="name" 
                            value={advisorFormData.name || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.display_name_zh}</label>
                        <input 
                            name="name_zh" 
                            value={advisorFormData.name_zh || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                        />
                        </div>

                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.professional_title}</label>
                        <input 
                            name="title" 
                            value={advisorFormData.title || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.professional_title_zh}</label>
                        <input 
                            name="title_zh" 
                            value={advisorFormData.title_zh || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                        />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t.category}</label>
                            <select 
                            name="category" 
                            value={advisorFormData.category || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>
                                        {language === 'zh' ? `${cat.name_zh} (${cat.name})` : cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t.experience} ({t.years})</label>
                            <input 
                            type="number"
                            name="yearsExperience" 
                            value={advisorFormData.yearsExperience || 0} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                            />
                        </div>
                        </div>

                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.price_per_min}</label>
                        <input 
                            type="number"
                            step="0.01"
                            name="pricePerMinute" 
                            value={advisorFormData.pricePerMinute || 0} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                            />
                        </div>

                        {/* Avatar Upload */}
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t.avatar_url} (Upload)</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'imageUrl')}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-lumina-light file:text-lumina-purple hover:file:bg-lumina-purple/20 cursor-pointer"
                            />
                            {advisorFormData.imageUrl && (
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300 shadow-sm">
                                        <img src={advisorFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs text-gray-400">Current Preview</span>
                                </div>
                            )}
                        </div>

                        {/* QR Upload */}
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t.qr_url_label} (Upload)</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'bookingQrUrl')}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-lumina-light file:text-lumina-purple hover:file:bg-lumina-purple/20 cursor-pointer"
                            />
                            <p className="text-xs text-gray-400 mt-1 mb-2">Upload the booking/CS QR Code image.</p>
                            {advisorFormData.bookingQrUrl && (
                                <div className="mt-2 border border-gray-200 p-2 bg-white inline-block rounded shadow-sm">
                                    <img src={advisorFormData.bookingQrUrl} alt="QR Preview" className="w-24 h-24 object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Bio & Extras */}
                    <div className="space-y-4">
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.biography}</label>
                        <textarea 
                            name="bio" 
                            rows={4}
                            value={advisorFormData.bio || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none text-sm" 
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.biography_zh}</label>
                        <textarea 
                            name="bio_zh" 
                            rows={4}
                            value={advisorFormData.bio_zh || ''} 
                            onChange={handleAdvisorChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none text-sm" 
                        />
                        </div>

                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.specialties_label}</label>
                        <input 
                            value={advisorFormData.specialties?.join(', ') || ''} 
                            onChange={handleSpecialtiesChange}
                            placeholder="e.g. Tarot, Love, career"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t.specialties_label_zh}</label>
                        <input 
                            value={advisorFormData.specialties_zh?.join(', ') || ''} 
                            onChange={handleSpecialtiesZhChange}
                            placeholder="e.g. 塔罗, 爱情"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                        />
                        </div>

                        {/* Certificates Management */}
                        <div className="border-t pt-4 mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">{t.credentials}</label>
                            <button 
                            onClick={handleCertificateAdd}
                            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition"
                            >
                            {t.add_url}
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {advisorFormData.certificates && advisorFormData.certificates.length > 0 ? (
                            advisorFormData.certificates.map((cert, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                <img src={cert} alt="" className="w-8 h-8 object-cover rounded" />
                                <span className="text-xs text-gray-500 truncate flex-1">{cert}</span>
                                <button 
                                    onClick={() => handleCertificateRemove(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                                </div>
                            ))
                            ) : (
                            <p className="text-sm text-gray-400 italic">No certificates added.</p>
                            )}
                        </div>
                        </div>

                    </div>
                    </div>

                    <div className="bg-gray-50 p-6 border-t flex justify-end gap-3">
                    <button 
                        onClick={() => {setEditingAdvisor(null); setIsAddingAdvisor(false);}}
                        className="px-6 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleSaveAdvisor}
                        className="px-6 py-2 bg-lumina-purple text-white rounded-lg font-bold hover:bg-lumina-dark transition shadow-lg"
                    >
                        {t.save}
                    </button>
                    </div>
                </div>
                )}
            </>
        )}

        {/* ================= CATEGORIES TAB ================= */}
        {activeTab === 'categories' && (
            <>
                {!editingCategory && !isAddingCategory && (
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{t.manage_categories}</h2>
                            <button 
                                onClick={handleAddCategoryClick}
                                className="bg-lumina-purple text-white px-4 py-2 rounded-lg font-bold hover:bg-lumina-dark transition shadow-md flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i> {t.add_category}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                                        <th className="p-4">ID</th>
                                        <th className="p-4">{t.cat_name_en}</th>
                                        <th className="p-4">{t.cat_name_zh}</th>
                                        <th className="p-4 text-center">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat.id} className="border-b hover:bg-gray-50 transition">
                                            <td className="p-4 text-gray-500 font-mono text-xs">{cat.id}</td>
                                            <td className="p-4 font-bold text-lumina-dark">{cat.name}</td>
                                            <td className="p-4">{cat.name_zh}</td>
                                            <td className="p-4 text-center space-x-2">
                                                <button 
                                                    onClick={() => handleEditCategoryClick(cat)}
                                                    className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm(t.delete_cat_confirm)) onDeleteCategory(cat.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(editingCategory || isAddingCategory) && (
                     <div className="max-w-xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                        <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isAddingCategory ? t.add_category : t.editing}
                            </h2>
                            <button 
                                onClick={() => {setEditingCategory(null); setIsAddingCategory(false);}}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t.cat_name_en}</label>
                                <input 
                                    name="name" 
                                    value={categoryFormData.name || ''} 
                                    onChange={handleCategoryChange}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t.cat_name_zh}</label>
                                <input 
                                    name="name_zh" 
                                    value={categoryFormData.name_zh || ''} 
                                    onChange={handleCategoryChange}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-lumina-purple outline-none" 
                                />
                             </div>
                        </div>
                        <div className="bg-gray-50 p-6 border-t flex justify-end gap-3">
                            <button 
                                onClick={() => {setEditingCategory(null); setIsAddingCategory(false);}}
                                className="px-6 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition"
                            >
                                {t.cancel}
                            </button>
                            <button 
                                onClick={handleSaveCategory}
                                className="px-6 py-2 bg-lumina-purple text-white rounded-lg font-bold hover:bg-lumina-dark transition shadow-lg"
                            >
                                {t.save}
                            </button>
                        </div>
                     </div>
                )}
            </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;