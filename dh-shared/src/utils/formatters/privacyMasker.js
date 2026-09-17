export function maskPhone(phone) {
  if (!phone) return '-';
  const s = String(phone).replace(/\D/g, '');
  return s.length >= 8 ? s.slice(0, 3) + '-***-' + s.slice(-4) : '***';
}
export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return local.slice(0, 2) + '***@' + domain;
}
export function maskTaxId(taxId) {
  if (!taxId) return '-';
  const s = String(taxId).replace(/\D/g, '');
  return s.slice(0, 3) + '-****-' + s.slice(-4);
}
export function formatPhoneNumber(phone) {
  if (!phone) return '-';
  const s = String(phone).replace(/\D/g, '');
  if (s.length === 10) return `${s.slice(0,3)}-${s.slice(3,6)}-${s.slice(6)}`;
  return phone;
}
