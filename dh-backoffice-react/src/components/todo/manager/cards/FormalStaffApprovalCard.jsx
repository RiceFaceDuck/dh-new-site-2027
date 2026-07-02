import React, { useState } from 'react';
import { UserPlus, Mail, Briefcase, Calendar, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import FormalManagerBadge from './FormalManagerBadge';

export default function FormalStaffApprovalCard({ 
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
        const uid = todo.payload?.targetUid;
        if (!uid) return;
        
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../../../../firebase/config');
        
        const uSnap = await getDoc(doc(db, 'users', uid));
        
        if (uSnap.exists() && isMounted) {
          const data = uSnap.data();
          if (data.isStaff === true || (data.roles && (data.roles.includes('Staff') || data.roles.includes('Manager')))) {
            // Auto complete the task silently if already processed
            await updateDoc(doc(db, 'todos', todo.id), { status: 'completed', resolution: 'auto_verified' });
          }
        } else if (!uSnap.exists() && isMounted) {
          // Clear orphaned task if target user doesn't exist
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
      
      {isManagerTab && <FormalManagerBadge text="STAFF APPROVAL" />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <span className="text-xs font-bold text-blue-600 animate-pulse">PROCESSING...</span>
        </div>
      )}

      {/* Header / Summary */}
      <div 
        className={`p-4 cursor-pointer flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded border border-blue-100 shrink-0">
            <UserPlus size={18} />
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 shadow-sm">
                #{todo.id?.slice(-6).toUpperCase()}
              </span>
              {getStatusBadge(todo.status)}
            </div>
            
            <h3 className="font-bold text-slate-800 text-sm truncate uppercase tracking-wide">
              {todo.title || 'อนุมัติพนักงานใหม่'}
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(todo.createdAt || todo.requestedAt)}</span>
              {todo.metadata?.name && <span className="text-blue-700 font-bold truncate">Name: {todo.metadata.name}</span>}
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
          
          <div className="mb-5">
            {todo.metadata && (
              <div className="bg-white border border-slate-200 p-4 rounded-md flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl shrink-0">
                    {todo.metadata.name ? todo.metadata.name.charAt(0).toUpperCase() : <UserPlus size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate uppercase">{todo.metadata.name || 'ไม่ระบุชื่อ'}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium truncate">
                      <Mail size={12} /> {todo.targetEmail || 'ไม่ระบุอีเมล'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Requested</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 w-fit">
                      <Briefcase size={12} className="text-blue-600" />
                      <span className="capitalize uppercase">{todo.metadata.requestedRole || 'Staff'}</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 w-fit">
                      {todo.metadata.gender === 'male' ? 'MALE' : todo.metadata.gender === 'female' ? 'FEMALE' : 'UNSPECIFIED'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 w-fit">
                      <Calendar size={13} className="text-indigo-600" /> {todo.metadata.startDate || 'Not Specified'}
                    </span>
                  </div>
                </div>
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
                  <Check size={16} strokeWidth={3} /> อนุมัติรับพนักงาน (APPROVE)
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
