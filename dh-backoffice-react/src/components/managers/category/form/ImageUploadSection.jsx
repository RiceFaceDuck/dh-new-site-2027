import React from 'react';
import { ImagePlus } from 'lucide-react';

export default function ImageUploadSection({
  isSubmitting,
  fileInputRef,
  previewUrl,
  handleImageChange
}) {
  return (
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
  );
}
