export function formatCurrency(val, currency = 'THB') {
  if (val === null || val === undefined || isNaN(Number(val))) return '-';
  return Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function formatTHB(val) { return formatCurrency(val); }
