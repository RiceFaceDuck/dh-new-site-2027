import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// =========================================================================
// ADVERSARIAL STRESS TEST SUITE: REFUND & CLAIM MATHEMATICAL INTEGRITY
// Location: Management System/tests/adversarial/challenger_claims_adversarial_stress.mjs
// =========================================================================

console.log('=== RUNNING ADVERSARIAL MATHEMATICAL STRESS TESTS ===\n');

// -------------------------------------------------------------------------
// 1. Swap SKU Stock & Defect Math Simulation (cancelActionService.js)
// -------------------------------------------------------------------------
describe('1. Swap SKU Stock & Defect Math Simulation during Cancellation', () => {
  
  function simulateCancelStock({
    type,
    originalType,
    originalStatus,
    payload,
    currentDefect = 0,
    currentStock = 0,
    currentSwapStock = 0
  }) {
    const qty = Number(payload.qty || 1);
    const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
    const isSwapSku = !isCancelReturn && (payload.isSwapSku || type === 'CANCEL_EXCHANGE_APPROVAL' || originalType === 'EXCHANGE_APPROVAL' || !!payload.swapSku);
    const isCompleted = originalStatus === 'completed';
    const isProcessing = originalStatus === 'processing';
    const hasArrived = isProcessing || isCompleted;

    let newDefectQuantity = currentDefect;
    let newStockQuantity = currentStock;
    let newSwapStockQuantity = currentSwapStock;
    let soldStatDelta = 0;

    // 1. Defect stock
    if (!isCancelReturn && hasArrived) {
      newDefectQuantity = Math.max(0, currentDefect - qty);
    }

    // 2. Sellable stock
    if (isCompleted) {
      if (isCancelReturn) {
        if (currentStock < qty) {
          throw new Error(`สต็อกคงเหลือไม่เพียงพอสำหรับยกเลิกการคืนสินค้า (คงเหลือ ${currentStock} ชิ้น, ต้องการหักคืน ${qty} ชิ้น)`);
        }
        newStockQuantity = currentStock - qty;
      } else if (isSwapSku) {
        newSwapStockQuantity = currentSwapStock + qty;
        soldStatDelta = -qty;
      } else {
        newStockQuantity = currentStock + qty;
        soldStatDelta = -qty;
      }
    }

    return {
      newDefectQuantity,
      newStockQuantity,
      newSwapStockQuantity,
      soldStatDelta,
      isSwapSku,
      hasArrived,
      isCompleted
    };
  }

  it('TC-STOCK-01: Completed Swap SKU cancellation restores swap stock and decrements defect stock', () => {
    const result = simulateCancelStock({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'completed',
      payload: { sku: 'ORIG-SKU-01', swapSku: 'SWAP-SKU-02', qty: 2, isSwapSku: true },
      currentDefect: 5,
      currentStock: 10,
      currentSwapStock: 3
    });

    assert.equal(result.newDefectQuantity, 3, 'Defect stock must decrement by 2 (5 -> 3)');
    assert.equal(result.newSwapStockQuantity, 5, 'Swap SKU stock must be restored by 2 (3 -> 5)');
    assert.equal(result.newStockQuantity, 10, 'Original SKU sellable stock remains untouched (10)');
    assert.equal(result.soldStatDelta, -2, 'Stats.sold must decrement by 2');
  });

  it('TC-STOCK-02: Defect stock decrement clamps to 0 on underflow (adversarial negative defect prevention)', () => {
    const result = simulateCancelStock({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'completed',
      payload: { sku: 'ORIG-SKU-01', swapSku: 'SWAP-SKU-02', qty: 10, isSwapSku: true },
      currentDefect: 2, // only 2 in defect, but cancel qty is 10
      currentSwapStock: 1
    });

    assert.equal(result.newDefectQuantity, 0, 'Defect stock must clamp to 0 and never become negative (-8)');
  });

  it('TC-STOCK-03: Processing (arrived but not completed) Swap cancel decrements defect but does NOT restore swap stock', () => {
    const result = simulateCancelStock({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'processing',
      payload: { sku: 'ORIG-SKU-01', swapSku: 'SWAP-SKU-02', qty: 1, isSwapSku: true },
      currentDefect: 4,
      currentSwapStock: 10
    });

    assert.equal(result.newDefectQuantity, 3, 'Defect stock must decrement by 1');
    assert.equal(result.newSwapStockQuantity, 10, 'Swap stock must NOT change because it was never dispatched');
  });

  it('TC-STOCK-04: Pending_manager (not arrived) cancel touches neither defect nor swap stock', () => {
    const result = simulateCancelStock({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'pending_manager',
      payload: { sku: 'ORIG-SKU-01', swapSku: 'SWAP-SKU-02', qty: 1, isSwapSku: true },
      currentDefect: 5,
      currentSwapStock: 10
    });

    assert.equal(result.newDefectQuantity, 5, 'Defect stock unchanged');
    assert.equal(result.newSwapStockQuantity, 10, 'Swap stock unchanged');
  });

  it('TC-STOCK-05: Return cancel throws error if warehouse stock is insufficient to pull back', () => {
    assert.throws(() => {
      simulateCancelStock({
        type: 'CANCEL_RETURN_APPROVAL',
        originalType: 'RETURN_APPROVAL',
        originalStatus: 'completed',
        payload: { sku: 'RETURN-SKU-01', qty: 5 },
        currentStock: 2 // only 2 in stock, cannot pull back 5
      });
    }, /สต็อกคงเหลือไม่เพียงพอสำหรับยกเลิกการคืนสินค้า/);
  });
});

// -------------------------------------------------------------------------
// 2. Wallet Difference Reversal & Clawback Simulation (cancelActionService.js)
// -------------------------------------------------------------------------
describe('2. Wallet Difference Reversal & Clawback Simulation', () => {

  function simulateWalletCancel({
    type,
    originalType,
    originalStatus,
    payload,
    currentWallet = 0
  }) {
    const qty = Number(payload.qty || 1);
    const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
    const isSwapSku = !isCancelReturn && (payload.isSwapSku || type === 'CANCEL_EXCHANGE_APPROVAL' || originalType === 'EXCHANGE_APPROVAL' || !!payload.swapSku);
    const isCompleted = originalStatus === 'completed';

    const originalPrice = isSwapSku ? Number(payload.originalPricePerUnit || 0) : 0;
    const swapPrice = isSwapSku ? Number(payload.swapPricePerUnit || 0) : 0;
    const refundAmountSwap = originalPrice * qty;
    const chargeAmountSwap = swapPrice * qty;
    const netDifference = chargeAmountSwap - refundAmountSwap;

    let refundAmountReturn = (payload.purchasePrice || 0) * qty;
    const penalty = Number(payload.freebiePenaltyAmount) || 0;
    if (penalty > 0) {
      refundAmountReturn = Math.max(0, refundAmountReturn - penalty);
    }

    const hasCustomer = payload.customerUid && payload.customerUid !== 'Walk-in' && payload.customerUid !== 'WALK-IN';
    let newWallet = currentWallet;
    let walletTxType = null;
    let walletTxAmount = 0;

    if (isCompleted && hasCustomer) {
      // 1. READ VALIDATIONS
      if (isCancelReturn && refundAmountReturn > 0 && currentWallet < refundAmountReturn) {
        throw new Error(`ไม่สามารถยกเลิกใบคืนสินค้านี้ได้ เนื่องจากลูกค้าได้นำเงินคืน (Wallet) จำนวน ${refundAmountReturn} บาท ไปใช้แล้ว (ยอดคงเหลือ ${currentWallet} บาท) กรุณาทวงเงินลูกค้านอกระบบ`);
      }
      if (isSwapSku && netDifference < 0) {
        const refundToClawback = Math.abs(netDifference);
        if (currentWallet < refundToClawback) {
          throw new Error(`ไม่สามารถยกเลิกใบสลับรุ่นนี้ได้ เนื่องจากลูกค้าได้นำเงินส่วนต่างที่คืนไป (Wallet) จำนวน ${refundToClawback} บาท ไปใช้แล้ว (ยอดคงเหลือ ${currentWallet} บาท) กรุณาทวงเงินลูกค้านอกระบบ`);
        }
      }

      // 2. WRITE MUTATIONS
      if (isCancelReturn && refundAmountReturn > 0) {
        newWallet -= refundAmountReturn;
        walletTxType = 'SPEND';
        walletTxAmount = refundAmountReturn;
      } else if (isSwapSku) {
        if (netDifference > 0) {
          newWallet += netDifference;
          walletTxType = 'REFUND';
          walletTxAmount = netDifference;
        } else if (netDifference < 0) {
          const refundToClawback = Math.abs(netDifference);
          newWallet -= refundToClawback;
          walletTxType = 'SPEND';
          walletTxAmount = refundToClawback;
        }
      }
    }

    return {
      newWallet,
      netDifference,
      refundAmountReturn,
      walletTxType,
      walletTxAmount
    };
  }

  it('TC-WALLET-01: Swap cancel with positive difference (customer paid extra) refunds money to customer wallet', () => {
    const result = simulateWalletCancel({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'completed',
      payload: {
        customerUid: 'cust_001',
        isSwapSku: true,
        originalPricePerUnit: 500,
        swapPricePerUnit: 800,
        qty: 1
      },
      currentWallet: 100
    });

    assert.equal(result.netDifference, 300, 'Net difference was +300 (customer paid 300 extra)');
    assert.equal(result.newWallet, 400, 'Customer wallet must increase by 300 (100 -> 400)');
    assert.equal(result.walletTxType, 'REFUND', 'Transaction type must be REFUND');
    assert.equal(result.walletTxAmount, 300);
  });

  it('TC-WALLET-02: Swap cancel with negative difference (customer received refund) claws back money when balance is sufficient', () => {
    const result = simulateWalletCancel({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'completed',
      payload: {
        customerUid: 'cust_001',
        isSwapSku: true,
        originalPricePerUnit: 1000,
        swapPricePerUnit: 700,
        qty: 1
      },
      currentWallet: 500
    });

    assert.equal(result.netDifference, -300, 'Net difference was -300 (customer received 300 refund previously)');
    assert.equal(result.newWallet, 200, 'Customer wallet must decrease by 300 (500 -> 200)');
    assert.equal(result.walletTxType, 'SPEND', 'Transaction type must be SPEND (clawback)');
    assert.equal(result.walletTxAmount, 300);
  });

  it('TC-WALLET-03: Swap cancel with negative difference throws error when customer has insufficient wallet balance', () => {
    assert.throws(() => {
      simulateWalletCancel({
        type: 'CANCEL_EXCHANGE_APPROVAL',
        originalType: 'EXCHANGE_APPROVAL',
        originalStatus: 'completed',
        payload: {
          customerUid: 'cust_001',
          isSwapSku: true,
          originalPricePerUnit: 1000,
          swapPricePerUnit: 700,
          qty: 1
        },
        currentWallet: 299.99 // 1 cent less than 300 required
      });
    }, /ไม่สามารถยกเลิกใบสลับรุ่นนี้ได้ เนื่องจากลูกค้าได้นำเงินส่วนต่างที่คืนไป/);
  });

  it('TC-WALLET-04: Swap cancel exact boundary match (wallet balance exactly equals clawback amount) succeeds', () => {
    const result = simulateWalletCancel({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'completed',
      payload: {
        customerUid: 'cust_001',
        isSwapSku: true,
        originalPricePerUnit: 800,
        swapPricePerUnit: 500,
        qty: 1
      },
      currentWallet: 300 // exactly 300
    });

    assert.equal(result.newWallet, 0, 'Wallet reduced exactly to 0');
    assert.equal(result.walletTxType, 'SPEND');
    assert.equal(result.walletTxAmount, 300);
  });

  it('TC-WALLET-05: Return cancel clawback throws when wallet balance is lower than refundAmount', () => {
    assert.throws(() => {
      simulateWalletCancel({
        type: 'CANCEL_RETURN_APPROVAL',
        originalType: 'RETURN_APPROVAL',
        originalStatus: 'completed',
        payload: {
          customerUid: 'cust_001',
          purchasePrice: 1500,
          qty: 1,
          freebiePenaltyAmount: 200
        },
        currentWallet: 1299 // need 1300 (1500 - 200)
      });
    }, /ไม่สามารถยกเลิกใบคืนสินค้านี้ได้ เนื่องจากลูกค้าได้นำเงินคืน/);
  });

  it('TC-WALLET-06: Walk-in customer does not trigger wallet modifications', () => {
    const result = simulateWalletCancel({
      type: 'CANCEL_EXCHANGE_APPROVAL',
      originalType: 'EXCHANGE_APPROVAL',
      originalStatus: 'completed',
      payload: {
        customerUid: 'Walk-in',
        isSwapSku: true,
        originalPricePerUnit: 500,
        swapPricePerUnit: 900,
        qty: 1
      },
      currentWallet: 0
    });

    assert.equal(result.walletTxType, null, 'No wallet transaction for Walk-in');
    assert.equal(result.newWallet, 0, 'No wallet change for Walk-in');
  });
});

// -------------------------------------------------------------------------
// 3. Bounded Refund Calculation Simulation (returnActionService.js)
// -------------------------------------------------------------------------
describe('3. Bounded Refund Calculation Simulation (Ceilings & Penalties)', () => {

  function calculateBoundedRefund({
    payload,
    orderData
  }) {
    const qty = Number(payload.qty || 1);
    let unitPrice = Number(payload.purchasePrice || 0);
    let maxRefundable = Infinity;

    if (orderData) {
      const matchedItem = (orderData.items || []).find(it => it.sku === payload.sku);
      if (matchedItem) {
        const itemEffectivePrice = Number(
          matchedItem.priceAfterDiscount ?? 
          matchedItem.effectivePrice ?? 
          matchedItem.priceAtPurchase ?? 
          matchedItem.price ?? 
          unitPrice
        );
        if (itemEffectivePrice > 0) {
          unitPrice = itemEffectivePrice;
        }
      }

      const orderFinalTotal = Number(orderData.finalTotal ?? orderData.totals?.finalTotal ?? 0);
      const pastReturns = (orderData.refundsAndClaims || []).filter(rc => rc.type === 'Return');
      const totalPastRefunded = pastReturns.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      maxRefundable = Math.max(0, orderFinalTotal - totalPastRefunded);
    }

    let refundAmount = unitPrice * qty;
    const finalPenalty = Number(payload.freebiePenaltyAmount) || 0;
    if (finalPenalty > 0) {
      refundAmount = Math.max(0, refundAmount - finalPenalty);
    }
    if (Number.isFinite(maxRefundable)) {
      refundAmount = Math.min(refundAmount, maxRefundable);
    }

    const hasCustomer = payload.customerUid && payload.customerUid !== 'Walk-in' && payload.customerUid !== 'WALK-IN';
    const clawbackPoints = (hasCustomer && refundAmount > 0) ? Math.floor(refundAmount / 100) : 0;

    return {
      resolvedUnitPrice: unitPrice,
      maxRefundable,
      refundAmount,
      finalPenalty,
      clawbackPoints
    };
  }

  it('TC-REFUND-01: Effective discounted price takes precedence over sticker purchase price', () => {
    const result = calculateBoundedRefund({
      payload: {
        sku: 'SKU-DISC-01',
        qty: 1,
        purchasePrice: 1000 // sticker price
      },
      orderData: {
        finalTotal: 800,
        items: [{
          sku: 'SKU-DISC-01',
          price: 1000,
          priceAfterDiscount: 750 // discounted promotional price
        }]
      }
    });

    assert.equal(result.resolvedUnitPrice, 750, 'Effective price must resolve to priceAfterDiscount (750)');
    assert.equal(result.refundAmount, 750, 'Refund amount must be 750, not 1000');
  });

  it('TC-REFUND-02: Refund clamped to remaining order balance when multiple returns occur', () => {
    const result = calculateBoundedRefund({
      payload: {
        sku: 'SKU-02',
        qty: 1,
        purchasePrice: 500
      },
      orderData: {
        finalTotal: 1000,
        items: [{ sku: 'SKU-02', price: 500 }],
        refundsAndClaims: [
          { type: 'Return', id: 'RTN-01', amount: 700 } // already refunded 700 of 1000
        ]
      }
    });

    assert.equal(result.maxRefundable, 300, 'Remaining refundable balance is 1000 - 700 = 300');
    assert.equal(result.refundAmount, 300, 'Refund of 500 must clamp to 300');
  });

  it('TC-REFUND-03: Order balance fully exhausted clamps subsequent refund to 0', () => {
    const result = calculateBoundedRefund({
      payload: {
        sku: 'SKU-03',
        qty: 1,
        purchasePrice: 400
      },
      orderData: {
        finalTotal: 800,
        items: [{ sku: 'SKU-03', price: 400 }],
        refundsAndClaims: [
          { type: 'Return', id: 'RTN-01', amount: 800 } // already refunded 800 of 800
        ]
      }
    });

    assert.equal(result.maxRefundable, 0);
    assert.equal(result.refundAmount, 0, 'Refund must clamp to 0 when order balance exhausted');
    assert.equal(result.clawbackPoints, 0, '0 clawback points on 0 refund');
  });

  it('TC-REFUND-04: Freebie penalty reduces refund amount, clamps to 0 if penalty exceeds item price', () => {
    // Penalty less than price
    const res1 = calculateBoundedRefund({
      payload: {
        sku: 'SKU-04',
        qty: 1,
        purchasePrice: 1000,
        freebiePenaltyAmount: 300
      },
      orderData: { finalTotal: 1000, items: [{ sku: 'SKU-04', price: 1000 }] }
    });
    assert.equal(res1.refundAmount, 700, 'Refund reduced by 300 penalty (1000 -> 700)');

    // Penalty exceeds price
    const res2 = calculateBoundedRefund({
      payload: {
        sku: 'SKU-04',
        qty: 1,
        purchasePrice: 200,
        freebiePenaltyAmount: 500
      },
      orderData: { finalTotal: 200, items: [{ sku: 'SKU-04', price: 200 }] }
    });
    assert.equal(res2.refundAmount, 0, 'Refund must clamp to 0 and not become negative (-300)');
  });

  it('TC-REFUND-05: Point clawback is 1 point per 100 THB floor for authenticated customers', () => {
    const result = calculateBoundedRefund({
      payload: {
        customerUid: 'cust_vip_01',
        sku: 'SKU-05',
        qty: 1,
        purchasePrice: 499
      },
      orderData: { finalTotal: 499, items: [{ sku: 'SKU-05', price: 499 }] }
    });

    assert.equal(result.refundAmount, 499);
    assert.equal(result.clawbackPoints, 4, 'Math.floor(499 / 100) = 4 points');
  });

  it('TC-REFUND-06: Walk-in customer gets 0 point clawback regardless of refund amount', () => {
    const result = calculateBoundedRefund({
      payload: {
        customerUid: 'Walk-in',
        sku: 'SKU-06',
        qty: 1,
        purchasePrice: 2500
      },
      orderData: { finalTotal: 2500, items: [{ sku: 'SKU-06', price: 2500 }] }
    });

    assert.equal(result.refundAmount, 2500);
    assert.equal(result.clawbackPoints, 0, 'Walk-in customer must have 0 clawback points');
  });
});
