import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { Search, Loader2, Copy, Check } from 'lucide-react';

export default function PartnerCreditsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // ==========================================================
  // ดึงข้อมูลบัญชีพาร์ทเนอร์/ลูกค้าที่มียอดเครดิตแบบ Real-time
  // ==========================================================
  useEffect(() => {
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => {
        const d = doc.data();
        const balance = Number(d.credit || d.creditBalance || 0);
        
        // ดึงเฉพาะ Partner หรือ ผู้ใช้งานทั่วไปที่มีเครดิตค้างอยู่
        if (d.role === 'partner' || balance > 0) {
          data.push({
            id: doc.id,
            name: d.firstName ? `${d.firstName} ${d.lastName || ''}` : 'Unknown Account',
            phone: d.phone || '-',
            balance: balance,
            status: d.status || 'active',
          });
        }
      });

      // เรียงลำดับยอดเงินจากมากไปน้อย (Top Holders)
      data.sort((a, b) => b.balance - a.balance);
      
      setPartners(data);
      setIsLoading(false);
    }, (error) => {
      console.error("🔥 DH-Core System Error [Fetch Partners]:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // กรองข้อมูลด้วยคำค้นหา
  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  // คำนวณยอดเงินรวมของตารางที่แสดงผลอยู่ปัจจุบัน
  const totalDisplayedCredit = filteredPartners.reduce((sum, p) => sum + p.balance, 0);

  // ฟังก์ชัน Copy ID ไปคลิปบอร์ด
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    // ดีไซน์ ERP ทรงเหลี่ยม แบนราบ ไร้ขอบมน
    <div className="flex flex-col bg-white border border-slate-300">
      
      {/* 🚀 Toolbar & Search Bar */}
      <div className="p-2 border-b border-slate-300 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Client Ledger Database</h3>
        </div>

        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Search size={12} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by Name, ID, Phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 🚀 Data Grid (ตารางข้อมูล): ล็อคความสูงและให้เลื่อน Scroll ภายในได้ */}
      <div className="flex-1 overflow-y-auto max-h-[500px]">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="sticky top-0 bg-slate-200 border-b border-slate-300 z-10 shadow-sm">
            <tr className="text-[10px] uppercase tracking-wider text-slate-700">
              <th className="px-3 py-1.5 font-bold w-10 text-center border-r border-slate-300">No.</th>
              <th className="px-3 py-1.5 font-bold border-r border-slate-300 whitespace-nowrap">Account ID (UID)</th>
              <th className="px-3 py-1.5 font-bold border-r border-slate-300">Partner / Client Name</th>
              <th className="px-3 py-1.5 font-bold border-r border-slate-300 whitespace-nowrap">Contact</th>
              <th className="px-3 py-1.5 font-bold border-r border-slate-300 text-center">Status</th>
              <th className="px-3 py-1.5 font-bold text-right">Current Balance (THB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500 bg-slate-50">
                  <Loader2 size={18} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <span className="text-xs font-mono">Synchronizing database...</span>
                </td>
              </tr>
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500 bg-slate-50">
                  <span className="text-xs font-mono">No records found matching criteria.</span>
                </td>
              </tr>
            ) : (
              filteredPartners.map((partner, index) => (
                <tr key={partner.id} className="hover:bg-blue-50 transition-none group">
                  
                  {/* ลำดับ */}
                  <td className="px-3 py-2 text-center text-slate-400 font-mono text-[10px] border-r border-slate-200">
                    {(index + 1).toString().padStart(3, '0')}
                  </td>
                  
                  {/* Account ID + Copy Action */}
                  <td className="px-3 py-2 border-r border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-slate-600 truncate max-w-[120px]" title={partner.id}>
                        {partner.id}
                      </span>
                      <button 
                        onClick={() => handleCopyId(partner.id)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-none"
                        title="Copy UID"
                      >
                        {copiedId === partner.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  
                  {/* Name */}
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">
                    {partner.name}
                  </td>
                  
                  {/* Phone */}
                  <td className="px-3 py-2 border-r border-slate-200 font-mono text-slate-600">
                    {partner.phone}
                  </td>
                  
                  {/* Status */}
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border
                      ${partner.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-red-700 bg-red-50 border-red-300'}`}
                    >
                      {partner.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  
                  {/* Balance */}
                  <td className="px-3 py-2 text-right">
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {partner.balance.toLocaleString('th-TH')}
                    </span>
                  </td>
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 Smart Footer: สรุปผลรวม Data Aggregation (Classic ERP Style) */}
      <div className="p-2 border-t border-slate-300 bg-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <div>
          <span className="font-bold text-slate-800">{filteredPartners.length}</span> Records Displayed
        </div>
        <div>
          Total Visible Liability: <span className="font-bold text-slate-900 text-xs ml-1">฿ {totalDisplayedCredit.toLocaleString('th-TH')}</span>
        </div>
      </div>
    </div>
  );
}