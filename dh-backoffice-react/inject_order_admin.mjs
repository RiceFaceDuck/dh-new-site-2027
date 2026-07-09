import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const customerId = 'y2rGbkQNZugOcSebVUx5xdYNpjs1';
  const customerRef = db.collection('users').doc(customerId);
  const customerSnap = await customerRef.get();
  const customerData = customerSnap.data();

  const invSnap = await db.collection('inventory').where('stockQuantity', '>', 5).limit(1).get();
  const product = { id: invSnap.docs[0].id, ...invSnap.docs[0].data() };

  const today = new Date();
  const mmStr = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const yyyyMM = yyyy + '-' + mmStr;
  
  const baseDocRef = db.collection('sales_stats').doc(yyyyMM);
  const statSnap = await baseDocRef.get();
  const count = (statSnap.exists ? (statSnap.data().orderCount || 0) : 0) + 1;
  const countStr = String(count).padStart(4, '0');
  const billId = 'DH-' + yyyy + '-' + mmStr + '-' + countStr;

  const mockItem = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: Number(product.retailPrice),
      retailPrice: Number(product.retailPrice),
      priceAtPurchase: Number(product.retailPrice),
      quantity: 1,
      isFreebie: false,
      image: product.imageUrls?.[0] || '',
      category: product.category || ''
  };
  
  const freebieItem = {
      ...mockItem,
      price: 0,
      priceAtPurchase: 0,
      isFreebie: true,
      promotionsApplied: [{ id: 'TEST-PROMO', name: 'Freebie Promo' }]
  };

  const totalItems = [mockItem, freebieItem];

  const orderData = {
      id: billId,
      userId: customerId,
      customerId: customerData.customerCode || '',
      customerName: customerData.firstName + ' ' + customerData.lastName,
      staffId: 'NJplV50wBOX02lKTQclEJ5pgVws2', // AI Manager
      staffName: 'ผู้จัดการ AI (ผู้ช่วย)',
      items: totalItems,
      status: 'COMPLETED',
      paymentMethod: 'TRANSFER',
      totals: {
          subtotal: mockItem.price,
          discountAmount: 0,
          shippingCost: 0,
          otherFeeAmount: 0,
          netTotal: mockItem.price
      },
      appliedPromotions: [
          { id: 'TEST-PROMO', name: 'โปรโมชั่นของแถม (AI Test)', discountType: 'FREE_ITEM' }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.runTransaction(async (t) => {
      // 1. Create Order
      const orderRef = db.collection('orders').doc(billId);
      t.set(orderRef, orderData);

      // 2. Update Customer Stats
      const currentStats = customerData.stats || {};
      t.update(customerRef, {
          'stats.orderCount': admin.firestore.FieldValue.increment(1),
          'stats.totalPurchasedAmount': admin.firestore.FieldValue.increment(mockItem.price),
          'stats.lastOrderDate': admin.firestore.FieldValue.serverTimestamp(),
          'stats.lastPurchaseDate': admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Update Inventory
      const invRef = db.collection('inventory').doc(product.id);
      t.update(invRef, {
          stockQuantity: admin.firestore.FieldValue.increment(-1),
          'stats.sold': admin.firestore.FieldValue.increment(1)
      });
      
      // 4. Update Sales Stats
      t.set(baseDocRef, {
          totalSales: admin.firestore.FieldValue.increment(mockItem.price),
          orderCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  });

  console.log('✅ Order successfully created: ' + billId);
}

run().catch(console.error);
