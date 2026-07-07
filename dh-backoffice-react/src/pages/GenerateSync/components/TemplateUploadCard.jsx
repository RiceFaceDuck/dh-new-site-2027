import React from 'react';
import { CheckCircle, Eye, Trash2, FileText } from 'lucide-react';

export default function TemplateUploadCard({
  title,
  number,
  color,
  hasTemplate,
  fileName,
  onUpload,
  onPreview,
  onRemove,
  fileRef,
  storageKey
}) {
  const isInstalled = hasTemplate;

  const colorConfig = {
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      borderActive: 'border-green-200 bg-green-50',
      borderInactive: 'border-dashed border-slate-300 bg-white hover:border-indigo-300',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700',
      pillBg: 'bg-indigo-50 text-indigo-600',
      previewText: 'text-indigo-600',
      previewBorder: 'border-indigo-200',
      previewHover: 'hover:bg-indigo-50'
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      borderActive: 'border-green-200 bg-green-50',
      borderInactive: 'border-dashed border-slate-300 bg-white hover:border-emerald-300',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
      pillBg: 'bg-emerald-50 text-emerald-600',
      previewText: 'text-emerald-600',
      previewBorder: 'border-emerald-200',
      previewHover: 'hover:bg-emerald-50'
    }
  };

  const theme = colorConfig[color] || colorConfig.indigo;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
        <span className={`w-6 h-6 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center text-xs`}>
          {number}
        </span>
        {title}
      </h3>
      
      <div className={`p-4 rounded-xl border transition-colors ${isInstalled ? theme.borderActive : theme.borderInactive}`}>
        {isInstalled ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-sm font-semibold text-green-700">ติดตั้งแม่แบบแล้ว</p>
                <p className="text-xs text-green-600/80">ระบบพร้อมใช้งานไฟล์โครงสร้างนี้</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onPreview(storageKey, title)} 
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white ${theme.previewText} border ${theme.previewBorder} ${theme.previewHover} rounded-lg text-xs font-bold transition-colors shadow-xs`}
              >
                <Eye size={14} /> ดูตัวอย่างโครงสร้าง
              </button>
              <button onClick={() => onRemove(storageKey)} className="text-red-400 hover:text-red-600 p-2 bg-white border border-red-100 rounded-lg shadow-xs hover:bg-red-50 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-5">
            <FileText className="mx-auto text-slate-300 mb-3" size={36} />
            <p className="text-sm text-slate-600 font-bold mb-1">ยังไม่มีไฟล์แม่แบบ</p>
            <p className="text-xs text-slate-500 mb-4">โปรดอัปโหลดไฟล์ <span className={`font-semibold ${theme.pillBg} px-1.5 py-0.5 rounded-sm`}>{fileName}</span></p>
            <button onClick={() => fileRef.current?.click()} className={`px-5 py-2.5 ${theme.btnBg} text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all`}>
              เลือกไฟล์อัปโหลด
            </button>
            <input type="file" ref={fileRef} onChange={(e) => onUpload(e, storageKey)} accept=".xlsx" className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}
