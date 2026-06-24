import React, { useState } from 'react';
import { Crown, Star, Building2, User, FileText, Copy, CheckCircle2 } from 'lucide-react';
import WalletDisplay from '../displays/WalletDisplay';
import PointDisplay from '../displays/PointDisplay';

export default function CustomerRow({ customer, isSelected, onSelect, gridLayout }) {
  const [copied, setCopied] = useState(false);

  // ฟังก์ชันสี Badge อิงความเรียบหรู (Clean Corporate)
  const getRankBadge = (rank) => {
    const r = rank?.toLowerCase() || 'customer';
    if (r.includes('vip')) return { color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100', icon: <Crown size={11} className="mr-1" /> };
    if (r.includes('partner')) return { color: 'bg-slate-800 text-white border-slate-800', icon: <Star size={11} className="mr-1 text-amber-400" /> };
    if (r.includes('wholesale')) return { color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <Building2 size={11} className="mr-1" /> };
    return { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: <User size={11} className="mr-1" /> };
  };


  // ดึงข้อมูลและกำหนดค่าเริ่มต้น
  const badge = getRankBadge(customer.rank || customer.role);
  // 🌟 ฟังก์ชันหาชื่อที่ถูกต้องที่สุดของลูกค้า
  const resolveDisplayName = (c) => {
    if (c.storeName) return c.storeName;
    if (c.displayName) return c.displayName;
    if (c.accountName) return c.accountName;
    if (c.firstName) return `${c.firstName} ${c.lastName || ''}`.trim();
    if (c.email) return c.email.split('@')[0];
    if (c.phone || c.phoneNumber) return c.phone || c.phoneNumber;
    return 'Unknown Account';
  };

  const displayName = resolveDisplayName(customer);
  
  // 🌟 ใช้ Account ID ของจริง ถ้าหาไม่เจอถึงจะ Fallback ไปใช้ Document ID (ของเก่า)
  const isMigrated = Boolean(customer.accountId);
  const displayCode = customer.accountId || customer.customerCode || customer.id?.substring(0, 8)?.toUpperCase() || '-';
  
  const phoneText = customer.phone || customer.phoneNumber || '-';
  const logisticText = customer.logisticProvider || '-';
  const hasTax = Boolean(customer.hasTaxInfo);
  
  // รหัสลูกค้าสำหรับการดึงข้อมูล Real-time (Wallet & Points)
  // บังคับใช้ Document ID (customer.id) เท่านั้น เพื่อป้องกันการวิ่งไปหาบัญชีผีจาก Short UID
  const customerId = customer.id;

  // ข้อมูลตัวเลขยอดสั่งซื้อ 30 วัน
  const sales30Days = Number(customer.stats?.sales30Days || customer.stats?.monthlySales || 0);

  // 🌟 ตรวจสอบความแข็งแกร่งของข้อมูล: บิลล่าสุด (Last Order Date)
  // ไม่ใช้ updatedAt เด็ดขาด เพราะการแก้โปรไฟล์ก็จะทำให้เวลาเปลี่ยน ซึ่งผิด Logic
  const lastOrderTimestamp = customer.stats?.lastOrderDate || customer.stats?.lastPurchaseDate;
  
  let lastOrderText = '-';
  let daysSinceLastOrder = null;

  if (lastOrderTimestamp) {
    const date = typeof lastOrderTimestamp === 'number' 
      ? new Date(lastOrderTimestamp) 
      : (lastOrderTimestamp.toDate ? lastOrderTimestamp.toDate() : new Date(lastOrderTimestamp));
    
    if (!isNaN(date)) {
      lastOrderText = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
      const now = new Date();
      daysSinceLastOrder = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    }
  }

  // ฟังก์ชันก๊อปปี้รหัสลัด
  const handleCopyCode = (e, code) => {
    if (code === '-') return;
    e.stopPropagation(); 
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(customer)}
      className={`
        relative group flex items-center px-4 py-2.5 border-b border-slate-200/60 cursor-pointer transition-colors duration-200
        even:bg-slate-100/40 odd:bg-white hover:bg-indigo-50/60
        ${isSelected ? '!bg-indigo-50/90' : ''}
      `}
    >
      {/* 🟦 Active Indicator (แถบสีซ้ายมือแบบ Enterprise) */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 shadow-[2px_0_5px_rgba(79,70,229,0.3)]"></div>}

      {/* รับสูตร Grid มาจาก CustomerTable เพื่อให้คอลัมน์ตรงกันเป๊ะ */}
      <div className={`${gridLayout} items-center`}>
        
        {/* 1. รหัสลูกค้า (ถ้าเป็น Account ID แท้ จะมีสี Indigo) */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[12px] font-mono font-semibold tracking-wider truncate ${isMigrated ? 'text-indigo-600' : 'text-slate-500'}`}>
            {displayCode}
          </span>
          <button 
            onClick={(e) => handleCopyCode(e, displayCode)}
            className={`p-0.5 transition-all shrink-0 ${isMigrated ? 'opacity-80 text-indigo-400 hover:text-indigo-700' : 'opacity-40 group-hover:opacity-100 text-slate-400 hover:text-indigo-600'}`}
            title="คัดลอก Account ID"
          >
            {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>

        {/* 2. ชื่อ-นามสกุล */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <span className={`text-[13px] font-bold truncate tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
            {displayName}
          </span>
          {hasTax && (
            <span className="shrink-0 flex items-center px-1.5 py-[1.5px] bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase border border-indigo-100/50 shadow-sm" title="พร้อมออกใบกำกับภาษี">
              <FileText size={9} className="mr-0.5" /> TAX
            </span>
          )}
        </div>

        {/* 3. เบอร์โทร */}
        <div className="text-[13px] font-mono font-medium text-slate-600 truncate">
          {phoneText}
        </div>

        {/* 4. ขนส่งประจำ */}
        <div className="text-[13px] font-medium text-slate-500 truncate">
          {logisticText}
        </div>

        {/* 5. ระดับบัญชี */}
        <div className="flex justify-center min-w-0">
          <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${badge.color} truncate max-w-full shadow-sm`}>
            {badge.icon}
            <span className="truncate">{customer.rank || customer.role || 'MEMBER'}</span>
          </div>
        </div>

        {/* 6. Wallet (เรียกใช้ Real-time Component แทน) */}
        <div className="text-right min-w-0">
          <WalletDisplay customerId={customerId} />
        </div>

        {/* 7. Points (เรียกใช้ Real-time Component แทน) */}
        <div className="text-right min-w-0">
          <PointDisplay customerId={customerId} />
        </div>

        {/* 8. วันที่สั่งซื้อล่าสุด (บิลล่าสุด) */}
        <div className={`text-center text-[12px] truncate ${
          daysSinceLastOrder === null 
            ? 'text-slate-300 font-normal' 
            : daysSinceLastOrder <= 7 
              ? 'text-emerald-600 font-black' 
              : daysSinceLastOrder <= 30 
                ? 'text-indigo-600 font-bold' 
                : 'text-slate-400 font-medium'
        }`}>
          {lastOrderText}
        </div>

        {/* 9. ยอดสั่งซื้อ 30 วัน (30D PAID OUT) */}
        <div className="text-right min-w-0">
          {sales30Days > 0 ? (
            <span className={`text-[13px] font-mono tracking-tight ${
              sales30Days >= 10000 
                ? 'text-emerald-600 font-black' 
                : 'text-indigo-600 font-bold'
            }`}>
              ฿{sales30Days.toLocaleString('th-TH', {minimumFractionDigits: 2})}
            </span>
          ) : (
            <span className="text-[12px] font-mono font-normal text-slate-300">0.00</span>
          )}
        </div>

      </div>
    </div>
  );
}