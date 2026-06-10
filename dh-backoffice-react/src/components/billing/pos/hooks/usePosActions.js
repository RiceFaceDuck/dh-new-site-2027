import { auth } from '../../../../firebase/config';
import { billingService } from '../../../../firebase/billingService';
import { driveService } from '../../../../firebase/driveService';

export const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

export const usePosActions = ({
    posState,
    products,
    customers,
    searchRef,
    submitLockRef,
    onSwitchView,
    convertToThaiBahtText
}) => {
    const {
        activeTab, updateActiveTab, createNewTab,
        setSearchQuery, setShowDropdown, setCustomerSearchText,
        setShowCustDropdown, setIsPromoModalOpen,
        setActionBoxItem, setIsProcessing, setIsUploadingSlip,
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, eligibleFreebies
    } = posState;

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
    
    const removeItem = (sku) => { 
        updateActiveTab({ items: activeTab.items.filter(i => i.sku !== sku) }); 
        if (posState.actionBoxItem === sku) setActionBoxItem(null); 
    };
    
    const clearCart = () => {
        if(window.confirm('คุณต้องการล้างบิลนี้ทิ้งใช่หรือไม่?')) { 
            updateActiveTab(createNewTab()); 
            setActionBoxItem(null); 
            setCustomerSearchText(''); 
            searchRef.current?.querySelector('input')?.focus(); 
        }
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
            posState.handlePriceModeChange('wholesale');
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingSlip(true); 
        try {
            const uploadedUrl = await driveService.uploadSlip(file);
            updateActiveTab({ slipImage: uploadedUrl, transactionRef: '', transferDateTime: '' });
        } catch (error) { alert(`อัปโหลดไม่สำเร็จ: ${error.message}`); } finally { setIsUploadingSlip(false); }
    };

    const handleCheckout = async (status) => { 
        if (submitLockRef.current || posState.isProcessing) return;

        const activePhone = activeTab.customer ? (activeTab.customer.phone || activeTab.customer.phoneNumber || '') : (activeTab.walkInPhone || '');
        const isPhoneMissing = (!activeTab.hidePhone) && (!activePhone || activePhone.trim() === '');
        const hasOutOfStock = activeTab.items.some(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));

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
                customer: activeTab.customer ? { uid: activeTab.customer.uid || '', accountName: activeTab.customer.accountName || activeTab.customer.displayName || activeTab.customer.firstName || activeTab.customer.name || '', phone: activeTab.customer.phone || activeTab.customer.phoneNumber || '', address: activeTab.customer.address || '', hidePhone: Boolean(activeTab.hidePhone) } : { uid: 'WALK-IN', accountName: activeTab.walkInName || 'ลูกค้าทั่วไป', phone: activeTab.walkInPhone || '', address: '', hidePhone: Boolean(activeTab.hidePhone) },
                items: finalOrderItems
            };

            await billingService.createOrder(orderData, auth.currentUser?.uid || 'System', 'POS');
            
            // ลบแท็บปัจจุบันแบบไม่ต้องเด้งถาม เพราะเซฟเสร็จแล้ว
            posState.closeTab(activeTab.id); 
            onSwitchView();
        } catch (error) { alert(`❌ ข้อผิดพลาด: ${error.message}`); } finally { submitLockRef.current = false; setIsProcessing(false); }
    };

    return {
        addItemToCart,
        updateItemAction,
        removeItem,
        clearCart,
        handleSelectCustomer,
        handleApplyPromotion,
        handleRemovePromotion,
        handleFileUpload,
        handleCheckout,
        applyPromotionLogic
    };
};
