import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { 
  Search, Calendar, ArrowUpRight, ArrowDownRight, 
  FileText, Download, Loader2
} from 'lucide-react';

export default function CreditHistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ดึง 100 รายการล่าสุดจาก Database (ประหยัดโควต้า)
    const q = query(collection(db, 'credit_transactions'), orderBy('timestamp', 'desc'), limit(100));
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          // แปลง Firebase Timestamp เป็น ISO String เพื่อให้ทำงานง่าย
          timestamp: d.timestamp?.toDate()?.toISOString() || new Date().toISOString()
        };
      });
      setTransactions(data);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchSearch = (tx.partnerId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (tx.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (tx.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || tx.type === filterType;
    return matchSearch && matchType;
  });

  return (
    // ถอดการล็อคความสูงออก เพื่อแก้ปัญหา Scroll
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            Audit Trail (ประวัติทำรายการ)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ดึงข้อมูลล่าสุด 100 รายการแบบ Realtime จาก Database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="ค้นหา ID, ชื่อ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none w-full sm:w-48 transition-all"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-xs font-medium rounded-md ${filterType === 'all' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}>ทั้งหมด</button>
            <button onClick={() => setFilterType('add')} className={`px-3 py-1 text-xs font-medium rounded-md ${filterType === 'add' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>เติม</button>
            <button onClick={() => setFilterType('deduct')} className={`px-3 py-1 text-xs font-medium rounded-md ${filterType === 'deduct' ? 'bg-rose-50 text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ลด</button>
          </div>
        </div>
      </div>

      {/* ให้เนื้อหากรอบนี้ Scroll ได้ถ้าข้อมูลเกิน 60vh */}
      <div className="p-0 overflow-y-auto max-h-[60vh]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-400 mb-3" />
            <p className="text-sm">กำลังโหลดประวัติ...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Search size={32} className="text-slate-200 mb-3" />
            <p className="text-sm">ไม่พบประวัติทำรายการ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50/80 transition-colors group flex items-start gap-4">
                <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${tx.type === 'add' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                >
                  {tx.type === 'add' ? <ArrowUpRight size={18} strokeWidth={2.5} /> : <ArrowDownRight size={18} strokeWidth={2.5} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm truncate">{tx.partnerName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{tx.partnerId}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden lg:inline-block">#{tx.id}</span>
                    </div>
                    <div className={`font-black text-base whitespace-nowrap text-right ${tx.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'add' ? '+' : '-'} ฿{Number(tx.amount || 0).toLocaleString('th-TH')}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(tx.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">ผู้ทำรายการ:</span>
                      <span className="font-medium text-slate-600">{tx.operator || 'System'}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:ml-auto">
                      <span className="text-slate-400">ยอดคงเหลือ:</span>
                      <span className="font-bold text-slate-700">฿{Number(tx.balanceAfter || 0).toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  {tx.remark && (
                    <div className="mt-2 text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-600 inline-block">
                      <span className="font-bold text-slate-500 mr-1">หมายเหตุ:</span>{tx.remark}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}