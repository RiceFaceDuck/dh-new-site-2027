import React, { useRef, useEffect } from 'react';
import { ScanBarcode, Eraser, Box, FileEdit, Trash2, Gift, X, Lock } from 'lucide-react';

export default function CartPanel({ 
    searchRef, searchQuery, setSearchQuery, showDropdown, setShowDropdown, 
    handleSearchKeyDown, clearCart, activeTab, searchResults, addItemToCart, 
    actionBoxItem, setActionBoxItem, updateItemAction, removeItem, eligibleFreebies,
    noteColorMap, isProcessing 
}) {
    const actionBoxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!actionBoxItem) return;
            if (actionBoxRef.current && actionBoxRef.current.contains(event.target)) return;
            if (event.target.closest('.product-row')) return;
            if (event.target.closest('.search-bar-area')) return;
            setActionBoxItem(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [actionBoxItem, setActionBoxItem]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white font-sans">
            
            {/* 🔍 Search Bar - Minimalist Flat */}
            <div className="search-bar-area p-3 border-b border-gray-200 flex items-center gap-3 shrink-0 relative bg-white" ref={searchRef}>
                {isProcessing && <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center"><span className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-sm border border-gray-200"><Lock size={14} className="text-gray-400" /> ล็อคหน้าจอ...</span></div>}

                <div className="relative flex-1 group">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={2}/>
                    <input 
                        type="text" placeholder="ยิง Barcode หรือค้นหาสินค้า (F3)" value={searchQuery} 
                        onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} onKeyDown={handleSearchKeyDown} disabled={isProcessing}
                        className="w-full pl-10 pr-4 py-2 rounded-sm border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-all bg-white"
                    />
                    
                    {showDropdown && searchResults.length > 0 && !isProcessing && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 shadow-lg rounded-sm z-[100] max-h-72 overflow-y-auto">
                            <div className="bg-gray-50 text-gray-500 text-[10px] font-semibold px-3 py-1.5 flex justify-between border-b border-gray-200 sticky top-0"><span>ผลการค้นหา</span><span>ESC</span></div>
                            {searchResults.map(p => (
                                <div key={p.sku} onMouseDown={(e) => e.preventDefault()} onClick={() => addItemToCart(p)} 
                                    className={`px-3 py-2.5 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-0 transition-colors ${p.stockQuantity <= 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                                    <div className={p.stockQuantity <= 0 ? 'opacity-50' : ''}>
                                        <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{p.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${p.stockQuantity <= 0 ? 'text-red-500' : 'text-gray-800'}`}>฿{(activeTab.priceMode === 'wholesale' ? (p.Price||p.retailPrice||0) : (p.retailPrice||p.Price||0)).toLocaleString()}</p>
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-1 inline-block ${p.stockQuantity <= 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{p.stockQuantity <= 0 ? 'หมด' : `คงเหลือ: ${p.stockQuantity}`}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={clearCart} disabled={activeTab.items.length === 0 || isProcessing} className="flex items-center gap-1.5 px-4 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm font-medium text-sm transition-colors disabled:opacity-40"><Eraser size={14}/> ล้างบิล</button>
            </div>

            {/* 📊 ตารางสินค้า (Flat & Clean) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase sticky top-0 z-10">
                        <tr>
                            <th className="py-2.5 px-3 text-center w-12">#</th>
                            <th className="py-2.5 px-3 text-left">รายการสินค้า</th>
                            <th className="py-2.5 px-3 text-center w-20">จำนวน</th>
                            <th className="py-2.5 px-3 text-right w-24">หน่วยละ</th>
                            <th className="py-2.5 px-3 text-right w-24">ส่วนลด</th>
                            <th className="py-2.5 px-3 text-right w-28 text-gray-700">รวมเงิน</th>
                            <th className="py-2.5 px-3 text-center w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab.items.length === 0 ? (
                            <tr><td colSpan="7" className="py-16 text-center text-gray-400">
                                <Box size={32} className="mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                                <p className="text-sm font-medium">ตะกร้าว่างเปล่า</p>
                            </td></tr>
                        ) : (
                            activeTab.items.map((item, index) => {
                                const isOutOfStock = item.stock < item.qty;
                                const isActive = actionBoxItem === item.sku;
                                
                                return (
                                <React.Fragment key={item.sku}>
                                    <tr onClick={() => { if (!isProcessing) setActionBoxItem(isActive ? null : item.sku); }} 
                                        className={`product-row group border-b border-gray-100 transition-colors ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'} ${isActive ? 'bg-gray-50' : isOutOfStock ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                        <td className="py-3 px-3 text-center text-gray-400 text-xs">{index + 1}</td>
                                        <td className="py-3 px-3">
                                            <p className={`text-sm font-semibold ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                            {item.note && !isActive && <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 border border-gray-200">Note: {item.note}</span>}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className="font-semibold text-sm text-gray-800">{item.qty}</span>
                                            {isOutOfStock && <span className="block text-[9px] text-red-500 font-bold mt-0.5">SOLD OUT</span>}
                                        </td>
                                        <td className="py-3 px-3 text-right text-gray-600 text-sm">{(Number(item.price) || 0).toLocaleString()}</td>
                                        <td className="py-3 px-3 text-right text-red-500 text-sm">{item.discount > 0 ? `-${(Number(item.discount) || 0).toLocaleString()}` : '0'}</td>
                                        <td className="py-3 px-3 text-right font-bold text-gray-800 text-sm">{(((Number(item.price) || 0) - (Number(item.discount) || 0)) * item.qty).toLocaleString()}</td>
                                        <td className="py-3 px-3 text-center">
                                            <button onClick={(e) => { e.stopPropagation(); if (!isProcessing) removeItem(item.sku); }} disabled={isProcessing} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                    
                                    {/* Action Drawer - Clean & Flat */}
                                    {isActive && (
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <td colSpan="7" className="p-3 pl-12 relative" ref={actionBoxRef}>
                                                <button onClick={() => setActionBoxItem(null)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 bg-white rounded-sm border border-gray-200"><X size={14}/></button>
                                                <div className="flex flex-wrap gap-4 items-start">
                                                    <div className="w-16">
                                                        <label className="text-[10px] text-gray-500 mb-1 block">จำนวน</label>
                                                        <input type="number" min="1" value={item.qty} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'qty', parseInt(e.target.value) || 1)} disabled={isProcessing} className="w-full h-8 px-2 rounded-sm border border-gray-300 text-center font-semibold text-sm outline-none focus:border-blue-500" />
                                                    </div>
                                                    <div className="w-24">
                                                        <label className="text-[10px] text-gray-500 mb-1 block">ราคา/หน่วย</label>
                                                        <input type="number" min="0" value={item.price} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'price', parseFloat(e.target.value) || 0)} disabled={isProcessing} className="w-full h-8 px-2 rounded-sm border border-gray-300 text-right font-semibold text-sm outline-none focus:border-blue-500" />
                                                    </div>
                                                    <div className="w-24">
                                                        <label className="text-[10px] text-red-400 mb-1 block">ลด/หน่วย</label>
                                                        <input type="number" min="0" value={item.discount} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'discount', parseFloat(e.target.value) || 0)} disabled={isProcessing} className="w-full h-8 px-2 rounded-sm border border-red-200 text-red-600 bg-red-50 text-right font-semibold text-sm outline-none focus:border-red-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <label className="text-[10px] text-gray-500 mb-1 block">หมายเหตุ (Note)</label>
                                                        <input type="text" maxLength={30} placeholder="รายละเอียดเพิ่มเติม..." value={item.note || ''} onFocus={e => e.target.select()} onChange={e => updateItemAction(item.sku, 'note', e.target.value)} disabled={isProcessing} className="w-full h-8 px-3 rounded-sm border border-gray-300 text-sm outline-none focus:border-blue-500" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {eligibleFreebies.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200 p-2 shrink-0 flex items-center gap-2">
                    <Gift size={16} className="text-gray-400 ml-1" />
                    <div className="flex-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-600 mr-2">ของแถม:</span>
                        {eligibleFreebies.map(f => (
                            <span key={f.id} className="text-[11px] font-medium bg-white text-gray-700 px-2 py-0.5 rounded-sm border border-gray-200 shadow-sm">{f.itemName} x{f.qty}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}