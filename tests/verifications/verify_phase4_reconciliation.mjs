import assert from 'node:assert';

function getValidDate(rawDate) {
  if (!rawDate) return new Date();
  if (typeof rawDate.toDate === 'function') return rawDate.toDate();
  if (rawDate instanceof Date) return rawDate;
  if (typeof rawDate === 'number') return new Date(rawDate);
  if (typeof rawDate === 'string') {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function reconcileTransactions({ decreased = [], increased = [], realOrders = [], realClaims = [], lastResetDate = new Date() }) {
  const records = [];
  const baseDate = getValidDate(lastResetDate);
  const baseTimeStr = baseDate.toLocaleString('th-TH');

  // Decreased items
  decreased.forEach((item, idx) => {
    const diff = (Number(item.newStock) || 0) - (Number(item.oldStock) || 0);

    const matchingOrder = realOrders.find(ord => {
      const orderDateObj = getValidDate(ord.createdAt || ord.updatedAt || ord.date);
      if (orderDateObj < baseDate) return false;
      const statusLower = (ord.orderStatus || ord.status || '').toLowerCase();
      if (statusLower === 'cancelled' || statusLower === 'draft') return false;
      const itemsList = ord.items || ord.cart || ord.verifiedItems || ord.products || [];
      return Array.isArray(itemsList) && itemsList.some(i => 
        String(i.sku || i.id || i.productSku || i.code || '').trim().toLowerCase() === String(item.sku).trim().toLowerCase()
      );
    });

    const matchingExchangeClaim = !matchingOrder && realClaims.find(clm => {
      const claimDateObj = getValidDate(clm.createdAt || clm.updatedAt || clm.date);
      if (claimDateObj < baseDate) return false;
      const payload = clm.payload || {};
      const claimTypeRaw = String(clm.type || clm.claimType || payload.claimType || '').toUpperCase();
      const isExchange = claimTypeRaw.includes('EXCHANGE') || claimTypeRaw.includes('SWAP') || Boolean(payload.exchangeId);
      if (!isExchange) return false;
      const targetSku = String(payload.exchangeSku || payload.replacementSku || clm.exchangeSku || clm.sku || '').trim().toLowerCase();
      return targetSku === String(item.sku).trim().toLowerCase();
    });

    if (matchingOrder) {
      const realTxId = matchingOrder.orderId || matchingOrder.invoiceNo || matchingOrder.receiptNo || matchingOrder.id || `ORD-${idx+1}`;
      records.push({
        id: `DEC-ORD-${matchingOrder.id}-${item.sku}-${idx}`,
        sku: item.sku,
        hasRealDocument: true,
        txId: realTxId,
        type: 'decreased',
        eventCategory: 'sale',
        eventLabel: '🛒 ขายสินค้า (Order/Bill)',
        customerName: matchingOrder.customerName || 'ลูกค้าหน้าร้าน'
      });
    } else if (matchingExchangeClaim) {
      const payload = matchingExchangeClaim.payload || {};
      const realTxId = payload.exchangeId || payload.claimId || matchingExchangeClaim.claimId || matchingExchangeClaim.ticketNo || matchingExchangeClaim.id;
      records.push({
        id: `DEC-EXC-${matchingExchangeClaim.id}-${item.sku}-${idx}`,
        sku: item.sku,
        hasRealDocument: true,
        txId: realTxId,
        type: 'decreased',
        eventCategory: 'claim',
        eventLabel: '🔄 เปลี่ยนสินค้า (ตัดตัวใหม่)',
        customerName: matchingExchangeClaim.customerName || 'ลูกค้าเปลี่ยนสินค้า'
      });
    } else {
      const docTxId = item.txId || item.transactionId || 'ไม่มีเอกสารอ้างอิง';
      records.push({
        id: `DEC-DIFF-${item.sku}-${idx}`,
        sku: item.sku,
        hasRealDocument: false,
        txId: docTxId,
        type: 'decreased',
        eventCategory: 'adjust',
        eventLabel: '📦 ตรวจพบลดลงระหว่างรอบ',
        customerName: 'คลังสินค้า (ส่วนต่างตรวจนับ)'
      });
    }
  });

  // Increased items
  increased.forEach((item, idx) => {
    const diff = (Number(item.newStock) || 0) - (Number(item.oldStock) || 0);

    const matchingClaim = realClaims.find(clm => {
      const claimDateObj = getValidDate(clm.createdAt || clm.updatedAt || clm.date);
      if (claimDateObj < baseDate) return false;
      const payload = clm.payload || {};
      const claimSku = String(clm.sku || clm.productSku || clm.itemSku || payload.sku || '').trim().toLowerCase();
      return claimSku === String(item.sku).trim().toLowerCase();
    });

    if (matchingClaim) {
      const payload = matchingClaim.payload || {};
      const claimTypeRaw = String(matchingClaim.type || matchingClaim.claimType || payload.claimType || '').toUpperCase();
      const isReturn = claimTypeRaw.includes('RETURN') || Boolean(payload.returnId);
      const isExchange = claimTypeRaw.includes('EXCHANGE') || claimTypeRaw.includes('SWAP') || Boolean(payload.exchangeId);

      const realTxId = payload.returnId || payload.exchangeId || payload.claimId || matchingClaim.claimId || matchingClaim.ticketNo || matchingClaim.id || `CLM-${idx+1}`;
      let eventLabel = '🔄 เคลมสินค้า (รับคืนเข้าคลัง)';
      if (isReturn) eventLabel = '🔄 รับคืนสินค้า (เข้าคลัง)';
      else if (isExchange) eventLabel = '🔄 เปลี่ยนสินค้า (รับของเดิมเข้า)';

      records.push({
        id: `INC-CLM-${matchingClaim.id}-${item.sku}-${idx}`,
        sku: item.sku,
        hasRealDocument: true,
        txId: realTxId,
        type: 'increased',
        eventCategory: 'claim',
        eventLabel
      });
    } else {
      const docTxId = item.txId || item.transactionId || 'ไม่มีเอกสารอ้างอิง';
      records.push({
        id: `INC-DIFF-${item.sku}-${idx}`,
        sku: item.sku,
        hasRealDocument: false,
        txId: docTxId,
        type: 'increased',
        eventCategory: 'adjust',
        eventLabel: '🛠️ ตรวจพบสต็อกเพิ่มขึ้น'
      });
    }
  });

  return records;
}

// ==========================================
// TEST SUITE: PHASE 4 AUTHENTIC RECONCILIATION
// ==========================================
console.log('--- STARTING VERIFICATION: PHASE 4 AUTHENTIC RECONCILIATION ---');

const baseDate = new Date('2026-09-23T10:00:00');
const laterDate = new Date('2026-09-23T11:00:00');

const mockOrders = [
  {
    id: 'ord-doc-001',
    invoiceNo: 'INV-20260923-0089',
    customerName: 'สมชาย การค้า',
    date: laterDate,
    items: [{ sku: 'SKU-LAPTOP-01', quantity: 2 }]
  }
];

const mockClaims = [
  {
    id: 'clm-doc-002',
    claimId: 'CLM-20260923-0012',
    type: 'RETURN',
    date: laterDate,
    sku: 'SKU-RAM-16GB',
    payload: { returnId: 'RTN-20260923-0005' }
  }
];

const mockDecreased = [
  { sku: 'SKU-LAPTOP-01', oldStock: 10, newStock: 8 }, // Should match mockOrders
  { sku: 'SKU-UNKNOWN-99', oldStock: 5, newStock: 4 }   // Unreferenced variance
];

const mockIncreased = [
  { sku: 'SKU-RAM-16GB', oldStock: 20, newStock: 21 }, // Should match mockClaims (RETURN)
  { sku: 'SKU-EXTRA-01', oldStock: 0, newStock: 3 }     // Unreferenced variance
];

const results = reconcileTransactions({
  decreased: mockDecreased,
  increased: mockIncreased,
  realOrders: mockOrders,
  realClaims: mockClaims,
  lastResetDate: baseDate
});

// Test 1: Zero Ghost Bill IDs
const allTxIds = results.map(r => r.txId);
assert.ok(!allTxIds.some(id => id.startsWith('BS-SYNC-')), 'MUST NOT contain fake BS-SYNC- IDs');
assert.ok(!allTxIds.some(id => id.startsWith('STK-IN-')), 'MUST NOT contain fake STK-IN- IDs');
console.log('✅ Test 1 Passed: Zero ghost IDs found in reconciled dataset');

// Test 2: Authentic POS Order Linking
const orderRecord = results.find(r => r.sku === 'SKU-LAPTOP-01');
assert.strictEqual(orderRecord.hasRealDocument, true);
assert.strictEqual(orderRecord.txId, 'INV-20260923-0089');
assert.strictEqual(orderRecord.customerName, 'สมชาย การค้า');
console.log('✅ Test 2 Passed: POS order authentic document linked correctly');

// Test 3: Authentic Return Claim Linking
const returnRecord = results.find(r => r.sku === 'SKU-RAM-16GB');
assert.strictEqual(returnRecord.hasRealDocument, true);
assert.strictEqual(returnRecord.txId, 'RTN-20260923-0005');
assert.strictEqual(returnRecord.eventLabel, '🔄 รับคืนสินค้า (เข้าคลัง)');
console.log('✅ Test 3 Passed: Return claim authentic document linked correctly');

// Test 4: Unreferenced stock variance marked truthfully
const unrefRecord = results.find(r => r.sku === 'SKU-UNKNOWN-99');
assert.strictEqual(unrefRecord.hasRealDocument, false);
assert.strictEqual(unrefRecord.txId, 'ไม่มีเอกสารอ้างอิง');
assert.strictEqual(unrefRecord.eventLabel, '📦 ตรวจพบลดลงระหว่างรอบ');
console.log('✅ Test 4 Passed: Unreferenced variance marked truthfully without synthetic IDs');

console.log('--- ALL PHASE 4 RECONCILIATION VERIFICATIONS PASSED (100%) ---');
