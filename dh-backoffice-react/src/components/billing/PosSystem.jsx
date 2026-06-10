import React, { useRef, useEffect, useState } from 'react';
import { Plus, ArrowLeft, X, HelpCircle } from 'lucide-react';
import { auth } from '../../firebase/config';

import CartPanel from './pos/CartPanel';
import PaymentPanel from './pos/PaymentPanel';
import SettingsPanel from './pos/SettingsPanel';
import ReceiptTemplate from './pos/ReceiptTemplate'; 
import PosHeader from './pos/layout/PosHeader';
import GuideModal from './pos/layout/GuideModal';
import PromoModal from './pos/layout/PromoModal';
import usePosState from './pos/hooks/usePosState';
import { usePosActions, sanitizeNum } from './pos/hooks/usePosActions';
import { usePosShortcuts } from './pos/hooks/usePosShortcuts';

const convertToThaiBahtText = (number) => {
    if (isNaN(number) || number === 0) return "ศูนย์บาทถ้วน";
    const numberStr = parseFloat(number).toFixed(2);
    const [bahtStr, satangStr] = numberStr.split('.');
    const readNumber = (numStr) => {
        const numbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
        const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
        let text = ""; const length = numStr.length;
        for (let i = 0; i < length; i++) {
            const digit = parseInt(numStr[i]); const position = length - i - 1;
            if (digit !== 0) {
                if (position === 0 && digit === 1 && length > 1 && parseInt(numStr[i-1]) !== 0) text += "เอ็ด";
                else if (position === 1 && digit === 2) text += "ยี่สิบ";
                else if (position === 1 && digit === 1) text += "สิบ";
                else text += numbers[digit] + positions[position % 6];
            }
            if (position % 6 === 0 && position > 0 && digit !== 0) text += "ล้าน";
        }
        return text;
    };
    let result = readNumber(bahtStr) + "บาท";
    if (satangStr === "00") result += "ถ้วน"; else result += readNumber(satangStr) + "สตางค์";
    return result;
};

const noteColorMap = { fuchsia: {}, blue: {}, emerald: {}, rose: {}, amber: {}, slate: {} };

export default function PosSystem({ products = [], customers = [], onSwitchView, initialDraft }) {
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
    const [isPaymentPanelLocked, setIsPaymentPanelLocked] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

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
            return tab.customer.accountName || tab.customer.displayName || tab.customer.firstName || tab.customer.name || `ลูกค้า ${index + 1}`;
        }
        if (tab.walkInName) return tab.walkInName;
        if (tab.orderId) return `บิล ${tab.orderId.slice(-4)}`;
        return `บิล ${index + 1}`;
    };

    useEffect(() => {
        if (!activeTab || !activeTab.items || activeTab.items.length === 0) return;
        if (!products || products.length === 0) return; 

        let isCartUpdated = false;
        let alertMessages = [];
        
        const validatedItems = activeTab.items.map(cartItem => {
            const masterProduct = products.find(p => p.sku === cartItem.sku);
            if (!masterProduct) return cartItem;

            let newItem = { ...cartItem };
            let itemChanged = false;

            if (newItem.stock !== masterProduct.stockQuantity) {
                newItem.stock = masterProduct.stockQuantity; itemChanged = true;
                if (masterProduct.stockQuantity < newItem.qty) alertMessages.push(`- ${newItem.name} (สต็อกเหลือ ${masterProduct.stockQuantity})`);
            }

            const expectedPrice = activeTab.priceMode === 'wholesale' ? (masterProduct.Price || masterProduct.retailPrice || 0) : (masterProduct.retailPrice || masterProduct.Price || 0);
            const oldBase = activeTab.priceMode === 'wholesale' ? newItem.baseWholesale : newItem.baseRetail;
            
            if (oldBase !== expectedPrice) {
                 if (sanitizeNum(newItem.price) === sanitizeNum(oldBase)) {
                     newItem.price = expectedPrice; alertMessages.push(`- ${newItem.name} (ราคาใหม่: ฿${expectedPrice})`);
                 }
                 newItem.baseWholesale = masterProduct.Price || masterProduct.retailPrice || 0;
                 newItem.baseRetail = masterProduct.retailPrice || masterProduct.Price || 0;
                 itemChanged = true;
            }

            if (itemChanged) isCartUpdated = true;
            return newItem;
        });

        if (isCartUpdated) {
            updateActiveTab({ items: validatedItems });
            if (alertMessages.length > 0) setTimeout(() => alert(`⚠️ อัปเดตข้อมูลบิลร่าง:\n\n${alertMessages.join('\n')}`), 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTabId, products, activeTab?.priceMode]); 

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            const exactMatch = products.find(p => p.sku.toLowerCase() === searchQuery.trim().toLowerCase());
            if (exactMatch) actions.addItemToCart(exactMatch); else if (searchResults.length > 0) actions.addItemToCart(searchResults[0]);
        }
        if (e.key === 'Escape') { setShowDropdown(false); setSearchQuery(''); }
    };

    useEffect(() => {
        if (!activeTab || activePromotions.length === 0) return;
        if (!activeTab.autoPromoEnabled) return; 

        let bestPromo = null; let maxDiscount = 0;
        activePromotions.forEach(promo => {
            if (itemSubTotal >= promo.minSpend) {
                let discount = actions.applyPromotionLogic(promo, itemSubTotal);
                if (discount > maxDiscount) { maxDiscount = discount; bestPromo = promo; }
            }
        });

        const currentPromoId = activeTab.appliedPromoId;
        const currentDiscount = sanitizeNum(activeTab.promoDiscount);

        if (bestPromo) {
            if (bestPromo.id !== currentPromoId || currentDiscount !== maxDiscount) updateActiveTab({ promoDiscount: maxDiscount, appliedPromoId: bestPromo.id, appliedPromoDetails: { ...bestPromo } });
        } else if (currentPromoId) updateActiveTab({ promoDiscount: 0, appliedPromoId: null, appliedPromoDetails: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemSubTotal, activePromotions, activeTab?.autoPromoEnabled, activeTab?.appliedPromoId, activeTab?.promoDiscount]); 

    const activePhone = activeTab?.customer ? activeTab.customer.phone : activeTab?.walkInPhone;
    const isPhoneMissing = (!activeTab?.hidePhone) && (!activePhone || activePhone.trim() === '');
    const hasOutOfStock = activeTab?.items.some(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));

    return (
        <div className="flex flex-col h-full bg-[var(--dh-bg-base)] font-sans relative text-[var(--dh-text-main)] transition-colors duration-300">
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

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-[var(--dh-bg-base)] p-2 gap-2">
                <div className="w-full flex-1 flex flex-col h-full bg-[var(--dh-bg-surface)] rounded-lg border border-gray-200 z-10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="flex-1 flex flex-col overflow-hidden" onFocusCapture={handleInteractWithOtherPanels} onClickCapture={handleInteractWithOtherPanels}>
                        <CartPanel searchRef={searchRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleSearchKeyDown={handleSearchKeyDown} clearCart={actions.clearCart} activeTab={activeTab} searchResults={searchResults} addItemToCart={actions.addItemToCart} actionBoxItem={actionBoxItem} setActionBoxItem={setActionBoxItem} updateItemAction={actions.updateItemAction} removeItem={actions.removeItem} eligibleFreebies={eligibleFreebies} noteColorMap={noteColorMap} isProcessing={isProcessing} />
                    </div>
                    <PaymentPanel itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatOnShipping={activeTab?.vatOnShipping} vatAmount={vatAmount} vatType={activeTab?.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} earnedPoints={earnedPoints} activeTab={activeTab} updateActiveTab={updateActiveTab} changeAmount={changeAmount} handleFileUpload={actions.handleFileUpload} setPreviewSlip={setPreviewSlip} handleCheckout={actions.handleCheckout} isProcessing={isProcessing} hasOutOfStock={hasOutOfStock} setShowPreview={setShowPreview} convertToThaiBahtText={convertToThaiBahtText} isUploadingSlip={isUploadingSlip} isCollapsed={isPaymentPanelCollapsed} setIsCollapsed={setIsPaymentPanelCollapsed} isLocked={isPaymentPanelLocked} setIsLocked={setIsPaymentPanelLocked} />
                </div>
                <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 bg-[var(--dh-bg-surface)] rounded-lg border border-gray-200 h-full overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]" onFocusCapture={handleInteractWithOtherPanels} onClickCapture={handleInteractWithOtherPanels}>
                    <SettingsPanel activeTab={activeTab} updateActiveTab={updateActiveTab} handlePriceModeChange={handlePriceModeChange} custSearchRef={custSearchRef} customerSearchText={customerSearchText} setCustomerSearchText={setCustomerSearchText} showCustDropdown={showCustDropdown} setShowCustDropdown={setShowCustDropdown} filteredCustomers={filteredCustomers} handleSelectCustomer={actions.handleSelectCustomer} netTotal={netTotal} setIsPromoModalOpen={setIsPromoModalOpen} handleRemovePromotion={actions.handleRemovePromotion} isProcessing={isProcessing} eligibleFreebies={eligibleFreebies} />
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

            {previewSlip && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm" onClick={() => setPreviewSlip(null)}>
                    <div className="relative max-w-2xl"><button onClick={() => setPreviewSlip(null)} className="absolute -top-12 right-0 text-white opacity-70 hover:opacity-100 dh-active-press bg-black/50 p-2 rounded-full"><X size={24}/></button><img src={previewSlip} alt="Slip" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" /></div>
                </div>
            )}

            {showPreview && (
                <ReceiptTemplate activeTab={activeTab} updateActiveTab={updateActiveTab} onClose={() => setShowPreview(false)} convertToThaiBahtText={convertToThaiBahtText} itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatAmount={vatAmount} vatType={activeTab?.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} />
            )}

            {isGuideModalOpen && (
                <GuideModal setIsGuideModalOpen={setIsGuideModalOpen} />
            )}
        </div>
    );
}