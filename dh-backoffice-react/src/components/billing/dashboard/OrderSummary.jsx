import React from 'react';
import OrderSummaryItems from './order-summary/OrderSummaryItems';
import OrderSummaryTotals from './order-summary/OrderSummaryTotals';

export default function OrderSummary({ selectedOrder, isCancelled, paymentStat, orderStat }) {
    if (!selectedOrder) return null;

    const netTotal = selectedOrder.netTotal || 0;
    const subTotal = selectedOrder.subTotal || netTotal;
    const discount = (selectedOrder.overallDiscount || 0) + (selectedOrder.promoDiscount || 0) + (selectedOrder.discountAmount || 0);
    const shipping = selectedOrder.shippingFee || selectedOrder.shippingCost || 0;
    const walletUsed = selectedOrder.walletUsed || selectedOrder.walletUsedAmount || 0;
    const vat = selectedOrder.vat || selectedOrder.vatAmount || selectedOrder.taxAmount || 0;
    const paymentFee = selectedOrder.paymentFee || selectedOrder.chargeAmount || selectedOrder.feeAmount || 0;
    const otherFees = selectedOrder.otherFees || selectedOrder.extraFee || 0;

    // Check if bill is claimable
    const pStat = (paymentStat || '').toLowerCase();
    const oStat = (orderStat || '').toLowerCase();
    const isPaidOrApproved = pStat === 'paid' || oStat === 'paid' || oStat === 'approved';
    const isClaimable = !isCancelled && isPaidOrApproved;

    return (
        <div className="flex flex-col md:flex-row h-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] rounded-sm shadow-sm overflow-hidden">
            <OrderSummaryItems 
                selectedOrder={selectedOrder} 
                isClaimable={isClaimable} 
            />
            
            <OrderSummaryTotals 
                subTotal={subTotal}
                discount={discount}
                shipping={shipping}
                paymentFee={paymentFee}
                otherFees={otherFees}
                vat={vat}
                walletUsed={walletUsed}
                netTotal={netTotal}
                isCancelled={isCancelled}
                paymentStat={pStat}
                orderStat={oStat}
            />
        </div>
    );
}
