import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw, Box } from 'lucide-react';
import { bigSellerExportService } from '../../../firebase/bigSellerExportService';

export default function GenerateActions({ changes, setChanges, isCalculating }) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [itemCount, setItemCount] = useState(0);

  const handleGenerate = async () => {
    try {
      setStatus('loading');
      setMessage('กำลังซิงค์และเตรียมข้อมูลจากคลังสินค้า...');
      
      let currentInventory = changes?.currentInventory;
      
      // กรณีเกิดข้อผิดพลาดในการคำนวณก่อนหน้า ให้โหลดใหม่
      if (!currentInventory) {
         const newChanges = await bigSellerExportService.calculateChanges();
         currentInventory = newChanges.currentInventory;
      }

      const result = await bigSellerExportService.exportStockToBigSeller(currentInventory);
      
      setItemCount(result.itemCount);
      setStatus('success');
      setMessage(`ดาวน์โหลดไฟล์ ${result.fileName} สำเร็จ!`);
      
      // กลับสู่สถานะปกติหลัง 5 วินาที
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
      
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  return (
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 w-full relative overflow-hidden group">
        
        {/* Animated Background Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>

        <div className="relative z-10 w-full flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm transition-all duration-500 ${
                status === 'loading' ? 'bg-blue-50 text-blue-500 animate-pulse' :
                status === 'success' ? 'bg-green-50 text-green-500 scale-110' :
                status === 'error' ? 'bg-red-50 text-red-500' :
                'bg-slate-50 text-slate-700 group-hover:scale-105'
            }`}>
                {(status === 'loading' || isCalculating) && <RefreshCw size={28} className="animate-spin" />}
                {status === 'success' && <CheckCircle size={28} className="animate-bounce" />}
                {status === 'error' && <AlertCircle size={28} />}
                {status === 'idle' && !isCalculating && <Box size={28} />}
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 text-center">
                อัปเดตสต็อก Big Seller
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                ดาวน์โหลดข้อมูลจำนวนสต็อกล่าสุด (Real-time) จัดฟอร์แมตอัตโนมัติพร้อมนำไปอัปโหลดขึ้น Shopee / Lazada ผ่าน Big Seller ทันที
            </p>

            <button
                onClick={handleGenerate}
                disabled={status === 'loading' || isCalculating}
                className={`
                    w-full py-3 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-3
                    transition-all duration-300 transform active:scale-95 shadow-sm
                    ${(status === 'loading' || isCalculating) ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none' : 
                      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-blue-500/25'}
                `}
            >
                {status === 'loading' ? (
                    <>กำลังประมวลผลระบบ...</>
                ) : isCalculating ? (
                    <>
                        <RefreshCw className="animate-spin" size={20} />
                        กำลังดึงข้อมูล...
                    </>
                ) : (
                    <>
                        <Download strokeWidth={3} size={20} />
                        ดาวน์โหลดไฟล์ CSV
                    </>
                )}
            </button>

            {/* Status Message */}
            <div className={`mt-4 text-sm font-medium transition-all duration-300 ${
                status === 'loading' ? 'text-blue-500 animate-pulse' :
                status === 'success' ? 'text-green-600' :
                status === 'error' ? 'text-red-500' :
                'opacity-0'
            }`}>
                {message}
                {status === 'success' && <div className="text-center mt-1 text-slate-500 text-xs">ส่งออกสินค้าสำเร็จจำนวน {itemCount} รายการ</div>}
            </div>
        </div>
      </div>
  );
}
