const noteColorStyles = {
    slate: { text: '#0f172a' },
    red: { text: '#dc2626' },
    black: { text: '#000000' },
    amber: { text: '#d97706' },
    blue: { text: '#2563eb' },
    fuchsia: { text: '#c026d3' },
    emerald: { text: '#059669' },
    rose: { text: '#e11d48' }
};

export default function ReceiptItems({ items, startIndex = 0, format = 'short', vatType = 'exempt', vatRate = 7 }) {
    const isVatIncluded = vatType === 'included' || vatType === 'รวม VAT';
    const vatMultiplier = 1 + (Number(vatRate) || 7) / 100;
    const round2 = (val) => Math.round(Number(val || 0) * 100) / 100;

    return (
        <table className="w-full mb-2 border-collapse table-fixed">
            <thead>
                <tr className="border-b border-black">
                    <th className="py-1 text-center w-6 font-black">#</th>
                    <th className="py-1 text-left pl-1 font-black">รายการสินค้า</th>
                    <th className="py-1 text-center w-10 font-black">Qty</th>
                    <th className="py-1 text-right w-20 font-black pr-1">จำนวนเงิน</th>
                </tr>
            </thead>
            <tbody>
                {items.length > 0 ? items.map((item, idx) => {
                    const itemIndex = startIndex + idx + 1;
                    if (item.isEmptyRow) {
                        return (
                            <tr key={idx} className="border-b border-gray-100 border-dashed" style={{ height: '42px' }}>
                                <td className="pt-1.5 pb-1 text-center text-gray-300 font-bold align-top">{itemIndex}</td>
                                <td className="pt-1.5 pb-1 pl-1 text-gray-300 font-medium align-top">-</td>
                                <td className="pt-1.5 pb-1 text-center text-gray-300 align-top">-</td>
                                <td className="pt-1.5 pb-1 text-right pr-1 text-gray-300 align-top">-</td>
                            </tr>
                        );
                    }
                    const isFreebie = item.isFreebie;
                    const qty = Number(item.qty ?? item.quantity ?? item.count ?? 1);
                    const price = Number(item.price ?? item.priceAtPurchase ?? item.pricePerUnit ?? item.unitPrice ?? 0);
                    const discount = Number(item.discount ?? item.discountAmount ?? item.itemDiscount ?? 0);
                    let lineTotal = isFreebie ? 0 : Number(item.total ?? item.lineTotal ?? (price - discount) * qty);
                    if (isNaN(lineTotal)) lineTotal = 0;

                    let originalTotal = isFreebie ? 0 : Number(item.originalTotal ?? item.totalBeforeDiscount ?? price * qty);
                    if (discount > 0) {
                        const calculatedDiscounted = (price - discount) * qty;
                        originalTotal = Math.abs(calculatedDiscounted - lineTotal) <= 0.01 ? price * qty : (price + discount) * qty;
                    } else if (item.originalPrice && Number(item.originalPrice) > price) {
                        originalTotal = Number(item.originalPrice) * qty;
                    }

                    let priceDisplay = lineTotal;
                    let originalPriceDisplay = originalTotal;
                    if (isVatIncluded && !isFreebie) {
                        priceDisplay = round2(lineTotal / vatMultiplier);
                        originalPriceDisplay = round2(originalTotal / vatMultiplier);
                    }
                    const hasDiscount = !isFreebie && (originalPriceDisplay - priceDisplay > 0.01);
                    const itemName = item.name || item.itemName || '';

                    return (
                        <tr key={idx} className={`border-b border-gray-200 border-dashed ${isFreebie ? 'text-gray-600' : ''}`} style={{ height: '42px' }}>
                            <td className="pt-1.5 pb-1 text-center text-gray-400 font-bold align-top">
                                {isFreebie ? <span className="text-[10px]">🎁</span> : itemIndex}
                            </td>
                            <td className="pt-1.5 pb-1 pl-1 max-w-0 overflow-hidden align-top">
                                <div className="flex items-center gap-2 min-w-0">
                                    {item.sku ? (
                                        <span className="w-[68px] text-[10.5px] font-mono font-black text-slate-900 uppercase shrink-0 tracking-tight leading-none inline-block">
                                            {item.sku}
                                        </span>
                                    ) : (
                                        <span className="w-[68px] shrink-0 inline-block" />
                                    )}
                                    <p className={`font-black text-[11px] leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis ${isFreebie ? 'italic' : ''}`} title={itemName}>
                                        {itemName}
                                    </p>
                                </div>
                                {(item.note || item.conditions?.length > 0) && (
                                    <div className="flex flex-wrap gap-2 items-center mt-0.5 pl-[76px] truncate">
                                        {item.note && (
                                            <span 
                                                className="text-[11px] font-bold leading-tight shrink-0 truncate"
                                                style={{ color: (noteColorStyles[item.noteColor] || noteColorStyles.rose).text }}
                                            >
                                                {item.note}
                                            </span>
                                        )}
                                        {item.conditions?.map((cond, cIdx) => (
                                            <span key={cIdx} className="text-[11px] font-semibold text-gray-700 leading-tight shrink-0">
                                                ({cond})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </td>
                            <td className="pt-1.5 pb-1 text-center font-black text-[11px] align-top">{qty}</td>
                            <td className="pt-1.5 pb-1 text-right pr-1 align-top">
                                {isFreebie ? (
                                    <span className="font-black text-[11px] text-gray-500 block leading-tight">0.00</span>
                                ) : hasDiscount ? (
                                    <div className="flex flex-col items-end justify-start">
                                        <span className="font-black text-[11px] text-slate-900 leading-tight">
                                            {priceDisplay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="line-through text-rose-500 font-semibold text-[10px] leading-tight">
                                            {originalPriceDisplay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="font-black text-[11px] text-slate-900 block leading-tight">
                                        {priceDisplay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </td>
                        </tr>
                    );
                }) : (
                    <tr><td colSpan="4" className="py-4 text-center text-gray-400">ไม่มีข้อมูลสินค้า</td></tr>
                )}
            </tbody>
        </table>
    );
}
