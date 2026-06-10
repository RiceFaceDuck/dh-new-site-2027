import React from 'react';
import { Receipt, Calendar, Ban, CheckCircle2, Clock, Phone, Truck, Store } from 'lucide-react';

export default function OrderTableRow({ order, setSelectedOrder }) {
    const isPaid = order.paymentStatus === 'Paid' || order.orderStatus === 'Paid';
    const fulfillment = order.fulfillmentType || 'StorePickup'; 
    const shippingName = order.shippingMethod || order.courier || 'จัดส่งเอกชน';
    const statLower = (order.orderStatus || order.status || '').toLowerCase();
    const isCancelled = statLower === 'cancelled' || statLower === 'void';

    return (
        <tr 
            onClick={() => setSelectedOrder(order)} 
            className="group bg-[var(--dh-bg-base)] even:bg-black/5 dark:even:bg-white/5 hover:bg-[var(--dh-bg-surface)] border-b border-[var(--dh-border)] transition-all duration-300 cursor-pointer"
        >
            <td className="py-2.5 px-6 align-middle relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--dh-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 dh-glow"></div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-black text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)] transition-colors">
                        <Receipt size={14} className="text-[var(--dh-text-muted)] group-hover:text-[var(--dh-accent)] transition-colors" strokeWidth={2.5}/>
                        <span className={isCancelled ? 'line-through opacity-70' : ''}>
                            {order.orderId}
                        </span>
                    </div>
                </div>
                <div className="text-[10px] text-[var(--dh-text-muted)] font-bold flex items-center gap-1 ml-5">
                    <Calendar size={10} className="opacity-60"/>
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                </div>
            </td>
            <td className="py-2.5 px-4 text-center align-middle">
                {isCancelled ? (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-black border border-rose-500/20 shadow-sm transition-transform group-hover:scale-105">
                        <Ban size={12} strokeWidth={2.5} /> ยกเลิกแล้ว
                    </span>
                ) : isPaid ? (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 shadow-sm transition-transform group-hover:scale-105">
                        <CheckCircle2 size={12} strokeWidth={2.5} /> ชำระเงินเรียบร้อย
                    </span>
                ) : (
                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-black border border-orange-500/20 shadow-sm transition-transform group-hover:scale-105">
                        <Clock size={12} strokeWidth={2.5} /> รอดำเนินการ
                    </span>
                )}
            </td>
            <td className="py-2.5 px-4 align-middle">
                <div className="font-black text-[var(--dh-text-main)] text-[13px] truncate max-w-[280px] group-hover:text-[var(--dh-accent)] transition-colors dh-text-glow">
                    {order.customer?.accountName || order.customer?.firstName || 'ลูกค้าทั่วไป'}
                </div>
                {order.customer?.phone && (
                    <div className="text-[11px] text-[var(--dh-text-muted)] mt-1 flex items-center gap-1 font-mono font-bold">
                        <Phone size={10} className="opacity-70"/>
                        {order.customer.phone}
                    </div>
                )}
            </td>
            <td className="py-2.5 px-4 align-middle">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--dh-text-main)]">
                    {fulfillment === 'Delivery' ? (
                        <>
                            <div className="p-1 bg-blue-500/10 rounded overflow-hidden shadow-inner flex items-center justify-center">
                                <Truck size={12} className="text-blue-500"/>
                            </div> 
                            ส่งพัสดุ 
                            <span className="text-[9px] text-[var(--dh-text-muted)]">({shippingName})</span>
                        </>
                    ) : (
                        <>
                            <div className="p-1 bg-purple-500/10 rounded overflow-hidden shadow-inner flex items-center justify-center">
                                <Store size={12} className="text-purple-500"/>
                            </div> 
                            รับหน้าร้าน
                        </>
                    )}
                </div>
            </td>
            <td className="py-2.5 px-6 text-right align-middle">
                <span className={`font-black text-[15px] transition-colors ${isCancelled ? 'text-[var(--dh-text-muted)] line-through' : 'text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)] dh-text-glow'}`}>
                    ฿{order.netTotal?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) || 0}
                </span>
            </td>
        </tr>
    );
}
