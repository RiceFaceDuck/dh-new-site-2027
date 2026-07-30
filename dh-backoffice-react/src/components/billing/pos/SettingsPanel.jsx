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
    const inputClass = "w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-hidden focus:border-[#2A305A] focus:ring-1 focus:ring-[#2A305A] transition-all placeholder-gray-400 shadow-xs";
    const labelClass = "text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider";
    const sectionClass = "p-3.5 border-b border-gray-200 last:border-0 transition-colors duration-300";

    return (
        <div className="w-full h-full flex flex-col bg-(--dh-bg-surface) overflow-hidden z-10 font-sans relative">
            {isProcessing && <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] cursor-not-allowed transition-all duration-300"></div>}

            {/* HEADER */}
            <div className="px-4 py-3 shrink-0 flex items-center justify-between relative z-20 bg-(--dh-primary) text-white">
                <button
                    type="button"
                    onClick={() => !isProcessing && setIsTerminalConfigOpen(!isTerminalConfigOpen)}
                    disabled={isProcessing}
                    className="flex items-center gap-2.5 group text-left cursor-pointer select-none"
                    title="กดเพื่อตั้งค่าเครื่อง / POS Terminal Settings"
                >
                    <div className={`p-1.5 border rounded-md shadow-xs transition-all ${
                        isTerminalConfigOpen 
                            ? 'bg-white text-[#2A305A] border-white shadow-md scale-105' 
                            : 'bg-white/10 border-white/20 text-white group-hover:bg-white/20 group-hover:border-white/30'
                    }`}>
                        <Settings size={16} className={`transition-transform duration-300 ${isTerminalConfigOpen ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-none group-hover:text-cyan-200 transition-colors">
                            ตั้งค่าบิล (SETTINGS)
                        </h2>
                        <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase tracking-widest">Control Panel</p>
                    </div>
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
                    shippingRules={shippingRules}
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
                    setIsFreebieModalOpen={setIsFreebieModalOpen}
                    handleRemovePromotion={handleRemovePromotion}
                    handleRemoveFreebie={handleRemoveFreebie}
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