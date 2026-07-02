import React, { useState } from 'react';
import { Megaphone, ExternalLink, Image as ImageIcon, Clock, Calendar, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import FormalManagerBadge from './FormalManagerBadge';

export default function FormalAdApprovalCard({ 
  todo, 
  isProcessing, 
  isManagerTab, 
  urgencyClass, 
  handleAction, 
  getStatusBadge, 
  formatDate, 
  handleRejectClick 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Auto-Verify if approved elsewhere ---
  React.useEffect(() => {
    let isMounted = true;
    const verifyStatus = async () => {
      if (!todo || !todo.id) return;
      try {
        const adId = todo.targetSkuId || todo.payload?.adId || todo.adPayload?.id || todo.id;
        const specificCol = String(adId).includes('PRODUCT_LINK') || String(adId).includes('SKU') ? 'user_sku_ads' : 
                            String(adId).includes('BILLBOARD') || String(adId).includes('BB') ? 'billboard_ads' : 'partner_ads';
        
        const appId = window.__app_id || 'default-app-id';
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../../../../firebase/config');
        
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', specificCol, adId);
        const adSnap = await getDoc(adRef);
        
        if (adSnap.exists() && isMounted) {
          const status = adSnap.data().status;
          if (status === 'active' || status === 'rejected' || status === 'paused') {
            // Auto complete the task silently if already processed
            await updateDoc(doc(db, 'todos', todo.id), { status: 'completed', resolution: 'auto_verified' });
          }
        } else if (!adSnap.exists() && isMounted) {
          // If the ad document doesn't exist anymore (e.g. deleted), clear the orphaned task
          await updateDoc(doc(db, 'todos', todo.id), { status: 'completed', resolution: 'target_deleted' });
        }
      } catch (err) {
        // Silently ignore errors in auto-verify
      }
    };
    verifyStatus();
    return () => { isMounted = false; };
  }, [todo]);

  return (
    <div className={`bg-white rounded-md shadow-sm border border-slate-200 flex flex-col relative transition-all hover:border-slate-400 mb-4 ${urgencyClass} ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
      
      {isManagerTab && <FormalManagerBadge text="AD APPROVAL" />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs font-bold text-indigo-600 animate-pulse">PROCESSING...</span>
        </div>
      )}

      {/* Header / Summary (Always Visible) */}
      <div 
        className={`p-4 cursor-pointer flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 shrink-0">
            <Megaphone size={18} />
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 shadow-sm">
                #{todo.id?.slice(-6).toUpperCase()}
              </span>
              {getStatusBadge(todo.status)}
              {todo.priority === 'High' && (
                <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded shadow-sm tracking-wider">
                  URGENT
                </span>
              )}
            </div>
            
            <h3 className="font-bold text-slate-800 text-sm truncate uppercase tracking-wide">
              {todo.title || 'ฝากโฆษณาสินค้า'}
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(todo.createdAt || todo.requestedAt)}</span>
              {todo.customerName && <span className="text-indigo-700 font-bold truncate">Acct: {todo.customerName}</span>}
            </div>
          </div>
        </div>
        
        <div className="shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
          
          <div className="space-y-4 mb-5">
            {todo.description && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Details / Note</span>
                <p className="text-sm text-slate-700 font-medium">
                  {todo.description}
                </p>
              </div>
            )}

            {/* Ad Preview */}
            {todo.adPayload && (
              <div className="border border-indigo-100 p-3 rounded-md flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white shadow-sm">
                <div className="w-20 h-20 rounded bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                  {todo.adPayload.imageUrl ? (
                    <img src={todo.adPayload.imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-sm uppercase font-bold text-white bg-indigo-600 shadow-sm tracking-wider">
                      {todo.adPayload.platform || 'OTHER'}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      งบประมาณ: <span className="text-indigo-600">{todo.adPayload.creditLimit || 0}</span> แต้ม
                    </span>
                  </div>
                  
                  {todo.adPayload.targetUrl && (
                    <a 
                      href={todo.adPayload.targetUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-bold bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100"
                    >
                      <ExternalLink size={12} /> ตรวจสอบลิงก์โฆษณา (Target URL)
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Meta data */}
            {todo.dueDate && (
              <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Due Date</span>
                <span className={`font-bold text-sm flex items-center gap-1.5 ${todo.priority === 'High' ? 'text-red-600' : 'text-slate-700'}`}>
                  <Calendar size={14} /> {formatDate(todo.dueDate)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex gap-3">
            {isManagerTab ? (
              <>
                <button 
                  onClick={() => handleAction(todo.id, 'approve', todo.type, todo.payload || todo)}
                  disabled={isProcessing}
                  className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check size={16} strokeWidth={3} /> อนุมัติโฆษณา (APPROVE)
                </button>
                <button 
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                  className="flex justify-center items-center gap-2 bg-white border border-slate-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 px-6 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  title="ปฏิเสธคำขอ"
                >
                  <X size={16} strokeWidth={3} /> ปฏิเสธ (REJECT)
                </button>
              </>
            ) : (
              <button 
                onClick={handleRejectClick}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 bg-white border border-slate-300 text-slate-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <X size={16} strokeWidth={3} /> ยกเลิกคำขอ (CANCEL)
              </button>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
