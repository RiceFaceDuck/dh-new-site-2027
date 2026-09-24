import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { writeCachedOrders } from './orderCacheService';

let inFlightSyncPromise = null;
let lastSyncTimestamp = 0;
const SYNC_THROTTLE_MS = 600; // Deduplicate calls within 600ms window

/**
 * 🚀 Sync and Bundle the latest 50 Orders into `catalogs/recent_orders`
 * Reduces reads for all dashboard views to 1 Read!
 */
export const syncRecentOrdersCatalog = async () => {
  if (inFlightSyncPromise) {
    return inFlightSyncPromise;
  }

  const now = Date.now();
  if (now - lastSyncTimestamp < SYNC_THROTTLE_MS) {
    return { success: true, count: 50, throttled: true };
  }

  inFlightSyncPromise = (async () => {
    try {
      const ordersCol = collection(db, getCollectionPath('orders'));
      const q = query(ordersCol, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("No orders found to bundle into recent_orders catalog.");
        return { success: true, count: 0 };
      }

    const bundledOrders = snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      
      // Normalize timestamp to epoch ms for lightweight storage
      let createdTime = Date.now();
      if (d.createdAt) {
        if (typeof d.createdAt.toMillis === 'function') createdTime = d.createdAt.toMillis();
        else if (typeof d.createdAt.toDate === 'function') createdTime = d.createdAt.toDate().getTime();
        else if (d.createdAt.seconds) createdTime = d.createdAt.seconds * 1000;
        else if (typeof d.createdAt === 'number') createdTime = d.createdAt;
        else {
          const parsed = new Date(d.createdAt).getTime();
          if (!isNaN(parsed)) createdTime = parsed;
        }
      }

      // Extract lightweight items
      const items = Array.isArray(d.items) ? d.items.map(i => ({
        sku: i.sku || i.productCode || i.code || '',
        name: i.name || i.productName || i.title || '',
        qty: Number(i.qty || i.quantity || 1),
        price: Number(i.price || 0),
        discount: Number(i.discount || 0)
      })) : [];

      return {
        id: docSnap.id,
        orderId: d.orderId || docSnap.id,
        orderStatus: d.orderStatus || d.status || 'pending',
        status: d.status || d.orderStatus || 'pending',
        paymentStatus: d.paymentStatus || 'unpaid',
        paymentMethod: d.paymentMethod || d.paymentType || 'Cash',
        fulfillmentType: d.fulfillmentType || (d.shippingMethod === 'standard' ? 'Delivery' : 'StorePickup'),
        shippingMethod: d.shippingMethod || '',
        courier: d.courier || '',
        trackingNumber: d.trackingNumber || d.trackingNo || d.shippingTracking || '',
        shippingFee: Number(d.shippingFee || d.shippingCost || 0),
        netTotal: Number(d.netTotal || d.totals?.netTotal || 0),
        createdAt: createdTime,
        customer: d.customer ? {
          uid: d.customer.uid || d.customerUid || '',
          name: d.customer.name || d.customer.displayName || d.customer.storeName || d.customer.accountName || '',
          displayName: d.customer.displayName || d.customer.name || '',
          storeName: d.customer.storeName || '',
          accountName: d.customer.accountName || '',
          phone: d.customer.phone || '',
          role: d.customer.role || '',
          tier: d.customer.tier || ''
        } : null,
        customerInfo: d.customerInfo || null,
        walkInName: d.walkInName || '',
        walkInPhone: d.walkInPhone || '',
        staffNickname: d.staffNickname || '',
        createdBy: d.createdBy || '',
        items,
        refundsAndClaims: d.refundsAndClaims || [],
        claims: d.claims || [],
        returns: d.returns || [],
        afterSales: d.afterSales || [],
        taxInvoiceStatus: d.taxInvoiceStatus || (d.taxInvoiceUrl ? 'issued' : null),
        taxInvoiceUrl: d.taxInvoiceUrl || null,
        hasPendingClaim: !!d.hasPendingClaim,
        hasPendingReturn: !!d.hasPendingReturn,
        hasPendingTax: !!d.hasPendingTax
      };
    });

    const version = Date.now();
    const catalogPayload = {
      version,
      updatedAt: serverTimestamp(),
      count: bundledOrders.length,
      orders: bundledOrders
    };

    // Write the single aggregated document
    const catalogRef = doc(db, getCollectionPath('catalogs'), 'recent_orders');
    await setDoc(catalogRef, catalogPayload);

    // Overwrite local cache immediately
    writeCachedOrders(bundledOrders, { version, updatedAt: version });

    console.log(`[✓] Successfully bundled ${bundledOrders.length} orders into catalogs/recent_orders (Version: ${version})`);
    lastSyncTimestamp = Date.now();
    return { success: true, count: bundledOrders.length, version };
  } catch (err) {
    console.error("❌ Error in syncRecentOrdersCatalog:", err);
    throw err;
  } finally {
    inFlightSyncPromise = null;
  }
  })();

  return inFlightSyncPromise;
};
