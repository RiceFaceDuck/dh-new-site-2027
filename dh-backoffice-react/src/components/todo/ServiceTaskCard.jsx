import React from 'react';
import { Package, Truck, Wrench, ArrowLeftRight, Check, X, ShieldAlert, FileText, Image as ImageIcon } from 'lucide-react';
import { claimService } from '../../firebase/claimService';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export default function ServiceTaskCard({ task, onApprove, onReject }) {
  const { payload } = task;
  const isClaim = task.originalType === 'CLAIM_APPROVAL' || task.type === 'CLAIM_APPROVAL';
  const isReturn = task.originalType === 'RETURN_APPROVAL' || task.type === 'RETURN_APPROVAL';
  const isCancel = task.type.startsWith('CANCEL_');
  
  // Local state for tracking input, distinct from form inside the main claim modal
  const [trackingNo, setTrackingNo] = React.useState(payload?.trackingNo || '');
  const [isSavingTracking, setIsSavingTracking] = React.useState(false);
  
  const handleSaveTracking = async () => {
    if (!trackingNo.trim()) return alert('กรุณาระบุเลขพัสดุ');
    setIsSavingTracking(true);
    try {
        const taskRef = doc(db, 'todos', task.id);
        await updateDoc(taskRef, {
            'payload.trackingNo': trackingNo
        });
        task.payload.trackingNo = trackingNo; // Optimistic update
        alert('บันทึกเลขพัสดุเรียบร้อย');
    } catch (err) {
        alert('Error saving tracking: ' + err.message);
    } finally {
        setIsSavingTracking(false);
    }
  };

  const isTrackingRequiredAndMissing = (isClaim || isReturn) && !payload?.trackingNo && !isCancel;

  return (
    <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-dh-border rounded-xl p-4 animate-in slide-in-from-top-2 shadow-inner">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Info Column */}
        <div className="flex-1 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-dh-muted flex items-center gap-1.5 border-b border-dh-border pb-1 mb-2">
                {isClaim ? <Wrench size={14}/> : <ArrowLeftRight size={14}/>}
                รายละเอียด {isClaim ? 'เคลมสินค้า' : 'คืนสินค้า'}
            </h4>
            
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-dh-border shadow-sm flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <Package className="w-5 h-5 text-dh-muted" />
                </div>
                <div>
                    <p className="text-sm font-bold text-dh-main">{payload?.productName}</p>
                    <p className="text-[11px] font-mono font-bold text-dh-muted mt-0.5">{payload?.sku} (จำนวน: {payload?.qty || 1})</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-dh-border shadow-sm">
                    <span className="text-dh-muted block mb-0.5">เหตุผล:</span>
                    <span className="font-bold text-dh-main">{isClaim ? payload?.symptomCode : payload?.returnReason}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-dh-border shadow-sm">
                    <span className="text-dh-muted block mb-0.5">รายละเอียด:</span>
                    <span className="font-bold text-dh-main">{isClaim ? payload?.symptomDetails : payload?.returnDetails || '-'}</span>
                </div>
            </div>
            
            {isCancel && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg mt-2 flex items-start gap-2">
                    <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-rose-700">พนักงานขอยกเลิกรายการนี้</p>
                        <p className="text-[11px] text-rose-600 mt-1">เหตุผล: {task.cancelReason}</p>
                    </div>
                </div>
            )}
            
            {payload?.images?.length > 0 && (
                <div className="mt-3">
                    <span className="text-[10px] font-black uppercase text-dh-muted mb-1.5 flex items-center gap-1"><ImageIcon size={12}/> รูปภาพประกอบ</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {payload.images.map((img, idx) => (
                           <a key={idx} href={img.replace('&sz=w1000', '')} target="_blank" rel="noreferrer" className="w-16 h-16 shrink-0 border border-dh-border rounded overflow-hidden hover:scale-105 transition-transform">
                              <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                           </a>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Action Column */}
        <div className="w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-dh-border pt-4 md:pt-0 md:pl-4 flex flex-col gap-3">
            
            {!isCancel && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-dh-border shadow-sm">
                    <label className="text-[10px] font-black text-dh-muted uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                        <Truck size={12}/> เลขพัสดุจัดส่งกลับ
                    </label>
                    <div className="flex flex-col gap-2">
                        <input 
                            type="text" 
                            placeholder="กรอกเลขพัสดุก่อนรับจบ" 
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            className="w-full text-xs p-2 rounded bg-slate-50 dark:bg-slate-900 border border-dh-border focus:border-dh-accent outline-none font-mono"
                        />
                        {payload?.trackingNo !== trackingNo && trackingNo.length > 0 && (
                            <button 
                                onClick={handleSaveTracking}
                                disabled={isSavingTracking}
                                className="w-full text-[10px] py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 font-bold rounded transition-colors"
                            >
                                บันทึกเลขพัสดุชั่วคราว
                            </button>
                        )}
                    </div>
                    {isTrackingRequiredAndMissing && (
                        <p className="text-[9px] text-orange-500 font-bold mt-1.5 leading-tight flex gap-1">
                            <ShieldAlert size={10} className="shrink-0"/> ต้องระบุเลขพัสดุก่อนดำเนินการเสร็จสิ้น
                        </p>
                    )}
                </div>
            )}
            
            <div className="flex-1"></div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => onApprove(task)}
                    disabled={isTrackingRequiredAndMissing}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${isTrackingRequiredAndMissing ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'}`}
                >
                    <Check size={16} strokeWidth={3}/> ดำเนินการเสร็จสิ้น
                </button>
            </div>
            
            <button 
                onClick={() => onReject(task)}
                className="w-full text-center text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 py-1.5 rounded transition-colors"
            >
                ปฏิเสธคำขอ
            </button>
            
        </div>
      </div>
    </div>
  );
}
