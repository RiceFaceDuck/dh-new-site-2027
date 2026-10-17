import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('🧪 VERIFY: Billing Checksum (Satang Parity) & Slip Image Display Fix');

// 1. Verify dh-shared index exports
import { calculateNetTotal, calculatePromotionDiscount, getRenderableImageUrl } from '../../dh-shared/index.js';

console.log('--- 1. Mathematical Parity & Satang Checksum Verification ---');
const items = [
  { id: 'CAAC028', sku: 'CAAC028', price: 290, retailPrice: 290, qty: 1 },
  { id: 'LED14015-1', sku: 'LED14015-1', price: 1790, retailPrice: 1790, qty: 1 }
];

const promo = {
  id: 'CUXlWAViH8qIaa2w62XL',
  name: 'ฉลองเว็บไซค์ใหม่',
  value: 2,
  type: 'PERCENTAGE'
};

const discount = calculatePromotionDiscount(2080, items, promo);
assert.strictEqual(discount, 41.6, `Promotion discount must be 41.6, got ${discount}`);

const result = calculateNetTotal({
  items,
  shippingCost: 0,
  otherFeeAmount: 0,
  discountAmount: 0,
  promotions: [promo]
});

assert.strictEqual(result.subtotal, 2080, 'Subtotal must be 2080');
assert.strictEqual(result.discountAmount, 41.6, 'Discount amount must be 41.6');
assert.strictEqual(result.netTotal, 2038.4, 'Net total must be 2038.4 (Parity with Storefront)');
console.log('✅ Mathematical Parity verified: 2080 - 41.6 = 2038.4');

console.log('--- 2. Image URL Transformation & CDN Normalization ---');
const rawDriveThumb = 'https://drive.google.com/thumbnail?id=1rSXddNAaMf_KsXNy-vHgiPkeAQJ4ccH-&sz=w1000';
const convertedUrl = getRenderableImageUrl(rawDriveThumb);
assert.strictEqual(
  convertedUrl,
  'https://lh3.googleusercontent.com/d/1rSXddNAaMf_KsXNy-vHgiPkeAQJ4ccH-=w1000',
  'Must normalize drive thumbnail to lh3 googleusercontent format'
);
console.log('✅ Drive Thumbnail correctly transformed to high-reliability Google CDN format');

console.log('--- 3. Static Guardrails & Boundary Verification ---');
const usePosActionsPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
const usePosActionsCode = fs.readFileSync(usePosActionsPath, 'utf8');
assert(!usePosActionsCode.includes('return Math.floor(calculatedDiscount);'), 'usePosActions must NOT truncate promo with Math.floor');
assert(usePosActionsCode.includes('Math.round(calculatedDiscount * 100) / 100'), 'usePosActions must use 2-decimal satang precision');

const usePosPaymentPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosPayment.js');
const usePosPaymentCode = fs.readFileSync(usePosPaymentPath, 'utf8');
assert(!usePosPaymentCode.includes('autoPromoDiscount = Math.floor(bestDiscount);'), 'usePosPayment must NOT truncate auto promo with Math.floor');
assert(usePosPaymentCode.includes('Math.round(bestDiscount * 100) / 100'), 'usePosPayment must use 2-decimal satang precision');

const paymentMethodsPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/pos/payment/PaymentMethods.jsx');
const paymentMethodsCode = fs.readFileSync(paymentMethodsPath, 'utf8');
assert(paymentMethodsCode.includes('referrerPolicy="no-referrer"'), 'PaymentMethods must have referrerPolicy="no-referrer"');
assert(paymentMethodsCode.includes('getRenderableImageUrl'), 'PaymentMethods must use getRenderableImageUrl');

const posSystemPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/PosSystem.jsx');
const posSystemCode = fs.readFileSync(posSystemPath, 'utf8');
assert(posSystemCode.includes('referrerPolicy="no-referrer"'), 'PosSystem slip preview modal must have referrerPolicy="no-referrer"');
assert(posSystemCode.includes('getRenderableImageUrl'), 'PosSystem slip preview modal must use getRenderableImageUrl');

console.log('✅ All static checks and guardrails passed with 100% precision!');
console.log('🎉 ALL VERIFICATION ASSERTIONS PASSED PERFECTLY!');
