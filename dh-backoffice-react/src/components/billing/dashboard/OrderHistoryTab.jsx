import { useState, useEffect, useCallback } from 'react';
import { 
    Clock, 
    RefreshCw, 
    CheckCircle2, 
    Truck, 
    Printer, 
    CreditCard, 
    FileText, 
    XCircle, 
    User, 
    Calendar,
    ArrowUpRight,
    AlertCircle
} from 'lucide-react';
import { billingQueryService } from '../../../firebase/billingQueryService';

function parseTimestamp(ts) {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    if (typeof ts === 'number') return new Date(ts);
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function formatThaiDate(date) {
    if (!date) return '-';
    return date.toLocaleString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function getEventIcon(type, color) {
    const iconSize = 14;
    switch (type) {
        case 'creation':
            return <FileText size={iconSize} className="text-emerald-500" />;
        case 'payment':
            return <CreditCard size={iconSize} className="text-blue-500" />;
        case 'print':
            return <Printer size={iconSize} className="text-indigo-500" />;
        case 'shipping':
            return <Truck size={iconSize} className="text-purple-500" />;
        case 'complete':
            return <CheckCircle2 size={iconSize} className="text-emerald-500" />;
        case 'void':
            return <XCircle size={iconSize} className="text-rose-500" />;
        default:
            return <Clock size={iconSize} className="text-amber-500" />;
    }
}

export default function OrderHistoryTab({ selectedOrder }) {
    const [historyItems, setHistoryItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const loadHistory = useCallback(async () => {
        if (!selectedOrder) return;
        setIsLoading(true);
        setFetchError(null);

        try {
            // 1. Fetch persistent history logs from Firestore
            const orderDocId = selectedOrder.id;
            const businessOrderId = selectedOrder.orderId;
            
            const [logsDocId, logsOrderId] = await Promise.all([
                orderDocId ? billingQueryService.getOrderHistory(orderDocId) : Promise.resolve([]),
                (businessOrderId && businessOrderId !== orderDocId) 
                    ? billingQueryService.getOrderHistory(businessOrderId) 
                    : Promise.resolve([])
            ]);

            const rawDbLogs = [...(logsDocId || []), ...(logsOrderId || [])];
            
            // Deduplicate DB logs by ID
            const uniqueDbLogs = [];
            const seenIds = new Set();
            for (const log of rawDbLogs) {
                const lid = log.id || `${log.timestamp?.seconds || 0}_${log.action}`;
                if (!seenIds.has(lid)) {
                    seenIds.add(lid);
                    uniqueDbLogs.push(log);
                }
            }

            // 2. Synthesize core order milestones from order state
            const milestones = [];

            // A. Creation
            const createdDate = parseTimestamp(selectedOrder.createdAt);
            if (createdDate) {
                milestones.push({
                    id: 'milestone-created',
                    timestamp: createdDate,
                    title: 'สร้างคำสั่งซื้อ',
                    badge: selectedOrder.orderStatus === 'draft' ? 'ร่างบิล (Draft)' : 'เปิดบิลขาย',
                    details: `เปิดบิลโดย ${selectedOrder.staffNickname || selectedOrder.createdBy || 'พนักงาน'} (${selectedOrder.items?.length || 0} รายการ, ยอดสุทธิ ฿${Number(selectedOrder.summary?.finalTotal || selectedOrder.finalTotal || selectedOrder.netTotal || 0).toLocaleString()})`,
                    actor: selectedOrder.staffNickname || selectedOrder.createdBy || 'พนักงานขาย',
                    type: 'creation'
                });
            }

            // B. Payment
            const isPaid = selectedOrder.paymentStatus === 'paid' || 
                           selectedOrder.orderStatus === 'paid' || 
                           selectedOrder.orderStatus === 'approved' || 
                           selectedOrder.orderStatus === 'completed';
            if (isPaid) {
                const paidDate = parseTimestamp(selectedOrder.paidAt || selectedOrder.createdAt);
                if (paidDate) {
                    milestones.push({
                        id: 'milestone-paid',
                        timestamp: paidDate,
                        title: 'ชำระเงินสำเร็จ',
                        badge: selectedOrder.paymentMethod || 'เงินสด/โอน',
                        details: `ยอดชำระ ฿${Number(selectedOrder.summary?.finalTotal || selectedOrder.finalTotal || selectedOrder.netTotal || 0).toLocaleString()}${selectedOrder.transactionRef ? ` (เลขอ้างอิงสลิป: ${selectedOrder.transactionRef})` : ''}`,
                        actor: selectedOrder.staffNickname || 'ระบบ POS',
                        type: 'payment'
                    });
                }
            }

            // C. Print Count
            if (selectedOrder.lastPrintedAt || (selectedOrder.printCount && selectedOrder.printCount > 0)) {
                const printDate = parseTimestamp(selectedOrder.lastPrintedAt);
                if (printDate) {
                    milestones.push({
                        id: 'milestone-printed',
                        timestamp: printDate,
                        title: 'พิมพ์ใบเสร็จรับเงิน',
                        badge: `พิมพ์แล้ว ${selectedOrder.printCount || 1} ครั้ง`,
                        details: `พิมพ์บิลล่าสุด ${formatThaiDate(printDate)}`,
                        actor: 'พนักงาน',
                        type: 'print'
                    });
                }
            }

            // D. Shipping
            const isShipped = selectedOrder.shippedAt || 
                              selectedOrder.trackingNumber || 
                              selectedOrder.orderStatus === 'shipped';
            if (isShipped) {
                const shipDate = parseTimestamp(selectedOrder.shippedAt || selectedOrder.updatedAt);
                if (shipDate) {
                    milestones.push({
                        id: 'milestone-shipped',
                        timestamp: shipDate,
                        title: 'แจ้งจัดส่งสินค้า',
                        badge: selectedOrder.courier || selectedOrder.shippingMethod || 'จัดส่งพัสดุ',
                        details: `เลขพัสดุ (Tracking No.): ${selectedOrder.trackingNumber || '-'}`,
                        actor: selectedOrder.shippedBy || 'ฝ่ายจัดส่ง',
                        type: 'shipping'
                    });
                }
            }

            // E. Completed Delivery
            if (selectedOrder.orderStatus === 'completed' || selectedOrder.completedAt) {
                const completeDate = parseTimestamp(selectedOrder.completedAt || selectedOrder.updatedAt);
                if (completeDate) {
                    milestones.push({
                        id: 'milestone-completed',
                        timestamp: completeDate,
                        title: 'ส่งมอบสินค้าสำเร็จ',
                        badge: 'เสร็จสมบูรณ์',
                        details: 'ลูกค้าได้รับสินค้าเรียบร้อย ปิดรายการสมบูรณ์',
                        actor: 'พนักงาน / ระบบ',
                        type: 'complete'
                    });
                }
            }

            // F. Void / Cancellation
            const isCancelled = selectedOrder.orderStatus === 'cancelled' || 
                                selectedOrder.orderStatus === 'void' || 
                                selectedOrder.voidedAt;
            if (isCancelled) {
                const voidDate = parseTimestamp(selectedOrder.voidedAt || selectedOrder.cancelledAt || selectedOrder.updatedAt);
                if (voidDate) {
                    milestones.push({
                        id: 'milestone-void',
                        timestamp: voidDate,
                        title: 'ยกเลิกคำสั่งซื้อ (Voided)',
                        badge: 'ยกเลิกบิล',
                        details: `เหตุผล: ${selectedOrder.voidReason || 'ยกเลิกคำสั่งซื้อ'} (คืนสต็อกสินค้าเรียบร้อย)`,
                        actor: selectedOrder.voidedBy || 'ผู้จัดการร้าน',
                        type: 'void'
                    });
                }
            }

            // 3. Map DB Logs into unified items
            const mappedDbLogs = uniqueDbLogs.map(log => ({
                id: log.id,
                timestamp: parseTimestamp(log.timestamp) || new Date(),
                title: `${log.module || 'ระบบ'}: ${log.action || 'บันทึกประวัติ'}`,
                badge: log.module || 'Audit Log',
                details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || ''),
                actor: log.actorName || log.performedBy || 'System',
                type: 'audit'
            }));

            // 4. Combine and Sort chronologically (newest first)
            const combined = [...milestones, ...mappedDbLogs].sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.getTime() : 0;
                const timeB = b.timestamp ? b.timestamp.getTime() : 0;
                return timeB - timeA;
            });

            setHistoryItems(combined);
        } catch (err) {
            console.error("Error building order history:", err);
            setFetchError(err.message || 'ไม่สามารถโหลดประวัติได้');
        } finally {
            setIsLoading(false);
        }
    }, [selectedOrder]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return (
        <div className="w-full h-full flex flex-col bg-(--dh-bg-base) overflow-hidden p-2 sm:p-4">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-(--dh-border) mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-xs border border-blue-500/20">
                        <History size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-(--dh-text-main) leading-none">
                            ประวัติความเคลื่อนไหวคำสั่งซื้อ
                        </h2>
                        <span className="text-[10px] text-(--dh-text-muted) font-medium">
                            บันทึกเหตุการณ์และเส้นทางสถานะของบิล {selectedOrder?.orderId || selectedOrder?.id}
                        </span>
                    </div>
                </div>

                <button
                    onClick={loadHistory}
                    disabled={isLoading}
                    title="โหลดประวัติใหม่"
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-(--dh-bg-surface) hover:bg-(--dh-bg-base) text-(--dh-text-muted) hover:text-(--dh-text-main) border border-(--dh-border) rounded-xs shadow-2xs transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={12} className={isLoading ? "animate-spin text-blue-500" : ""} />
                    <span>รีเฟรช</span>
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-(--dh-text-muted) gap-2">
                        <RefreshCw size={24} className="animate-spin text-blue-500 opacity-80" />
                        <span className="text-xs font-medium">กำลังโหลดประวัติของบิล...</span>
                    </div>
                ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center h-48 text-rose-500 gap-2">
                        <AlertCircle size={24} />
                        <span className="text-xs font-medium">{fetchError}</span>
                        <button
                            onClick={loadHistory}
                            className="mt-2 text-xs px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xs font-bold"
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                ) : historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-(--dh-text-muted) gap-2 opacity-60">
                        <Clock size={28} />
                        <span className="text-xs font-medium">ไม่พบประวัติการทำรายการสำหรับบิลนี้</span>
                    </div>
                ) : (
                    <div className="relative pl-6 sm:pl-8 before:absolute before:top-2 before:bottom-2 before:left-[11px] sm:before:left-[15px] before:w-[2px] before:bg-(--dh-border)">
                        {historyItems.map((item, index) => (
                            <div key={item.id || index} className="relative mb-4 last:mb-1 group">
                                {/* Timeline Dot */}
                                <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-(--dh-bg-surface) border border-(--dh-border) flex items-center justify-center shadow-2xs z-10 group-hover:border-blue-500 transition-colors">
                                    {getEventIcon(item.type)}
                                </div>

                                {/* Event Card */}
                                <div className="bg-(--dh-bg-surface) border border-(--dh-border) rounded-xs p-2.5 sm:p-3 shadow-2xs hover:border-(--dh-accent)/40 transition-colors">
                                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-bold text-(--dh-text-main)">
                                                {item.title}
                                            </span>
                                            {item.badge && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-2xs bg-(--dh-bg-base) text-(--dh-text-muted) border border-(--dh-border) uppercase">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 text-[10px] text-(--dh-text-muted) font-mono">
                                            <Calendar size={10} />
                                            <span>{formatThaiDate(item.timestamp)}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-(--dh-text-muted) leading-relaxed">
                                        {item.details}
                                    </p>

                                    {item.actor && (
                                        <div className="mt-2 pt-1.5 border-t border-(--dh-border) flex items-center justify-between text-[10px] text-(--dh-text-muted)">
                                            <div className="flex items-center gap-1">
                                                <User size={10} className="text-blue-500" />
                                                <span>ผู้ดำเนินการ: <strong className="text-(--dh-text-main)">{item.actor}</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
