import React, { useRef, useEffect } from 'react';
import { Plus, ArrowLeft, X, HelpCircle } from 'lucide-react';
import { billingService } from '../../firebase/billingService';
import { auth } from '../../firebase/config';
import { driveService } from '../../firebase/driveService'; 

import CartPanel from './pos/CartPanel';
import PaymentPanel from './pos/PaymentPanel';
import SettingsPanel from './pos/SettingsPanel';
import ReceiptTemplate from './pos/ReceiptTemplate'; 
import usePosState from './pos/hooks/usePosState';

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

const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

const noteColorMap = { fuchsia: {}, blue: {}, emerald: {}, rose: {}, amber: {}, slate: {} };

export default function PosSystem({ products = [], customers = [], cartTabs = [], setCartTabs, activeTabId, setActiveTabId, onSwitchView, initialDraft }) {
    const posState = usePosState(products, customers, cartTabs, setCartTabs, activeTabId, setActiveTabId, initialDraft);
    const {
        searchQuery, setSearchQuery, showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem, isProcessing, setIsProcessing,
        showPreview, setShowPreview, previewSlip, setPreviewSlip,
        isUploadingSlip, setIsUploadingSlip, customerSearchText, setCustomerSearchText,
        showCustDropdown, setShowCustDropdown, activePromotions,
        isPromoModalOpen, setIsPromoModalOpen,
        createNewTab, safeCartTabs, activeTab, updateActiveTab,
        handlePriceModeChange, searchResults, filteredCustomers,
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, eligibleFreebies
    } = posState;

    const searchRef = useRef(null);
    const custSearchRef = useRef(null);
    const submitLockRef = useRef(false);

    const [isPaymentPanelCollapsed, setIsPaymentPanelCollapsed] = React.useState(false);
    const [isPaymentPanelLocked, setIsPaymentPanelLocked] = React.useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = React.useState(false);

    const handleInteractWithOtherPanels = () => {
        if (!isPaymentPanelLocked && !isPaymentPanelCollapsed) {
            setIsPaymentPanelCollapsed(true);
        }
    };

    const getTabTitle = (tab, index) => {
        if (tab.customer) return tab.customer.accountName || tab.customer.firstName || `ลูกค้า ${index + 1}`;
        if (tab.walkInName) return tab.walkInName;
        return `บิล ${index + 1}`;
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => { if (safeCartTabs.some(tab => tab.items.length > 0)) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [safeCartTabs]);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'F3') { e.preventDefault(); searchRef.current?.querySelector('input')?.focus(); } };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
    }, [activeTabId, products, activeTab?.priceMode]); 

    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    handleFileUpload({ target: { files: [blob] } });
                }
            }
        };
        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [activeTabId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingSlip(true); 
        try {
            const uploadedUrl = await driveService.uploadSlip(file);
            updateActiveTab({ slipImage: uploadedUrl, transactionRef: '', transferDateTime: '' });
        } catch (error) { alert(`อัปโหลดไม่สำเร็จ: ${error.message}`); } finally { setIsUploadingSlip(false); }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            const exactMatch = products.find(p => p.sku.toLowerCase() === searchQuery.trim().toLowerCase());
            if (exactMatch) addItemToCart(exactMatch); else if (searchResults.length > 0) addItemToCart(searchResults[0]);
        }
        if (e.key === 'Escape') { setShowDropdown(false); setSearchQuery(''); }
    };

    const addItemToCart = (product) => {
        const existingItem = activeTab.items.find(i => i.sku === product.sku);
        if (existingItem) { updateActiveTab({ items: activeTab.items.map(i => i.sku === product.sku ? { ...i, qty: i.qty + 1 } : i) }); } 
        else {
            const baseWholesale = product.Price || product.retailPrice || 0; const baseRetail = product.retailPrice || product.Price || 0;
            const targetPrice = activeTab.priceMode === 'wholesale' ? baseWholesale : baseRetail;
            updateActiveTab({ items: [{ sku: product.sku, name: product.name, baseWholesale, baseRetail, price: targetPrice, qty: 1, discount: 0, stock: product.stockQuantity, note: '', noteColor: 'slate' }, ...activeTab.items] });
        }
        setSearchQuery(''); setShowDropdown(false);
        setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 10);
    };

    const updateItemAction = (sku, field, value) => updateActiveTab({ items: activeTab.items.map(i => i.sku === sku ? { ...i, [field]: value } : i) });
    const removeItem = (sku) => { updateActiveTab({ items: activeTab.items.filter(i => i.sku !== sku) }); if (actionBoxItem === sku) setActionBoxItem(null); };
    
    const clearCart = () => {
        if(window.confirm('คุณต้องการล้างบิลนี้ทิ้งใช่หรือไม่?')) { updateActiveTab(createNewTab()); setActionBoxItem(null); setCustomerSearchText(''); searchRef.current?.querySelector('input')?.focus(); }
    };

    const handleSelectCustomer = (uid) => {
        const cust = customers.find(c => c.uid === uid);
        if (cust) {
            const mem = JSON.parse(localStorage.getItem(`dh_cust_pref_${uid}`)) || {};
            const isCompany = cust.accountName?.includes('บริษัท');
            const targetMode = mem.priceMode || (isCompany ? 'wholesale' : 'retail');
            const updatedItems = activeTab.items.map(item => ({ ...item, price: targetMode === 'wholesale' ? item.baseWholesale : item.baseRetail }));

            updateActiveTab({ 
                customer: cust, priceMode: targetMode, vatType: mem.vatType || (isCompany ? 'included' : 'exempt'),
                fulfillmentType: mem.fulfillmentType || (cust.logisticProvider ? 'Delivery' : 'StorePickup'),
                receiptFormat: mem.receiptFormat || 'short', paymentMethod: 'Transfer', walkInName: '', walkInPhone: '', hidePhone: false, items: updatedItems, walletUsed: 0 
            });
            setCustomerSearchText(''); 
        } else {
            handlePriceModeChange('wholesale');
            updateActiveTab({ customer: null, vatType: 'exempt', fulfillmentType: 'Delivery', paymentMethod: 'Transfer', receiptFormat: 'short', walletUsed: 0 });
            setCustomerSearchText('');
        }
        setShowCustDropdown(false);
    };

    const applyPromotionLogic = (promo, subTotalAmount) => {
        let calculatedDiscount = promo.type === 'PERCENTAGE' ? subTotalAmount * (promo.value / 100) : promo.value;
        return Math.floor(calculatedDiscount);
    };

    const handleApplyPromotion = (promo, isAuto = false) => {
        if (promo.minSpend > 0 && itemSubTotal < promo.minSpend) return;
        updateActiveTab({ promoDiscount: applyPromotionLogic(promo, itemSubTotal), appliedPromoId: promo.id, appliedPromoDetails: { ...promo }, autoPromoEnabled: isAuto ? true : false });
        setIsPromoModalOpen(false);
    };

    const handleRemovePromotion = () => { updateActiveTab({ promoDiscount: 0, appliedPromoId: null, appliedPromoDetails: null, autoPromoEnabled: false }); };

    useEffect(() => {
        if (!activeTab || activePromotions.length === 0) return;
        if (!activeTab.autoPromoEnabled) return; 

        let bestPromo = null; let maxDiscount = 0;
        activePromotions.forEach(promo => {
            if (itemSubTotal >= promo.minSpend) {
                let discount = applyPromotionLogic(promo, itemSubTotal);
                if (discount > maxDiscount) { maxDiscount = discount; bestPromo = promo; }
            }
        });

        const currentPromoId = activeTab.appliedPromoId;
        const currentDiscount = sanitizeNum(activeTab.promoDiscount);

        if (bestPromo) {
            if (bestPromo.id !== currentPromoId || currentDiscount !== maxDiscount) updateActiveTab({ promoDiscount: maxDiscount, appliedPromoId: bestPromo.id, appliedPromoDetails: { ...bestPromo } });
        } else if (currentPromoId) updateActiveTab({ promoDiscount: 0, appliedPromoId: null, appliedPromoDetails: null });
    }, [itemSubTotal, activePromotions, activeTab?.autoPromoEnabled, activeTab?.appliedPromoId, activeTab?.promoDiscount]); 

    const activePhone = activeTab.customer ? activeTab.customer.phone : activeTab.walkInPhone;
    const isPhoneMissing = (!activeTab.hidePhone) && (!activePhone || activePhone.trim() === '');
    const hasOutOfStock = activeTab.items.some(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));

    const handleCheckout = async (status) => { 
        if (submitLockRef.current || isProcessing) return;

        if (activeTab.items.length === 0) { alert('⚠️ กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'); return; }
        if (hasOutOfStock && status !== 'Draft') { alert('⚠️ สินค้าไม่เพียงพอ กรุณาบันทึกร่างแทน'); return; }
        if (isPhoneMissing && status !== 'Draft') { alert('⚠️ กรุณาระบุเบอร์โทรศัพท์ลูกค้า'); return; }
        if (status === 'Paid' && activeTab.paymentMethod === 'Cash' && sanitizeNum(activeTab.cashReceived) < remainingToPay) { alert('⚠️ รับเงินมาไม่ครบ'); return; }
        if (netTotal < 0) { alert('⚠️ ยอดสุทธิติดลบ'); return; }
        
        submitLockRef.current = true;
        setIsProcessing(true);

        try {
            if (activeTab.customer) localStorage.setItem(`dh_cust_pref_${activeTab.customer.uid}`, JSON.stringify({ priceMode: activeTab.priceMode, vatType: activeTab.vatType, fulfillmentType: activeTab.fulfillmentType, receiptFormat: activeTab.receiptFormat }));

            const now = new Date();
            const yy = String(now.getFullYear()).slice(2); const mm = String(now.getMonth() + 1).padStart(2, '0'); const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0'); const min = String(now.getMinutes()).padStart(2, '0'); const sec = String(now.getSeconds()).padStart(2, '0');
            
            let finalOrderId = activeTab.orderId || `TEMP-${yy}${mm}${dd}-${hh}${min}${sec}`; 
            if ((status === 'Paid' || status === 'OnAccount') && finalOrderId.startsWith('TEMP-')) finalOrderId = `DH${yy}${mm}${dd}-${hh}${min}${sec}`; 

            let finalNote = activeTab.billNote || '';
            if (activeTab.appliedPromoDetails) finalNote = finalNote ? `${finalNote}\n[ใช้สิทธิ์โปร: ${activeTab.appliedPromoDetails.title}]` : `[ใช้สิทธิ์โปร: ${activeTab.appliedPromoDetails.title}]`;

            const freebieItems = eligibleFreebies.map(f => ({ sku: f.sku || `FREE-${f.id}`, name: `[แถมฟรี] ${f.itemName}`, qty: sanitizeNum(f.qty) || 1, price: 0, discount: 0, total: 0, isFreebie: true, note: f.title, noteColor: 'rose' }));

            const finalOrderItems = [
                ...activeTab.items.map(i => {
                    const cleanPrice = sanitizeNum(i.price); const cleanDiscount = sanitizeNum(i.discount); const cleanQty = Math.max(1, sanitizeNum(i.qty));
                    return { sku: i.sku || '', name: i.name || '', qty: cleanQty, price: cleanPrice, discount: cleanDiscount, total: Math.max(0, (cleanPrice - cleanDiscount) * cleanQty), note: i.note || '', noteColor: i.noteColor || 'fuchsia', isFreebie: false };
                }), ...freebieItems 
            ];

            const orderData = {
                id: activeTab.docId || null, orderId: finalOrderId,
                orderStatus: status === 'OnAccount' ? 'Pending' : (status === 'Paid' ? 'Paid' : 'Pending'), paymentStatus: status === 'Draft' ? 'Unpaid' : status,
                paymentMethod: activeTab.paymentMethod || 'Transfer', bankAccount: activeTab.paymentMethod === 'Transfer' ? (activeTab.bankAccount || '') : null,
                fulfillmentType: activeTab.fulfillmentType || 'Delivery', courier: activeTab.fulfillmentType === 'Delivery' ? (activeTab.courier || '') : null,
                receiptFormat: activeTab.receiptFormat || 'short', priceMode: activeTab.priceMode || 'wholesale', vatType: activeTab.vatType || 'exempt', vatOnShipping: Boolean(activeTab.vatOnShipping),
                subTotal: sanitizeNum(itemSubTotal), overallDiscount: manualDiscount, promoDiscount: promoDiscount, discountTotal: sanitizeNum(activeTab.items.reduce((sum, item) => sum + (sanitizeNum(item.discount) * Math.max(1, sanitizeNum(item.qty))), 0) + totalDiscount),
                shippingFee: shippingFee, otherFeeName: activeTab.otherFeeName || '', otherFeeAmount: otherFeeAmount, vatAmount: sanitizeNum(vatAmount), netTotal: sanitizeNum(netTotal), walletUsed: walletUsed,
                earnedPoints: status === 'Paid' ? earnedPoints : 0, remainingToPay: sanitizeNum(remainingToPay), cashReceived: activeTab.paymentMethod === 'Cash' ? sanitizeNum(activeTab.cashReceived) : null,
                changeAmount: sanitizeNum(changeAmount) > 0 ? sanitizeNum(changeAmount) : 0, slipImage: activeTab.slipImage || null, appliedPromotion: activeTab.appliedPromoDetails || null,
                appliedFreebies: eligibleFreebies.length > 0 ? eligibleFreebies.map(f => ({ id: f.id, title: f.title, itemName: f.itemName, qty: sanitizeNum(f.qty) })) : null,
                thaiBahtText: convertToThaiBahtText(remainingToPay) || '', billNote: finalNote, sellerUid: auth.currentUser?.uid || 'System',
                customer: activeTab.customer ? { uid: activeTab.customer.uid || '', accountName: activeTab.customer.accountName || activeTab.customer.firstName || '', phone: activeTab.customer.phone || '', address: activeTab.customer.address || '', hidePhone: Boolean(activeTab.hidePhone) } : { uid: 'WALK-IN', accountName: activeTab.walkInName || 'ลูกค้าทั่วไป', phone: activeTab.walkInPhone || '', address: '', hidePhone: Boolean(activeTab.hidePhone) },
                items: finalOrderItems
            };

            await billingService.createOrder(orderData, auth.currentUser?.uid || 'System', 'POS');
            alert(`✅ บันทึกบิลสำเร็จ!\nเลขที่เอกสาร: ${finalOrderId}`);
            clearCart(); onSwitchView();
        } catch (error) { alert(`❌ ข้อผิดพลาด: ${error.message}`); } finally { submitLockRef.current = false; setIsProcessing(false); }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--dh-bg-base)] font-sans relative text-[var(--dh-text-main)] transition-colors duration-300">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#D3DCEB] bg-[#EFF2F9] text-[#2A305A] shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onSwitchView} disabled={isProcessing} className="p-1 text-gray-500 hover:text-[#2A305A] transition-colors dh-active-press"><ArrowLeft size={20}/></button>
                    <h1 className="font-black text-sm tracking-wide text-[#2A305A]">เปิดบิลการขาย</h1>
                    <button onClick={() => setIsGuideModalOpen(true)} className="text-gray-400 hover:text-[#D51C39] transition-colors ml-1" title="คู่มือการใช้งาน">
                        <HelpCircle size={16}/>
                    </button>
                </div>
                
                <div className="flex items-center gap-1 overflow-x-auto max-w-[60vw] custom-scrollbar">
                    {safeCartTabs.map((tab, idx) => (
                        <button key={tab.id} onClick={() => !isProcessing && setActiveTabId(tab.id)}
                            className={`px-5 py-2 text-xs font-black transition-all border-t-2 rounded-t-lg mt-1 mr-1 flex items-center gap-1.5
                                ${activeTabId === tab.id ? 'border-t-[#D51C39] text-[#2A305A] bg-[var(--dh-bg-base)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10 relative' : 'border-t-transparent text-gray-500 bg-[#D9E2EC] hover:text-gray-800 hover:bg-[#CBD5E1]'}`}>
                            {getTabTitle(tab, idx)} {tab.orderId && <span className="text-[9px] opacity-60 font-mono bg-black/5 px-1 rounded">(Draft)</span>}
                        </button>
                    ))}
                    <button onClick={() => { if (!isProcessing) { const newTab = createNewTab(); if(typeof setCartTabs === 'function') { setCartTabs([...safeCartTabs, newTab]); setActiveTabId(newTab.id); } } }} className="p-1.5 ml-1 text-gray-500 hover:text-[#2A305A] hover:bg-gray-200 transition-colors bg-white/50 border border-gray-200 rounded-md dh-active-press mt-1"><Plus size={16}/></button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-[var(--dh-bg-base)] p-3 gap-4">
                <div className="w-full flex-1 flex flex-col h-full bg-[var(--dh-bg-surface)] rounded-xl border border-gray-200 z-10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="flex-1 flex flex-col overflow-hidden" onFocusCapture={handleInteractWithOtherPanels} onClickCapture={handleInteractWithOtherPanels}>
                        <CartPanel searchRef={searchRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleSearchKeyDown={handleSearchKeyDown} clearCart={clearCart} activeTab={activeTab} searchResults={searchResults} addItemToCart={addItemToCart} actionBoxItem={actionBoxItem} setActionBoxItem={setActionBoxItem} updateItemAction={updateItemAction} removeItem={removeItem} eligibleFreebies={eligibleFreebies} noteColorMap={noteColorMap} isProcessing={isProcessing} />
                    </div>
                    <PaymentPanel itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatOnShipping={activeTab.vatOnShipping} vatAmount={vatAmount} vatType={activeTab.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} earnedPoints={earnedPoints} activeTab={activeTab} updateActiveTab={updateActiveTab} changeAmount={changeAmount} handleFileUpload={handleFileUpload} setPreviewSlip={setPreviewSlip} handleCheckout={handleCheckout} isProcessing={isProcessing} hasOutOfStock={hasOutOfStock} setShowPreview={setShowPreview} convertToThaiBahtText={convertToThaiBahtText} isUploadingSlip={isUploadingSlip} isCollapsed={isPaymentPanelCollapsed} setIsCollapsed={setIsPaymentPanelCollapsed} isLocked={isPaymentPanelLocked} setIsLocked={setIsPaymentPanelLocked} />
                </div>
                <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 bg-[var(--dh-bg-surface)] rounded-xl border border-gray-200 h-full overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]" onFocusCapture={handleInteractWithOtherPanels} onClickCapture={handleInteractWithOtherPanels}>
                    <SettingsPanel activeTab={activeTab} updateActiveTab={updateActiveTab} handlePriceModeChange={handlePriceModeChange} custSearchRef={custSearchRef} customerSearchText={customerSearchText} setCustomerSearchText={setCustomerSearchText} showCustDropdown={showCustDropdown} setShowCustDropdown={setShowCustDropdown} filteredCustomers={filteredCustomers} handleSelectCustomer={handleSelectCustomer} netTotal={netTotal} setIsPromoModalOpen={setIsPromoModalOpen} handleRemovePromotion={handleRemovePromotion} isProcessing={isProcessing} />
                </div>
            </div>

            {isPromoModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
                    <div className="bg-[var(--dh-bg-surface)] dh-glass border border-[var(--dh-glass-border)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden dh-hover-lift">
                        <div className="p-4 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-base)]">
                            <h2 className="text-sm font-black text-[var(--dh-text-main)] dh-text-glow">โปรโมชันที่มี</h2>
                            <button onClick={() => setIsPromoModalOpen(false)} className="text-[var(--dh-text-muted)] hover:text-rose-500 dh-active-press"><X size={18}/></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                            {activePromotions.length === 0 ? (<p className="text-center py-6 text-[var(--dh-text-muted)] text-sm font-bold">ไม่มีโปรโมชัน</p>) : (
                                activePromotions.map(promo => {
                                    const isEligible = promo.minSpend <= 0 || itemSubTotal >= promo.minSpend;
                                    const isApplied = activeTab.appliedPromoId === promo.id;
                                    return (
                                        <div key={promo.id} className={`p-4 rounded-xl border-2 transition-all ${isApplied ? 'border-[var(--dh-accent)] bg-[var(--dh-accent-light)]' : isEligible ? 'border-[var(--dh-border)] hover:border-[var(--dh-text-main)] bg-[var(--dh-bg-base)] cursor-pointer dh-active-press' : 'border-[var(--dh-border)] bg-[var(--dh-bg-base)] opacity-50'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className={`font-black text-sm ${isApplied ? 'text-[var(--dh-accent)]' : 'text-[var(--dh-text-main)]'}`}>{promo.title}</h3>
                                                    <p className="text-[11px] text-[var(--dh-text-muted)] mt-1 font-bold">{promo.description}</p>
                                                </div>
                                                <div className={`font-black text-lg ${isApplied ? 'text-[var(--dh-accent)]' : 'text-[var(--dh-text-main)]'}`}>ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}</div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--dh-border)]/50">
                                                <p className="text-[10px] text-[var(--dh-text-muted)] font-black uppercase tracking-wider">{promo.minSpend > 0 ? `ขั้นต่ำ ${promo.minSpend.toLocaleString()} ฿` : 'ไม่มีขั้นต่ำ'}</p>
                                                <button onClick={() => isEligible ? handleApplyPromotion(promo) : null} disabled={!isEligible} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-colors dh-active-press ${isApplied ? 'bg-[var(--dh-accent)] text-white shadow-md' : isEligible ? 'bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] hover:bg-[var(--dh-text-main)] hover:text-[var(--dh-bg-surface)]' : 'bg-[var(--dh-bg-base)] text-[var(--dh-text-muted)] border border-[var(--dh-border)]'}`}>
                                                    {isApplied ? 'ใช้งานอยู่' : isEligible ? 'เลือก' : 'ยอดไม่ถึง'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {previewSlip && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm" onClick={() => setPreviewSlip(null)}>
                    <div className="relative max-w-2xl"><button onClick={() => setPreviewSlip(null)} className="absolute -top-12 right-0 text-white opacity-70 hover:opacity-100 dh-active-press bg-black/50 p-2 rounded-full"><X size={24}/></button><img src={previewSlip} alt="Slip" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" /></div>
                </div>
            )}

            {showPreview && (
                <ReceiptTemplate activeTab={activeTab} updateActiveTab={updateActiveTab} onClose={() => setShowPreview(false)} convertToThaiBahtText={convertToThaiBahtText} itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatAmount={vatAmount} vatType={activeTab.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} />
            )}

            {isGuideModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setIsGuideModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-[#EFF2F9]">
                            <h2 className="text-base font-black text-[#2A305A] flex items-center gap-2"><HelpCircle size={18} className="text-[#D51C39]"/> คู่มือการใช้งาน: เปิดบิลการขาย</h2>
                            <button onClick={() => setIsGuideModalOpen(false)} className="text-gray-400 hover:text-[#D51C39] transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-gray-700">
                            
                            <section>
                                <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">1. โซนตะกร้าสินค้า (ซ้ายบน)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>การค้นหาสินค้า:</strong> กด <code>F3</code> เพื่อพิมพ์ค้นหา หรือใช้เครื่องยิงบาร์โค้ดสแกนได้ทันที</li>
                                    <li><strong>การแก้ไขรายการ:</strong> คลิกที่ชื่อสินค้าเพื่อแก้ไขจำนวนหรือส่วนลดรายชิ้น หรือกดปุ่ม <code>-</code> / <code>+</code> ด้านขวา</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">2. โซนตั้งค่าบิล (ขวามือ)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>การเลือกลูกค้า:</strong> ค้นหาด้วยชื่อหรือเบอร์โทร หากเป็นลูกค้าใหม่สามารถกด "ดึงข้อมูลจากระบบ" เพื่อกรอกอัตโนมัติ</li>
                                    <li><strong>รูปแบบบิลและ VAT:</strong> เลือกระดับราคา (B2B/ปลีก) และรูปแบบภาษี (ไม่มี VAT, รวม VAT, แยก VAT) ตามที่ต้องการ</li>
                                    <li><strong>ค่าจัดส่งและส่วนลด:</strong> มีปุ่มลัดสำหรับใส่ค่าส่งด่วน (เช่น +40, +60) หรือส่วนลดทันที</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">3. โซนชำระเงิน (ด้านล่าง)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>การยุบแผง:</strong> แผงสรุปเงินจะยุบอัตโนมัติเพื่อให้หน้าจอกว้างขึ้น คุณสามารถกด <code>ล็อค</code> (ไอคอนกุญแจ) เพื่อเปิดค้างไว้ได้</li>
                                    <li><strong>การรับชำระ:</strong> ระบุยอดเงินสด หรือกด <code>พอดี</code> เพื่อรับเงินสดแบบรวดเร็ว หากโอนเงินสามารถแนบสลิปผ่านปุ่มแนบไฟล์ หรือกด <code>Ctrl+V</code> เพื่อวางสลิป</li>
                                    <li><strong>ปุ่มลัดยืนยัน:</strong> สามารถกด <code>Ctrl + Enter</code> เพื่อยืนยันการรับชำระเงิน (Paid) อย่างรวดเร็ว</li>
                                </ul>
                            </section>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}