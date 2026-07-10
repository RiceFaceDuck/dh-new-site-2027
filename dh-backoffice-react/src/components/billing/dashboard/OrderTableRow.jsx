import React from 'react';
import { Receipt, Calendar, Ban, CheckCircle2, Clock, Phone, Truck, Store, User } from 'lucide-react';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

export default function OrderTableRow({ order, setSelectedOrder }) {
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

    // Calculate after-sales service quantities
    const claimQty = order.refundsAndClaims
        ? order.refundsAndClaims.filter(rc => rc.type === 'Claim').reduce((sum, rc) => sum + (rc.qty || 0), 0)
        : 0;

    const exchangeQty = order.refundsAndClaims
        ? order.refundsAndClaims.filter(rc => rc.type === 'Exchange').reduce((sum, rc) => sum + (rc.qty || 0), 0)
        : 0;

    const returnQty = order.refundsAndClaims
        ? order.refundsAndClaims.filter(rc => rc.type === 'Return').reduce((sum, rc) => sum + (rc.qty || 0), 0)
        : 0;

    // Check tax invoice status (prepared for future)
    const hasTaxInvoice = !!(order.taxInvoice || order.taxInvoiceRequested || order.requestTaxInvoice || order.taxInvoiceStatus);
    const taxStatus = order.taxInvoiceStatus || (hasTaxInvoice ? 'pending' : null);

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
            <td className="py-2.5 px-4 text-center align-middle">
                {isCancelled ? (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-black border border-rose-500/20 shadow-xs transition-transform group-hover:scale-105">
                        <Ban size={12} strokeWidth={2.5} /> ยกเลิกแล้ว
                    </span>
                ) : statLower === 'completed' ? (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black border border-blue-500/20 shadow-xs transition-transform group-hover:scale-105 dh-glow">
                        <CheckCircle2 size={12} strokeWidth={2.5} /> เสร็จสิ้น
                    </span>
                ) : statLower === 'approved' ? (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 shadow-xs transition-transform group-hover:scale-105 dh-glow">
                        <CheckCircle2 size={12} strokeWidth={2.5} /> อนุมัติ / หักสต็อกแล้ว
                    </span>
                ) : isPaid ? (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-black border border-teal-500/20 shadow-xs transition-transform group-hover:scale-105">
                        <CheckCircle2 size={12} strokeWidth={2.5} /> ชำระเงินเรียบร้อย
                    </span>
                ) : (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-black border border-orange-500/20 shadow-xs transition-transform group-hover:scale-105">
                        <Clock size={12} strokeWidth={2.5} /> รอดำเนินการ
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
                    <span className="truncate max-w-[110px]" title={order.creatorName || order.actorName || 'พนักงาน'}>
                        {order.creatorName || order.actorName || 'พนักงาน'}
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
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-orange-500/10 text-orange-600 text-[10px] font-black border border-orange-500/20 shadow-xs transition-transform hover:scale-105" title={`เคลมสินค้าจำนวน ${claimQty} ชิ้น`}>
                            เคลม {claimQty}
                        </span>
                    )}
                    {exchangeQty > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 text-[10px] font-black border border-blue-500/20 shadow-xs transition-transform hover:scale-105" title={`เปลี่ยนสินค้าจำนวน ${exchangeQty} ชิ้น`}>
                            เปลี่ยน {exchangeQty}
                        </span>
                    )}
                    {returnQty > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 text-[10px] font-black border border-purple-500/20 shadow-xs transition-transform hover:scale-105" title={`คืนสินค้าจำนวน ${returnQty} ชิ้น`}>
                            คืน {returnQty}
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
                    {claimQty === 0 && exchangeQty === 0 && returnQty === 0 && !taxStatus && (
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
}
