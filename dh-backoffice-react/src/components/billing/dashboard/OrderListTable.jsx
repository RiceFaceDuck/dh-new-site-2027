import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import OrderTableRow from './OrderTableRow';

const ITEMS_PER_PAGE = 21;

export default function OrderListTable({ orders, loading, isSearching, limitAmount, setLimitAmount, setSelectedOrder }) {
    const [currentPage, setCurrentPage] = useState(1);

    // 🚀 Performance Optimization: Memoize Table Components to prevent full unmount on re-render
    const virtuosoComponents = React.useMemo(() => ({
        Table: ({ style, ...props }) => <table {...props} style={style} className="w-full text-left border-collapse" />,
        TableHead: React.forwardRef((props, ref) => <thead {...props} ref={ref} className="bg-(--dh-text-main) sticky top-0 z-20 shadow-md" />),
        TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} />),
        TableRow: (props) => {
            const order = props.item;
            if (!order) return <tr {...props} />;
            return (
                <tr 
                    {...props}
                    onClick={() => setSelectedOrder(order)} 
                    className={`group bg-(--dh-bg-base) even:bg-black/5 dark:even:bg-white/5 hover:bg-(--dh-bg-surface) border-b border-(--dh-border) transition-all duration-300 cursor-pointer ${props.className || ''}`}
                />
            );
        },
        EmptyPlaceholder: () => (
            <tbody>
                <tr>
                    <td colSpan="7" className="p-16 text-center text-(--dh-text-muted)">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-(--dh-bg-base) rounded-full flex items-center justify-center shadow-inner dh-inner-shadow">
                                <Search className="opacity-40" size={32}/>
                            </div>
                            <div className="text-center">
                                <span className="font-black text-lg block dh-text-glow">ไม่พบข้อมูลบิล</span>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        )
    }), [setSelectedOrder]);

    // Reset to page 1 when search or orders set changes
    useEffect(() => {
        setCurrentPage(1);
    }, [orders.length, isSearching]);

    const totalItems = orders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const validPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (validPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (orders.length >= limitAmount && typeof setLimitAmount === 'function') {
            setLimitAmount(prev => prev + 21);
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    return (
        <div className="flex flex-col flex-1 w-full h-full min-h-[300px] relative z-0 bg-(--dh-bg-surface) overflow-hidden">
            <div className="flex-1 w-full h-full relative overflow-hidden">
                {((loading || isSearching) && orders.length === 0) ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-(--dh-text-main) sticky top-0 z-20 shadow-md">
                            <tr className="border-b-4 border-(--dh-accent) text-(--dh-bg-base)">
                                <th className="py-3 px-6 text-[12px] font-black uppercase tracking-wider w-[18%]">เลขที่บิล / วันที่</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider text-center w-[12%]">สถานะ</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[20%]">ชื่อร้าน / ลูกค้า</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[13%]">เจ้าหน้าที่</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[12%]">การจัดส่ง</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[13%]">บริการหลังการขาย</th>
                                <th className="py-3 px-6 text-[12px] font-black uppercase tracking-wider text-right w-[12%]">ยอดสุทธิ (NET)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={`skeleton-${idx}`} className="border-b border-(--dh-border)/60 animate-pulse">
                                    <td className="py-4 px-6"><div className="h-4 bg-(--dh-border) rounded-sm w-3/4 mb-2"></div><div className="h-3 bg-(--dh-border)/50 rounded-sm w-1/2"></div></td>
                                    <td className="py-4 px-4 text-center"><div className="h-6 bg-(--dh-border) rounded-full w-20 mx-auto"></div></td>
                                    <td className="py-4 px-4"><div className="h-4 bg-(--dh-border) rounded-sm w-full mb-2"></div><div className="h-3 bg-(--dh-border)/50 rounded-sm w-1/3"></div></td>
                                    <td className="py-4 px-4"><div className="h-4 bg-(--dh-border) rounded-sm w-2/3"></div></td>
                                    <td className="py-4 px-4"><div className="h-4 bg-(--dh-border) rounded-sm w-2/3"></div></td>
                                    <td className="py-4 px-4"><div className="h-4 bg-(--dh-border) rounded-sm w-2/3"></div></td>
                                    <td className="py-4 px-6 text-right"><div className="h-5 bg-(--dh-border) rounded-sm w-1/2 ml-auto"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <TableVirtuoso
                        data={paginatedOrders}
                        className="custom-scrollbar w-full h-full flex-1"
                        components={virtuosoComponents}
                        fixedHeaderContent={() => (
                            <tr className="border-b-4 border-(--dh-accent) text-(--dh-bg-base)">
                                <th className="py-3 px-6 text-[12px] font-black uppercase tracking-wider w-[18%]">เลขที่บิล / วันที่</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider text-center w-[12%]">สถานะ</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[20%]">ชื่อร้าน / ลูกค้า</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[13%]">เจ้าหน้าที่</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[12%]">การจัดส่ง</th>
                                <th className="py-3 px-4 text-[12px] font-black uppercase tracking-wider w-[13%]">บริการหลังการขาย</th>
                                <th className="py-3 px-6 text-[12px] font-black uppercase tracking-wider text-right w-[12%]">ยอดสุทธิ (NET)</th>
                            </tr>
                        )}
                        itemContent={(index, order) => (
                            <OrderTableRow 
                                order={order} 
                                setSelectedOrder={setSelectedOrder} 
                            />
                        )}
                    />
                )}
            </div>

            {/* 📄 Pagination Bar (แถบเปลี่ยนหน้า 21 รายการ/หน้า) */}
            {!loading && totalItems > 0 && (
                <div className="px-6 py-2.5 bg-(--dh-bg-base) border-t border-(--dh-border) flex flex-wrap items-center justify-between gap-3 shrink-0 text-sm shadow-xs relative z-10">
                    <div className="text-xs font-semibold text-(--dh-text-muted)">
                        แสดง <span className="text-(--dh-accent) font-bold">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> จากทั้งหมด <span className="text-(--dh-text-main) font-bold">{totalItems.toLocaleString()}</span> รายการ
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handlePrevPage}
                            disabled={validPage <= 1}
                            className="px-3 py-1.5 bg-(--dh-bg-surface) border border-(--dh-border) hover:border-(--dh-accent) text-(--dh-text-main) hover:text-(--dh-accent) rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="หน้าก่อนหน้า"
                        >
                            <ChevronLeft size={14} />
                            <span>ย้อนกลับ</span>
                        </button>

                        <div className="px-3 py-1 bg-(--dh-bg-surface) border border-(--dh-border) rounded-md text-xs font-bold text-(--dh-text-main)">
                            หน้า <span className="text-(--dh-accent)">{validPage}</span> / {totalPages}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={validPage >= totalPages && orders.length < limitAmount}
                            className="px-3 py-1.5 bg-(--dh-bg-surface) border border-(--dh-border) hover:border-(--dh-accent) text-(--dh-text-main) hover:text-(--dh-accent) rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="หน้าถัดไป"
                        >
                            <span>ถัดไป</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
