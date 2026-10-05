import React from 'react';
import { Receipt, Calendar, Ban, CheckCircle2, Clock, Phone, Truck, Store, User } from 'lucide-react';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

const OrderTableRow = React.memo(function OrderTableRow({ order, setSelectedOrder }) {
    const statLower = (order.orderStatus || order.status || '').toLowerCase();
    const payStatLower = (order.paymentStatus || '').toLowerCase();
    const isPaid = payStatLower === 'paid' || statLower === 'paid';
    
    // Determine fulfillment considering frontend's shippingMethod and old orders fallback
    let fulfillment = order.fulfillmentType;
    if (!fulfillment) {
        if (order.shippingMethod) {
            fulfillment = order.shippingMethod === 'standard' ? 'Delivery' : 'StorePickup';
        } else {
            // Fallback for old orders that didn't save shippingMethod: if they paid shipping, it's delivery
            const shippingCost = Number(order.shippingFee || order.shippingCost || order.totals?.shipping || 0);
            fulfillment = shippingCost > 0 ? 'Delivery' : 'StorePickup';
        }
    }

    const shippingName = order.shippingMethod || order.courier || 'จัดส่งเอกชน';
    const isCancelled = statLower === 'cancelled' || statLower === 'void';

    // Calculate after-sales service quantities from order.refundsAndClaims, order.claims, order.returns, order.afterSales
    const allRC = [
        ...(Array.isArray(order.refundsAndClaims) ? order.refundsAndClaims : []),
        ...(Array.isArray(order.claims) ? order.claims : []),
        ...(Array.isArray(order.returns) ? order.returns : []),
        ...(Array.isArray(order.afterSales) ? order.afterSales : [])
    ];

    const exchangeQty = allRC
        .filter(rc => {
            const type = (rc.type || rc.actionType || '').toLowerCase();
            const id = String(rc.id || rc.exchangeId || rc.claimId || '').toUpperCase();
            return type.includes('exchange') || type.includes('swap') || type.includes('เปลี่ยน') || id.startsWith('EXC-');
        })
        .reduce((sum, rc) => sum + Number(rc.qty || rc.quantity || 1), 0);

    const returnQty = allRC
        .filter(rc => {
            const type = (rc.type || rc.actionType || '').toLowerCase();
            const id = String(rc.id || rc.returnId || rc.claimId || '').toUpperCase();
            return type.includes('return') || type.includes('refund') || type.includes('คืน') || id.startsWith('RTN-');
        })
        .reduce((sum, rc) => sum + Number(rc.qty || rc.quantity || 1), 0);

    const claimQty = allRC
        .filter(rc => {
            const type = (rc.type || rc.actionType || '').toLowerCase();
            const id = String(rc.id || rc.claimId || '').toUpperCase();
            const isExchange = type.includes('exchange') || type.includes('swap') || type.includes('เปลี่ยน') || id.startsWith('EXC-');
            const isReturn = type.includes('return') || type.includes('refund') || type.includes('คืน') || id.startsWith('RTN-');
            return !isExchange && !isReturn && (type.includes('claim') || type === 'repair' || type.includes('เคลม') || id.startsWith('CLM-'));
        })
        .reduce((sum, rc) => sum + Number(rc.qty || rc.quantity || 1), 0);

    // Pending service checks from order or active To-dos
    const hasPendingClaim = !!(order.hasPendingClaim || order.pendingClaimCount > 0 || order.pendingClaim);
    const hasPendingReturn = !!(order.hasPendingReturn || order.pendingReturnCount > 0 || order.pendingReturn);
    const hasPendingExchange = !!(order.hasPendingExchange || order.pendingExchangeCount > 0 || order.pendingExchange);
    const isDraft = statLower === 'draft' || payStatLower === 'draft' || order.isDraft === true;

    // Check tax invoice status
    const hasTaxInvoice = !!(order.taxInvoice || order.taxInvoiceRequested || order.requestTaxInvoice || order.taxInvoiceStatus || order.taxInvoiceUrl || order.taxData || order.hasPendingTax);
    const isTaxInvoice = order.vatType === 'included' || order.vatType === 'excluded' || !!(order.isTaxInvoice || order.customer?.taxInvoiceNeeded || order.customer?.taxId || hasTaxInvoice);
    const taxStatus = order.taxInvoiceStatus || (order.taxInvoiceUrl ? 'issued' : (hasTaxInvoice ? 'pending' : null));

    return (
        <>
            <td className="py-2.5 px-6 align-middle relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-(--dh-accent) opacity-0 group-hover:opacity-100 transition-opacity duration-300 dh-glow"></div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-black text-(--dh-text-main) group-hover:text-(--dh-accent) transition-colors">
                        <Receipt size={14} className="text-(--dh-text-muted) group-hover:text-(--dh-accent) transition-colors" strokeWidth={2.5}/>
                        <span className={isCancelled ? 'line-through opacity-70' : ''}>
                            {order.orderId}
                        </span>
                    </div>
                </div>
                <div className="text-[10px] text-(--dh-text-muted) font-bold flex items-center gap-1 ml-5">
                    <Calendar size={10} className="opacity-60"/>
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                </div>
            </td>
            <td className="py-2.5 px-4 text-left align-middle whitespace-nowrap">
                {isCancelled ? (
                    <span className="inline-flex items-center justify-start gap-1.5 text-rose-600 text-sm font-black">
                        <Ban size={15} strokeWidth={2.5} /> ยกเลิกแล้ว
                    </span>
                ) : isDraft ? (
                    <span className="inline-flex items-center justify-start gap-1.5 text-purple-700 text-sm font-black">
                        <Clock size={15} strokeWidth={2.5} /> ฉบับร่าง (Draft)
                    </span>
                ) : statLower === 'completed' ? (
                    <span className="inline-flex items-center justify-start gap-1.5 text-blue-700 text-sm font-black">
                        ส่งออก 🚚
                    </span>
                ) : statLower === 'approved' ? (
                    <span className="inline-flex items-center justify-start gap-1.5 text-indigo-700 text-sm font-black">
                        print แล้ว 🖨️ / หักสต๊อคแล้ว 📤
                    </span>
                ) : isPaid ? (
                    <span className="inline-flex items-center justify-start gap-1.5 text-teal-700 text-sm font-black">
                        โอนแล้ว ✅ / หักสต๊อคแล้ว 📤
                    </span>
                ) : (
                    <span className="inline-flex items-center justify-start gap-1.5 text-amber-700 text-sm font-black">
                        <Clock size={15} strokeWidth={2.5} /> รอดำเนินการ
                    </span>
                )}
            </td>
            <td className="py-2.5 px-4 align-middle">
                <div className="font-black text-(--dh-text-main) text-[13px] truncate max-w-[280px] group-hover:text-(--dh-accent) transition-colors dh-text-glow">
                    {getCustomerDisplayName(order.customer, 'ลูกค้าทั่วไป')}
                </div>
                {order.customer?.phone && (
                    <div className="text-[11px] text-(--dh-text-muted) mt-1 flex items-center gap-1 font-mono font-bold">
                        <Phone size={10} className="opacity-70"/>
                        {order.customer.phone}
                    </div>
                )}
            </td>
            <td className="py-2.5 px-4 align-middle">
                <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-(--dh-text-main)">
                    <div className="p-1 bg-slate-500/10 rounded-sm overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                        <User size={12} className="text-slate-500"/>
                    </div>
                    <span className="truncate max-w-[110px]" title={order.staffNickname || order.creatorName || order.actorName || 'พนักงาน'}>
                        {order.staffNickname || order.creatorName || order.actorName || 'พนักงาน'}
                    </span>
                </div>
            </td>
            <td className="py-2.5 px-4 align-middle">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-(--dh-text-main)">
                    {fulfillment === 'Delivery' ? (
                        <>
                            <div className="p-1 bg-blue-500/10 rounded-sm overflow-hidden shadow-inner flex items-center justify-center">
                                <Truck size={12} className="text-blue-500"/>
                            </div> 
                            ส่งพัสดุ 
                            <span className="text-[9px] text-(--dh-text-muted)">({shippingName})</span>
                        </>
                    ) : (
                        <>
                            <div className="p-1 bg-purple-500/10 rounded-sm overflow-hidden shadow-inner flex items-center justify-center">
                                <Store size={12} className="text-purple-500"/>
                            </div> 
                            รับหน้าร้าน
                        </>
                    )}
                </div>
            </td>
            <td className="py-2.5 px-4 align-middle">
                <div className="flex flex-wrap gap-1 justify-start items-center">
                    {claimQty > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-orange-500/10 text-orange-600 text-[10px] font-black border border-orange-500/20 shadow-xs transition-transform hover:scale-105" title={`เคลมสินค้าสำเร็จจำนวน ${claimQty} ชิ้น`}>
                            เคลม {claimQty}
                        </span>
                    )}
                    {hasPendingClaim && claimQty === 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-orange-500/10 text-orange-500 text-[10px] font-black border border-orange-500/20 shadow-xs transition-transform hover:scale-105 animate-pulse" title="มีรายการขอเคลมสินค้าอยู่ระหว่างดำเนินการ (รออนุมัติ)">
                            เคลม (รอ)
                        </span>
                    )}
                    {exchangeQty > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 text-[10px] font-black border border-blue-500/20 shadow-xs transition-transform hover:scale-105" title={`เปลี่ยนสินค้าจำนวน ${exchangeQty} ชิ้น`}>
                            เปลี่ยน {exchangeQty}
                        </span>
                    )}
                    {hasPendingExchange && exchangeQty === 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-sky-500/10 text-sky-600 text-[10px] font-black border border-sky-500/20 shadow-xs transition-transform hover:scale-105 animate-pulse" title="มีรายการขอเปลี่ยนสินค้าอยู่ระหว่างดำเนินการ (รออนุมัติ)">
                            เปลี่ยน (รอ)
                        </span>
                    )}
                    {returnQty > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 text-[10px] font-black border border-purple-500/20 shadow-xs transition-transform hover:scale-105" title={`คืนสินค้าสำเร็จจำนวน ${returnQty} ชิ้น`}>
                            คืน {returnQty}
                        </span>
                    )}
                    {hasPendingReturn && returnQty === 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 text-[10px] font-black border border-purple-500/20 shadow-xs transition-transform hover:scale-105 animate-pulse" title="มีรายการขอคืนสินค้าอยู่ระหว่างดำเนินการ (รออนุมัติ)">
                            คืน (รอ)
                        </span>
                    )}
                    {isTaxInvoice && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-purple-600 text-white text-[10px] font-black shadow-xs transition-transform hover:scale-105" title="ลูกค้าต้องการใบกำกับภาษี">
                            📄 ใบกำกับภาษี
                        </span>
                    )}
                    {taxStatus === 'issued' && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 shadow-xs transition-transform hover:scale-105" title="ออกใบกำกับภาษีเรียบร้อยแล้ว">
                            ภาษี (ออกแล้ว)
                        </span>
                    )}
                    {taxStatus === 'pending' && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-teal-500/10 text-teal-600 text-[10px] font-black border border-teal-500/20 shadow-xs transition-transform hover:scale-105 animate-pulse" title="รอออกใบกำกับภาษี">
                            ภาษี (รอ)
                        </span>
                    )}
                    {claimQty === 0 && !hasPendingClaim && exchangeQty === 0 && !hasPendingExchange && returnQty === 0 && !hasPendingReturn && !isTaxInvoice && !taxStatus && (
                        <span className="text-[11px] text-(--dh-text-muted)">-</span>
                    )}
                </div>
            </td>
            <td className="py-2.5 px-6 text-right align-middle">
                <span className={`font-black text-[15px] transition-colors ${isCancelled ? 'text-(--dh-text-muted) line-through' : 'text-(--dh-text-main) group-hover:text-(--dh-accent) dh-text-glow'}`}>
                    {(() => {
                        let netTotal = Number(order.netTotal || order.totals?.netTotal || order.summary?.finalTotal || order.finalTotal || order.finalPayable || order.totalPrice || order.totalAmount || 0);
                        
                        // 🔥 ULTIMATE FALLBACK: If netTotal is 0, calculate it from the items array
                        if (netTotal === 0 && order.items && order.items.length > 0) {
                            netTotal = order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)), 0);
                        }

                        return `฿${netTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
                    })()}
                </span>
            </td>
        </>
    );
});

export default OrderTableRow;
