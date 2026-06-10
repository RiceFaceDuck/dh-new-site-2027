import React, { useEffect, useState } from 'react';
import { Settings, SlidersHorizontal } from 'lucide-react';
import TerminalConfigDropdown from './settings/TerminalConfigDropdown';
import CustomerSection from './settings/CustomerSection';
import LogisticsSettings from './settings/panel/LogisticsSettings';
import DiscountSettings from './settings/panel/DiscountSettings';
import PromotionSettings from './settings/panel/PromotionSettings';
import NoteSettings from './settings/panel/NoteSettings';

export default function SettingsPanel({
    activeTab, updateActiveTab, handlePriceModeChange, custSearchRef, customerSearchText, setCustomerSearchText, 
    showCustDropdown, setShowCustDropdown, filteredCustomers, handleSelectCustomer, netTotal, setIsPromoModalOpen, handleRemovePromotion,
    isProcessing, eligibleFreebies
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
    const inputClass = "w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#2A305A] focus:ring-1 focus:ring-[#2A305A] transition-all placeholder-gray-400 shadow-sm";
    const labelClass = "text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider";
    const sectionClass = "p-3.5 border-b border-gray-200 last:border-0 transition-colors duration-300";

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

                <LogisticsSettings
                    activeTab={activeTab}
                    updateActiveTab={updateActiveTab}
                    handlePriceModeChange={handlePriceModeChange}
                    isProcessing={isProcessing}
                    localShipping={localShipping}
                    setLocalShipping={setLocalShipping}
                    terminalConfig={terminalConfig}
                    sectionClass={sectionClass}
                    labelClass={labelClass}
                    inputClass={inputClass}
                />

                <DiscountSettings
                    activeTab={activeTab}
                    updateActiveTab={updateActiveTab}
                    isProcessing={isProcessing}
                    localDiscount={localDiscount}
                    setLocalDiscount={setLocalDiscount}
                    localOtherName={localOtherName}
                    setLocalOtherName={setLocalOtherName}
                    localOtherAmount={localOtherAmount}
                    setLocalOtherAmount={setLocalOtherAmount}
                    sectionClass={sectionClass}
                    labelClass={labelClass}
                    inputClass={inputClass}
                />

                <PromotionSettings
                    activeTab={activeTab}
                    updateActiveTab={updateActiveTab}
                    isProcessing={isProcessing}
                    setIsPromoModalOpen={setIsPromoModalOpen}
                    handleRemovePromotion={handleRemovePromotion}
                    eligibleFreebies={eligibleFreebies}
                    sectionClass={sectionClass}
                    labelClass={labelClass}
                />

                <NoteSettings
                    activeTab={activeTab}
                    updateActiveTab={updateActiveTab}
                    isProcessing={isProcessing}
                    localBillNote={localBillNote}
                    setLocalBillNote={setLocalBillNote}
                    sectionClass={sectionClass}
                    labelClass={labelClass}
                    inputClass={inputClass}
                />

            </div>
        </div>
    );
}