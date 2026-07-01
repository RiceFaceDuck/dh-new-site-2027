import { doc, increment } from 'firebase/firestore';

export const handlePromoFreebieReversal = async (transaction, db, orderData) => {
  // 1. คืนโควตาโปรโมชัน
  if (orderData.appliedPromotions && Array.isArray(orderData.appliedPromotions)) {
    for (const promo of orderData.appliedPromotions) {
      if (!promo.id) continue;
      const promoRef = doc(db, 'promotions', promo.id);
      const promoSnap = await transaction.get(promoRef);
      if (promoSnap.exists() && promoSnap.data().quotaUsed > 0) {
        transaction.update(promoRef, { quotaUsed: increment(-1) });
      }
    }
  } else if (orderData.appliedPromotion && orderData.appliedPromotion.id) {
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
        const qtyToReturn = freebie.qty || 1;
        transaction.update(freebieRef, { quotaUsed: increment(-qtyToReturn) });
      }
    }
  }
};
