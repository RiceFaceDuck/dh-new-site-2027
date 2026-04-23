import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, ArrowLeft, Eye, QrCode, X, Megaphone, Check, Gift } from 'lucide-react';
import { billingService } from '../../firebase/billingService';
import { promotionService } from '../../firebase/promotionService'; 
import { freebieService } from '../../firebase/freebieService'; 
import { auth } from '../../firebase/config';
import { driveService } from '../../firebase/driveService'; 

import CartPanel from './pos/CartPanel';
import PaymentPanel from './pos/PaymentPanel';
import SettingsPanel from './pos/SettingsPanel';
import ReceiptTemplate from './pos/ReceiptTemplate'; 

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

export default function PosSystem({ products = [], customers = [], cartTabs = [], setCartTabs, activeTabId, setActiveTabId, onSwitchView }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionBoxItem, setActionBoxItem] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewSlip, setPreviewSlip] = useState(null); 
    const [isUploadingSlip, setIsUploadingSlip] = useState(false);
    const [customerSearchText, setCustomerSearchText] = useState('');
    const [showCustDropdown, setShowCustDropdown] = useState(false);
    const [activePromotions, setActivePromotions] = useState([]);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [activeFreebies, setActiveFreebies] = useState([]);

    const searchRef = useRef(null);
    const custSearchRef = useRef(null);
    const submitLockRef = useRef(false);

    const createNewTab = () => ({
        id: Date.now().toString(), orderId: null, docId: null, items: [], customer: null, priceMode: 'wholesale',
        walkInName: '', walkInPhone: '', hidePhone: false, fulfillmentType: 'Delivery', courier: 'KEX', shippingFee: 0, vatOnShipping: false, vatType: 'exempt', 
        overallDiscount: 0, promoDiscount: 0, autoPromoEnabled: true, otherFeeName: '', otherFeeAmount: 0, 
        paymentMethod: 'Transfer', bankAccount: 'KBANK', cashReceived: '', slipImage: null, billNote: '', receiptFormat: 'short',
        appliedPromoId: null, appliedPromoDetails: null, walletUsed: 0 
    });

    const safeCartTabs = Array.isArray(cartTabs) && cartTabs.length > 0 ? cartTabs : [createNewTab()];
    const activeTab = safeCartTabs.find(t => t.id === activeTabId) || safeCartTabs[0];

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
        const fetchMarketingData = async () => {
            try {
                const [promos, freebies] = await Promise.all([promotionService.getActivePromotions(), freebieService.getActiveFreebies()]);
                setActivePromotions(promos || []); setActiveFreebies(freebies || []);
            } catch(e) { console.error(e); }
        };
        fetchMarketingData();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return products.slice(0, 15);
        const q = searchQuery.toLowerCase();
        return products.filter(p => p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q)).slice(0, 15);
    }, [searchQuery, products]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            const exactMatch = products.find(p => p.sku.toLowerCase() === searchQuery.trim().toLowerCase());
            if (exactMatch) addItemToCart(exactMatch); else if (searchResults.length > 0) addItemToCart(searchResults[0]);
        }
        if (e.key === 'Escape') { setShowDropdown(false); setSearchQuery(''); }
    };

    const filteredCustomers = useMemo(() => {
        if (!customerSearchText.trim()) return customers.slice(0, 10);
        const q = customerSearchText.toLowerCase();
        return customers.filter(c => (c.accountName || '').toLowerCase().includes(q) || (c.firstName || '').toLowerCase().includes(q) || (c.phone || '').includes(q)).slice(0, 15);
    }, [customerSearchText, customers]);

    const updateActiveTab = (updates) => {
        if (typeof setCartTabs === 'function') setCartTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, ...updates } : tab));
    };

    const handlePriceModeChange = (mode) => {
        const updatedItems = activeTab.items.map(item => { const newPrice = mode === 'wholesale' ? item.baseWholesale : item.baseRetail; return { ...item, price: newPrice }; });
        updateActiveTab({ priceMode: mode, items: updatedItems });
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

    const itemSubTotal = activeTab.items.reduce((sum, item) => sum + ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty))), 0);
    const manualDiscount = sanitizeNum(activeTab.overallDiscount);
    const promoDiscount = sanitizeNum(activeTab.promoDiscount);
    const totalDiscount = manualDiscount + promoDiscount;
    const shippingFee = sanitizeNum(activeTab.shippingFee);
    const otherFeeAmount = sanitizeNum(activeTab.otherFeeAmount);
    
    let baseTotal = Math.max(0, itemSubTotal - totalDiscount) + otherFeeAmount;
    let taxableAmount = baseTotal + (activeTab.vatOnShipping ? shippingFee : 0);
    let vatAmount = 0; let netTotal = 0;

    if (activeTab.vatType === 'included') { vatAmount = taxableAmount - (taxableAmount / 1.07); netTotal = baseTotal + shippingFee; } 
    else if (activeTab.vatType === 'excluded') { vatAmount = taxableAmount * 0.07; netTotal = baseTotal + shippingFee + vatAmount; } 
    else { vatAmount = 0; netTotal = baseTotal + shippingFee; }

    const walletUsed = sanitizeNum(activeTab.walletUsed);
    const remainingToPay = Math.max(0, netTotal - walletUsed);
    const earnedPoints = activeTab.customer ? Math.floor(remainingToPay / 100) : 0;
    const changeAmount = (activeTab.paymentMethod === 'Cash' && activeTab.cashReceived) ? (sanitizeNum(activeTab.cashReceived) - remainingToPay) : 0;

    const eligibleFreebies = activeFreebies.filter(f => itemSubTotal > 0 && itemSubTotal >= f.minSpend);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // ✨ UI/UX: ธรรมดามากที่สุด Edge-to-Edge Layout สะอาดตา
        <div className="flex flex-col h-full bg-white font-sans relative">
            
            {/* Header - Simple & Clean */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50/50 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onSwitchView} disabled={isProcessing} className="p-1 text-gray-500 hover:text-gray-800 transition-colors"><ArrowLeft size={20}/></button>
                    <h1 className="font-bold text-gray-800 text-sm">หน้าจอจุดขาย (POS)</h1>
                </div>
                
                <div className="flex items-center gap-1 overflow-x-auto max-w-[60vw] custom-scrollbar">
                    {safeCartTabs.map((tab, idx) => (
                        <button key={tab.id} onClick={() => !isProcessing && setActiveTabId(tab.id)}
                            className={`px-3 py-1 text-xs font-semibold transition-colors border-b-2 rounded-t-sm
                                ${activeTabId === tab.id ? 'border-[var(--dh-accent)] text-[var(--dh-accent)] bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
                            {getTabTitle(tab, idx)} {tab.orderId && <span className="ml-1 text-[9px] text-gray-400 font-mono">(Draft)</span>}
                        </button>
                    ))}
                    <button onClick={() => { if (!isProcessing) { const newTab = createNewTab(); if(typeof setCartTabs === 'function') { setCartTabs([...safeCartTabs, newTab]); setActiveTabId(newTab.id); } } }} className="p-1 ml-1 text-gray-400 hover:text-blue-500 transition-colors"><Plus size={16}/></button>
                </div>
            </div>

            {/* 3 Panels - Solid Borders */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-gray-100">
                <div className="w-full lg:w-[68%] flex flex-col h-full border-r border-gray-200">
                    <CartPanel searchRef={searchRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleSearchKeyDown={handleSearchKeyDown} clearCart={clearCart} activeTab={activeTab} searchResults={searchResults} addItemToCart={addItemToCart} actionBoxItem={actionBoxItem} setActionBoxItem={setActionBoxItem} updateItemAction={updateItemAction} removeItem={removeItem} eligibleFreebies={eligibleFreebies} noteColorMap={noteColorMap} isProcessing={isProcessing} />
                    <PaymentPanel itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatOnShipping={activeTab.vatOnShipping} vatAmount={vatAmount} vatType={activeTab.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} earnedPoints={earnedPoints} activeTab={activeTab} updateActiveTab={updateActiveTab} changeAmount={changeAmount} handleFileUpload={handleFileUpload} setPreviewSlip={setPreviewSlip} handleCheckout={handleCheckout} isProcessing={isProcessing} hasOutOfStock={hasOutOfStock} setShowPreview={setShowPreview} convertToThaiBahtText={convertToThaiBahtText} isUploadingSlip={isUploadingSlip} />
                </div>
                <SettingsPanel activeTab={activeTab} updateActiveTab={updateActiveTab} handlePriceModeChange={handlePriceModeChange} custSearchRef={custSearchRef} customerSearchText={customerSearchText} setCustomerSearchText={setCustomerSearchText} showCustDropdown={showCustDropdown} setShowCustDropdown={setShowCustDropdown} filteredCustomers={filteredCustomers} handleSelectCustomer={handleSelectCustomer} netTotal={netTotal} setIsPromoModalOpen={setIsPromoModalOpen} handleRemovePromotion={handleRemovePromotion} isProcessing={isProcessing} />
            </div>

            {/* Promo Modal - Minimalist */}
            {isPromoModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-md shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-sm font-bold text-gray-800">โปรโมชันที่มี</h2>
                            <button onClick={() => setIsPromoModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                            {activePromotions.length === 0 ? (<p className="text-center py-6 text-gray-500 text-sm">ไม่มีโปรโมชัน</p>) : (
                                activePromotions.map(promo => {
                                    const isEligible = promo.minSpend <= 0 || itemSubTotal >= promo.minSpend;
                                    const isApplied = activeTab.appliedPromoId === promo.id;
                                    return (
                                        <div key={promo.id} className={`p-3 rounded-sm border flex justify-between items-center ${isApplied ? 'border-blue-500 bg-blue-50' : isEligible ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                                            <div>
                                                <h3 className={`font-bold text-sm ${isApplied ? 'text-blue-700' : 'text-gray-800'}`}>{promo.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>
                                                {promo.minSpend > 0 && <p className="text-[10px] text-gray-500 mt-1">ขั้นต่ำ {promo.minSpend.toLocaleString()} ฿</p>}
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold text-base ${isApplied ? 'text-blue-700' : 'text-gray-800'}`}>ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}</div>
                                                <button onClick={() => isEligible ? handleApplyPromotion(promo) : null} disabled={!isEligible} className={`mt-1 px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${isApplied ? 'bg-blue-600 text-white' : isEligible ? 'bg-white border border-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400'}`}>
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
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewSlip(null)}>
                    <div className="relative max-w-2xl"><button onClick={() => setPreviewSlip(null)} className="absolute -top-10 right-0 text-white opacity-70 hover:opacity-100"><X size={24}/></button><img src={previewSlip} alt="Slip" className="max-w-full max-h-[85vh] object-contain rounded-sm" /></div>
                </div>
            )}

            {showPreview && (
                <ReceiptTemplate activeTab={activeTab} updateActiveTab={updateActiveTab} onClose={() => setShowPreview(false)} convertToThaiBahtText={convertToThaiBahtText} itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatAmount={vatAmount} vatType={activeTab.vatType} walletUsed={walletUsed} remainingToPay={remainingToPay} />
            )}
        </div>
    );
}