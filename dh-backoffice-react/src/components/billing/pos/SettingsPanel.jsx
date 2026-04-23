import React, { useEffect, useState } from 'react';
import { Settings, User, Search as SearchIcon, X, Truck, Check, Calculator, Megaphone, Receipt, Package, FileText, Tag, Wallet, Database, MapPin, Phone, ShieldCheck, SlidersHorizontal, Printer, Volume2, Lock, Wand2, Sparkles, RefreshCw, UserPlus, AlertCircle, Save, Info, Loader2, ChevronRight } from 'lucide-react';
import { userService } from '../../../firebase/userService';

export default function SettingsPanel({
    activeTab, updateActiveTab, handlePriceModeChange, custSearchRef, customerSearchText, setCustomerSearchText, 
    showCustDropdown, setShowCustDropdown, filteredCustomers, handleSelectCustomer, netTotal, setIsPromoModalOpen, handleRemovePromotion,
    isProcessing
}) {
    // ⚡ Local State
    const [localSearchText, setLocalSearchText] = useState('');
    const [localShipping, setLocalShipping] = useState(activeTab.shippingFee || '');
    const [localDiscount, setLocalDiscount] = useState(activeTab.overallDiscount || '');
    const [localOtherName, setLocalOtherName] = useState(activeTab.otherFeeName || '');
    const [localOtherAmount, setLocalOtherAmount] = useState(activeTab.otherFeeAmount || '');
    const [localBillNote, setLocalBillNote] = useState(activeTab.billNote || '');

    // ✨ State สำหรับ Flow ของ Smart Phone Input & Search Highlight
    const [showWalkInPhoneInput, setShowWalkInPhoneInput] = useState(false);
    const [isEditingCustomerPhone, setIsEditingCustomerPhone] = useState(false);
    const [tempCustomerPhone, setTempCustomerPhone] = useState('');
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false); // ควบคุมการลดความสะดุดตาเมื่อกำลัง Search

    // 🐛 ซิงค์ข้อมูลช่องค้นหา
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

    // รีเซ็ตฟอร์มเบอร์โทร เมื่อเปลี่ยนบิล
    useEffect(() => { 
        setShowWalkInPhoneInput(false); 
        setIsEditingCustomerPhone(false);
        setTempCustomerPhone('');
    }, [activeTab.id, activeTab.customer?.uid]);

    useEffect(() => { setLocalShipping(activeTab.shippingFee || ''); }, [activeTab.shippingFee, activeTab.id]);
    useEffect(() => { setLocalDiscount(activeTab.overallDiscount || ''); }, [activeTab.overallDiscount, activeTab.id]);
    useEffect(() => { setLocalOtherName(activeTab.otherFeeName || ''); }, [activeTab.otherFeeName, activeTab.id]);
    useEffect(() => { setLocalOtherAmount(activeTab.otherFeeAmount || ''); }, [activeTab.otherFeeAmount, activeTab.id]);
    useEffect(() => { setLocalBillNote(activeTab.billNote || ''); }, [activeTab.billNote, activeTab.id]);

    const defaultTerminalConfig = { 
        autoPrint: true, sound: true, requireWalkinPhone: true, 
        defaultFulfillment: 'Delivery', defaultPriceMode: 'wholesale', defaultCourier: 'KEX', defaultVatType: 'exempt',
        quickShippingFees: [40, 60, 120] 
    };

    const [terminalConfig, setTerminalConfig] = useState(() => {
        try { return { ...defaultTerminalConfig, ...(JSON.parse(localStorage.getItem('dh_pos_config_v6')) || {}) }; } catch { return defaultTerminalConfig; }
    });
    const [isTerminalConfigOpen, setIsTerminalConfigOpen] = useState(false);

    const updateTerminalConfig = (key, val) => {
        const newConf = { ...terminalConfig, [key]: val };
        setTerminalConfig(newConf);
        localStorage.setItem('dh_pos_config_v6', JSON.stringify(newConf));
    };

    const isStorePickup = activeTab.fulfillmentType === 'StorePickup' || activeTab.fulfillmentType === 'ZeerBranch';

    useEffect(() => {
        function handleClickOutside(event) { if (custSearchRef.current && !custSearchRef.current.contains(event.target)) setShowCustDropdown(false); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [custSearchRef, setShowCustDropdown]);

    useEffect(() => {
        if (isProcessing) { setShowCustDropdown(false); setIsTerminalConfigOpen(false); }
    }, [isProcessing, setShowCustDropdown]);

    // บังคับ Default
    useEffect(() => {
        if (!activeTab) return;
        let needsUpdate = false;
        let updates = {};
        
        if (activeTab.fulfillmentType === undefined) { updates.fulfillmentType = terminalConfig.defaultFulfillment; needsUpdate = true; }
        if (activeTab.priceMode === undefined) { updates.priceMode = terminalConfig.defaultPriceMode; needsUpdate = true; }
        if (activeTab.vatType === undefined) { updates.vatType = terminalConfig.defaultVatType; needsUpdate = true; }
        if (activeTab.autoPromoEnabled === undefined) { updates.autoPromoEnabled = true; needsUpdate = true; }
        
        const currentFulfillment = updates.fulfillmentType || activeTab.fulfillmentType;
        if (currentFulfillment === 'Delivery' && !activeTab.courier) { 
            updates.courier = terminalConfig.defaultCourier; needsUpdate = true; 
        }

        if (needsUpdate) updateActiveTab(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab?.id]); 

    // Helper เบอร์โทร
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

    // พิมพ์ค้นหาลูกค้า
    const handleSearchInput = (e) => {
        const val = e.target.value;
        setLocalSearchText(val);
        setCustomerSearchText(val); 
        setShowCustDropdown(true);

        if (activeTab.customer) {
            updateActiveTab({ customer: null, walletUsed: 0 });
        }
    };

    // ✨ ฟังก์ชันบันทึกเป็นลูกค้าประจำด่วน
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

    // 🎨 UI Classes 
    const inputClass = "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400";
    const labelClass = "text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5";
    const sectionClass = "p-4 border-b border-gray-200 last:border-0 transition-colors duration-300";
    
    const ToggleGroup = ({ options, activeValue, onChange, disabled }) => (
        <div className={`flex bg-gray-100 p-1 rounded-md border border-gray-200 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-sm uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        activeValue === opt.value
                            ? 'bg-gray-300 text-gray-800 shadow-[inset_0_3px_6px_rgba(0,0,0,0.15)] border-t border-gray-400/50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    // ✨ สถานะสำหรับพิจารณาว่าต้อง Highlight ช่องค้นหาหรือไม่
    const isSearchHighlight = !activeTab.customer && !activeTab.walkInName;

    return (
        <div className="w-full lg:w-[32%] h-full flex flex-col bg-white rounded-xl shadow-sm border border-[var(--dh-border)] overflow-hidden z-10 font-sans relative">
            {isProcessing && <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] cursor-not-allowed transition-all duration-300"></div>}

            {/* HEADER */}
            <div className="px-4 py-3 border-b border-gray-200 shrink-0 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-gray-500"><Settings size={14} /></div>
                    <div>
                        <h2 className="text-sm font-bold text-[var(--dh-text-main)] leading-none">ตั้งค่าบิล (SETTINGS)</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Control Panel</p>
                    </div>
                </div>
                <button onClick={() => !isProcessing && setIsTerminalConfigOpen(!isTerminalConfigOpen)} disabled={isProcessing}
                    className={`p-2 rounded-md transition-all border group 
                        ${isTerminalConfigOpen ? 'bg-gray-100 text-gray-800 border-gray-300 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:text-[var(--dh-text-main)] hover:bg-gray-50'}`}>
                    <SlidersHorizontal size={14} className="group-hover:rotate-12 transition-transform"/>
                </button>

                {/* Dropdown ตั้งค่า POS */}
                {isTerminalConfigOpen && (
                    <div className="absolute top-14 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-[var(--dh-text-main)] text-sm flex items-center gap-1.5 uppercase"><SlidersHorizontal size={14}/> Terminal Settings</h3>
                            </div>
                            <button onClick={() => setIsTerminalConfigOpen(false)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors"><X size={14}/></button>
                        </div>
                        <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-gray-600 border-b border-gray-100 pb-1 mb-2">ฟังก์ชันเครื่อง POS</h4>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-gray-100">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Printer size={14} className="text-gray-400 group-hover:text-[var(--dh-accent)]"/> พิมพ์ใบเสร็จอัตโนมัติ</span>
                                    <input type="checkbox" checked={terminalConfig.autoPrint} onChange={(e) => updateTerminalConfig('autoPrint', e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-gray-300"/>
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-gray-100">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Volume2 size={14} className="text-gray-400 group-hover:text-[var(--dh-accent)]"/> เสียงแจ้งเตือน</span>
                                    <input type="checkbox" checked={terminalConfig.sound} onChange={(e) => updateTerminalConfig('sound', e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-gray-300"/>
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-gray-100">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Phone size={14} className="text-gray-400 group-hover:text-[var(--dh-accent)]"/> บังคับกรอกเบอร์ (หน้าร้าน)</span>
                                    <input type="checkbox" checked={terminalConfig.requireWalkinPhone} onChange={(e) => updateTerminalConfig('requireWalkinPhone', e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-gray-300"/>
                                </label>
                            </div>
                            <div className="space-y-3 pt-3">
                                <h4 className="text-xs font-bold text-gray-600 border-b border-gray-100 pb-1 mb-2">ค่าเริ่มต้นเปิดบิล (Defaults)</h4>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">ราคาเริ่มต้น</label>
                                    <select value={terminalConfig.defaultPriceMode} onChange={(e) => updateTerminalConfig('defaultPriceMode', e.target.value)} className={inputClass}>
                                        <option value="wholesale">B2B (ราคาส่ง)</option><option value="retail">ราคาปลีก</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">ภาษีเริ่มต้น</label>
                                    <select value={terminalConfig.defaultVatType} onChange={(e) => updateTerminalConfig('defaultVatType', e.target.value)} className={inputClass}>
                                        <option value="exempt">ยกเว้น (EXEMPT)</option><option value="included">รวมในราคา (INCLUDED)</option><option value="excluded">บวกเพิ่ม (EXCLUDED)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">การจัดส่งเริ่มต้น</label>
                                    <select value={terminalConfig.defaultFulfillment} onChange={(e) => updateTerminalConfig('defaultFulfillment', e.target.value)} className={inputClass}>
                                        <option value="Delivery">ส่งพัสดุ</option><option value="StorePickup">หน้าร้าน</option><option value="ZeerBranch">เซียร์</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">ขนส่งเริ่มต้น</label>
                                        <select value={terminalConfig.defaultCourier} onChange={(e) => updateTerminalConfig('defaultCourier', e.target.value)} className={inputClass}>
                                            <option value="KEX">KEX</option><option value="Flash">Flash</option><option value="J&T">J&T</option><option value="SPX">SPX</option><option value="ThaiPost">ไปรษณีย์ไทย</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">คีย์ลัดค่าส่ง (คั่นด้วย ,)</label>
                                        <input type="text" value={terminalConfig.quickShippingFees?.join(',')} onChange={(e) => updateTerminalConfig('quickShippingFees', e.target.value.split(',').map(n => Number(n.trim())||0))} className={inputClass} placeholder="40,60,120" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT AREA */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isProcessing ? 'opacity-70' : ''}`}>

                {/* 1. CUSTOMER IDENTITY & SEARCH */}
                <div className={sectionClass}>
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

                    {/* ✨ อัปเกรด: ช่องค้นหาเล็กกระชับ, สีรุ้งพาสเทล, ขอบสีเข้ม, ไม่มีออร่าฟุ้ง */}
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
                                    // 🌟 โหมดไฮไลท์: เล็กกระชับ, สีรุ้งพาสเทล, ขอบสีม่วงเข้ม (รับกับพาสเทล) และเงาธรรมดา
                                    ? 'pl-8 pr-14 py-1.5 text-[11px] bg-gradient-to-r from-rose-100 via-purple-100 to-indigo-100 border-[2px] border-purple-500/80 shadow-sm text-purple-900 placeholder-purple-700/60 rounded-md' 
                                    // 📄 โหมดใช้งานปกติ (Focus/เลือกลูกค้าแล้ว): คลีน สบายตา ขนาดปกติ
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
                                }} disabled={isProcessing} className={`p-1 rounded-md transition-all ${isSearchHighlight && !isSearchFocused ? 'text-purple-600 hover:text-white hover:bg-purple-500/50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                                    <X size={14}/>
                                </button>
                            )}
                            <button onClick={() => {
                                sessionStorage.removeItem('dh_cache_customers');
                                alert('ล้างแคชลูกค้าสำเร็จ!\\nกรุณากด F5 หรือรีเฟรช 1 ครั้งเพื่อโหลดรายชื่อใหม่');
                            }} className={`p-1 rounded-md transition-all ${isSearchHighlight && !isSearchFocused ? 'text-purple-600 hover:text-white hover:bg-purple-500/50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                                <RefreshCw size={isSearchHighlight && !isSearchFocused ? 12 : 14}/>
                            </button>
                        </div>
                        
                        {/* Dropdown ผลลัพธ์การค้นหา & Quick Add */}
                        {showCustDropdown && !isProcessing && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl z-50 max-h-60 overflow-y-auto rounded-lg custom-scrollbar">
                                {filteredCustomers.length === 0 ? (
                                    /* ✨ ปุ่ม Quick Add - ตกลงใช้ชื่อที่พิมพ์ */
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

                    {/* ✨ ระบบ Flow ลูกค้า Walk-in / เพิ่มเบอร์โทร (ปรากฏเมื่อยืนยันชื่อแล้ว) */}
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

                            {/* State 1: ให้เลือก ปุ่มใส่เบอร์ หรือ สงวนสิทธิ์ */}
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
                                /* State 2: เปลี่ยนเป็นช่องกรอกเบอร์โทร หรือ สงวนสิทธิ์ไปแล้ว */
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

                                    {/* ปุ่มบันทึกเป็นลูกค้าประจำ */}
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

                    {/* ✨ ระบบ Flow ของลูกค้าเก่าในระบบ (ที่มีและไม่มีเบอร์) */}
                    {activeTab.customer && (
                        <div className="bg-white border border-blue-200 rounded-lg p-4 relative overflow-hidden shadow-sm animate-in fade-in transition-all mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex gap-1.5 flex-wrap mb-2">
                                {activeTab.customer.rank && <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{activeTab.customer.rank}</span>}
                                {activeTab.customer.isPartner && <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><ShieldCheck size={10}/> Partner</span>}
                            </div>
                            <div className="space-y-1 mb-4">
                                <p className="font-bold text-sm text-[var(--dh-text-main)]">{activeTab.customer.accountName}</p>
                                
                                {/* 🚨 แจ้งเตือนระดับปกติ ถ้าลูกค้าเก่าไม่มีเบอร์โทร */}
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
                                    <span className="font-black text-blue-700 text-[13px]">฿{Number(activeTab.customer.partnerCredit || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-200">
                                    <span className="text-gray-500 font-bold text-xs flex items-center gap-1.5"><Sparkles size={12}/> Credit Points</span>
                                    <span className="font-black text-amber-600 text-xs">{Number(activeTab.customer.points || 0).toLocaleString()} Pts</span>
                                </div>
                                {Number(activeTab.customer.partnerCredit || 0) > 0 && (
                                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                        <span className="text-[10px] font-bold text-gray-600">หักจ่ายบิลนี้</span>
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[11px]">฿</span>
                                            <input type="number" min="0" value={activeTab.walletUsed || ''} disabled={isProcessing}
                                                onChange={(e) => {
                                                    const maxWallet = Number(activeTab.customer.partnerCredit || 0);
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

                {/* 2. FORMAT & VAT */}
                <div className={`${sectionClass} grid grid-cols-2 gap-4`}>
                    <div>
                        <label className={labelClass}><Tag size={12}/> ระดับราคา</label>
                        <ToggleGroup 
                            options={[{ value: 'wholesale', label: 'B2B' }, { value: 'retail', label: 'ปลีก' }]}
                            activeValue={activeTab.priceMode} onChange={handlePriceModeChange} disabled={isProcessing}
                        />
                    </div>
                    <div>
                        <label className={labelClass}><Receipt size={12}/> รูปแบบบิล</label>
                        <ToggleGroup 
                            options={[{ value: 'short', label: 'ย่อ' }, { value: 'full', label: 'เต็ม' }]}
                            activeValue={activeTab.receiptFormat} onChange={(val) => updateActiveTab({ receiptFormat: val })} disabled={isProcessing}
                        />
                    </div>
                </div>

                {/* 3. LOGISTICS & VAT */}
                <div className={sectionClass}>
                    <div className="mb-5">
                        <label className={labelClass}><Calculator size={12}/> ภาษีมูลค่าเพิ่ม (VAT 7%)</label>
                        <ToggleGroup 
                            options={[{ value: 'exempt', label: 'EXEMPT' }, { value: 'included', label: 'INCLUDED' }, { value: 'excluded', label: 'EXCLUDED' }]}
                            activeValue={activeTab.vatType} onChange={(val) => updateActiveTab({ vatType: val })} disabled={isProcessing}
                        />
                    </div>

                    <div>
                        <label className={labelClass}><Truck size={14}/> การรับสินค้า</label>
                        <div className="mb-3">
                            <ToggleGroup 
                                options={[{ value: 'Delivery', label: 'พัสดุ' }, { value: 'StorePickup', label: 'หน้าร้าน' }, { value: 'ZeerBranch', label: 'เซียร์' }]}
                                activeValue={activeTab.fulfillmentType} onChange={(val) => updateActiveTab({ fulfillmentType: val })} disabled={isProcessing}
                            />
                        </div>

                        {activeTab.fulfillmentType === 'Delivery' && (
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">ขนส่ง</label>
                                    <select disabled={isProcessing} value={activeTab.courier || ''} onChange={(e) => updateActiveTab({ courier: e.target.value })} className={inputClass}>
                                        <option value="KEX">KEX</option><option value="Flash">Flash</option><option value="J&T">J&T</option><option value="SPX">SPX</option><option value="ThaiPost">ไปรษณีย์</option><option value="Other">อื่นๆ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-600 mb-1.5 block uppercase tracking-wide">ค่าส่ง (฿)</label>
                                    <input disabled={isProcessing} type="number" min="0" placeholder="0" value={localShipping} onChange={(e) => setLocalShipping(e.target.value)} onBlur={() => updateActiveTab({ shippingFee: parseFloat(localShipping) || 0 })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ shippingFee: parseFloat(localShipping) || 0 }); }} className={`${inputClass} text-right font-black text-blue-600`} />
                                    {/* ✨ คีย์ลัดค่าจัดส่ง 40, 60, 120 */}
                                    <div className="flex gap-1.5 mt-2 justify-end">
                                        <button onClick={() => { setLocalShipping(0); updateActiveTab({ shippingFee: 0 }); }} disabled={isProcessing} className="text-[10px] bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors shadow-sm active:scale-95">ส่งฟรี</button>
                                        {(terminalConfig.quickShippingFees || [40, 60, 120]).map(val => (
                                            <button key={val} onClick={() => { setLocalShipping(val); updateActiveTab({ shippingFee: val }); }} disabled={isProcessing} className="text-[10px] bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors shadow-sm active:scale-95">
                                                +{val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {activeTab.vatType !== 'exempt' && (
                                    <div className="col-span-2 flex justify-end pt-1.5 border-t border-gray-200">
                                        <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5 cursor-pointer hover:text-gray-700">
                                            <input disabled={isProcessing} type="checkbox" checked={activeTab.vatOnShipping} onChange={(e) => updateActiveTab({ vatOnShipping: e.target.checked })} className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 bg-white" /> คิด VAT รวมกับค่าส่ง
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. DISCOUNTS & OTHERS */}
                <div className={`${sectionClass} grid grid-cols-2 gap-4`}>
                    <div>
                        <label className={labelClass}><Tag size={12}/> ลดท้ายบิล (฿)</label>
                        <input disabled={isProcessing} type="number" min="0" placeholder="0" value={localDiscount} onChange={(e) => setLocalDiscount(e.target.value)} onBlur={() => updateActiveTab({ overallDiscount: parseFloat(localDiscount) || 0 })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ overallDiscount: parseFloat(localDiscount) || 0 }); }} className={`${inputClass} border-red-200 bg-red-50 text-right text-red-600 font-bold focus:border-red-400 focus:ring-red-500/20`} />
                        {/* ✨ คีย์ลัดส่วนลด ล้าง, 50, 100, 500 */}
                        <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
                            <button onClick={() => { setLocalDiscount(''); updateActiveTab({ overallDiscount: 0 }); }} disabled={isProcessing} className="text-[10px] bg-red-100 hover:bg-red-200 border border-red-200 text-red-600 px-2 py-0.5 rounded transition-colors active:scale-95">ล้าง</button>
                            {[50, 100, 500].map(val => (
                                <button key={val} onClick={() => { setLocalDiscount(val); updateActiveTab({ overallDiscount: val }); }} disabled={isProcessing} className="text-[10px] bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors active:scale-95">
                                    -{val}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}><FileText size={12}/> ยอดอื่นๆ (+/-)</label>
                        <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <input disabled={isProcessing} type="text" placeholder="ชื่อ..." value={localOtherName} onChange={(e) => setLocalOtherName(e.target.value)} onBlur={() => updateActiveTab({ otherFeeName: localOtherName })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ otherFeeName: localOtherName }); }} className="w-1/2 bg-transparent px-3 py-2 text-xs font-medium text-gray-800 outline-none border-r border-gray-200" />
                            <input disabled={isProcessing} type="number" placeholder="0" value={localOtherAmount} onChange={(e) => setLocalOtherAmount(e.target.value)} onBlur={() => updateActiveTab({ otherFeeAmount: parseFloat(localOtherAmount) || 0 })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ otherFeeAmount: parseFloat(localOtherAmount) || 0 }); }} className="w-1/2 bg-transparent px-3 py-2 text-xs text-right font-bold text-gray-800 outline-none" />
                        </div>
                    </div>
                </div>

                {/* 5. PROMOTIONS */}
                <div className={sectionClass}>
                    <div className="flex items-center justify-between mb-3">
                        <label className={`${labelClass} text-fuchsia-600`}><Megaphone size={14}/> โปรโมชัน</label>
                        <button disabled={isProcessing} onClick={() => setIsPromoModalOpen(true)} className="bg-white border border-fuchsia-300 hover:bg-fuchsia-50 text-fuchsia-600 text-xs font-bold px-3 py-1 rounded transition-colors">เลือกโปร</button>
                    </div>
                    
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white p-3 rounded border border-gray-200 cursor-pointer hover:border-fuchsia-300 transition-colors">
                        <input disabled={isProcessing} type="checkbox" checked={activeTab.autoPromoEnabled} onChange={(e) => updateActiveTab({ autoPromoEnabled: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 bg-white cursor-pointer" />
                        รับโปรโมชันคุ้มสุดอัตโนมัติ
                    </label>

                    {activeTab.appliedPromoDetails && (
                        <div className="bg-fuchsia-50 border border-fuchsia-200 rounded p-3 flex items-center justify-between mt-3 animate-in slide-in-from-bottom-2">
                            <span className="text-xs font-bold text-fuchsia-700 flex items-center gap-1.5 truncate pr-2">
                                <div className="bg-fuchsia-200 p-0.5 rounded-full shrink-0"><Check size={10} className="text-fuchsia-700"/></div>
                                {activeTab.appliedPromoDetails.title}
                            </span>
                            <button disabled={isProcessing} onClick={handleRemovePromotion} className="p-1 hover:bg-fuchsia-200 text-fuchsia-500 rounded transition-colors shrink-0"><X size={14}/></button>
                        </div>
                    )}
                </div>

                {/* 6. NOTE */}
                <div className={sectionClass}>
                    <label className={labelClass}><FileText size={14}/> หมายเหตุพิมพ์ในบิล (PRINT NOTE)</label>
                    <textarea disabled={isProcessing} placeholder="อ้างอิง PO, จุดสังเกตการจัดส่ง..." value={localBillNote} onChange={(e) => setLocalBillNote(e.target.value)} onBlur={() => updateActiveTab({ billNote: localBillNote })} className={`${inputClass} resize-none h-20 custom-scrollbar`} />
                </div>

            </div>
        </div>
    );
};