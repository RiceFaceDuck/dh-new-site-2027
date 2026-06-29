import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Link, ArrowRight, Loader2 } from 'lucide-react';

export default function RedirectURLsForm({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) {
  const [formData, setFormData] = useState({
    oldUrl: '',
    newUrl: '',
    isActive: true,
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        oldUrl: '',
        newUrl: '',
        isActive: true,
        description: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.oldUrl.trim()) {
      newErrors.oldUrl = 'กรุณาระบุ URL เดิม';
    } else if (!formData.oldUrl.startsWith('/')) {
      newErrors.oldUrl = 'URL เดิมต้องเริ่มต้นด้วยเครื่องหมาย / (เช่น /old-product)';
    }

    if (!formData.newUrl.trim()) {
      newErrors.newUrl = 'กรุณาระบุ URL ใหม่';
    } else if (!formData.newUrl.startsWith('/') && !formData.newUrl.startsWith('http')) {
      newErrors.newUrl = 'URL ใหม่ต้องเริ่มต้นด้วย / หรือ http://, https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Link className="text-indigo-500" size={24} />
            {initialData ? 'แก้ไข Redirect URL' : 'เพิ่ม Redirect URL'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="redirect-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Old URL */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                URL เดิม (Old URL) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="/old-page-path"
                  value={formData.oldUrl}
                  onChange={(e) => setFormData({...formData, oldUrl: e.target.value.trim()})}
                  className={`w-full pl-4 pr-4 py-2.5 bg-slate-50 border ${errors.oldUrl ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {errors.oldUrl && <p className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.oldUrl}</p>}
            </div>

            {/* Arrow icon visual */}
            <div className="flex justify-center -my-2">
              <div className="bg-indigo-50 text-indigo-400 p-2 rounded-full border border-indigo-100">
                <ArrowRight size={20} />
              </div>
            </div>

            {/* New URL */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                URL ใหม่ที่ต้องการชี้ไป (New URL) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                placeholder="/new-page-path หรือ https://..."
                value={formData.newUrl}
                onChange={(e) => setFormData({...formData, newUrl: e.target.value.trim()})}
                className={`w-full pl-4 pr-4 py-2.5 bg-slate-50 border ${errors.newUrl ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
              {errors.newUrl && <p className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.newUrl}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                คำอธิบาย / หมายเหตุ (ถ้ามี)
              </label>
              <textarea 
                rows="2"
                placeholder="เช่น เปลี่ยนลิงก์เพราะสินค้ารุ่นเก่าเลิกผลิต..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="font-bold text-slate-700 text-sm">สถานะการใช้งาน</p>
                <p className="text-xs font-medium text-slate-500">หากปิด ระบบจะไม่ทำการ Redirect ลิงก์นี้</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            form="redirect-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {initialData ? 'บันทึกการแก้ไข' : 'เพิ่ม Redirect URL'}
          </button>
        </div>

      </div>
    </div>
  );
}
