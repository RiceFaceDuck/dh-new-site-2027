import OrderSummaryItems from './order-summary/OrderSummaryItems';
import OrderSummaryTotals from './order-summary/OrderSummaryTotals';
import { calculateOrderCanonicalTotals } from 'dh-shared/src/priceEngine';

export default function OrderSummary({ selectedOrder, isCancelled, paymentStat, orderStat }) {
    if (!selectedOrder) return null;

    // 🟢 Use Canonical Totals Engine (Satang Precision SSOT)
    const canonical = calculateOrderCanonicalTotals(selectedOrder);

    const subTotal = canonical.itemsSubTotal;
    let discount = canonical.totalDiscount;
    const shipping = canonical.shippingFee;
    const otherFeeAmount = canonical.otherFees;
    const otherFeeName = selectedOrder.otherFeeName || selectedOrder.summary?.otherFeeName || '';
    const vat = canonical.vatAmount;
    const paymentFee = Number(selectedOrder.paymentFee || selectedOrder.chargeAmount || selectedOrder.feeAmount || selectedOrder.summary?.paymentFee || 0);
    const walletUsed = Number(selectedOrder.walletUsed || selectedOrder.walletUsedAmount || selectedOrder.summary?.walletUsed || selectedOrder.calculationLog?.usedWallet || 0);
    const pointsUsed = Number(selectedOrder.pointsUsed || selectedOrder.summary?.pointsUsed || selectedOrder.pointsDiscount || selectedOrder.calculationLog?.pointsUsed || 0);
    const netTotal = canonical.netTotal;

    // 🟢 [FALLBACK CALCULATION] If discount is 0 but subTotal > netTotal, calculate actual discount
    if (discount === 0 && subTotal > netTotal) {
        const calculatedDiff = subTotal + shipping + otherFeeAmount + vat - netTotal;
        if (calculatedDiff > 0) {
            discount = Math.round(calculatedDiff * 100) / 100;
        }
    }

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
                    isFreebie: true, note: (f.title || '') + (f.conditionText ? ' ('+f.conditionText.trim()+')' : ''), noteColor: 'rose',
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
                otherFees={otherFeeAmount}
                otherFeeName={otherFeeName}
                vat={vat}
                walletUsed={walletUsed}
                pointsUsed={pointsUsed}
                netTotal={netTotal}
                isCancelled={isCancelled}
                paymentStat={pStat}
                orderStat={oStat}
            />
        </div>
    );
}
