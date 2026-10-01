export const BANK_ACCOUNTS = [
  { code: 'BAY', name: 'เข้าบัญชี: กรุงศรี (default)', label: 'กรุงศรี', color: '#fec40b' },
  { code: 'KBANK_CO', name: 'เข้าบัญชี: กสิกร (บจก.)', label: 'กสิกร (บจก.)', color: '#138f2d' },
  { code: 'SCB', name: 'เข้าบัญชี: ไทยพาณิชย์ (SCB)', label: 'ไทยพาณิชย์ (SCB)', color: '#4e2583' },
  { code: 'KTB', name: 'เข้าบัญชี: กรุงไทย', label: 'กรุงไทย', color: '#00a5e5' },
  { code: 'BBL', name: 'เข้าบัญชี: กรุงเทพ', label: 'กรุงเทพ', color: '#1e4598' },
  { code: 'KBANK', name: 'เข้าบัญชี: กสิกร', label: 'กสิกร', color: '#138f2d' },
  { code: 'TTB', name: 'เข้าบัญชี: ทหารไทยธนชาต (TTB)', label: 'ทหารไทยธนชาต', color: '#002d63' },
  { code: 'GSB', name: 'เข้าบัญชี: ออมสิน', label: 'ออมสิน', color: '#eb008b' },
  { code: 'PROMPTPAY', name: 'เข้าบัญชี: พร้อมเพย์', label: 'พร้อมเพย์', color: '#003d6b' },
  { code: 'CUSTOM', name: '+ เพิ่มเอง / บัญชีอื่น', label: 'เพิ่มเอง', color: '#64748b' }
];

export const getBankLabel = (code) => {
  if (!code) return 'กรุงศรี';
  const found = BANK_ACCOUNTS.find(b => b.code.toUpperCase() === String(code).toUpperCase());
  return found ? found.label : code;
};
