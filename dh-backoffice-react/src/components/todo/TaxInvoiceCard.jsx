import React from 'react';
import { FileText, CheckCircle2, User, Building2 } from 'lucide-react';
import { todoService } from '../../firebase/todoService';
import { auth } from '../../firebase/config';

export default function TaxInvoiceCard({ task, onComplete }) {

  const handleApprove = async () => {
    try {
      await todoService.resolveTodo(task, { status: 'issued' }, auth.currentUser);
      if(onComplete) onComplete(task.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden relative mb-4">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
      <div className="p-5 pl-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                Tax Invoice
              </span>
              <span className="text-xs font-mono text-gray-400">Order: #{task.payload?.orderId || task.orderId || 'N/A'}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              คำขอใบกำกับภาษี
            </h3>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4 text-sm">
           <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Building2 className="w-3 h-3"/> นามผู้เสียภาษี</p>
                <p className="font-semibold text-gray-800">{task.payload?.taxInfo?.name || 'ไม่ระบุ'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><User className="w-3 h-3"/> เลขผู้เสียภาษี</p>
                <p className="font-mono font-medium text-gray-800">{task.payload?.taxInfo?.taxId || 'ไม่ระบุ'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs mb-1">ที่อยู่จดทะเบียน</p>
                <p className="text-gray-700">{task.payload?.taxInfo?.address || 'ไม่ระบุ'}</p>
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
             onClick={handleApprove}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
          >
             <CheckCircle2 className="w-4 h-4" />
             ออกเอกสารแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}