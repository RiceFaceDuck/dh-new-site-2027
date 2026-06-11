import { useState, useMemo } from 'react';

export default function useWholesaleCalculator(task, fetchedData = {}) {
  const checkoutState = task?.payload?.checkoutSnapshot || {};
  const cartItems = task?.payload?.items || [];
  const totals = task?.payload?.originalTotals || {};

  const [editedPrices, setEditedPrices] = useState({});
  const [extraManualDiscount, setExtraManualDiscount] = useState(0);

  const shippingCost = checkoutState.shippingCost || totals.shippingFee || 0;
  const appliedPromotions = checkoutState.appliedPromotions || [];
  const qualifiedFreebies = checkoutState.qualifiedFreebies || [];
  const webExtraDiscount = checkoutState.discountAmount || 0;
  const usedPoints = checkoutState.usePoints || 0;
  const usedWallet = checkoutState.useWallet || 0;

  const totalPromoDiscount = appliedPromotions.reduce((sum, promo) => sum + (promo.discountValue || 0), 0);
  const totalWebDiscount = totalPromoDiscount + webExtraDiscount;
  const totalCreditDiscount = usedPoints + usedWallet;

  const calculations = useMemo(() => {
    let retailSubtotal = 0;
    let wholesaleSubtotal = 0;

    cartItems.forEach((item, idx) => {
      const rPrice = item.price || 0;
      const qty = item.quantity || 1;
      retailSubtotal += rPrice * qty;

      let finalWholesalePrice = rPrice;

      if (editedPrices[idx] !== undefined && editedPrices[idx] !== '') {
        finalWholesalePrice = Number(editedPrices[idx]);
      } else if (fetchedData && fetchedData[item.productId] !== undefined) {
        finalWholesalePrice = fetchedData[item.productId];
      } else if (item.wholesalePrice && item.wholesalePrice < rPrice) {
        finalWholesalePrice = item.wholesalePrice;
      } else {
        finalWholesalePrice = Math.floor(rPrice * 0.95);
      }

      wholesaleSubtotal += Math.max(0, finalWholesalePrice) * qty;
    });

    const extra = Number(extraManualDiscount) || 0;
    const itemLevelDiscount = Math.max(0, retailSubtotal - wholesaleSubtotal);
    
    const originalNetTotal = Math.max(0, (retailSubtotal - totalWebDiscount) + shippingCost - totalCreditDiscount);
    const newNetTotal = Math.max(0, (wholesaleSubtotal - totalWebDiscount - extra) + shippingCost - totalCreditDiscount);

    return {
      retailSubtotal,
      wholesaleSubtotal,
      itemLevelDiscount,
      originalNetTotal,
      newNetTotal,
      extra
    };
  }, [cartItems, fetchedData, editedPrices, extraManualDiscount, totalWebDiscount, shippingCost, totalCreditDiscount]);

  const handlePriceChange = (idx, value) => {
    setEditedPrices(prev => ({ ...prev, [idx]: Math.max(0, Number(value)) }));
  };

  return {
    cartItems,
    totals,
    editedPrices,
    setEditedPrices,
    extraManualDiscount,
    setExtraManualDiscount,
    shippingCost,
    appliedPromotions,
    qualifiedFreebies,
    webExtraDiscount,
    usedPoints,
    usedWallet,
    totalWebDiscount,
    totalCreditDiscount,
    calculations,
    handlePriceChange
  };
}
