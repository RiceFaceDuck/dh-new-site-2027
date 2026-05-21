import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { Search, Download, Loader2 } from 'lucide-react';

// 🛡️ กำหนด App ID เพื่อเข้าถึง Enterprise Sandbox Data
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function CreditHistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================================
  // ดึงข้อมูลประวัติการทำรายการ (Audit Trail) แบบ Real-time
  // ==========================================================
  useEffect(() => {
    // อ้างอิง Path เดียวกับที่ creditService.js ใช้บันทึกข้อมูล
    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions');
    
    // ดึง 100 รายการล่าสุด ป้องกันการดึงข้อมูลมหาศาลจนเว็บค้าง
    const q = query(txRef, orderBy('timestamp', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          // ใช้เวลาระบบหาก timestamp ยังไม่มา (กรณีเพิ่งกดบันทึกและรอ server delay)
          timestamp: d.timestamp?.toDate()?.toISOString() || new Date().toISOString()
        };
      });
      setTransactions(data);
      setIsLoading(false);
    }, (error) => {
      console.error("🔥 DH-Core System Error [Fetch History]:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ฟังก์ชันจัดรูปแบบเวลาสำหรับตาราง ERP (DD/MM/YYYY HH:mm)
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

  // ลอจิกการกรองข้อมูล
  const filteredTransactions = transactions.filter(tx => {
    const searchString = searchTerm.toLowerCase();
    const matchSearch = (tx.partnerId || '').toLowerCase().includes(searchString) || 
                        (tx.partnerName || '').toLowerCase().includes(searchString) ||
                        (tx.id || '').toLowerCase().includes(searchString);
    const matchType = filterType === 'all' || tx.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col h-full bg-white border border-slate-300 rounded-sm">
      
      {/* 🚀 Header & Toolbar: ทรงเหลี่ยม กระชับพื้นที่ */}
      <div className="p-3 border-b border-slate-300 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Transaction Log</h3>
          <p className="text-[11px] text-slate-500">Real-time immutable audit trail (Last 100 records)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search ID, Name, Ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-56"
            />
          </div>

          {/* Filter Types */}
          <div className="flex bg-white border border-slate-300 rounded-sm p-0.5">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-xs font-bold rounded-sm transition-none ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>All</button>
            <button onClick={() => setFilterType('add')} className={`px-3 py-1 text-xs font-bold rounded-sm transition-none ${filterType === 'add' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Added</button>
            <button onClick={() => setFilterType('deduct')} className={`px-3 py-1 text-xs font-bold rounded-sm transition-none ${filterType === 'deduct' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Deducted</button>
          </div>

          {/* Mock Export Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-sm transition-none ml-auto md:ml-0">
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {/* 🚀 Data Table: แบบดั้งเดิม จัดเต็มพื้นที่ ดูง่าย ระดับองค์กร */}
      <div className="flex-1 overflow-auto max-h-[500px]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 z-10">
            <tr className="text-[10px] uppercase tracking-wider text-slate-600">
              <th className="px-4 py-2 font-bold whitespace-nowrap">Date / Time</th>
              <th className="px-4 py-2 font-bold whitespace-nowrap">TX Reference</th>
              <th className="px-4 py-2 font-bold">Target Account</th>
              <th className="px-4 py-2 font-bold whitespace-nowrap">Type</th>
              <th className="px-4 py-2 font-bold text-right whitespace-nowrap">Amount (THB)</th>
              <th className="px-4 py-2 font-bold text-right whitespace-nowrap">Balance After</th>
              <th className="px-4 py-2 font-bold">Operator</th>
              <th className="px-4 py-2 font-bold">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                  Fetching Audit Trail...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-slate-500 font-medium">
                  No transaction records found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-none">
                  {/* Date Time */}
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {formatDateTime(tx.timestamp)}
                  </td>
                  
                  {/* TX Ref */}
                  <td className="px-4 py-2.5 font-mono text-slate-400 text-[10px]">
                    {tx.id.substring(0, 10)}...
                  </td>
                  
                  {/* Target Account */}
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-slate-800">{tx.partnerName || 'Unknown'}</div>
                    <div className="font-mono text-slate-500 text-[10px]">{tx.partnerId}</div>
                  </td>
                  
                  {/* Type */}
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border
                      ${tx.type === 'add' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                    >
                      {tx.type === 'add' ? 'ADD' : 'DEDUCT'}
                    </span>
                  </td>
                  
                  {/* Amount */}
                  <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${tx.type === 'add' ? 'text-blue-700' : 'text-red-700'}`}>
                    {tx.type === 'add' ? '+' : '-'} {Number(tx.amount || 0).toLocaleString('th-TH')}
                  </td>
                  
                  {/* Balance After */}
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {Number(tx.balanceAfter || 0).toLocaleString('th-TH')}
                  </td>
                  
                  {/* Operator */}
                  <td className="px-4 py-2.5 text-[11px] text-slate-600">
                    {tx.operatorUid || 'System'}
                  </td>
                  
                  {/* Remark */}
                  <td className="px-4 py-2.5 text-[11px] text-slate-500 truncate max-w-[150px]" title={tx.remark}>
                    {tx.remark || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-slate-300 bg-slate-50 text-[10px] text-slate-400 font-mono text-right uppercase">
        End of Records // Showing max 100 recent transactions
      </div>
    </div>
  );
}