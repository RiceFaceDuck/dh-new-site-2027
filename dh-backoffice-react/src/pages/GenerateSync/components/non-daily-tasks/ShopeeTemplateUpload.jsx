import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { bigSellerImportService } from '../../../../firebase/bigseller';
import { historyService } from '../../../../firebase/historyService';

export default function ShopeeTemplateUpload({ currentInventory, isCalculating }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      setStatus('error');
      setMessage('กรุณาอัปโหลดไฟล์ .xlsx เท่านั้น');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    try {
      setStatus('loading');
      setMessage('กำลังประมวลผลไฟล์...');
      
      const result = await bigSellerImportService.processUpdateProductInfoTemplate(file, currentInventory);
      
      setStatus('success');
      setMessage(`อัปเดตและดาวน์โหลดสำเร็จ (${result.updatedCount} รายการ)`);
      
      // Log the action
      historyService.addLog({
        level: 'INFO',
        module: 'Big Seller Sync',
        action: 'Import & Update Shopee Template',
        target: { id: result.fileName, type: 'File' },
        details: { message: `Updated ${result.updatedCount} items in Shopee template.` }
      });

      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'เกิดข้อผิดพลาดในการประมวลผล');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const isDisabled = status === 'loading' || isCalculating || !currentInventory;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1 pl-1 text-slate-700 font-bold">
        <Database size={16} className="text-blue-500" />
        <span className="text-sm">1. นำเข้าอัปเดตข้อมูลสินค้า (แก้ราคา/สต็อก)</span>
      </div>
      
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        className={`w-full relative rounded-xl border-2 border-dashed p-6 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center cursor-pointer group overflow-hidden
          ${isDisabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-70' : 
            isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 
            status === 'success' ? 'border-green-400 bg-green-50' :
            status === 'error' ? 'border-red-400 bg-red-50' :
            'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx"
          className="hidden"
          disabled={isDisabled}
        />

        {/* Animated Background Element */}
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-all duration-700 opacity-20
          ${isDragging || status === 'loading' ? 'bg-blue-500 scale-150' : 'bg-transparent'}`}></div>

        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 shadow-sm
          ${status === 'loading' ? 'bg-blue-100 text-blue-500' : 
            status === 'success' ? 'bg-green-100 text-green-500 scale-110' :
            status === 'error' ? 'bg-red-100 text-red-500' :
            isDragging ? 'bg-blue-100 text-blue-500 scale-110' :
            'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-500'}`}
        >
          {status === 'loading' ? <RefreshCw size={24} className="animate-spin" /> :
           status === 'success' ? <CheckCircle size={24} className="animate-bounce" /> :
           status === 'error' ? <AlertCircle size={24} /> :
           <Upload size={24} className={isDragging ? 'animate-bounce' : 'group-hover:-translate-y-1 transition-transform'} />}
        </div>

        <div className="relative z-10 flex flex-col gap-1">
          {status === 'idle' && (
            <>
              <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                อัปโหลดไฟล์ shopee_edit_price_stock
              </p>
              <p className="text-xs text-slate-500 font-medium">
                ลากไฟล์ <span className="font-bold text-slate-600">.xlsx</span> มาวางที่นี่ หรือ <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-2">คลิกเพื่อเลือกไฟล์</span>
              </p>
            </>
          )}
          
          {status === 'loading' && <p className="text-sm font-bold text-blue-600 animate-pulse">{message}</p>}
          
          {status === 'success' && (
            <>
              <p className="text-sm font-bold text-green-600">ประมวลผลเสร็จสิ้น!</p>
              <p className="text-xs text-green-700/70 font-medium">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <p className="text-sm font-bold text-red-600">เกิดข้อผิดพลาด</p>
              <p className="text-xs text-red-500 font-medium">{message}</p>
            </>
          )}
        </div>
      </div>
      
      <p className="text-[11px] text-slate-400 pl-2 leading-relaxed mt-1">
        * ระบบจะเติมสต็อกและราคาให้ใหม่ แล้วเด้งไฟล์ที่มีโครงสร้างเดิมกลับมา (Item_ID และช่องผสานเซลล์ไม่หายแน่นอน)
      </p>
    </div>
  );
}
