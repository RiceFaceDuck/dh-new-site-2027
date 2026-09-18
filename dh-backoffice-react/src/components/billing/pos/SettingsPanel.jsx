import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { auth } from '../../../firebase/config';
import { safeJsonParse } from 'dh-shared';
import TerminalConfigDropdown from './settings/TerminalConfigDropdown';
import CustomerSection from './settings/CustomerSection';
import LogisticsSettings from './settings/panel/LogisticsSettings';
import DiscountSettings from './settings/panel/DiscountSettings';
import PromotionSettings from './settings/panel/PromotionSettings';
import NoteSettings from './settings/panel/NoteSettings';

export default function SettingsPanel({
    activeTab, updateActiveTab, handlePriceModeChange, custSearchRef, customerSearchText, setCustomerSearchText, 
    showCustDropdown, setShowCustDropdown, filteredCustomers, handleSelectCustomer, netTotal, setIsPromoModalOpen, setIsFreebieModalOpen, handleRemovePromotion, handleRemoveFreebie,
    isProcessing, eligibleFreebies, shippingRules
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

    const getTerminalConfigKey = (uid) => uid ? `dh_pos_config_v6_${uid}` : 'dh_pos_config_v6';

    const [terminalConfig, setTerminalConfig] = useState(() => {
        try {
            const uid = auth.currentUser?.uid;
            const key = getTerminalConfigKey(uid);
            const saved = localStorage.getItem(key) || localStorage.getItem('dh_pos_config_v6');
            return { ...defaultTerminalConfig, ...(safeJsonParse(saved) || {}) };
        } catch { return defaultTerminalConfig; }
    });
    const [isTerminalConfigOpen, setIsTerminalConfigOpen] = useState(false);

    const updateTerminalConfig = (key, val) => {
        const newConf = { ...terminalConfig, [key]: val };
        setTerminalConfig(newConf);
        const uid = auth.currentUser?.uid;
        localStorage.setItem(getTerminalConfigKey(uid), JSON.stringify(newConf));
    };

    // ซิงค์ข้อมูลตอนเปลี่ยนบิล
    useEffect(() => {
        setLocalShipping(activeTab.shippingFee || '');
        setLocalDiscount(activeTab.overallDiscount || '');
        setLocalOtherName(activeTab.otherFeeName || '');
        setLocalOtherAmount(activeTab.otherFeeAmount || '');
        setLocalBillNote(activeTab.billNote || '');
    }, [activeTab.id, activeTab.shippingFee, activeTab.overallDiscount, activeTab.otherFeeName, activeTab.otherFeeAmount, activeTab.billNote]);

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
    }, [activeTab?.id, activeTab?.fulfillmentType, activeTab?.priceMode, activeTab?.vatType, activeTab?.autoPromoEnabled, activeTab?.courier, terminalConfig.defaultFulfillment, terminalConfig.defaultPriceMode, terminalConfig.defaultVatType, terminalConfig.defaultCourier, updateActiveTab]); 


    // 🎨 UI Classes 
    const inputClass = "w-full bg-white border border-gray-300 rounded-none rounded-tr-md px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-hidden focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-all placeholder-gray-400 shadow-xs";
    const labelClass = "text-xs font-bold text-white/90 mb-1 flex items-center gap-1.5 uppercase tracking-wider";
    const sectionClass = "p-3.5 border-b border-white/10 last:border-0 transition-colors duration-300";

    return (
        <div className="w-full h-full flex flex-col bg-[#35416C] text-white overflow-y-auto max-h-full font-sans hide-scrollbar relative z-10">
            {isProcessing && <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] cursor-not-allowed transition-all duration-300"></div>}

            {/* HEADER */}
            <div className="p-3 border-b border-black/20 flex justify-between items-center bg-[#283254] sticky top-0 z-20 shadow-md">
                <button
                    type="button"
                    onClick={() => !isProcessing && setIsTerminalConfigOpen(!isTerminalConfigOpen)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 text-white cursor-pointer hover:opacity-90 transition-opacity"
                    title="ตั้งค่าบิลขาย"
                >
                    <div className="p-1.5 bg-white/10 rounded-md">
                        <Settings size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-wide">ตั้งค่าบิลขาย</span>
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
            <div className={`p-3 flex flex-col gap-3 pb-8 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isProcessing ? 'opacity-70' : ''}`}>

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
                    shippingRules={shippingRules}
                />

                <PromotionSettings
                    activeTab={activeTab}
                    updateActiveTab={updateActiveTab}
                    isProcessing={isProcessing}
                    setIsPromoModalOpen={setIsPromoModalOpen}
                    setIsFreebieModalOpen={setIsFreebieModalOpen}
                    handleRemovePromotion={handleRemovePromotion}
                    handleRemoveFreebie={handleRemoveFreebie}
                    eligibleFreebies={eligibleFreebies}
                    sectionClass={sectionClass}
                    labelClass={labelClass}
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