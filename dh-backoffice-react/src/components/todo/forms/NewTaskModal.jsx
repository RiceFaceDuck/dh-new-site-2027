import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Tag, AlignLeft, Loader2, Type } from 'lucide-react';

/**
 * 🎯 Component: Modal สำหรับสร้างงานใหม่ (Manual Task)
 * แยกตัวออกมาเพื่อให้หน้าหลักโค้ดสะอาด และจัดการ State ของฟอร์มได้อิสระ
 */
export default function NewTaskModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  // 📝 1. กำหนดค่าเริ่มต้นของฟอร์ม
  const initialFormState = {
    title: '',
    description: '',
    priority: 'MEDIUM', // HIGH, MEDIUM, LOW
    type: 'MANUAL',     // ประเภทงาน
    dueDate: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // 🔄 2. เคลียร์ฟอร์มทุกครั้งที่เปิด Modal ใหม่
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // หากไม่ได้สั่งให้เปิด ให้ return null (ไม่แสดงผล)
  if (!isOpen) return null;

  // 📤 3. ฟังก์ชั่นจัดการเมื่อกด Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return; // ป้องกันการส่งค่าว่าง
    onSubmit(formData);
  };

  // Helper สำหรับจัดการค่า Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    // 🌌 4. Backdrop (พื้นหลังเบลอ ป้องกันการคลิกด้านหลัง)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      // 📦 5. Modal Container
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-dh-main/10 text-dh-main rounded-lg">
              <AlertCircle size={18} className="stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">สร้างงานใหม่ (Manual)</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Body (Form) --- */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* หัวข้องาน */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              <Type size={14} /> หัวข้องาน <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="title"
              required
              disabled={isSubmitting}
              value={formData.title} 
              onChange={handleChange} 
              placeholder="ระบุสิ่งที่ต้องทำ..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-dh-main focus:ring-2 focus:ring-dh-main/20 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400" 
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              <AlignLeft size={14} /> รายละเอียดเพิ่มเติม
            </label>
            <textarea 
              name="description"
              disabled={isSubmitting}
              value={formData.description} 
              onChange={handleChange} 
              rows="3"
              placeholder="ข้อมูลเพิ่มเติมที่จำเป็นต้องทราบ..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-dh-main focus:ring-2 focus:ring-dh-main/20 transition-all resize-none disabled:bg-slate-50 disabled:text-slate-400" 
            />
          </div>

          {/* Grid 2 Column สำหรับ ตัวเลือก */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ความสำคัญ */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                <AlertCircle size={14} /> ความสำคัญ
              </label>
              <select 
                name="priority"
                disabled={isSubmitting}
                value={formData.priority} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-dh-main focus:ring-2 focus:ring-dh-main/20 transition-all appearance-none font-medium cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="HIGH">🔴 ด่วนมาก (High)</option>
                <option value="MEDIUM">🟡 ปานกลาง (Medium)</option>
                <option value="LOW">🔵 ทั่วไป (Low)</option>
              </select>
            </div>

            {/* หมวดหมู่งาน */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                <Tag size={14} /> หมวดหมู่งาน
              </label>
              <select 
                name="type"
                disabled={isSubmitting}
                value={formData.type} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-dh-main focus:ring-2 focus:ring-dh-main/20 transition-all appearance-none font-medium cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="MANUAL">งานทั่วไป</option>
                <option value="CONTACT">ติดต่อลูกค้า</option>
                <option value="DOCUMENT">เอกสาร</option>
                <option value="INVENTORY">ตรวจสอบสต็อก</option>
              </select>
            </div>
          </div>

          {/* กำหนดส่ง */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              <Calendar size={14} /> กำหนดส่ง (Due Date)
            </label>
            <input 
              type="datetime-local" 
              name="dueDate"
              disabled={isSubmitting}
              value={formData.dueDate} 
              onChange={handleChange} 
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-dh-main focus:ring-2 focus:ring-dh-main/20 transition-all font-medium cursor-pointer disabled:bg-slate-50 disabled:text-slate-400" 
            />
          </div>

          {/* --- Footer (Actions) --- */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-dh-main hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  กำลังสร้างงาน...
                </>
              ) : (
                'บันทึกและสร้างงาน'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}