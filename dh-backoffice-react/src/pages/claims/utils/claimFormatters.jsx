import React from 'react';
import { Clock, CheckCircle, XCircle, Ban, Flame, Zap, Timer } from 'lucide-react';

// ✨ อัปเกรดลูกเล่นที่ 1: ระบบคำนวณหลอดประกัน (Warranty Progress)
export const getWarrantyInfo = (purchaseDateStr, createdAt) => {
  if (!purchaseDateStr) return null;
  const pDate = new Date(purchaseDateStr);
  if (isNaN(pDate)) return null;
  
  const cDate = createdAt?.toDate ? new Date(createdAt.toDate()) : new Date();
  const diffTime = cDate - pDate;
  const usedDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const warrantyPeriod = 365; // สันนิษฐานประกัน 1 ปี (ปรับเปลี่ยนได้)
  const remainingDays = warrantyPeriod - usedDays;
  const percentUsed = Math.min((usedDays / warrantyPeriod) * 100, 100);

  let color = 'bg-dh-accent'; let textColor = 'text-dh-accent'; let label = `เหลือ ${remainingDays} วัน`;

  if (remainingDays <= 0) {
    color = 'bg-rose-500'; textColor = 'text-rose-500'; label = 'หมดประกัน';
  } else if (remainingDays <= 30) {
    color = 'bg-rose-400'; textColor = 'text-rose-500'; label = `ใกล้หมด (${remainingDays} วัน)`;
  } else if (usedDays <= 30) {
    color = 'bg-emerald-400'; textColor = 'text-emerald-500'; label = `ใหม่มาก (${usedDays} วัน)`;
  } else {
    color = 'bg-amber-400'; textColor = 'text-amber-500';
  }

  return { percentUsed, label, color, textColor };
};

// ✨ อัปเกรดลูกเล่นที่ 2: ระบบตรวจจับความล่าช้า (SLA Tracker Gimmick)
export const getSLAIndicator = (createdAt, status) => {
  if (status !== 'pending_manager') return null;
  const cDate = createdAt?.toDate ? new Date(createdAt.toDate()) : new Date();
  const hoursDiff = (new Date() - cDate) / (1000 * 60 * 60);

  if (hoursDiff > 48) return <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-rose-500 animate-pulse bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/50"><Flame className="w-3 h-3"/> ล่าช้า!</div>;
  if (hoursDiff > 24) return <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800/50"><Zap className="w-3 h-3"/> เร่งด่วน</div>;
  return <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-dh-muted bg-dh-base px-1.5 py-0.5 rounded"><Timer className="w-3 h-3"/> ปกติ</div>;
};

export const getStatusDisplay = (req) => {
  if (req.type.startsWith('CANCEL_') && req.status === 'pending_manager') {
    return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-red-100/80 text-red-700 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 whitespace-nowrap"><Clock className="w-3.5 h-3.5" /> รออนุมัติยกเลิก</span>;
  }
  switch(req.status) {
    case 'pending_manager': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-amber-100/80 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 whitespace-nowrap"><Clock className="w-3.5 h-3.5" /> รอตรวจสอบ</span>;
    case 'approved': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 whitespace-nowrap"><CheckCircle className="w-3.5 h-3.5" /> อนุมัติแล้ว</span>;
    case 'rejected': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-100/80 text-rose-800 border border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 whitespace-nowrap"><XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ</span>;
    case 'cancelled': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-dh-base text-dh-muted border border-dh-border whitespace-nowrap"><Ban className="w-3.5 h-3.5" /> ยกเลิกรายการ</span>;
    default: return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-dh-base text-dh-muted border border-dh-border whitespace-nowrap">{req.status}</span>;
  }
};
