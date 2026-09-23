import { useState } from 'react';
import { Layers, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function PrepareFullCatalogAction({ isCalculating, skuCount = 2412, onPrepare }) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [progress, setProgress] = useState({
    percent: 0,
    eventName: '',
    chunkRatio: '0/1',
    referenceId: null,
    errorMessage: null
  });

  const isExecuting = status === 'loading' || isCalculating;
  const displayCount = skuCount || 2412;

  const handleClick = async () => {
    if (isExecuting) return;
    if (typeof onPrepare === 'function') {
      try {
        setStatus('loading');
        await onPrepare({
          onProgress: (p) => setProgress(prev => ({ ...prev, ...p }))
        });
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setProgress(prev => ({ ...prev, errorMessage: err?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' }));
      }
    }
  };

  return (
    <div className="w-full mt-2" data-testid="prepare-full-catalog-container">
      <button
        type="button"
        onClick={handleClick}
        disabled={isExecuting}
        data-testid="prepare-full-catalog-btn"
        title="ดึงและรวบรวมข้อมูลสินค้าทั้งหมด (2,412+ SKU) ส่งไปยังปุ่มส่งออก Big Seller ฝั่งซ้าย"
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex flex-col gap-1.5 transition-all duration-300 transform active:scale-98 shadow-xs border text-left
          ${isExecuting 
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
            : status === 'success' 
            ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100/70 text-emerald-800' 
            : 'bg-gradient-to-r from-indigo-50/80 to-blue-50/60 border-indigo-200/80 hover:border-indigo-400 hover:shadow-sm text-slate-700'}`}
      >
        <div className="w-full flex items-center gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${
            isExecuting 
              ? 'bg-slate-200 text-slate-400' 
              : status === 'success' 
              ? 'bg-emerald-100 text-emerald-700' 
              : status === 'error' 
              ? 'bg-red-100 text-red-600' 
              : status === 'loading' 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'bg-white text-indigo-600 border border-indigo-100 shadow-2xs'
          }`}>
            {status === 'loading' ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle size={18} className="text-emerald-600" />
            ) : status === 'error' ? (
              <AlertCircle size={18} className="text-red-500" />
            ) : (
              <Layers size={18} />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                {status === 'success' ? `(${displayCount} SKU) พร้อมแล้ว` : 'ดึงและเตรียมส่งออก (ALL SKU)'}
              </span>
              {status === 'idle' && (
                <span className="text-[11px] bg-indigo-100/80 text-indigo-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                  {displayCount} SKU
                </span>
              )}
            </div>

            {status === 'idle' && (
              <span className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                รวบรวมสินค้าทุก SKU เพื่อส่งไปยังปุ่มตรวจเช็คของ Big Seller ฝั่งซ้าย
              </span>
            )}

            {status === 'loading' && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600">
                  <span className="truncate max-w-[200px]" data-testid="progress-event-name">
                    {progress.eventName || 'กำลังดำเนินการ...'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span data-testid="progress-chunk-ratio" className="bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                      {progress.chunkRatio}
                    </span>
                    <span data-testid="progress-percent">
                      {progress.percent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress.percent}%` }} 
                    data-testid="progress-bar-fill"
                  />
                </div>
              </div>
            )}

            {status === 'success' && progress.referenceId && (
              <span data-testid="completion-badge" className="text-xs text-emerald-700 font-bold mt-0.5 flex items-center gap-1 truncate">
                ({displayCount} SKU) พร้อมแล้ว อ้างอิง {progress.referenceId}
              </span>
            )}

            {status === 'error' && (
              <span className="text-xs text-red-500 mt-0.5 font-medium">
                {progress.errorMessage || 'เกิดข้อผิดพลาดในการประมวลผล'}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
