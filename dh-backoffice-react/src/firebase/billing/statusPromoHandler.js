import { increment } from 'firebase/firestore';

export const handlePromoFreebieReversal = async (transaction, db, orderData, promoFreebieSnaps = []) => {
  // 1. คืนโควตาโปรโมชัน และ ของแถม จาก Preloaded Snaps
  if (promoFreebieSnaps && promoFreebieSnaps.length > 0) {
    for (const item of promoFreebieSnaps) {
      if (item.snap && item.snap.exists() && item.snap.data().quotaUsed > 0) {
        if (item.type === 'promo') {
          transaction.update(item.ref, { quotaUsed: increment(-1) });
        } else if (item.type === 'freebie') {
           const freebieInOrder = (orderData.appliedFreebies || []).find(f => f.id === item.snap.id);
           const qtyToReturn = freebieInOrder ? (freebieInOrder.qty || 1) : 1;
           transaction.update(item.ref, { quotaUsed: increment(-qtyToReturn) });
        }
      }
    }
  }
};
