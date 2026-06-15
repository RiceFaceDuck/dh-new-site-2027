import React from 'react';
import { X, ExternalLink, CloudUpload } from 'lucide-react';

export default function ManagerDrivePanel({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <CloudUpload size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">ระบบจัดการคลังสินทรัพย์ (Google Drive)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">อัปโหลดและจัดการไฟล์โดยตรง</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://drive.google.com/drive/folders/1VaeeSqzaUu7F_CgSTyk-e2y6gMFXly3j" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <ExternalLink size={16} /> เปิดในหน้าต่างใหม่
            </a>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Iframe Content */}
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 relative">
          <iframe 
            src="https://drive.google.com/embeddedfolderview?id=1VaeeSqzaUu7F_CgSTyk-e2y6gMFXly3j#list"
            className="w-full h-full border-0"
            title="DH Product Images Drive"
            allow="fullscreen"
          ></iframe>
          
          {/* Overlay Guide in case they are not logged in */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-800/80 backdrop-blur-md text-white text-sm p-3 rounded-xl flex items-center justify-between border border-white/10 pointer-events-none opacity-80 hover:opacity-10 transition-opacity">
            <span>💡 <b>Tip:</b> คุณสามารถลากไฟล์ (Drag & Drop) วางในพื้นที่ด้านบนได้เลย (ต้องล็อกอิน Google Account ของร้านค้า)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
