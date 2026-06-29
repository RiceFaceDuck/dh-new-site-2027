import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Plus, Search, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRedirectURLsState } from './useRedirectURLsState';
import RedirectURLsForm from './RedirectURLsForm';
import RedirectURLsGuide from './RedirectURLsGuide';

export default function RedirectURLsSettings() {
  const navigate = useNavigate();
  const {
    redirects,
    isLoading,
    isSubmitting,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleToggleStatus,
  } = useRedirectURLsState();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const filteredRedirects = redirects.filter(r => 
    r.oldUrl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.newUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingData(null);
    setIsFormOpen(true);
  };

  const openEditModal = (data) => {
    setEditingData(data);
    setIsFormOpen(true);
  };

  const onFormSubmit = async (formData) => {
    let success = false;
    if (editingData) {
      success = await handleUpdate(editingData.id, formData);
    } else {
      success = await handleAdd(formData);
    }
    
    if (success) {
      setIsFormOpen(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/managers')}
            className="p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors"
            title="ย้อนกลับ"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <ArrowRightLeft size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Redirect URLs</h1>
            <p className="text-sm font-semibold text-slate-500">จัดการการเปลี่ยนเส้นทางลิงก์ของเว็บไซต์ (301 Redirect)</p>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          เพิ่ม Redirect ใหม่
        </button>
      </div>

      {/* Guide Documentation */}
      <RedirectURLsGuide />

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ค้นหา URL เก่า, ใหม่ หรือ หมายเหตุ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="font-bold">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredRedirects.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="p-4 bg-slate-100 rounded-full text-slate-300">
                <ArrowRightLeft size={40} />
              </div>
              <p className="font-bold text-lg text-slate-500">ยังไม่มีข้อมูล Redirect</p>
              {searchTerm && <p className="text-sm font-medium">ไม่พบผลลัพธ์สำหรับการค้นหา "{searchTerm}"</p>}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="px-6 py-4">URL เดิม</th>
                  <th className="px-6 py-4 w-12 text-center"></th>
                  <th className="px-6 py-4">URL ใหม่ (ปลายทาง)</th>
                  <th className="px-6 py-4 hidden md:table-cell">หมายเหตุ</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRedirects.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-sm max-w-[200px] sm:max-w-[300px] truncate" title={item.oldUrl}>
                        {item.oldUrl}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <ArrowRight size={16} className="text-indigo-300 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono text-sm max-w-[200px] sm:max-w-[300px] truncate" title={item.newUrl}>
                        {item.newUrl}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-500 font-medium truncate max-w-[200px]" title={item.description}>
                        {item.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={item.isActive}
                          onChange={() => handleToggleStatus(item.id, item.isActive, item.oldUrl)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.oldUrl)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <RedirectURLsForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={onFormSubmit}
        initialData={editingData}
        isSubmitting={isSubmitting}
      />

    </div>
  );
}
