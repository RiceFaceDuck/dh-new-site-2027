
const noteColorStyles = {
    slate: { text: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
    red: { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    black: { text: '#000000', bg: '#f3f4f6', border: '#d1d5db' },
    amber: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    blue: { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    fuchsia: { text: '#c026d3', bg: '#fdf4ff', border: '#f0abfc' },
    emerald: { text: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    rose: { text: '#e11d48', bg: '#fff1f2', border: '#fecdd3' }
};

export default function ReceiptItems({ items, startIndex = 0 }) {
    return (
        <table className="w-full mb-2 border-collapse">
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
                            <tr key={idx} className="border-b border-gray-100 border-dashed" style={{ height: '35px' }}>
                                <td className="py-1 text-center text-gray-300 font-bold">{itemIndex}</td>
                                <td className="py-1 pl-1 text-gray-300 font-medium">-</td>
                                <td className="py-1 text-center text-gray-300">-</td>
                                <td className="py-1 text-right pr-1 text-gray-300">-</td>
                            </tr>
                        );
                    }
                    const isFreebie = item.isFreebie;
                    return (
                    <tr key={idx} className={`border-b border-gray-200 border-dashed ${isFreebie ? 'text-gray-600' : ''}`}>
                        <td className="py-1.5 text-center text-gray-400 font-bold">{isFreebie ? <span className="text-[10px]">🎁</span> : itemIndex}</td>
                        <td className="py-1.5 pl-1">
                            <p className={`font-black text-[11px] leading-tight ${isFreebie ? 'italic' : ''}`}>
                                {((item.name || item.itemName || '').length > 80)
                                    ? (item.name || item.itemName || '').substring(0, 80) + '...'
                                    : (item.name || item.itemName || '')}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-mono text-gray-400 uppercase">{item.sku}</span>
                                {item.note && (
                                    <div className="flex flex-wrap gap-1 items-center">
                                        <span className="text-[8px] font-bold px-1 rounded-sm border leading-none" 
                                                style={{ color: (noteColorStyles[item.noteColor] || noteColorStyles.slate).text, backgroundColor: (noteColorStyles[item.noteColor] || noteColorStyles.slate).bg }}>
                                            {item.note}
                                        </span>
                                        {item.conditions?.map((cond, i) => (
                                            <span key={i} className="text-[8px] font-bold px-1 rounded-sm border leading-none bg-gray-100 text-gray-500 border-gray-200">
                                                {cond}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="py-1.5 text-center font-black text-[11px]">{item.qty}</td>
                        <td className="py-1.5 text-right font-black pr-1 text-[11px]">{isFreebie ? '0.00' : ((item.price || 0) * item.qty).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                    </tr>
                    );
                }) : <tr><td colSpan="4" className="py-4 text-center text-gray-400">ไม่มีข้อมูลสินค้า</td></tr>}
            </tbody>
        </table>
    );
}
