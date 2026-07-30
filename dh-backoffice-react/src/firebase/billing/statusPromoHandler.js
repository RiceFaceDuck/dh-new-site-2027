import { increment } from 'firebase/firestore';

export const handlePromoFreebieReversal = async (transaction, db, orderData, promoFreebieSnaps = []) => {
  // 1. คืนโควตาโปรโมชัน และ ของแถม จาก Preloaded Snaps
  if (promoFreebieSnaps && promoFreebieSnaps.length > 0) {
    for (const item of promoFreebieSnaps) {
      if (item.snap && item.snap.exists()) {
        const currentQuotaUsed = Number(item.snap.data().quotaUsed || 0);
        if (currentQuotaUsed > 0) {
          if (item.type === 'promo') {
            const nextQuota = Math.max(0, currentQuotaUsed - 1);
            transaction.update(item.ref, { quotaUsed: nextQuota });
          } else if (item.type === 'freebie') {
             const freebieInOrder = (orderData.appliedFreebies || []).find(f => f.id === item.snap.id);
             const qtyToReturn = freebieInOrder ? (freebieInOrder.qty || 1) : 1;
             const nextQuota = Math.max(0, currentQuotaUsed - qtyToReturn);
             transaction.update(item.ref, { quotaUsed: nextQuota });
          }
        }
      }
    }
  }
};
