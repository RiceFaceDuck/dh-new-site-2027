/**
 * Centralized formatting utilities facade for DH Notebook monorepo.
 * Re-exports SRP formatting modules to maintain 100% backwards compatibility.
 */

export { formatDate, getBangkokYMD, formatRelativeTime } from './formatters/dateFormatter.js';
export { formatCurrency, formatTHB } from './formatters/currencyFormatter.js';
export { formatNumber, formatDistance, formatUnit, convertToThaiBahtText, isSafeNumber } from './formatters/numberFormatter.js';
export { maskPhone, maskEmail, maskTaxId, formatPhoneNumber } from './formatters/privacyMasker.js';
