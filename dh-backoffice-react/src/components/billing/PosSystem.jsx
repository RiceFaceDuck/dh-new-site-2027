import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import CartPanel from './pos/CartPanel';
import PaymentPanel from './pos/PaymentPanel';
import SettingsPanel from './pos/SettingsPanel';
import ReceiptTemplate from './pos/ReceiptTemplate'; 
import PosHeader from './pos/layout/PosHeader';
import GuideModal from '../common/GuideModal';
import PromoModal from './pos/layout/PromoModal';
import FreebieModal from '../../pages/managers/components/freebie/FreebieModal';
import usePosState from './pos/hooks/usePosState';
import { usePosActions, sanitizeNum } from './pos/hooks/usePosActions';
import { usePosShortcuts } from './pos/hooks/usePosShortcuts';
import { useCartValidation } from './pos/hooks/useCartValidation';
import { usePromotionLogic } from './pos/hooks/usePromotionLogic';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

const convertToThaiBahtText = (number) => {
    if (isNaN(number) || number === 0) return "เธจเธนเธเธขเนเธเธฒเธ—เธ–เนเธงเธ";
    const numberStr = parseFloat(number).toFixed(2);
    const [bahtStr, satangStr] = numberStr.split('.');
    const readNumber = (numStr) => {
        const numbers = ["เธจเธนเธเธขเน", "เธซเธเธถเนเธ", "เธชเธญเธ", "เธชเธฒเธก", "เธชเธตเน", "เธซเนเธฒ", "เธซเธ", "เน€เธเนเธ”", "เนเธเธ”", "เน€เธเนเธฒ"];
        const positions = ["", "เธชเธดเธ", "เธฃเนเธญเธข", "เธเธฑเธ", "เธซเธกเธทเนเธ", "เนเธชเธ", "เธฅเนเธฒเธ"];
        let text = ""; const length = numStr.length;
        for (let i = 0; i < length; i++) {
            const digit = parseInt(numStr[i]); const position = length - i - 1;
            if (digit !== 0) {
                if (position === 0 && digit === 1 && length > 1 && parseInt(numStr[i-1]) !== 0) text += "เน€เธญเนเธ”";
                else if (position === 1 && digit === 2) text += "เธขเธตเนเธชเธดเธ";
                else if (position === 1 && digit === 1) text += "เธชเธดเธ";
                else text += numbers[digit] + positions[position % 6];
            }
            if (position % 6 === 0 && position > 0 && digit !== 0) text += "เธฅเนเธฒเธ";
        }
        return text;
    };
    let result = readNumber(bahtStr) + "เธเธฒเธ—";
    if (satangStr === "00") result += "เธ–เนเธงเธ"; else result += readNumber(satangStr) + "เธชเธ•เธฒเธเธเน";
    return result;
};

const noteColorMap = { fuchsia: {}, blue: {}, emerald: {}, rose: {}, amber: {}, slate: {} };

export default function PosSystem({ products = [], customers = [], onSwitchView, initialDraft, resumeTabId }) {
    const posState = usePosState(products, customers, initialDraft);
    const {
        cartTabs: safeCartTabs, setCartTabs,
        activeTabId, setActiveTabId,
        searchQuery, setSearchQuery, showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem, isProcessing, setIsProcessing,
        showPreview, setShowPreview, previewSlip, setPreviewSlip,
        isUploadingSlip, setIsUploadingSlip, customerSearchText, setCustomerSearchText,
        showCustDropdown, setShowCustDropdown, activePromotions,
        isPromoModalOpen, setIsPromoModalOpen,
        createNewTab, closeTab, activeTab, updateActiveTab,
        handlePriceModeChange, searchResults, filteredCustomers,
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, eligibleFreebies
    } = posState;

    const searchRef = useRef(null);
    const custSearchRef = useRef(null);
    const submitLockRef = useRef(false);

    const [isPaymentPanelCollapsed, setIsPaymentPanelCollapsed] = useState(false);
    const [isPaymentPanelLocked, setIsPaymentPanelLocked] = useState(true);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [shippingRules, setShippingRules] = useState([]);

    useEffect(() => {
        const fetchShippingRules = async () => {
            try {
                const { shippingService } = await import('../../firebase/shippingService');
                const rules = await shippingService.getActiveShippingRules();
                setShippingRules(rules);
            } catch (e) {
                console.error("๐”ฅ Error loading shipping rules in POS:", e);
            }
        };
        fetchShippingRules();
    }, []);

    useEffect(() => {
        if (resumeTabId && safeCartTabs.some(t => t.id === resumeTabId)) {
            setActiveTabId(resumeTabId);
        }
    }, [resumeTabId, safeCartTabs, setActiveTabId]);

    const actions = usePosActions({
        posState, products, customers, searchRef, submitLockRef, onSwitchView, convertToThaiBahtText
    });

    usePosShortcuts({
        safeCartTabs, searchRef, activeTabId, handleFileUpload: actions.handleFileUpload
    });

    const handleInteractWithOtherPanels = () => {
        if (!isPaymentPanelLocked && !isPaymentPanelCollapsed) {
            setIsPaymentPanelCollapsed(true);
        }
    };

    const getTabTitle = (tab, index) => {
        if (tab.customer && tab.customer.uid !== 'WALK-IN') {
            return getCustomerDisplayName(tab.customer, `เธฅเธนเธเธเนเธฒ ${index + 1}`);
        }
        if (tab.walkInName) return tab.walkInName;
        if (tab.orderId) return `เธเธดเธฅ ${tab.orderId.slice(-4)}`;
        return `เธเธดเธฅ ${index + 1}`;
    };

    useCartValidation(activeTabId, activeTab, products, updateActiveTab);
    usePromotionLogic(itemSubTotal, activePromotions, activeTab, updateActiveTab, actions.applyPromotionLogic);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            // ๐€ [UPDATED] เนเธเน searchResults เธเธฒเธ Dynamic Server Search เนเธ—เธ products array
            const exactMatch = searchResults.find(p => p.sku?.toLowerCase() === searchQuery.trim().toLowerCase());
            if (exactMatch) actions.addItemToCart(exactMatch); else if (searchResults.length > 0) actions.addItemToCart(searchResults[0]);
        }
        if (e.key === 'Escape') { setShowDropdown(false); setSearchQuery(''); }
    };

    const activePhone = activeTab?.customer ? activeTab.customer.phone : activeTab?.walkInPhone;
    const isPhoneMissing = (!activeTab?.hidePhone) && (!activePhone || activePhone.trim() === '');
    const hasOutOfStock = activeTab?.items.some(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));

    return (
        <div className="flex flex-col h-full bg-(--dh-bg-base) font-sans relative text-(--dh-text-main) transition-colors duration-300">
            <PosHeader 
                onSwitchView={onSwitchView} 
                isProcessing={isProcessing} 
                setIsGuideModalOpen={setIsGuideModalOpen} 
                safeCartTabs={safeCartTabs} 
                activeTabId={activeTabId} 
                setActiveTabId={setActiveTabId} 
                getTabTitle={getTabTitle} 
                createNewTab={createNewTab} 
                setCartTabs={setCartTabs} 
                closeTab={closeTab}
            />

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-(--dh-bg-base) p-2 gap-2">
                <div className="w-full flex-1 flex flex-col h-full bg-(--dh-bg-surface) rounded-lg border border-gray-200 z-10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="flex-1 flex flex-col overflow-hidden" onFocusCapture={handleInteractWithOtherPanels} onClickCapture={handleInteractWithOtherPanels}>
                        <CartPanel searchRef={searchRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleSearchKeyDown={handleSearchKeyDown} clearCart={actions.clearCart} activeTab={activeTab} searchResults={searchResults} addItemToCart={actions.addItemToCart} actionBoxItem={actionBoxItem} setActionBoxItem={setActionBoxItem} updateItemAction={actions.updateItemAction} removeItem={actions.removeItem} eligibleFreebies={eligibleFreebies} noteColorMap={noteColorMap} isProcessing={isProcessing} isCacheLoading={posState.isCacheLoading} />
                    </div>
                    <PaymentPanel itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatOnShipping={activeTab?.vatOnShipping} vatAmount={vatAmount} vatType={activeTab?.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} earnedPoints={earnedPoints} activeTab={activeTab} updateActiveTab={updateActiveTab} changeAmount={changeAmount} handleFileUpload={actions.handleFileUpload} setPreviewSlip={setPreviewSlip} handleCheckout={actions.handleCheckout} isProcessing={isProcessing} hasOutOfStock={hasOutOfStock} setShowPreview={setShowPreview} convertToThaiBahtText={convertToThaiBahtText} isUploadingSlip={isUploadingSlip} isCollapsed={isPaymentPanelCollapsed} setIsCollapsed={setIsPaymentPanelCollapsed} isLocked={isPaymentPanelLocked} setIsLocked={setIsPaymentPanelLocked} />
                </div>
                <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 bg-(--dh-bg-surface) rounded-lg border border-gray-200 h-full overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]" onFocusCapture={handleInteractWithOtherPanels} onClickCapture={handleInteractWithOtherPanels}>
                    <SettingsPanel activeTab={activeTab} updateActiveTab={updateActiveTab} handlePriceModeChange={handlePriceModeChange} custSearchRef={custSearchRef} customerSearchText={customerSearchText} setCustomerSearchText={setCustomerSearchText} showCustDropdown={showCustDropdown} setShowCustDropdown={setShowCustDropdown} filteredCustomers={filteredCustomers} handleSelectCustomer={actions.handleSelectCustomer} netTotal={netTotal} setIsPromoModalOpen={setIsPromoModalOpen} setIsFreebieModalOpen={posState.setIsFreebieModalOpen} handleRemovePromotion={actions.handleRemovePromotion} handleRemoveFreebie={actions.handleRemoveFreebie} isProcessing={isProcessing} eligibleFreebies={eligibleFreebies} shippingRules={shippingRules} />
                </div>
            </div>

            {isPromoModalOpen && (
                <PromoModal 
                    setIsPromoModalOpen={setIsPromoModalOpen} 
                    activePromotions={activePromotions} 
                    itemSubTotal={itemSubTotal} 
                    activeTab={activeTab} 
                    actions={actions} 
                />
            )}

            {posState.isFreebieModalOpen && (
                <FreebieModal 
                    setIsFreebieModalOpen={posState.setIsFreebieModalOpen} 
                    activeFreebies={posState.activeFreebies} 
                    itemSubTotal={itemSubTotal} 
                    activeTab={activeTab} 
                    updateActiveTab={updateActiveTab} 
                />
            )}

            {previewSlip && (
                <div className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs" onClick={() => setPreviewSlip(null)}>
                    <div className="relative max-w-2xl"><button onClick={() => setPreviewSlip(null)} className="absolute -top-12 right-0 text-white opacity-70 hover:opacity-100 dh-active-press bg-black/50 p-2 rounded-full"><X size={24}/></button><img src={previewSlip} alt="Slip" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"  loading="lazy" /></div>
                </div>
            )}

            {showPreview && (
                <ReceiptTemplate activeTab={activeTab} updateActiveTab={updateActiveTab} onClose={() => setShowPreview(false)} convertToThaiBahtText={convertToThaiBahtText} itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatAmount={vatAmount} vatType={activeTab?.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} eligibleFreebies={eligibleFreebies} />
            )}

            {isGuideModalOpen && (
                <GuideModal 
                    isOpen={isGuideModalOpen} 
                    onClose={() => setIsGuideModalOpen(false)} 
                    title="เธเธนเนเธกเธทเธญเธเธฒเธฃเนเธเนเธเธฒเธ: เน€เธเธดเธ”เธเธดเธฅเธเธฒเธฃเธเธฒเธข"
                    config={{
                        description: "เธฃเธฐเธเธเน€เธเธดเธ”เธเธดเธฅเธเธฒเธฃเธเธฒเธข (POS) เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธชเธฃเนเธฒเธเธซเธฅเธฒเธขเธเธดเธฅเธเธฃเนเธญเธกเธเธฑเธ (Multi-tabs) เธเธฒเธฃเธ•เธฑเธ”เธชเธ•เนเธญเธเนเธฅเธฐเธเธฑเธ”เธเธฒเธฃเธชเนเธงเธเธฅเธ”/เธ เธฒเธฉเธต",
                        howTo: [
                            "<strong>เนเธเธเธ•เธฐเธเธฃเนเธฒเธชเธดเธเธเนเธฒ (เธเนเธฒเธขเธเธ):</strong> เธเธ” <code>F3</code> เน€เธเธทเนเธญเธเธดเธกเธเนเธเนเธเธซเธฒเธชเธดเธเธเนเธฒ เธซเธฃเธทเธญเนเธเนเน€เธเธฃเธทเนเธญเธเธขเธดเธเธเธฒเธฃเนเนเธเนเธ”เธชเนเธเธเนเธ”เนเธ—เธฑเธเธ—เธต เธชเธฒเธกเธฒเธฃเธ–เธเธฅเธดเธเธ—เธตเนเธเธทเนเธญเธชเธดเธเธเนเธฒเน€เธเธทเนเธญเนเธเนเนเธเธเธณเธเธงเธเธซเธฃเธทเธญเธชเนเธงเธเธฅเธ”เธฃเธฒเธขเธเธดเนเธ",
                            "<strong>เนเธเธเธ•เธฑเนเธเธเนเธฒเธเธดเธฅ (เธเธงเธฒเธกเธทเธญ):</strong> เธเนเธเธซเธฒเธฅเธนเธเธเนเธฒเธ”เนเธงเธขเธเธทเนเธญเธซเธฃเธทเธญเน€เธเธญเธฃเนเนเธ—เธฃ เน€เธฅเธทเธญเธเธฃเธฐเธ”เธฑเธเธฃเธฒเธเธฒ (B2B/เธเธฅเธตเธ) เธฃเธนเธเนเธเธเธ เธฒเธฉเธต เนเธฅเธฐเน€เธเธดเนเธกเธเนเธฒเธเธฑเธ”เธชเนเธเธซเธฃเธทเธญเธชเนเธงเธเธฅเธ”เธ—เนเธฒเธขเธเธดเธฅ",
                            "<strong>เนเธเธเธเธณเธฃเธฐเน€เธเธดเธ (เธ”เนเธฒเธเธฅเนเธฒเธ):</strong> เธฃเธฐเธเธธเธขเธญเธ”เน€เธเธดเธเธชเธ” เนเธเธเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ (เธเธ” <code>Ctrl+V</code> เน€เธเธทเนเธญเธงเธฒเธเธฃเธนเธเธชเธฅเธดเธ) เนเธเธเธเธณเธฃเธฐเธเธฐเธขเธธเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เธเธ”เธเธธเนเธก <code>เธฅเนเธญเธ</code> (เนเธญเธเธญเธเธเธธเธเนเธ) เน€เธเธทเนเธญเน€เธเธดเธ”เธเนเธฒเธเนเธงเน"
                        ],
                        tips: [
                            "เธชเธฒเธกเธฒเธฃเธ–เนเธเน <code>Ctrl + Enter</code> เน€เธเธทเนเธญเธขเธทเธเธขเธฑเธเธเธฒเธฃเธฃเธฑเธเธเธณเธฃเธฐเน€เธเธดเธ (Paid) เธญเธขเนเธฒเธเธฃเธงเธ”เน€เธฃเนเธง",
                            "เธซเธฒเธเธ•เนเธญเธเธเธฒเธฃเน€เธเธดเนเธกเธเธดเธฅเธฃเนเธฒเธเนเธซเธกเน เธเธ”เนเธญเธเธญเธ <code>+</code> เธซเธฃเธทเธญเนเธเน <code>Alt + N</code>",
                            "เธเธฒเธฃเนเธเนเน€เธกเธฒเธชเนเธเธฅเธดเธเธเธธเนเธกเธเนเธฒเธขเธเธญเธ”เธต (Exact) เธเนเธงเธขเนเธซเนเธฃเธฑเธเน€เธเธดเธเนเธ”เนเธฃเธงเธ”เน€เธฃเนเธงเธเธถเนเธเนเธเธเธฃเธ“เธตเธ—เธตเนเธฅเธนเธเธเนเธฒเธเนเธฒเธขเน€เธเธดเธเธเธญเธ”เธต"
                        ],
                        expectedResults: "เน€เธกเธทเนเธญเธเธ” <strong>เธขเธทเธเธขเธฑเธเธเธณเธฃเธฐเน€เธเธดเธ</strong> เธฃเธฐเธเธเธเธฐเธ•เธฑเธ”เธชเธ•เนเธญเธเธชเธดเธเธเนเธฒเธ—เธฑเธเธ—เธตเนเธฅเธฐเธชเธฃเนเธฒเธเธเธดเธฅเธซเธกเธฒเธขเน€เธฅเธ (DH-xxxx) เธเธฃเนเธญเธกเธเธฑเธเธ—เธถเธเธขเธญเธ”เธเธฒเธขเนเธฅเธฐเธเธฃเธฐเธงเธฑเธ•เธดเนเธซเนเธฅเธนเธเธเนเธฒ"
                    }}
                />
            )}
        </div>
    );
}
