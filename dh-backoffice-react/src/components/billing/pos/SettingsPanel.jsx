import React, { useEffect, useState } from 'react';
import { Settings, X, Truck, Check, Calculator, Megaphone, Receipt, FileText, Tag, SlidersHorizontal, Printer, Volume2, Phone } from 'lucide-react';
import TerminalConfigDropdown from './settings/TerminalConfigDropdown';
import CustomerSection from './settings/CustomerSection';

export default function SettingsPanel({
    activeTab, updateActiveTab, handlePriceModeChange, custSearchRef, customerSearchText, setCustomerSearchText, 
    showCustDropdown, setShowCustDropdown, filteredCustomers, handleSelectCustomer, netTotal, setIsPromoModalOpen, handleRemovePromotion,
    isProcessing
}) {
    // ⚡ Local State
    const [localShipping, setLocalShipping] = useState(activeTab.shippingFee || '');
    const [localDiscount, setLocalDiscount] = useState(activeTab.overallDiscount || '');
    const [localOtherName, setLocalOtherName] = useState(activeTab.otherFeeName || '');
    const [localOtherAmount, setLocalOtherAmount] = useState(activeTab.otherFeeAmount || '');
    const [localBillNote, setLocalBillNote] = useState(activeTab.billNote || '');

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

    // ซิงค์ข้อมูลตอนเปลี่ยนบิล
    useEffect(() => {
        setLocalShipping(activeTab.shippingFee || '');
        setLocalDiscount(activeTab.overallDiscount || '');
        setLocalOtherName(activeTab.otherFeeName || '');
        setLocalOtherAmount(activeTab.otherFeeAmount || '');
        setLocalBillNote(activeTab.billNote || '');
    }, [activeTab.id]);

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


    // 🎨 UI Classes 
    const inputClass = "w-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] rounded-md px-3 py-2 text-sm font-semibold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent)] transition-all placeholder-gray-400 shadow-sm";
    const labelClass = "text-[11px] font-bold text-[var(--dh-text-muted)] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider";
    const sectionClass = "p-5 border-b border-[var(--dh-border)] last:border-0 transition-colors duration-300";
    
    const ToggleGroup = ({ options, activeValue, onChange, disabled }) => (
        <div className={`flex bg-gray-100 p-1 rounded-md border border-[var(--dh-border)] ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-sm uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        activeValue === opt.value
                            ? 'bg-[var(--dh-primary-light)] text-white shadow-sm' 
                            : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-gray-200'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-[var(--dh-bg-surface)] overflow-hidden z-10 font-sans relative">
            {isProcessing && <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] cursor-not-allowed transition-all duration-300"></div>}

            {/* HEADER */}
            <div className="px-4 py-3 shrink-0 flex items-center justify-between relative z-20 bg-[var(--dh-primary)] text-white">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/10 border border-white/20 rounded-md shadow-sm text-white"><Settings size={14} /></div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-none">ตั้งค่าบิล (SETTINGS)</h2>
                        <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase tracking-widest">Control Panel</p>
                    </div>
                </div>
                <button onClick={() => !isProcessing && setIsTerminalConfigOpen(!isTerminalConfigOpen)} disabled={isProcessing}
                    className={`p-2 rounded-md transition-all border group 
                        ${isTerminalConfigOpen ? 'bg-white/20 text-white border-white/30 shadow-sm' : 'bg-transparent text-gray-300 border-white/10 hover:text-white hover:bg-white/10'}`}>
                    <SlidersHorizontal size={14} className="group-hover:rotate-12 transition-transform"/>
                </button>

                {/* Dropdown ตั้งค่า POS */}
                <TerminalConfigDropdown
                    terminalConfig={terminalConfig}
                    updateTerminalConfig={updateTerminalConfig}
                    isTerminalConfigOpen={isTerminalConfigOpen}
                    setIsTerminalConfigOpen={setIsTerminalConfigOpen}
                    inputClass={inputClass}
                    isProcessing={isProcessing}
                />
            </div>

            {/* CONTENT AREA */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isProcessing ? 'opacity-70' : ''}`}>

                {/* 1. CUSTOMER IDENTITY & SEARCH */}
                <CustomerSection
                    activeTab={activeTab}
                    updateActiveTab={updateActiveTab}
                    custSearchRef={custSearchRef}
                    customerSearchText={customerSearchText}
                    setCustomerSearchText={setCustomerSearchText}
                    showCustDropdown={showCustDropdown}
                    setShowCustDropdown={setShowCustDropdown}
                    filteredCustomers={filteredCustomers}
                    handleSelectCustomer={handleSelectCustomer}
                    netTotal={netTotal}
                    isProcessing={isProcessing}
                    labelClass={labelClass}
                />

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
                            options={[{ value: 'exempt', label: 'ไม่มี VAT' }, { value: 'included', label: 'รวม VAT' }, { value: 'excluded', label: 'แยก VAT' }]}
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