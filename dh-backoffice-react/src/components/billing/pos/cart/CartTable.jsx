import React from 'react';
import { Box } from 'lucide-react';
import CartTableRow from './CartTableRow';

export default function CartTable({
    activeTab,
    actionBoxItem,
    setActionBoxItem,
    updateItemAction,
    removeItem,
    eligibleFreebies,
    isProcessing
}) {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <table className="w-full border-collapse">
                    <thead className="bg-[#2A305A] border-b border-[#2A305A] text-white text-[11px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="py-2.5 px-3 text-center w-12 opacity-80">#</th>
                            <th className="py-2.5 px-3 text-left">รายการสินค้า</th>
                            <th className="py-2.5 px-3 text-center w-20">จำนวน</th>
                            <th className="py-2.5 px-3 text-right w-24">หน่วยละ</th>
                            <th className="py-2.5 px-3 text-right w-24">ส่วนลด</th>
                            <th className="py-2.5 px-3 text-right w-28">รวมเงิน</th>
                            <th className="py-2.5 px-3 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab.items.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-20 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                        <Box size={40} className="mb-3 opacity-20" strokeWidth={1.5} />
                                        <p className="text-sm font-bold tracking-wide">ตะกร้าว่างเปล่า</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {activeTab.items.map((item, index) => (
                                    <CartTableRow 
                                        key={`item-${item.sku}-${index}`}
                                        item={item}
                                        index={index}
                                        isFreebie={false}
                                        isProcessing={isProcessing}
                                        isActive={actionBoxItem === item.sku}
                                        actionBoxItem={actionBoxItem}
                                        setActionBoxItem={setActionBoxItem}
                                        updateItemAction={updateItemAction}
                                        removeItem={removeItem}
                                    />
                                ))}
                                {eligibleFreebies?.map((freebie, index) => {
                                    let conditionText = [];
                                    if (freebie.minSpend > 0) conditionText.push(`ยอด${freebie.minSpend}฿`);
                                    if (freebie.minQty > 0) conditionText.push(`ครบ${freebie.minQty}ชิ้น`);
                                    if (freebie.applicableSkus?.length > 0) conditionText.push(`เฉพาะรุ่น`);
                                    const reasonStr = conditionText.length > 0 ? ` (${conditionText.join(', ')})` : '';
                                    return (
                                        <CartTableRow 
                                            key={`freebie-${freebie.id}-${index}`}
                                            item={{ 
                                                ...freebie, 
                                                sku: freebie.itemName,
                                                name: `[แถมฟรี] ${freebie.productName || freebie.itemName}`, 
                                                qty: freebie.qty || 1, 
                                                price: 0, 
                                                discount: 0,
                                                note: `${freebie.title}${reasonStr}`,
                                                noteColor: 'rose'
                                            }}
                                            index={activeTab.items.length + index}
                                            isFreebie={true}
                                            isProcessing={isProcessing}
                                            isActive={false}
                                            actionBoxItem={actionBoxItem}
                                            setActionBoxItem={setActionBoxItem}
                                            updateItemAction={updateItemAction}
                                            removeItem={removeItem}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
