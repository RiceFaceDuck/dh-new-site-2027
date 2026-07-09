import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function initFirebase() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  const tempAdcPath = path.resolve('temp_adc.json');
  const adcContent = {
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: refreshToken
  };
  fs.writeFileSync(tempAdcPath, JSON.stringify(adcContent, null, 2));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;
  initializeApp({
    projectId: 'dh-notebook-69f3b'
  });
}

async function run() {
  initFirebase();
  const db = getFirestore();
  const customerId = 'y2rGbkQNZugOcSebVUx5xdYNpjs1';
  const customerRef = db.collection('users').doc(customerId);
  const customerSnap = await customerRef.get();
  const customerData = customerSnap.data();

  const invSnap = await db.collection('products').where('sku', '==', 'ADAC001').limit(1).get();
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
      staffName: 'ผู้จัดการ AI',
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
      createdAt: FieldValue.serverTimestamp()
  };

  await db.runTransaction(async (t) => {
      // 1. Create Order
      const orderRef = db.collection('orders').doc(billId);
      t.set(orderRef, orderData);

      // 2. Update Customer Stats
      t.update(customerRef, {
          'stats.orderCount': FieldValue.increment(1),
          'stats.totalPurchasedAmount': FieldValue.increment(mockItem.price),
          'stats.lastOrderDate': FieldValue.serverTimestamp(),
          'stats.lastPurchaseDate': FieldValue.serverTimestamp()
      });

      // 3. Update Inventory
      const invRef = db.collection('products').doc(product.id);
      t.update(invRef, {
          stockQuantity: FieldValue.increment(-1),
          'stats.sold': FieldValue.increment(1)
      });
      
      // 4. Update Sales Stats
      t.set(baseDocRef, {
          totalSales: FieldValue.increment(mockItem.price),
          orderCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
  });

  console.log('✅ Order successfully created: ' + billId);
}

run().catch(console.error);
