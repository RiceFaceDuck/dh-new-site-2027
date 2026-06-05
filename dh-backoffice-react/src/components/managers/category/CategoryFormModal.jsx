import React, { useState, useEffect, useRef } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { categoryService } from '../../../firebase/categoryService';

const CategoryFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState(''); // 🚀 State สำหรับ Type
  const [isActive, setIsActive] = useState(true);
  const [iconFile, setIconFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setName(initialData.name || '');
        setType(initialData.type || ''); // 🚀 ดึง Type เดิมมาแสดง
        setIsActive(initialData.isActive !== false);
        setPreviewUrl(initialData.imageUrl || '');
        setIconFile(null);
      } else {
        setName('');
        setType('');
        setIsActive(true);
        setPreviewUrl('');
        setIconFile(null);
      }
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      setIconFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }
    if (!type.trim()) {
      setError('กรุณาระบุรหัสประเภทสินค้า (Type) เพื่อใช้เชื่อมโยงข้อมูล');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      console.log("🚀 [Debug] เริ่มต้นการบันทึก...");

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      );

      const saveProcess = async () => {
        let finalImageUrl = initialData?.imageUrl || null;

        // ☁️ 1. ขั้นตอนอัปโหลดไปยัง Google Drive
        if (iconFile) {
          console.log("☁️ [Debug] กำลังอัปโหลดรูปภาพไปยัง Google Drive...");
          
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); 
            reader.onerror = err => reject(err);
            reader.readAsDataURL(iconFile);
          });

          // Google Apps Script URL ของ DH-Image-Upload-Service
          const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzD3KW7juo-XNtw_kmPTPi2Pp4OtNVCAIQMGHdBVeUL1QPBQXgUhv3E_wRISEkOzML7/exec";

          const uploadRes = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({
              name: `CAT_${Date.now()}_${iconFile.name}`,
              mimeType: iconFile.type,
              data: base64Data,
              file: base64Data 
            })
          });

          const responseText = await uploadRes.text();
          
          try {
            const result = JSON.parse(responseText);
            finalImageUrl = result.url || result.link || result.imageUrl || responseText;
          } catch(err) {
            if(responseText.startsWith('http')) {
              finalImageUrl = responseText;
            } else {
              throw new Error("อัปโหลดไม่สำเร็จ หรือ Server ตอบกลับผิดพลาด");
            }
          }
        }

        // 📦 2. ขั้นตอนบันทึกข้อมูล พร้อมส่ง type ไปด้วย
        if (initialData) {
          await categoryService.updateCategory(
            initialData.id,
            { name: name.trim(), type: type.trim(), isActive, imageUrl: finalImageUrl }, // 🚀 เพิ่ม type
            null, 
            null  
          );
        } else {
          const newCat = await categoryService.createCategory(
            { name: name.trim(), type: type.trim(), isActive }, // 🚀 เพิ่ม type
            null
          );
          if (finalImageUrl) {
            await categoryService.updateCategory(
              newCat.id,
              { name: name.trim(), type: type.trim(), isActive, imageUrl: finalImageUrl },
              null,
              null
            );
          }
        }
      };

      await Promise.race([saveProcess(), timeout]);

      console.log("✅ [Debug] บันทึกข้อมูลหมวดหมู่ทั้งหมดสำเร็จ!");
      onSuccess(); 
      onClose(); 
    } catch (err) {
      console.error('❌ [Debug] เกิดข้อผิดพลาด:', err);
      if (err.message === 'TIMEOUT') {
        setError('การอัปโหลดใช้เวลานานเกินไป (Timeout) ⚠️ โปรดตรวจสอบการตั้งค่า Google Apps Script');
      } else {
        setError(`เกิดข้อผิดพลาด: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            {initialData ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}
          </h3>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto custom-scrollbar p-6">
          <form id="categoryForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}

            {/* Image Uploader */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-sm font-medium text-slate-700 self-start">ไอคอน/รูปภาพหมวดหมู่</label>
              <div 
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden relative group ${
                  previewUrl ? 'border-transparent bg-slate-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50 bg-slate-50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium">เปลี่ยนรูปภาพ</span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus size={32} className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium text-slate-500 group-hover:text-blue-600 text-center px-2">คลิกเพื่อเลือกรูปภาพ</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>

            {/* Category Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="categoryName" className="text-sm font-medium text-slate-700">
                ชื่อหมวดหมู่ที่แสดง <span className="text-red-500">*</span>
              </label>
              <input
                id="categoryName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น อุปกรณ์ภายใน, สินค้าแนะนำ"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* 🚀 Category Type (เพื่อใช้ในการ Query สินค้า) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="categoryType" className="text-sm font-medium text-slate-700">
                ประเภทสินค้า / คำค้นหา (Type) <span className="text-red-500">*</span>
              </label>
              <input
                id="categoryType"
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="เช่น case, motherboard, ram"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                ระบบจะใช้ค่านี้ไปดึงข้อมูลสินค้าที่ตรงกันมาแสดงผลที่หน้าเว็บ
              </p>
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-800">สถานะการแสดงผล</span>
                <span className="text-xs text-slate-500">เปิดเพื่อแสดงหมวดหมู่นี้ที่หน้าเว็บไซต์</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="categoryForm"
            disabled={isSubmitting || !name.trim() || !type.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              initialData ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CategoryFormModal;