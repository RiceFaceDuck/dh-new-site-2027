import React from 'react';
import { Search as SearchIcon, X, RefreshCw, UserPlus, ChevronRight } from 'lucide-react';

export default function CustomerSearchInput({
    localSearchText,
    handleSearchInput,
    showCustDropdown,
    setShowCustDropdown,
    isSearchFocused,
    setIsSearchFocused,
    isSearchHighlight,
    isProcessing,
    activeTab,
    handleSelectCustomer,
    setLocalSearchText,
    setCustomerSearchText,
    updateActiveTab,
    setShowWalkInPhoneInput,
    filteredCustomers,
    custSearchRef
}) {
    return (
        <div className="relative mb-2.5 group" ref={custSearchRef}>
            <SearchIcon 
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors z-20 
                ${isSearchHighlight && !isSearchFocused ? 'text-purple-600' : 'text-gray-400 group-focus-within:text-blue-500'}`} 
                size={isSearchHighlight && !isSearchFocused ? 14 : 16}
            />
            <input 
                type="text" placeholder="พิมพ์ชื่อลูกค้า, เบอร์โทร หรืออีเมล..."
                value={localSearchText}
                onChange={handleSearchInput}
                onClick={() => { setShowCustDropdown(true); setIsSearchFocused(true); }}
                onFocus={() => { setShowCustDropdown(true); setIsSearchFocused(true); }}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                disabled={isProcessing}
                className={`w-full transition-all duration-300 outline-none relative z-10 font-bold
                    ${isSearchHighlight && !isSearchFocused 
                        ? 'pl-8 pr-14 py-1.5 text-[11px] bg-white border-2 border-blue-500 shadow-sm text-gray-900 placeholder-blue-300 rounded-md' 
                        : 'pl-9 pr-16 py-1.5 text-[11px] border border-gray-300 bg-gray-50 hover:bg-white rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder-gray-400 text-gray-800 shadow-sm'
                    }`}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-20">
                {(activeTab.customer || activeTab.walkInName || localSearchText) && (
                    <button onClick={() => {
                        if(!isProcessing) {
                            handleSelectCustomer('');
                            setLocalSearchText('');
                            setCustomerSearchText('');
                            updateActiveTab({ walkInName: '', walkInPhone: '', hidePhone: false });
                            setShowWalkInPhoneInput(false);
                        }
                    }} disabled={isProcessing} className="p-1 rounded-md transition-all text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <X size={12}/>
                    </button>
                )}
                <button onClick={() => {
                    sessionStorage.removeItem('dh_cache_customers');
                    alert('ล้างแคชลูกค้าสำเร็จ!\nกรุณากด F5 หรือรีเฟรช 1 ครั้งเพื่อโหลดรายชื่อใหม่');
                }} className="p-1 rounded-md transition-all text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                    <RefreshCw size={12}/>
                </button>
            </div>
            
            {showCustDropdown && !isProcessing && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl z-50 max-h-60 overflow-y-auto rounded-lg custom-scrollbar">
                    {filteredCustomers.length === 0 ? (
                        <div 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => { 
                                updateActiveTab({ walkInName: localSearchText, customer: null, walletUsed: 0, hidePhone: false, walkInPhone: '' }); 
                                setCustomerSearchText(''); 
                                setShowWalkInPhoneInput(false);
                                setShowCustDropdown(false); 
                            }} 
                            className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-200 text-blue-600 font-bold flex items-center gap-2 transition-colors group"
                        >
                            <div className="p-1.5 bg-blue-100 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><UserPlus size={14}/></div> 
                            <div className="flex flex-col">
                                <span className="text-gray-800 text-[10px]">ตกลงใช้ชื่อ Walk-in</span>
                                <span className="text-blue-600 text-xs truncate">"{localSearchText}"</span>
                            </div>
                            <ChevronRight size={16} className="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform"/>
                        </div>
                    ) : (
                        <>
                            <div className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-500 tracking-widest border-b border-gray-200 uppercase">รายชื่อลูกค้าในระบบ</div>
                            {filteredCustomers.map(c => {
                                // แก้ไขบั๊กการดึงข้อมูลชื่อและเบอร์โทร ให้ตรวจสอบฟิลด์อื่นเผื่อไว้
                                const displayName = c.accountName || c.displayName || c.firstName || '-';
                                const displayPhone = c.phone || c.phoneNumber || '';
                                return (
                                <div key={c.uid || c.id} onClick={() => { handleSelectCustomer(c.uid || c.id); setShowCustDropdown(false); }} className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-xs text-[var(--dh-text-main)] truncate max-w-[180px]">{displayName}</p>
                                        {c.email && <p className="text-[9px] text-gray-400 truncate max-w-[180px]">{c.email}</p>}
                                    </div>
                                    {displayPhone && <p className="text-[10px] font-mono text-[var(--dh-text-muted)] shrink-0">{displayPhone}</p>}
                                </div>
                                )
                            })}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
