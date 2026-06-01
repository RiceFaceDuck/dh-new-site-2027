import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, or } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { Search, Loader2, Copy, Check, Users, ShieldAlert, BadgeInfo } from 'lucide-react';

// 🛡️ App ID สำหรับกำหนด Scope การเข้าถึง Database
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function PartnerCreditsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // ==========================================================
  // 🚀 ดึงข้อมูลบัญชีที่มียอดเครดิต (Optimized Query)
  // ==========================================================
  useEffect(() => {
    setIsLoading(true);
    const usersRef = collection(db, 'artifacts', appId, 'users');
    
    let q;
    try {
      // ใช้ or() เพื่อดึงคนที่มีเครดิต > 0 หรือเป็นพาร์ทเนอร์ ประหยัดยอด Reads 100%
      q = query(
        usersRef,
        or(
          where('creditPoints', '>', 0),
          where('role', '==', 'partner')
        )
      );
    } catch (e) {
      // Fallback ป้องกันแอปพัง หาก Firebase SDK เวอร์ชั่นเก่ากว่า v9.4
      console.warn("⚠️ [Credit System] or() query not supported, falling back to creditPoints > 0");
      q = query(usersRef, where('creditPoints', '>', 0));
    }
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => {
        const d = doc.data();
        // รวบรวมฟิลด์เครดิตทุกรูปแบบ (ป้องกันข้อมูลตกหล่นจากระบบเก่า)
        const balance = Number(d.creditPoints || d.creditPoint || d.credit || d.creditBalance || d.partnerCredit || 0);
        
        // Double Check กรองอีกชั้น
        if (d.role === 'partner' || balance > 0) {
          data.push({
            id: doc.id,
            name: d.firstName ? `${d.firstName} ${d.lastName || ''}` : d.displayName || 'Unknown Account',
            phone: d.phone || '-',
            email: d.email || '-',
            role: d.role || 'user',
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
    p.phone.includes(searchTerm) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // คำนวณยอดเงินรวมของตารางที่แสดงผลอยู่ปัจจุบัน
  const totalDisplayedCredit = filteredPartners.reduce((sum, p) => sum + p.balance, 0);

  // 📋 ฟังก์ชัน Copy ID ไปคลิปบอร์ดแบบ Robust
  const handleCopyId = (id) => {
    try {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback สำหรับกรณีถูกบล็อคจาก iframe
      const textArea = document.createElement("textarea");
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (e) {
        console.error("Copy failed", e);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    // 🎨 ดีไซน์ Enterprise UI: โค้งมนประณีต (Rounded-2xl) กรอบบางดูพรีเมียม
    <div className="flex flex-col h-full bg-white">
      
      {/* 🚀 Toolbar & Search Bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide">Client Ledger Database</h3>
            <p className="text-[11px] text-slate-500 font-medium">ทำเนียบลูกค้าผู้ถือครองเครดิตระบบ</p>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500">
            <Search size={16} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ, รหัส, อีเมล หรือ เบอร์โทร..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 🚀 Data Grid (ตารางข้อมูล) */}
      <div className="flex-1 overflow-auto bg-slate-50/30">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-bold w-12 text-center border-r border-slate-100">No.</th>
              <th className="px-4 py-3 font-bold border-r border-slate-100 whitespace-nowrap">Account Detail</th>
              <th className="px-4 py-3 font-bold border-r border-slate-100 text-center w-28">Role</th>
              <th className="px-4 py-3 font-bold border-r border-slate-100 whitespace-nowrap w-40">Contact Info</th>
              <th className="px-4 py-3 font-bold border-r border-slate-100 text-center w-28">Status</th>
              <th className="px-4 py-3 font-bold text-right w-44">Current Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-4 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <span className="text-xs font-semibold tracking-wider">กำลังเชื่อมต่อฐานข้อมูลบัญชี...</span>
                  </div>
                </td>
              </tr>
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                    <BadgeInfo size={32} className="text-slate-400" />
                    <span className="text-sm font-medium tracking-wide">ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไข</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPartners.map((partner, index) => (
                <tr key={partner.id} className="hover:bg-indigo-50/30 transition-colors duration-200 group">
                  
                  {/* ลำดับ */}
                  <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs border-r border-slate-100">
                    {(index + 1).toString().padStart(3, '0')}
                  </td>
                  
                  {/* Account Detail + Copy Action */}
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-800 tracking-wide">{partner.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded" title={partner.id}>
                          {partner.id.substring(0, 15)}...
                        </span>
                        <button 
                          onClick={() => handleCopyId(partner.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="คัดลอก UID"
                        >
                          {copiedId === partner.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                      ${partner.role === 'partner' 
                        ? 'text-purple-700 bg-purple-50 border-purple-200' 
                        : 'text-slate-600 bg-slate-50 border-slate-200'}`}
                    >
                      {partner.role === 'partner' ? 'Partner' : 'Member'}
                    </span>
                  </td>
                  
                  {/* Contact */}
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs text-slate-600">{partner.phone}</span>
                      {partner.email !== '-' && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={partner.email}>
                          {partner.email}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                      ${partner.status === 'active' ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${partner.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {partner.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  
                  {/* Balance */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-slate-900 font-mono text-[15px] tracking-tight">
                      {partner.balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 Smart Footer: สรุปผลรวม Data Aggregation */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-slate-400" />
          <span>Showing <strong className="text-slate-700">{filteredPartners.length}</strong> active accounts</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Total Visible Liability:</span>
          <div className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
            <strong className="text-slate-800 font-mono text-sm tracking-tight">
              ฿ {totalDisplayedCredit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}