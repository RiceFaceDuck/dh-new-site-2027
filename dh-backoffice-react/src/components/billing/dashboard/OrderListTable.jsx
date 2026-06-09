import React from 'react';
import { Search, Loader2, Receipt, Calendar, Ban, CheckCircle2, Clock, Phone, Truck, Store } from 'lucide-react';

export default function OrderListTable({ orders, loading, isSearching, limitAmount, setLimitAmount, setSelectedOrder }) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0 bg-[var(--dh-bg-surface)]">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--dh-text-main)] sticky top-0 z-20 shadow-md">
                    <tr className="border-b-4 border-[var(--dh-accent)] text-[var(--dh-bg-base)]">
                        <th className="py-3 px-6 text-[12px] font-black uppercase tracking-wider w-[22%]">เลขที่บิล / วันที่</th>
                        <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider text-center w-[15%]">สถานะ</th>
                        <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[28%]">ชื่อร้าน / ลูกค้า</th>
                        <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[20%]">การจัดส่ง</th>
                        <th className="py-3 px-6 text-[12px] font-black uppercase tracking-wider text-right w-[15%]">ยอดสุทธิ (NET)</th>
                    </tr>
                </thead>
                <tbody>
                    {(loading || isSearching) && orders.length === 0 ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={`skeleton-${idx}`} className="border-b border-[var(--dh-border)]/60 animate-pulse">
                                <td className="py-4 px-6"><div className="h-4 bg-[var(--dh-border)] rounded w-3/4 mb-2"></div><div className="h-3 bg-[var(--dh-border)]/50 rounded w-1/2"></div></td>
                                <td className="py-4 px-4 text-center"><div className="h-6 bg-[var(--dh-border)] rounded-full w-20 mx-auto"></div></td>
                                <td className="py-4 px-4"><div className="h-4 bg-[var(--dh-border)] rounded w-full mb-2"></div><div className="h-3 bg-[var(--dh-border)]/50 rounded w-1/3"></div></td>
                                <td className="py-4 px-4"><div className="h-4 bg-[var(--dh-border)] rounded w-2/3"></div></td>
                                <td className="py-4 px-6 text-right"><div className="h-5 bg-[var(--dh-border)] rounded w-1/2 ml-auto"></div></td>
                            </tr>
                        ))
                    ) : orders.length === 0 ? (
                        <tr key="not-found">
                            <td colSpan="5" className="p-16 text-center text-[var(--dh-text-muted)]">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 bg-[var(--dh-bg-base)] rounded-full flex items-center justify-center shadow-inner dh-inner-shadow">
                                        <Search className="opacity-40" size={32}/>
                                    </div>
                                    <div className="text-center">
                                        <span className="font-black text-lg block dh-text-glow">ไม่พบข้อมูลบิล</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        <>
                            {orders.map((order, idx) => {
                                const isPaid = order.paymentStatus === 'Paid' || order.orderStatus === 'Paid';
                                const fulfillment = order.fulfillmentType || 'StorePickup'; 
                                const shippingName = order.shippingMethod || order.courier || 'จัดส่งเอกชน';
                                const statLower = (order.orderStatus || order.status || '').toLowerCase();
                                const isCancelled = statLower === 'cancelled' || statLower === 'void';

                                return (
                                <tr 
                                    key={order.id || order.orderId || `order-${idx}`} 
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
                            })}
                            {orders.length >= limitAmount && (
                                <tr key="load-more">
                                    <td colSpan="5" className="py-5 text-center bg-[var(--dh-bg-base)]/50 border-t border-[var(--dh-border)]">
                                        <button 
                                            onClick={() => setLimitAmount(prev => prev + 25)} 
                                            className="px-5 py-2.5 bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] hover:border-[var(--dh-accent)] text-[var(--dh-text-main)] hover:text-[var(--dh-accent)] rounded-md text-xs font-black shadow-sm transition-all inline-flex items-center gap-2 active:scale-95 dh-hover-lift dh-active-press"
                                        >
                                            <Search size={14} strokeWidth={3}/> โหลดบิลเก่าเพิ่มเติม... (กำลังแสดง {limitAmount} รายการล่าสุด)
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}
