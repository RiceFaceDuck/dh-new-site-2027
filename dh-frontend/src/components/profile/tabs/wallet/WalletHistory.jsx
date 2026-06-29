import React from 'react';
import { History, TrendingUp, TrendingDown, Clock, Loader2, FileText } from 'lucide-react';
import { formatCredit } from '../../../../firebase/creditService';

const WalletHistory = ({ historyLogs, loadingHistory }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
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
              const isEarn = log.type === 'deposit' || log.type === 'earn' || log.type === 'WITHDRAWAL_REJECTED';
              const isWithdraw = log.type === 'WITHDRAWAL_REQUEST' || log.type === 'WITHDRAWAL_COMPLETED' || log.type === 'spend';
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
                      <a 
                        href={log.slipUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hidden sm:flex px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors items-center gap-1.5 border border-blue-100 shadow-sm shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" /> ดูสลิป
                      </a>
                    )}
                    <div className="text-right shrink-0">
                      <p className={`text-base font-black font-mono ${isWithdraw ? 'text-amber-600' : isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isWithdraw ? '-' : (isEarn ? '+' : '-')}฿ {formatCredit(amount)}
                      </p>
                      {log.status && (
                        <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wider flex items-center justify-end gap-1 ${
                          log.status === 'SUCCESS' ? 'text-emerald-500' : log.status === 'PENDING' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {log.status === 'SUCCESS' ? 'สำเร็จ' : log.status === 'PENDING' ? 'รอดำเนินการ' : log.status}
                          
                          {/* Show slip icon on mobile only if present */}
                          {log.slipUrl && (
                            <a href={log.slipUrl} target="_blank" rel="noopener noreferrer" className="sm:hidden text-blue-500 hover:text-blue-600 ml-1">
                              <FileText className="w-3.5 h-3.5" />
                            </a>
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
    </div>
  );
};

export default WalletHistory;
