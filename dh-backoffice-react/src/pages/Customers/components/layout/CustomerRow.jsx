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

  // สร้างตัวย่อชื่อบริษัท/ลูกค้าแบบมืออาชีพ (Avatar)
  const getInitials = (name) => {
    if (!name) return 'DH';
    const cleanName = name.replace(/บริษัท|บจก\.|หจก\.|ร้าน/g, '').trim();
    return cleanName.substring(0, 2).toUpperCase();
  };

  // ดึงข้อมูลและกำหนดค่าเริ่มต้น
  const badge = getRankBadge(customer.rank || customer.role);
  const displayName = customer.accountName || customer.displayName || '-';
  const displayCode = customer.customerCode || customer.id?.substring(0, 8) || '-';
  const phoneText = customer.phone || customer.phoneNumber || '-';
  const logisticText = customer.logisticProvider || '-';
  const hasTax = Boolean(customer.hasTaxInfo);
  
  // รหัสลูกค้าสำหรับการดึงข้อมูล Real-time (Wallet & Points)
  // บังคับใช้ Document ID (customer.id) เท่านั้น เพื่อป้องกันการวิ่งไปหาบัญชีผีจาก Short UID
  const customerId = customer.id;

  // ข้อมูลตัวเลขยอดสั่งซื้อ 30 วัน
  const sales30Days = Number(customer.stats?.sales30Days || customer.stats?.monthlySales || 0);

  // คำนวณวันที่สั่งซื้อล่าสุด
  const lastOrderTimestamp = customer.stats?.lastOrderDate || customer.updatedAt;
  let lastOrderText = '-';
  if (lastOrderTimestamp) {
    const date = typeof lastOrderTimestamp === 'number' 
      ? new Date(lastOrderTimestamp) 
      : (lastOrderTimestamp.toDate ? lastOrderTimestamp.toDate() : new Date(lastOrderTimestamp));
    if (!isNaN(date)) {
      lastOrderText = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
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
        
        {/* 1. รหัสลูกค้า (ปรับให้ใหญ่ขึ้น เข้มขึ้นเล็กน้อย และแสดงปุ่ม Copy จางๆ ไว้เสมอ) */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-mono font-semibold text-slate-500 tracking-wider truncate">
            {displayCode.toUpperCase()}
          </span>
          <button 
            onClick={(e) => handleCopyCode(e, displayCode)}
            className="opacity-40 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 transition-all shrink-0"
            title="คัดลอกรหัส"
          >
            {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>

        {/* 2. ชื่อ-นามสกุล / Avatar */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="shrink-0 w-7 h-7 rounded bg-white flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200/80 shadow-sm">
            {getInitials(displayName)}
          </div>
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

        {/* 8. วันที่สั่งซื้อล่าสุด */}
        <div className="text-center text-[12px] font-medium text-slate-400 truncate">
          {lastOrderText}
        </div>

        {/* 9. ยอดสั่งซื้อ 30 วัน */}
        <div className="text-right min-w-0">
          {sales30Days > 0 ? (
            <span className="text-[13px] font-mono font-semibold text-slate-700 tracking-tight">
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