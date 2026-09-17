export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(Number(val))) return '-';
  return Number(val).toLocaleString('th-TH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
export function formatDistance(val) { return val != null ? `${Number(val).toFixed(1)} กม.` : '-'; }
export function formatUnit(val, unit = '') { return val != null ? `${Number(val).toLocaleString('th-TH')} ${unit}`.trim() : '-'; }
export function isSafeNumber(val) { return typeof val === 'number' && isFinite(val) && !isNaN(val); }
export function convertToThaiBahtText(amount) {
  if (!amount || isNaN(amount)) return 'ศูนย์บาทถ้วน';
  const baht = Math.floor(amount); const satang = Math.round((amount - baht) * 100);
  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  function toText(n) {
    if (n === 0) return '';
    let result = ''; let pos = 0;
    while (n > 0) {
      const d = n % 10; n = Math.floor(n / 10);
      if (d !== 0) result = units[d] + positions[pos] + result;
      pos++;
    }
    return result;
  }
  const bahtText = baht === 0 ? 'ศูนย์' : toText(baht);
  return bahtText + 'บาท' + (satang > 0 ? toText(satang) + 'สตางค์' : 'ถ้วน');
}
