import React, { useState, useEffect } from 'react';
import { User, Search as SearchIcon, X, RefreshCw, UserPlus, ChevronRight, Info, Phone, ShieldCheck, Save, Loader2, Sparkles, Wallet, Wand2 } from 'lucide-react';
import { userService } from '../../../../firebase/userService';

export default function CustomerSection({
    activeTab,
    updateActiveTab,
    custSearchRef,
    customerSearchText,
    setCustomerSearchText,
    showCustDropdown,
    setShowCustDropdown,
    filteredCustomers,
    handleSelectCustomer,
    netTotal,
    isProcessing,
    labelClass
}) {
    const [localSearchText, setLocalSearchText] = useState('');
    const [showWalkInPhoneInput, setShowWalkInPhoneInput] = useState(false);
    const [isEditingCustomerPhone, setIsEditingCustomerPhone] = useState(false);
    const [tempCustomerPhone, setTempCustomerPhone] = useState('');
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        if (activeTab.customer) {
            setLocalSearchText(activeTab.customer.accountName || activeTab.customer.firstName || '');
        } else if (activeTab.walkInName) {
            setLocalSearchText(activeTab.walkInName);
        } else {
            setLocalSearchText('');
        }
        setCustomerSearchText(''); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab.id, activeTab.customer?.uid, activeTab.walkInName]); 

    useEffect(() => { 
        setShowWalkInPhoneInput(false); 
        setIsEditingCustomerPhone(false);
        setTempCustomerPhone('');
    }, [activeTab.id, activeTab.customer?.uid]);

    const formatPhoneNumber = (val) => {
        if (!val || val === '(+' || val === '(+6' || val === '(+66' || val === '(+66)') return '';
        let digits = val.replace(/\D/g, ''); 
        if (digits.startsWith('0')) digits = '66' + digits.substring(1);
        else if (digits.length > 0 && !digits.startsWith('66')) digits = '66' + digits;

        let formatted = '';
        if (digits.startsWith('66')) {
            formatted = '(+66)'; let rest = digits.substring(2);
            if (rest.startsWith('2')) {
                if (rest.length > 0) formatted += rest.substring(0, 1);
                if (rest.length > 1) formatted += '-' + rest.substring(1, 4);
                if (rest.length > 4) formatted += '-' + rest.substring(4, 8);
            } else {
                if (rest.length > 0) formatted += rest.substring(0, 2);
                if (rest.length > 2) formatted += '-' + rest.substring(2, 5);
                if (rest.length > 5) formatted += '-' + rest.substring(5, 9);
            }
        } else formatted = digits;
        return formatted;
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        updateActiveTab({ walkInPhone: formatted });
    };

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setLocalSearchText(val);
        setCustomerSearchText(val); 
        setShowCustDropdown(true);

        if (activeTab.customer) {
            updateActiveTab({ customer: null, walletUsed: 0 });
        }
    };

    const handleSaveNewCustomer = async () => {
        if (!activeTab.walkInName) return;
        setIsSavingCustomer(true);
        try {
            const newCustData = {
                accountName: activeTab.walkInName,
                firstName: activeTab.walkInName,
                phone: activeTab.walkInPhone || '',
                customerType: 'ทั่วไป',
                source: 'POS Quick Add'
            };
            await userService.createManualCustomer(newCustData);
            alert('✅ บันทึกเป็นลูกค้าระบบสำเร็จ! ในบิลถัดไปสามารถค้นหาชื่อนี้ได้เลย');
        } catch (error) {
            console.error("🔥 Error saving customer:", error);
            alert(`❌ ไม่สามารถบันทึกลูกค้าได้: ${error.message}`);
        } finally {
            setIsSavingCustomer(false);
        }
    };

    const isSearchHighlight = !activeTab.customer && !activeTab.walkInName;

    return (
        <div className="p-4 border-b border-[var(--dh-border)] last:border-0 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
                <label className={`${labelClass} text-blue-600`}>
                    <User size={14}/> ข้อมูลลูกค้า 
                </label>
                {!activeTab.customer && !activeTab.walkInName && (
                    <button onClick={() => {
                        const randomName = `Walk-in #${Math.floor(1000 + Math.random() * 9000)}`;
                        updateActiveTab({ walkInName: randomName, hidePhone: false, walkInPhone: '' });
                        setLocalSearchText(randomName);
                        setShowWalkInPhoneInput(false);
                    }} className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors font-bold uppercase bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-1 rounded shadow-sm group" title="เสกชื่อลูกค้า Walk-in อัตโนมัติ">
                        <Wand2 size={10} className="group-hover:rotate-12 transition-transform"/> Auto-Fill
                    </button>
                )}
            </div>

            <div className="relative mb-3 group" ref={custSearchRef}>
                <SearchIcon 
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors z-20 
                    ${isSearchHighlight && !isSearchFocused ? 'text-purple-600' : 'text-gray-400 group-focus-within:text-blue-500'}`} 
                    size={isSearchHighlight && !isSearchFocused ? 14 : 16}
                />
                <input 
                    type="text" placeholder="พิมพ์ชื่อลูกค้า, เบอร์โทร หรือชื่อ Walk-in..."
                    value={localSearchText}
                    onChange={handleSearchInput}
                    onFocus={() => { setShowCustDropdown(true); setIsSearchFocused(true); }}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                    disabled={isProcessing}
                    className={`w-full transition-all duration-300 outline-none relative z-10 font-bold
                        ${isSearchHighlight && !isSearchFocused 
                            ? 'pl-8 pr-14 py-2 text-[12px] bg-white border-2 border-blue-500 shadow-sm text-gray-900 placeholder-blue-300 rounded-md' 
                            : 'pl-9 pr-16 py-2.5 text-[13px] border border-gray-300 bg-gray-50 hover:bg-white rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder-gray-400 text-gray-800 shadow-sm'
                        }`}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-20">
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
                            <X size={14}/>
                        </button>
                    )}
                    <button onClick={() => {
                        sessionStorage.removeItem('dh_cache_customers');
                        alert('ล้างแคชลูกค้าสำเร็จ!\nกรุณากด F5 หรือรีเฟรช 1 ครั้งเพื่อโหลดรายชื่อใหม่');
                    }} className="p-1 rounded-md transition-all text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                        <RefreshCw size={14}/>
                    </button>
                </div>
                
                {showCustDropdown && !isProcessing && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl z-50 max-h-60 overflow-y-auto rounded-lg custom-scrollbar">
                        {filteredCustomers.length === 0 ? (
                            <div 
                                onMouseDown={(e) => e.preventDefault()} 
                                onClick={() => { 
                                    updateActiveTab({ walkInName: localSearchText, customer: null, walletUsed: 0, hidePhone: false, walkInPhone: '' }); 
                                    setCustomerSearchText(''); 
                                    setShowWalkInPhoneInput(false);
                                    setShowCustDropdown(false); 
                                }} 
                                className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-gray-200 text-blue-600 font-bold flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><UserPlus size={18}/></div> 
                                <div className="flex flex-col">
                                    <span className="text-gray-800 text-xs">ตกลงใช้ชื่อ Walk-in</span>
                                    <span className="text-blue-600 text-sm truncate">"{localSearchText}"</span>
                                </div>
                                <ChevronRight size={20} className="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform"/>
                            </div>
                        ) : (
                            <>
                                <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-black text-gray-500 tracking-widest border-b border-gray-200 uppercase">รายชื่อลูกค้าในระบบ</div>
                                {filteredCustomers.map(c => (
                                    <div key={c.uid} onClick={() => { handleSelectCustomer(c.uid); setShowCustDropdown(false); }} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors">
                                        <p className="font-bold text-sm text-[var(--dh-text-main)]">{c.accountName || c.firstName}</p>
                                        {c.phone && <p className="text-[11px] font-mono text-[var(--dh-text-muted)] mt-0.5">{c.phone}</p>}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {!activeTab.customer && activeTab.walkInName && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 mb-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-1.5 bg-blue-100 rounded-md shrink-0"><User size={16} className="text-blue-600"/></div>
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-0.5">ลูกค้า Walk-in</p>
                            <p className="text-sm font-black text-blue-900 mt-0.5">{activeTab.walkInName}</p>
                        </div>
                    </div>

                    {!showWalkInPhoneInput && !activeTab.hidePhone && !activeTab.walkInPhone ? (
                        <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={14} className="text-blue-600 shrink-0" />
                                <p className="text-[11px] font-bold text-blue-800">กรุณาระบุเบอร์โทรศัพท์ หรือเลือกสงวนสิทธิ์</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowWalkInPhoneInput(true)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5">
                                    <Phone size={14}/> ใส่เบอร์โทร
                                </button>
                                <button onClick={() => updateActiveTab({ hidePhone: true })} className="flex-1 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95">
                                    สงวนการให้เบอร์
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in">
                            {activeTab.hidePhone ? (
                                <div className="flex items-center justify-between bg-white/80 p-3 rounded-lg border border-gray-200">
                                    <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5"><ShieldCheck size={14}/> ลูกค้าสงวนสิทธิ์เบอร์โทร</span>
                                    <button onClick={() => { updateActiveTab({ hidePhone: false }); setShowWalkInPhoneInput(true); }} className="text-[10px] text-blue-600 font-bold underline hover:text-blue-800 transition-colors">เปลี่ยนใจใส่เบอร์</button>
                                </div>
                            ) : (
                                <div className="flex gap-2 relative bg-white/80 p-2 rounded-lg border border-blue-100">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"/>
                                    <input 
                                        type="text" placeholder="(+66)XX-XXX-XXXX" 
                                        value={activeTab.walkInPhone || ''} 
                                        onChange={handlePhoneChange} autoFocus
                                        className="w-full pl-10 pr-3 py-2 text-[13px] border-2 border-blue-300 bg-white rounded-md font-mono font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-blue-900 placeholder-blue-300"
                                    />
                                </div>
                            )}

                            {(activeTab.hidePhone || (activeTab.walkInPhone && activeTab.walkInPhone.length > 8)) && (
                                <div className="pt-3 border-t border-blue-200/50 flex items-center justify-between animate-in fade-in">
                                    <span className="text-[10px] text-blue-700 font-medium">บันทึกเป็นลูกค้าประจำหรือไม่?</span>
                                    <button 
                                        onClick={handleSaveNewCustomer} disabled={isSavingCustomer}
                                        className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[10px] font-black rounded-md shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                                    >
                                        {isSavingCustomer ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                                        บันทึกลูกค้า
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab.customer && (
                <div className="bg-white border border-blue-200 rounded-lg p-4 relative overflow-hidden shadow-sm animate-in fade-in transition-all mt-2">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                        {activeTab.customer.rank && <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{activeTab.customer.rank}</span>}
                        {activeTab.customer.isPartner && <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><ShieldCheck size={10}/> Partner</span>}
                    </div>
                    <div className="space-y-1 mb-4">
                        <p className="font-bold text-sm text-[var(--dh-text-main)]">{activeTab.customer.accountName}</p>
                        
                        {(!activeTab.customer.phone || activeTab.customer.phone.trim() === '' || activeTab.customer.phone === '-') && !activeTab.hidePhone ? (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2 items-start mb-3">
                                    <Info size={16} className="text-blue-600 mt-0.5 shrink-0"/>
                                    <p className="text-[11px] font-bold text-blue-800 leading-tight">
                                        ลูกค้ารายนี้ยังไม่มีเบอร์โทรศัพท์ในระบบ กรุณาระบุเบอร์ หรือเลือกสงวนสิทธิ์
                                    </p>
                                </div>
                                {!isEditingCustomerPhone ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingCustomerPhone(true)} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-1.5">
                                            <Phone size={14}/> ใส่เบอร์โทร
                                        </button>
                                        <button onClick={() => updateActiveTab({ hidePhone: true })} className="flex-1 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 text-xs font-bold rounded shadow-sm transition-colors">
                                            สงวนการให้เบอร์
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 animate-in zoom-in-95">
                                        <input
                                            type="text"
                                            placeholder="(+66)XX-XXX-XXXX"
                                            value={tempCustomerPhone}
                                            onChange={(e) => setTempCustomerPhone(formatPhoneNumber(e.target.value))}
                                            autoFocus
                                            className="flex-1 px-3 py-1.5 text-xs border-2 border-blue-400 rounded font-mono font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        <button onClick={() => {
                                            if(tempCustomerPhone.length > 8) {
                                                updateActiveTab({ customer: { ...activeTab.customer, phone: tempCustomerPhone } });
                                                setIsEditingCustomerPhone(false);
                                            }
                                        }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1">
                                            <Save size={14}/> บันทึก
                                        </button>
                                        <button onClick={() => setIsEditingCustomerPhone(false)} className="p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded border border-gray-200 transition-colors">
                                            <X size={16}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : activeTab.hidePhone ? (
                            <p className="text-[11px] text-gray-500 font-bold flex items-center gap-1.5 mt-1"><ShieldCheck size={12}/> สงวนสิทธิ์เบอร์โทร <button onClick={() => updateActiveTab({ hidePhone: false })} className="ml-1 text-[10px] text-blue-500 underline">แก้ไข</button></p>
                        ) : (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-mono mt-0.5"><Phone size={12}/> {activeTab.customer.phone || '-'}</p>
                        )}
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-gray-500 font-bold text-xs flex items-center gap-1.5"><Wallet size={12}/> Wallet (เงินค้าง)</span>
                            <span className="font-black text-blue-700 text-[13px]">฿{Number(activeTab.customer.creditPoints || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-200">
                            <span className="text-gray-500 font-bold text-xs flex items-center gap-1.5"><Sparkles size={12}/> Credit Points</span>
                            <span className="font-black text-amber-600 text-xs">{Number(activeTab.customer.points || 0).toLocaleString()} Pts</span>
                        </div>
                        {Number(activeTab.customer.creditPoints || 0) > 0 && (
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-600">หักจ่ายบิลนี้</span>
                                <div className="relative w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[11px]">฿</span>
                                    <input type="number" min="0" value={activeTab.walletUsed || ''} disabled={isProcessing}
                                        onChange={(e) => {
                                            const maxWallet = Number(activeTab.customer.creditPoints || 0);
                                            const val = Math.min(Number(e.target.value), maxWallet, netTotal);
                                            updateActiveTab({ walletUsed: Math.max(0, val) });
                                        }} 
                                        className="w-full bg-transparent border-none py-0.5 pl-5 pr-1 text-right font-black text-blue-700 outline-none text-[11px]" placeholder="0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
