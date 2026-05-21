import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, ArrowUpRight, ArrowDownRight, 
  MoreVertical, FileText, Download
} from 'lucide-react';

export default function CreditHistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'add', 'deduct'

  // ข้อมูลจำลอง (Mock Data) สำหรับประวัติการทำรายการ
  // 🚀 [อนาคต] ต้องดึงข้อมูลนี้มาจาก Firebase Firestore (Collection: credit_transactions)
  const mockTransactions = [
    {
      id: 'TXN-001',
      partnerId: 'P-9921',
      partnerName: 'สมชาย การค้า',
      type: 'add',
      amount: 5000,
      balanceAfter: 15000,
      remark: 'โอนผ่าน KBank (ยอดเข้าช้า)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 นาทีที่แล้ว
      operator: 'Manager_A'
    },
    {
      id: 'TXN-002',
      partnerId: 'P-1054',
      partnerName: 'ร้านเจ๊น้อย',
      type: 'deduct',
      amount: 1500,
      balanceAfter: 8500,
      remark: 'หักค่าสินค้า (เคลม)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 ชั่วโมงที่แล้ว
      operator: 'Manager_B'
    },
    {
      id: 'TXN-003',
      partnerId: 'P-8842',
      partnerName: 'เฮียชัย ขนส่ง',
      type: 'add',
      amount: 10000,
      balanceAfter: 22000,
      remark: 'เติมล่วงหน้า (โปรโมชั่น)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 วันที่แล้ว
      operator: 'System' // Auto
    }
  ];

  // ฟังก์ชันช่วยจัดรูปแบบวันที่
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // กรองข้อมูลตามที่ค้นหาและ Filter
  const filteredTransactions = mockTransactions.filter(tx => {
    const matchSearch = tx.partnerId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        tx.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || tx.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Header & Tools */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            Audit Trail (ประวัติทำรายการ)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกทุกการเคลื่อนไหวของเครดิต (Immutable Log)
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="ค้นหา ID, ชื่อ, รหัส..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none w-full sm:w-48 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ทั้งหมด
            </button>
            <button 
              onClick={() => setFilterType('add')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'add' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              เติม
            </button>
            <button 
              onClick={() => setFilterType('deduct')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'deduct' ? 'bg-rose-50 text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ลด
            </button>
          </div>

          {/* Export Button (Mock) */}
          <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Transaction List (Timeline Style) */}
      <div className="flex-1 p-0 overflow-auto">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 space-y-3">
            <Search size={32} className="text-slate-200" />
            <p className="text-sm">ไม่พบประวัติการทำรายการที่ค้นหา</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50/80 transition-colors group flex items-start gap-4">
                
                {/* Icon Indicator */}
                <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${tx.type === 'add' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                >
                  {tx.type === 'add' ? <ArrowUpRight size={18} strokeWidth={2.5} /> : <ArrowDownRight size={18} strokeWidth={2.5} />}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    {/* Partner & TxID */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm truncate">{tx.partnerName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{tx.partnerId}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">#{tx.id}</span>
                    </div>
                    
                    {/* Amount */}
                    <div className={`font-black text-base whitespace-nowrap text-right ${tx.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'add' ? '+' : '-'} ฿{tx.amount.toLocaleString('th-TH')}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(tx.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">ผู้ทำรายการ:</span>
                      <span className="font-medium text-slate-600">{tx.operator}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:ml-auto">
                      <span className="text-slate-400">ยอดคงเหลือ:</span>
                      <span className="font-bold text-slate-700">฿{tx.balanceAfter.toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  {/* Remark */}
                  {tx.remark && (
                    <div className="mt-2 text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-600 inline-block">
                      <span className="font-bold text-slate-500 mr-1">หมายเหตุ:</span>{tx.remark}
                    </div>
                  )}
                </div>

                {/* Actions (Mock) */}
                <button className="p-1.5 text-slate-300 hover:text-slate-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                   <MoreVertical size={16} />
                </button>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}