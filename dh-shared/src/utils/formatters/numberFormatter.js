export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(Number(val))) return '-';
  return Number(val).toLocaleString('th-TH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
export function formatDistance(val) { return val != null ? `${Number(val).toFixed(1)} กม.` : '-'; }
export function formatUnit(val, unit = '') { return val != null ? `${Number(val).toLocaleString('th-TH')} ${unit}`.trim() : '-'; }
export function isSafeNumber(val) { return typeof val === 'number' && isFinite(val) && !isNaN(val); }
export function convertToThaiBahtText(amount) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const numberStr = absNum.toFixed(2);
  const [bahtStr, satangStr] = numberStr.split('.');

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readGroup(str) {
    let text = '';
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(str[i], 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1) {
          text += 'เอ็ด';
        } else if (pos === 1 && digit === 2) {
          text += 'ยี่สิบ';
        } else if (pos === 1 && digit === 1) {
          text += 'สิบ';
        } else {
          text += numbers[digit] + positions[pos % 6];
        }
      }
      if (pos % 6 === 0 && pos > 0 && digit !== 0) {
        text += 'ล้าน';
      }
    }
    return text;
  }

  const bahtVal = parseInt(bahtStr, 10);
  const satangVal = parseInt(satangStr, 10);

  let result = isNegative ? 'ลบ' : '';

  if (bahtVal > 0) {
    result += readGroup(bahtStr) + 'บาท';
  }

  if (satangVal > 0) {
    result += readGroup(satangStr) + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }

  return result || 'ศูนย์บาทถ้วน';
}
