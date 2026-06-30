import { doc, increment } from 'firebase/firestore';

export const handlePromoFreebieReversal = async (transaction, db, orderData) => {
  // 1. คืนโควตาโปรโมชัน
  if (orderData.appliedPromotion && orderData.appliedPromotion.id) {
    const promoRef = doc(db, 'promotions', orderData.appliedPromotion.id);
    const promoSnap = await transaction.get(promoRef);
    if (promoSnap.exists() && promoSnap.data().quotaUsed > 0) {
      transaction.update(promoRef, { quotaUsed: increment(-1) });
    }
  }

  // 2. คืนโควตาของแถม
  if (orderData.appliedFreebies && Array.isArray(orderData.appliedFreebies)) {
    for (const freebie of orderData.appliedFreebies) {
      if (!freebie.id) continue;
      const freebieRef = doc(db, 'freebies', freebie.id);
      const freebieSnap = await transaction.get(freebieRef);
      if (freebieSnap.exists() && freebieSnap.data().quotaUsed > 0) {
        transaction.update(freebieRef, { quotaUsed: increment(-1) });
      }
    }
  }
};
