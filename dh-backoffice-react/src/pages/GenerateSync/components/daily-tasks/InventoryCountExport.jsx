import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw, CheckSquare } from 'lucide-react';
import { bigSellerExportService } from '../../../../firebase/bigseller';
import { historyService } from '../../../../firebase/historyService';

export default function InventoryCountExport({ changes, isCalculating, onManualReset }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    try {
      setStatus('loading');
      setMessage('กำลังประมวลผลไฟล์...');
      
      const result = await bigSellerExportService.processInventoryCountTemplate(changes);
      
      setStatus('success');
      setMessage(`ดาวน์โหลดสำเร็จ (${result.itemCount} รายการ)`);
      
      historyService.addLog({
        level: 'INFO',
        module: 'Big Seller Sync',
        action: 'Export Inventory Count',
        target: { id: result.fileName, type: 'File' },
        details: { message: `Generated Inventory Count file from template with ${result.itemCount} items.` }
      });

      // Auto-Reset Logic
      if (localStorage.getItem('bigseller_auto_reset_baseline') === 'true') {
        if (onManualReset) {
          setTimeout(() => {
            onManualReset();
          }, 1500); // Wait a bit before resetting to show success state
        }
      }

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
            'bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700'}`}
      >
        <div className={`p-1.5 rounded-lg ${isDisabled ? 'bg-slate-200' : 'bg-emerald-100 text-emerald-600'}`}>
          {status === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : 
           status === 'success' ? <CheckCircle size={16} className="text-green-500" /> :
           status === 'error' ? <AlertCircle size={16} className="text-red-500" /> :
           <CheckSquare size={16} />}
        </div>
        <div className="flex-1 text-left flex flex-col">
          <span>โหลด ผลลัพธ์การนับ</span>
          {status !== 'idle' && (
            <span className={`text-xs mt-0.5 ${status === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
              {message}
            </span>
          )}
        </div>
        <Download size={16} className={isDisabled ? 'text-slate-300' : 'text-emerald-400 group-hover:text-emerald-600 animate-bounce'} />
      </button>
      <p className="text-xs text-slate-500 pl-2">
        * นำไฟล์ .xlsx ไปอัปโหลดเพื่อยืนยันสต็อก และจบการนับสต็อกบน Big Seller
      </p>
    </div>
  );
}
