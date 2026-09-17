import { Timestamp } from 'firebase/firestore';

export function formatDate(val, opts = {}) {
  if (!val) return opts.fallback ?? '-';
  try {
    const d = val?.toDate ? val.toDate() : val instanceof Date ? val : new Date(val);
    if (isNaN(d)) return opts.fallback ?? '-';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', ...opts });
  } catch { return opts.fallback ?? '-'; }
}

export function getBangkokYMD(date = new Date()) {
  const d = date?.toDate ? date.toDate() : date instanceof Date ? date : new Date(date);
  const bkk = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const y = bkk.getFullYear();
  const m = String(bkk.getMonth() + 1).padStart(2, '0');
  const day = String(bkk.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatRelativeTime(val) {
  if (!val) return '-';
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hrs / 24)} วันที่แล้ว`;
  } catch { return '-'; }
}
