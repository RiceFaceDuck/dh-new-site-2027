import React from 'react';
import { Activity, User, Building2 } from 'lucide-react';

export default function PendingWithdrawals({ pendingRequests, onActionClick }) {
    if (!pendingRequests || pendingRequests.length === 0) return null;

    return (
        <div className="mt-3 lg:mt-4 bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden shrink-0 animate-in fade-in slide-in-from-top-4">
            <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
                <h3 className="font-black text-sm text-amber-800 flex items-center gap-2">
                    <Activity size={16} className="text-amber-500 animate-pulse"/> คำขอถอนเงินรออนุมัติ ({pendingRequests.length})
                </h3>
            </div>
            <div className="p-3 overflow-x-auto">
                <div className="flex gap-3 pb-2">
                    {pendingRequests.map(task => (
                        <div key={task.id} className="min-w-[300px] w-[350px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><User size={16}/></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 truncate w-32">{task.customer?.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-mono">UID: {task.customer?.uid?.substring(0,6)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">ยอดถอน</p>
                                    <p className="text-lg font-black text-amber-600 font-mono leading-none">฿{Number(task.withdrawalDetails?.amount||0).toLocaleString('th-TH')}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg mb-3 border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5"><Building2 size={12} className="text-slate-400"/> {task.withdrawalDetails?.bankName}</p>
                                <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{task.withdrawalDetails?.accountNumber}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{task.withdrawalDetails?.accountName}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onActionClick(task, 'REJECT')} className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors">ปฏิเสธ</button>
                                <button onClick={() => onActionClick(task, 'APPROVE')} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all">โอนแล้ว</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
