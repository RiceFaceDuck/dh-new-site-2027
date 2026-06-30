import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw, List } from 'lucide-react';
import { bigSellerExportService } from '../../../../firebase/bigseller';
import { historyService } from '../../../../firebase/historyService';

export default function SkuMerchantExport({ changes, isCalculating }) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    try {
      setStatus('loading');
      setMessage('กำลังประมวลผลไฟล์...');
      
      const result = await bigSellerExportService.processSkuMerchantTemplate(changes);
      
      setStatus('success');
      setMessage(`ดาวน์โหลดสำเร็จ (${result.itemCount} รายการ)`);
      
      historyService.addLog({
        level: 'INFO',
        module: 'Big Seller Sync',
        action: 'Export SKU Merchant',
        target: { id: result.fileName, type: 'File' },
        details: { message: `Generated SKU Merchant file from template with ${result.itemCount} items.` }
      });

      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'เกิดข้อผิดพลาด');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const isDisabled = status === 'loading' || isCalculating || !changes;

  return (
    <div className="w-full flex flex-col gap-2 relative group">
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all duration-300 transform active:scale-95 shadow-sm border
          ${isDisabled ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 
            'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700'}`}
      >
        <div className={`p-1.5 rounded-lg ${isDisabled ? 'bg-slate-200' : 'bg-indigo-100 text-indigo-600'}`}>
          {status === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : 
           status === 'success' ? <CheckCircle size={16} className="text-green-500" /> :
           status === 'error' ? <AlertCircle size={16} className="text-red-500" /> :
           <List size={16} />}
        </div>
        <div className="flex-1 text-left flex flex-col">
          <span>โหลด SKU ที่มีความเคลื่อนไหว</span>
          {status !== 'idle' && (
            <span className={`text-xs mt-0.5 ${status === 'error' ? 'text-red-500' : 'text-indigo-500'}`}>
              {message}
            </span>
          )}
        </div>
        <Download size={16} className={isDisabled ? 'text-slate-300' : 'text-indigo-400 group-hover:text-indigo-600 animate-bounce'} />
      </button>
      <p className="text-xs text-slate-500 pl-2">
        * นำไฟล์ .xlsx ไปอัปโหลดหน้า Big Seller (Import Merchant SKU) เพื่อเริ่มการนับสต็อก
      </p>
    </div>
  );
}
