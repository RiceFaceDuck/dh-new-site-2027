import React, { useState, useEffect } from 'react';
import ClaimActionForm from './ClaimActionForm';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';

const FreebieName = ({ item }) => {
    const [name, setName] = useState(item.name);
    
    useEffect(() => {
        if (item.isFreebie && item.sku) {
            inventoryQueryService.getProductBySku(item.sku)
                .then(product => {
                    if (product && product.name) {
                        setName(`[แถมฟรี] ${product.name}`);
                    }
                })
                .catch(err => console.error("Error fetching freebie name", err));
        }
    }, [item.sku, item.isFreebie]);

    return (
        <span className="font-bold text-[11px] text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)] truncate max-w-[150px] lg:max-w-xs" title={name}>
            {name}
        </span>
    );
};

export default function OrderSummaryItems({ selectedOrder, isClaimable }) {
    const [expandedRowIdx, setExpandedRowIdx] = useState(null);

    if (!selectedOrder?.items?.length) {
        return (
            <div className="flex-1 flex flex-col min-w-0 md:border-r border-[var(--dh-border)] bg-white">
                <div className="bg-[var(--dh-bg-base)] px-3 py-2 border-b border-[var(--dh-border)] flex justify-between items-center shrink-0">
                    <h3 className="font-black text-[13px] text-[var(--dh-text-main)]">รายการสินค้า</h3>
                    <span className="text-[10px] font-bold text-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] px-2 py-0.5 rounded border border-[var(--dh-border)]">0 รายการ</span>
                </div>
                <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--dh-text-muted)] font-bold">
                    ไม่มีรายการสินค้า
                </div>
            </div>
        );
    }

    const toggleRow = (idx) => {
        if (!isClaimable) return;
        setExpandedRowIdx(expandedRowIdx === idx ? null : idx);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 md:border-r border-[var(--dh-border)] bg-white">
            <div className="bg-[var(--dh-bg-base)] px-3 py-2 border-b border-[var(--dh-border)] flex justify-between items-center shrink-0">
                <h3 className="font-black text-[13px] text-[var(--dh-text-main)]">รายการสินค้า</h3>
                <span className="text-[10px] font-bold text-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] px-2 py-0.5 rounded border border-[var(--dh-border)]">
                    {selectedOrder.items.length} รายการ
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[var(--dh-bg-surface)] sticky top-0 border-b border-[var(--dh-border)] z-10">
                        <tr>
                            <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase w-16">SKU</th>
                            <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase">สินค้า</th>
                            <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase text-right w-16">ราคา</th>
                            <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase text-center w-12">จำนวน</th>
                            <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase text-right w-20">รวม</th>
                            {isClaimable && <th className="px-3 py-1.5 w-8"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--dh-border)]/50">
                        {selectedOrder.items.map((item, idx) => {
                            const qty = item.qty || item.quantity || 1;
                            const price = item.price || 0;
                            const isFreebie = price === 0 || item.isFreebie;
                            const pastActions = selectedOrder.refundsAndClaims?.filter(rc => rc.sku === item.sku) || [];
                            const usedQty = pastActions.reduce((sum, action) => sum + (Number(action.qty) || 1), 0);
                            const availableQty = qty - usedQty;
                            
                            const isExpanded = expandedRowIdx === idx;
                            const rowClickable = isClaimable && !isFreebie && availableQty > 0;

                            return (
                                <React.Fragment key={idx}>
                                    <tr 
                                        onClick={() => rowClickable && toggleRow(idx)}
                                        className={`group transition-colors ${rowClickable ? 'cursor-pointer hover:bg-orange-50/50' : 'hover:bg-[var(--dh-bg-base)]'} ${isExpanded ? 'bg-orange-50/50' : ''}`}
                                    >
                                        <td className="px-3 py-1.5 align-middle">
                                            <span className="font-mono text-[9px] text-[var(--dh-text-muted)]">{item.sku || '-'}</span>
                                        </td>
                                        <td className="px-3 py-1.5 align-middle">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {isFreebie ? (
                                                    <FreebieName item={item} />
                                                ) : (
                                                    <span className="font-bold text-[11px] text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)] truncate max-w-[150px] lg:max-w-xs" title={item.name}>
                                                        {item.name}
                                                    </span>
                                                )}
                                                {isFreebie && (
                                                    <span className="bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded text-[8px] font-black border border-emerald-500/20 shrink-0">ของแถม</span>
                                                )}
                                                {/* Tags for previous actions */}
                                                {(() => {
                                                    const pastActions = selectedOrder.refundsAndClaims?.filter(rc => rc.sku === item.sku) || [];
                                                    return pastActions.map((action, aIdx) => {
                                                        const isClaim = action.type === 'Claim';
                                                        const isReturn = action.type === 'Return';
                                                        const isExchange = action.type === 'Exchange';
                                                        return (
                                                            <span key={aIdx} className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${
                                                                isClaim ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                                                                isReturn ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                                                isExchange ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                                'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                            }`}>
                                                                เคย{isClaim ? 'เคลม' : isReturn ? 'คืน' : isExchange ? 'เปลี่ยน' : 'ทำรายการ'} x{action.qty || 1}
                                                            </span>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5 align-middle text-right text-[10px] text-[var(--dh-text-muted)]">
                                            {isFreebie ? '-' : `฿${price.toLocaleString()}`}
                                        </td>
                                        <td className="px-3 py-1.5 align-middle text-center text-[10px] font-bold text-[var(--dh-text-main)]">
                                            {qty}
                                        </td>
                                        <td className="px-3 py-1.5 align-middle text-right">
                                            <span className={`font-black text-[11px] ${isFreebie ? 'text-emerald-500' : 'text-[var(--dh-text-main)]'}`}>
                                                {isFreebie ? 'ฟรี' : `฿${(price * qty).toLocaleString()}`}
                                            </span>
                                        </td>
                                        {isClaimable && (
                                            <td className="px-3 py-1.5 align-middle text-center">
                                                {rowClickable && (
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-orange-500 text-white shadow-sm' : 'text-[var(--dh-text-muted)] group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                                                        {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                    {/* Expanded Form Row */}
                                    {isExpanded && rowClickable && (
                                        <tr className="bg-orange-50/50">
                                            <td colSpan={isClaimable ? 6 : 5} className="p-0">
                                                <ClaimActionForm 
                                                    item={item} 
                                                    selectedOrder={selectedOrder} 
                                                    onCancel={() => setExpandedRowIdx(null)} 
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
