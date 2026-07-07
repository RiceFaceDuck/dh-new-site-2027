import React from 'react';
import OrderSummaryItems from './order-summary/OrderSummaryItems';
import OrderSummaryTotals from './order-summary/OrderSummaryTotals';

export default function OrderSummary({ selectedOrder, isCancelled, paymentStat, orderStat }) {
    if (!selectedOrder) return null;

    let netTotal = Number(selectedOrder.netTotal || selectedOrder.totals?.netTotal || selectedOrder.summary?.finalTotal || selectedOrder.finalTotal || selectedOrder.finalPayable || selectedOrder.totalPrice || selectedOrder.totalAmount || 0);
    
    // 🔥 ULTIMATE FALLBACK: If netTotal is 0, calculate it from the items array
    if (netTotal === 0 && selectedOrder.items && selectedOrder.items.length > 0) {
        netTotal = selectedOrder.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)), 0);
    }

    // 🟢 [FALLBACK CALCULATION] Calculate true subtotal before discount from non-freebie items
    let calculatedSubTotal = 0;
    if (selectedOrder.items && selectedOrder.items.length > 0) {
        calculatedSubTotal = selectedOrder.items.reduce((sum, item) => {
            if (item.isFreebie) return sum;
            const price = Number(item.price || item.priceAtPurchase || 0);
            const qty = Number(item.qty || item.quantity || 1);
            return sum + (price * qty);
        }, 0);
    }

    const subTotal = Number(selectedOrder.subTotal || selectedOrder.summary?.itemSubTotal || selectedOrder.itemTotal || selectedOrder.totals?.subtotal || calculatedSubTotal || netTotal);
    
    let discount = Number(selectedOrder.overallDiscount || selectedOrder.promoDiscount || selectedOrder.discountAmount || selectedOrder.summary?.discountTotal || selectedOrder.calculationLog?.discountAmount || selectedOrder.totals?.discount || 0);
    
    // 🟢 [FALLBACK CALCULATION] If discount is 0 but subTotal > netTotal, calculate actual discount
    if (discount === 0 && subTotal > netTotal) {
        const shipping = Number(selectedOrder.shippingFee || selectedOrder.shippingCost || selectedOrder.summary?.shippingFee || selectedOrder.totals?.shipping || 0);
        const vat = Number(selectedOrder.vat || selectedOrder.vatAmount || selectedOrder.taxAmount || selectedOrder.summary?.vat || 0);
        const otherFees = Number(selectedOrder.otherFees || selectedOrder.extraFee || selectedOrder.summary?.otherFees || 0);
        const calculatedDiff = subTotal + shipping + otherFees + vat - netTotal;
        if (calculatedDiff > 0) {
            discount = calculatedDiff;
        }
    }

    const shipping = Number(selectedOrder.shippingFee || selectedOrder.shippingCost || selectedOrder.summary?.shippingFee || selectedOrder.totals?.shipping || 0);
    const walletUsed = Number(selectedOrder.walletUsed || selectedOrder.walletUsedAmount || selectedOrder.summary?.walletUsed || selectedOrder.calculationLog?.usedWallet || 0);
    const vat = Number(selectedOrder.vat || selectedOrder.vatAmount || selectedOrder.taxAmount || selectedOrder.summary?.vat || 0);
    const paymentFee = Number(selectedOrder.paymentFee || selectedOrder.chargeAmount || selectedOrder.feeAmount || selectedOrder.summary?.paymentFee || 0);
    const otherFees = Number(selectedOrder.otherFees || selectedOrder.extraFee || selectedOrder.summary?.otherFees || 0);

    // Check if bill is claimable
    const pStat = (paymentStat || '').toLowerCase();
    const oStat = (orderStat || '').toLowerCase();
    const isPaidOrApproved = pStat === 'paid' || oStat === 'paid' || oStat === 'approved' || oStat === 'shipped' || oStat === 'completed';
    const isClaimable = !isCancelled && isPaidOrApproved;

    // Merge appliedFreebies into items for display (for frontend orders where they are stored separately)
    const displayItems = [...(selectedOrder.items || [])];
    if (selectedOrder.appliedFreebies?.length > 0) {
        selectedOrder.appliedFreebies.forEach(f => {
            if (!displayItems.some(i => (i.sku === f.itemName || i.id === f.itemName) && i.isFreebie)) {
                displayItems.push({
                    sku: f.itemName,
                    name: `[แถมฟรี] ${f.productName || f.title || f.itemName}`,
                    qty: f.qty || 1,
                    price: 0,
                    isFreebie: true,
                });
            }
        });
    }

    const orderWithMergedItems = { ...selectedOrder, items: displayItems };

    return (
        <div className="flex flex-col md:flex-row h-full bg-(--dh-bg-surface) border border-(--dh-border) rounded-xs shadow-xs overflow-hidden">
            <OrderSummaryItems 
                selectedOrder={orderWithMergedItems} 
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
