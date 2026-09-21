/**
 * Customer match service - phone normalization utilities.
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('66')) p = '0' + p.slice(2);
  if (p.startsWith('+66')) p = '0' + p.slice(3);
  return p;
}

export function matchCustomerByPhone(customers, phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return customers.find(c => normalizePhone(c.phone) === normalized || normalizePhone(c.phoneNumber) === normalized) || null;
}
