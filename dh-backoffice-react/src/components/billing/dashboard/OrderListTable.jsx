import React from 'react';
import { Search } from 'lucide-react';
import OrderTableRow from './OrderTableRow';

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
                            {orders.map((order, idx) => (
                                <OrderTableRow 
                                    key={order.id || order.orderId || `order-${idx}`} 
                                    order={order} 
                                    setSelectedOrder={setSelectedOrder} 
                                />
                            ))}
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
