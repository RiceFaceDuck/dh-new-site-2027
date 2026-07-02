import React from 'react';
import { ScanBarcode, Eraser, Lock, Star, CheckCircle, Search } from 'lucide-react';

export default function SearchArea({ 
    searchRef, searchQuery, setSearchQuery, showDropdown, setShowDropdown, 
    handleSearchKeyDown, clearCart, activeTab, searchResults, addItemToCart, isProcessing, isCacheLoading 
}) {
    return (
        <div className="search-bar-area p-3 bg-[#2a305a] shrink-0 flex items-center gap-3 relative z-20 shadow-sm border-b border-[#1f2445]" ref={searchRef}>
            {isProcessing && (
                <div className="absolute inset-0 z-20 bg-[#2a305a]/60 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-sm shadow-sm">
                        <Lock size={14} className="text-gray-400" /> ล็อคหน้าจอ...
                    </span>
                </div>
            )}

            <div className="relative flex-1 group">
                {isCacheLoading ? (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        <span className="text-gray-400 text-xs">กำลังโหลดข้อมูลสินค้า...</span>
                    </div>
                ) : (
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D51C39] transition-colors" size={18} strokeWidth={2}/>
                )}
                
                <input 
                    type="text" 
                    placeholder={isCacheLoading ? "" : "ยิง Barcode หรือค้นหาสินค้า (F3)"} 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)} 
                    onClick={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                    onKeyDown={handleSearchKeyDown} 
                    disabled={isProcessing || isCacheLoading}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-md border-2 border-transparent text-sm text-[#2A305A] focus:outline-none transition-all font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.1)] placeholder-gray-400
                        ${isCacheLoading ? 'bg-gray-100 animate-pulse' : 'bg-white focus:border-[#D51C39]/30 focus:ring-4 focus:ring-[#D51C39]/10'}
                    `}
                />
                
                {showDropdown && searchResults.length > 0 && !isProcessing && !isCacheLoading && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-lg z-[100] max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                        <div className="bg-slate-50 text-slate-500 text-[10px] font-bold px-4 py-2 flex justify-between border-b border-gray-200 sticky top-0 z-10 uppercase tracking-wider">
                            <span>ผลการค้นหา ({searchResults.length})</span>
                            <span>ESC ปิด</span>
                        </div>
                        {searchResults.map((p, idx) => {
                            const isExact = p.matchType === 'exact';
                            const isBestSeller = p.matchType === 'best-seller';
                            const isSimilar = p.matchType === 'similar';
                            
                            return (
                                <div key={`${p.sku}-${idx}`} onMouseDown={(e) => e.preventDefault()} onClick={() => addItemToCart(p)} 
                                    className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-0 transition-all 
                                    ${p.stockQuantity <= 0 ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-blue-50/50'}`}>
                                    <div className={p.stockQuantity <= 0 ? 'opacity-60' : ''}>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={`font-bold text-sm ${isExact ? 'text-blue-700' : 'text-gray-800'}`}>{p.name}</p>
                                            {isExact && <span className="flex items-center gap-1 text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm"><CheckCircle size={10}/> ตรงเป๊ะ</span>}
                                            {isSimilar && <span className="flex items-center gap-1 text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm"><Search size={10}/> ใกล้เคียง</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-gray-500 font-medium font-mono">{p.sku}</p>
                                            {p.stats?.sold > 0 && <span className="text-[10px] text-gray-400 font-medium">ขายแล้ว {p.stats.sold}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-sm ${p.stockQuantity <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>฿{(activeTab.priceMode === 'wholesale' ? (p.Price||p.retailPrice||0) : (p.retailPrice||p.Price||0)).toLocaleString()}</p>
                                        <div className="flex flex-col items-end gap-1 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${p.stockQuantity <= 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {p.stockQuantity <= 0 ? 'สินค้าหมด' : `คงเหลือ: ${p.stockQuantity}`}
                                            </span>
                                            {p.isActive === false && (
                                                <div className="group/tooltip relative flex items-center">
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1 cursor-help">
                                                        เลิกจำหน่าย
                                                    </span>
                                                    <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none text-center">
                                                        สินค้านี้ถูกตั้งค่าเป็น "ไม่ใช้งาน" (Inactive) หากต้องการขายกรุณาตรวจสอบว่ามีสินค้าทดแทนหรือไม่
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <button onClick={clearCart} disabled={activeTab.items.length === 0 || isProcessing} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all shadow-sm
                    ${activeTab.items.length > 0 
                        ? 'text-white bg-[#D51C39] hover:bg-[#A3152B] active:scale-95' 
                        : 'text-[#D51C39]/60 bg-[#D51C39]/10 border border-[#D51C39]/20 opacity-70 cursor-not-allowed'}`}>
                <Eraser size={16}/> ล้างบิล
            </button>
        </div>
    );
}
