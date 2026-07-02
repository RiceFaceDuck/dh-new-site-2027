import React, { useState } from 'react';
import { Calendar, UserCircle, CheckCircle, XCircle, Info, FileText } from 'lucide-react';

export default function FormalLeaveApprovalCard({ 
  todo, 
  isProcessing, 
  handleAction, 
  handleRejectClick,
  getStatusBadge,
  formatDate
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const payload = todo.payload || {};

  const translateLeaveType = (type) => {
    switch (type) {
      case 'sick': return 'ลาป่วย';
      case 'personal': return 'ลากิจ';
      case 'vacation': return 'ลาพักร้อน';
      default: return type;
    }
  };

  return (
    <div className={`mb-3 bg-white rounded-md border-l-4 border-l-orange-500 border border-slate-200 shadow-sm overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-500/20' : 'hover:border-slate-300'}`}>
      
      {/* Header (Click to expand) */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-orange-100 rounded-md shrink-0">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              คำขอลางาน: {payload.staffName || 'พนักงาน'}
            </h4>
            <div className="flex items-center gap-2 text-xs mt-1">
              {getStatusBadge(todo.status)}
              <span className="text-slate-500">
                {formatDate(todo.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-3 rounded-md border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">ประเภทการลา</span>
                <span className="font-bold text-slate-800">{translateLeaveType(payload.leaveType)}</span>
             </div>
             <div className="bg-white p-3 rounded-md border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">ระยะเวลา</span>
                <span className="font-bold text-slate-800 text-sm">
                   {payload.startDate} ถึง {payload.endDate}
                </span>
             </div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-slate-200">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">เหตุผล</span>
             <p className="text-sm text-slate-700">{payload.reason || '-'}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'approve', todo.type, todo.payload); }}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <CheckCircle size={16} /> อนุมัติ
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); handleRejectClick(); }}
              disabled={isProcessing}
              className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <XCircle size={16} /> ไม่อนุมัติ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
