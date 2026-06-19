import React, { useRef, useEffect } from 'react';
import { Trash2, X, Gift } from 'lucide-react';

const noteColorMap = {
    slate: { badge: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    red: { badge: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
    black: { badge: 'bg-gray-100 text-gray-900 border-gray-300', dot: 'bg-gray-900' },
    amber: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-[#ffbb00]' },
    blue: { badge: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-600' }
};

export default function CartTableRow({
    item, index, isFreebie, isProcessing,
    isActive, setActionBoxItem, updateItemAction, removeItem, actionBoxItem
}) {
    const actionBoxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isActive) return;
            if (actionBoxRef.current && actionBoxRef.current.contains(event.target)) return;
            if (event.target.closest('.product-row')) return;
            if (event.target.closest('.search-bar-area')) return;
            setActionBoxItem(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActive, setActionBoxItem]);

    const isOutOfStock = !isFreebie && item.stock < item.qty;
    
    // Zebra striping + Freebie styling
    let rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
    if (isFreebie) rowBg = 'bg-emerald-50/50 hover:bg-emerald-50';
    else if (isActive) rowBg = 'bg-[#ffbb00]/10 hover:bg-[#ffbb00]/5';
    else if (isOutOfStock) rowBg = 'bg-red-50/50 hover:bg-red-50/80';
    else rowBg = `${rowBg} hover:bg-[#ffbb00]/5`;

    return (
        <React.Fragment>
            <tr onClick={() => { if (!isProcessing && !isFreebie) setActionBoxItem(isActive ? null : item.sku); }} 
                className={`product-row group border-b border-gray-100 transition-colors ${isProcessing ? 'cursor-not-allowed' : (isFreebie ? 'cursor-default' : 'cursor-pointer')} ${rowBg}`}>
                
                <td className="py-2 px-3 text-center text-slate-400 text-xs font-mono">
                    {isFreebie ? <Gift size={14} className="text-emerald-500 mx-auto" /> : index + 1}
                </td>
                
                <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate max-w-[250px] lg:max-w-[350px] ${isActive ? 'text-amber-700' : (isFreebie ? 'text-emerald-700' : 'text-slate-800')}`} title={item.name}>
                            {item.name}
                        </p>
                        {isFreebie && <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 text-[9px] font-black tracking-wide border border-emerald-200">แถมฟรี</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] font-mono text-slate-500">{item.sku}</p>
                        {item.note && !isActive && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium tracking-wide border ${noteColorMap[item.noteColor || 'slate']?.badge || noteColorMap['slate'].badge}`}>
                                {item.note}
                            </span>
                        )}
                    </div>
                </td>
                
                <td className="py-2 px-3 text-center">
                    <span className={`font-bold text-sm ${isFreebie ? 'text-emerald-700' : 'text-slate-800'}`}>{item.qty}</span>
                    {isOutOfStock && <span className="block text-[9px] text-red-500 font-black mt-0.5 bg-red-100 rounded-sm py-0.5 px-1 mx-auto max-w-[50px]">SOLD OUT</span>}
                </td>
                
                <td className="py-2 px-3 text-right text-sm font-medium">
                    {isFreebie ? (
                        <span className="line-through text-slate-400 text-xs">{(Number(item.price)||0).toLocaleString()}</span>
                    ) : (
                        <span className="text-slate-600">{(Number(item.price) || 0).toLocaleString()}</span>
                    )}
                </td>
                
                <td className="py-2 px-3 text-right text-sm font-bold">
                    {isFreebie ? (
                        <span className="text-emerald-600">0</span>
                    ) : (
                        <span className="text-red-500">{item.discount > 0 ? `-${(Number(item.discount) || 0).toLocaleString()}` : '0'}</span>
                    )}
                </td>
                
                <td className="py-2 px-3 text-right font-black text-sm">
                    {isFreebie ? (
                        <span className="text-emerald-600">0</span>
                    ) : (
                        <span className="text-slate-800">{(((Number(item.price) || 0) - (Number(item.discount) || 0)) * item.qty).toLocaleString()}</span>
                    )}
                </td>
                
                <td className="py-2 px-2 text-center">
                    {!isFreebie && (
                        <button onClick={(e) => { e.stopPropagation(); if (!isProcessing) removeItem(item.sku); }} disabled={isProcessing} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16}/></button>
                    )}
                </td>
            </tr>
            
            {!isFreebie && isActive && (
                <tr className="bg-[#ffbb00]/[0.15] border-b border-[#ffbb00]/30 shadow-inner">
                    <td colSpan="7" className="p-3 pl-12 relative" ref={actionBoxRef}>
                        <button onClick={() => setActionBoxItem(null)} className="absolute top-2 right-2 p-1 text-amber-700 hover:text-amber-900 bg-white/50 hover:bg-white rounded-md transition-colors"><X size={14}/></button>
                        <div className="flex flex-wrap gap-4 items-start animate-in slide-in-from-top-1 fade-in duration-200">
                            <div className="w-16">
                                <label className="text-[10px] text-amber-900 font-bold mb-1 block uppercase tracking-wider">จำนวน</label>
                                <input type="number" min="1" value={item.qty} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'qty', parseInt(e.target.value) || 1)} disabled={isProcessing} className="w-full h-8 px-2 rounded-md border-amber-200/60 bg-white/90 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-[#ffbb00]/40 focus:border-[#ffbb00] transition-all shadow-sm" />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] text-amber-900 font-bold mb-1 block uppercase tracking-wider">ราคา/หน่วย</label>
                                <input type="number" min="0" value={item.price} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'price', parseFloat(e.target.value) || 0)} disabled={isProcessing} className="w-full h-8 px-2 rounded-md border-amber-200/60 bg-white/90 text-right font-bold text-sm outline-none focus:ring-2 focus:ring-[#ffbb00]/40 focus:border-[#ffbb00] transition-all shadow-sm" />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] text-red-600 font-bold mb-1 block uppercase tracking-wider">ลด/หน่วย</label>
                                <input type="number" min="0" value={item.discount} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'discount', parseFloat(e.target.value) || 0)} disabled={isProcessing} className="w-full h-8 px-2 rounded-md border-red-200 text-red-600 bg-red-50/90 text-right font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all shadow-sm" />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">หมายเหตุ (Note)</label>
                                    <div className="flex items-center gap-1.5 mr-6">
                                        {['slate', 'red', 'black', 'amber', 'blue'].map(c => (
                                            <button key={c} onClick={() => updateItemAction(item.sku, 'noteColor', c)} className={`w-3.5 h-3.5 rounded-full ${noteColorMap[c].dot} border border-black/10 ${item.noteColor === c ? 'ring-2 ring-offset-1 ring-[#ffbb00] scale-110 shadow-sm' : 'opacity-50 hover:opacity-100 hover:scale-110'} transition-all`} title={c}/>
                                        ))}
                                    </div>
                                </div>
                                <input type="text" maxLength={30} placeholder="รายละเอียดเพิ่มเติม..." value={item.note || ''} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'note', e.target.value)} disabled={isProcessing} className="w-full h-8 px-3 rounded-md border-amber-200/60 bg-white/90 text-sm font-medium outline-none focus:ring-2 focus:ring-[#ffbb00]/40 focus:border-[#ffbb00] transition-all shadow-sm" />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}
