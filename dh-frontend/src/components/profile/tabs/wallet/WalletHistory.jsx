import { useState } from 'react';
import { History, TrendingUp, TrendingDown, Clock, Loader2, FileText, X } from 'lucide-react';
import { formatCredit } from '../../../../firebase/creditService';

const WalletHistory = ({ historyLogs, loadingHistory, type }) => {
  const [activeSlipUrl, setActiveSlipUrl] = useState(null);
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <History className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">ประวัติการทำรายการล่าสุด (Recent Transactions)</h3>
      </div>

      <div className="p-0">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-500" />
            <span className="text-sm font-medium">กำลังโหลดประวัติ...</span>
          </div>
        ) : historyLogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold text-sm">ยังไม่มีประวัติการทำรายการ</p>
            <p className="text-slate-400 text-xs mt-1">รายการได้เครดิตและการถอนเงินจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyLogs.map((log, index) => {
              const typeUpper = (log.type || '').toUpperCase();
              const isCredit = log.source === 'credit';
              
              const isEarn = isCredit 
                ? ['ADD', 'EARN', 'DEPOSIT', 'REFUND'].includes(typeUpper)
                : ['DEPOSIT', 'REFUND', 'REFUND_POS', 'WITHDRAWAL_REJECTED'].includes(typeUpper);

              const isWithdraw = isCredit
                ? ['DEDUCT', 'SPEND', 'CLAWBACK'].includes(typeUpper)
                : ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL', 'SPEND'].includes(typeUpper);

              const amount = Number(log.amount || log.points || 0);
              
              return (
                <div key={log.id || index} className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between group">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isWithdraw ? 'bg-amber-100 text-amber-600' : isEarn ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {isWithdraw ? <Clock className="w-5 h-5" /> : isEarn ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{log.note || log.action || log.type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH') : 
                           (log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('th-TH') : '-')}
                        </span>
                        {(log.referenceId || log.transactionId) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate max-w-[120px]" title={log.transactionId || log.referenceId}>
                              {log.transactionId || log.referenceId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {log.slipUrl && (
                      <button 
                        type="button"
                        onClick={() => setActiveSlipUrl(log.slipUrl)} 
                        className="hidden sm:flex px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors items-center gap-1.5 border border-blue-100 shadow-xs shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> ดูสลิป
                      </button>
                    )}
                    <div className="text-right shrink-0">
                      <p className={`text-base font-black font-mono ${isWithdraw ? 'text-amber-600' : isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isWithdraw ? '-' : (isEarn ? '+' : '-')}{isCredit ? `${formatCredit(amount)} Pts` : `฿ ${formatCredit(amount)}`}
                      </p>
                      {log.status && (
                        <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wider flex items-center justify-end gap-1 ${
                          log.status === 'SUCCESS' ? 'text-emerald-500' : log.status === 'PENDING' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {log.status === 'SUCCESS' ? 'สำเร็จ' : log.status === 'PENDING' ? 'รอดำเนินการ' : log.status}
                          
                          {/* Show slip icon on mobile only if present */}
                          {log.slipUrl && (
                            <button type="button" onClick={() => setActiveSlipUrl(log.slipUrl)} className="sm:hidden text-blue-500 hover:text-blue-600 ml-1 cursor-pointer">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slip Preview Modal */}
      {activeSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> หลักฐานการโอนเงิน (Slip)
              </h4>
              <button onClick={() => setActiveSlipUrl(null)} className="p-1 text-slate-400 hover:text-white rounded-full bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex justify-center items-center min-h-[300px]">
              <img src={activeSlipUrl} alt="สลิปโอนเงิน" className="max-h-[500px] w-auto object-contain rounded-lg shadow-md" />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setActiveSlipUrl(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletHistory;
