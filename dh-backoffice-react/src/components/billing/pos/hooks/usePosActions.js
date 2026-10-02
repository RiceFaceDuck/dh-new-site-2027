import { auth, storage } from '../../../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImageWithCanvas } from 'dh-shared/src/utils/imageProcessingUtils.js';
import { billingService } from '../../../../firebase/billingService';
import { syncRecentOrdersCatalog } from '../../../../firebase/orderSyncService';
import { offlinePosService } from '../../../../firebase/offlinePosService';
import { toast } from 'react-hot-toast';
import { useCallback } from 'react';

import { safeJsonParse } from 'dh-shared';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
export const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

// Co-located Slip Storage Service (Firebase Storage upload with Canvas WebP compression)
export const slipStorageService = {
    uploadSlipImage: async (file, orderId = 'UNASSIGNED') => {
        if (!file) throw new Error("กรุณาเลือกไฟล์สลิปโอนเงิน");
        const compressedFile = await compressImageWithCanvas(file, {
            maxWidth: 1200,
            maxHeight: 1600,
            quality: 0.85,
            fileType: 'image/webp'
        });
        const timestamp = Date.now();
        const rand = Math.floor(Math.random() * 10000);
        const safeOrderId = String(orderId || 'UNASSIGNED').replace(/[\/\\#\?]/g, '_');
        const storagePath = `slips/${safeOrderId}/${timestamp}_${rand}.webp`;
        const storageRef = ref(storage, storagePath);
        const metadata = {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable',
            customMetadata: {
                uploadedBy: auth.currentUser?.uid || 'anonymous',
                orderId: safeOrderId,
                uploadedAt: new Date().toISOString()
            }
        };
        const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
        return await getDownloadURL(snapshot.ref);
    },
    extractSlipData: async (file, uploadedUrl) => {
        try {
            const ocrModule = await import(/* @vite-ignore */ 'tesseract.js').catch(() => null);
            if (ocrModule && ocrModule.createWorker) {
                const worker = await ocrModule.createWorker('tha+eng');
                const ret = await worker.recognize(file);
                await worker.terminate();
                const text = ret?.data?.text || '';
                const cleanText = text;
                const refMatch = cleanText.match(/(?:รหัสอ้างอิง|เลขที่รายการ|Ref|Transaction\s*ID)[:\s]*([A-Za-z0-9]+)/i);
                const dateMatch = cleanText.match(/(\d{1,2}\s+[^\d\s]+\s+\d{2,4}(?:\s*[-/]?\s*)\d{1,2}:\d{2})/) || cleanText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s+\d{1,2}:\d{2})/);
                return {
                    rawText: text,
                    transactionRef: refMatch ? refMatch[1] : '',
                    transferDateTime: dateMatch ? dateMatch[1] : '',
                    transferNote: 'สแกนสลิปสำเร็จ'
                };
            }
        } catch (e) {
            console.warn('[Slip OCR] Client OCR fallback:', e);
        }
        return {
            transactionRef: '',
            transferDateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
            transferNote: 'อัปโหลดสลิปสำเร็จ (รอตรวจสอบยอด)'
        };
    }
};

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
            updateActiveTab({ items: [{ sku: product.sku, name: product.name, type: product.type || '', category: product.category || '', baseWholesale, baseRetail, price: targetPrice, qty: 1, discount: 0, stock: product.stockQuantity, note: '', noteColor: 'slate' }, ...activeTab.items] });
        }
        setSearchQuery(''); setShowDropdown(false);
        setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 10);
    };

    const updateItemAction = useCallback((sku, field, value) => {
        updateActiveTab(tab => ({ items: tab.items.map(i => i.sku === sku ? { ...i, [field]: value } : i) }));
    }, [updateActiveTab]);
    
    const removeItem = useCallback((sku) => { 
        updateActiveTab(tab => ({ items: tab.items.filter(i => i.sku !== sku) })); 
        setActionBoxItem(prev => prev === sku ? null : prev); 
    }, [updateActiveTab, setActionBoxItem]);
    
    const clearCart = () => {
        if(window.confirm('คุณต้องการล้างบิลนี้ทิ้งใช่หรือไม่?')) { 
            updateActiveTab(createNewTab()); 
            setActionBoxItem(null); 
            setCustomerSearchText(''); 
            searchRef.current?.querySelector('input')?.focus(); 
        }
    };

    const handleSelectCustomer = (uidOrId) => {
        console.log("handleSelectCustomer called with:", uidOrId);
        const cust = customers.find(c => c.uid === uidOrId || c.id === uidOrId);
        console.log("Customer found:", JSON.stringify(cust));
        if (cust) {
            let mem = {};
            try {
                mem = safeJsonParse(localStorage.getItem(`dh_cust_pref_${uidOrId}`)) || {};
            } catch (e) {
                console.error("Failed to parse customer preference", e);
            }
            const pref = { ...(cust.preferences || {}), ...mem };
            const roleStr = String(cust.role || cust.rank || '').toLowerCase();
            const isRoleWholesale = roleStr.includes('wholesale') || roleStr.includes('ช่าง') || roleStr.includes('partner') || roleStr.includes('enterprise') || roleStr.includes('ใหญ่');
            const isCompany = cust.accountName?.includes('บริษัท');
            const targetMode = pref.priceMode || pref.defaultPriceTier || (isRoleWholesale || isCompany ? 'wholesale' : 'retail');
            const targetVat = pref.vatType || pref.defaultVatMode || (isCompany ? 'included' : 'exempt');
            const targetFulfillment = pref.fulfillmentType || (cust.logisticProvider ? 'Delivery' : 'StorePickup');
            const targetCourier = pref.courier || pref.defaultCourier || (cust.logisticProvider || 'KEX');
            const targetReceiptFormat = pref.receiptFormat || pref.defaultBillType || 'short';
            const updatedItems = activeTab.items.map(item => ({ ...item, price: targetMode === 'wholesale' ? item.baseWholesale : item.baseRetail }));

            updateActiveTab({ 
                customer: cust, priceMode: targetMode, vatType: targetVat,
                fulfillmentType: targetFulfillment, courier: targetCourier,
                receiptFormat: targetReceiptFormat, paymentMethod: 'Transfer', walkInName: '', walkInPhone: '', hidePhone: false, items: updatedItems, walletUsed: 0 
            });
            setCustomerSearchText(''); 
        } else {
            posState.handlePriceModeChange('wholesale');
            updateActiveTab({ customer: null, vatType: 'exempt', fulfillmentType: 'Delivery', paymentMethod: 'Transfer', receiptFormat: 'short', walletUsed: 0 });
            setCustomerSearchText('');
        }
        setShowCustDropdown(false);
    };

    const applyPromotionLogic = (promo, subTotalAmount, items = []) => {
        if (!promo) return 0;
        
        let eligibleTotal = subTotalAmount;
        const hasSkus = promo.applicableSkus && promo.applicableSkus.length > 0;
        const hasTypes = promo.applicableTypes && promo.applicableTypes.length > 0;

        if ((hasSkus || hasTypes) && items && items.length > 0) {
            eligibleTotal = items.reduce((acc, item) => {
                const itemSku = String(item.sku || '').toUpperCase();
                const itemType = String(item.type || item.category || '').toUpperCase();
                let isEligible = false;

                if (hasSkus && promo.applicableSkus.some(s => String(s).toUpperCase() === itemSku)) isEligible = true;
                if (hasTypes && promo.applicableTypes.some(t => String(t).toUpperCase() === itemType)) isEligible = true;

                if (isEligible) {
                    return acc + ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty)));
                }
                return acc;
            }, 0);
        }

        let calculatedDiscount = promo.type === 'PERCENTAGE' ? eligibleTotal * (promo.value / 100) : Math.min(promo.value, eligibleTotal);
        if (promo.type === 'PERCENTAGE' && promo.maxDiscount > 0) {
            calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
        }
        return Math.floor(calculatedDiscount);
    };

    const handleApplyPromotion = (promo, isAuto = false) => {
        if (!promo) return;
        if (promo.minSpend > 0 && itemSubTotal < promo.minSpend) {
            toast.error(`ยอดซื้อไม่ถึงขั้นต่ำ ${promo.minSpend.toLocaleString()} ฿`);
            return;
        }
        if (promo.quotaLimit && (promo.quotaUsed || 0) >= promo.quotaLimit) {
            toast.error(`สิทธิ์โปรโมชัน "${promo.title}" เต็มแล้ว`);
            return;
        }
        updateActiveTab({ promoDiscount: applyPromotionLogic(promo, itemSubTotal, activeTab.items), appliedPromoId: promo.id, appliedPromoDetails: { ...promo }, autoPromoEnabled: isAuto ? true : false });
        setIsPromoModalOpen(false);
    };

    const handleRemovePromotion = () => { updateActiveTab({ promoDiscount: 0, appliedPromoId: null, appliedPromoDetails: null, autoPromoEnabled: false }); };

    const handleRemoveFreebie = (freebieId) => {
        const autoEnabled = activeTab?.autoFreebieEnabled !== false;
        if (autoEnabled) {
            const currentDisabled = activeTab?.disabledFreebieIds || [];
            if (!currentDisabled.includes(freebieId)) {
                updateActiveTab({ disabledFreebieIds: [...currentDisabled, freebieId] });
            }
        } else {
            const currentManual = activeTab?.manualFreebieIds || [];
            updateActiveTab({ manualFreebieIds: currentManual.filter(id => id !== freebieId) });
        }
    };

    const handleFileUpload = async (e, onOcrComplete = null) => {
        const file = e?.target?.files?.[0] || e;
        if (!file || !(file instanceof Blob)) return null;
        setIsUploadingSlip(true); 
        try {
            const orderIdForSlip = activeTab.orderId || `POS_TEMP_${Date.now()}`;
            const uploadFn = slipStorageService.uploadSlipImage || slipStorageService.uploadSlip;
            const uploadedUrl = await uploadFn(file, orderIdForSlip);

            // Extract or derive storagePath
            let storagePath = '';
            try {
                const urlMatch = String(uploadedUrl || '').match(/\/o\/([^?]+)/);
                if (urlMatch && urlMatch[1]) {
                    storagePath = decodeURIComponent(urlMatch[1]);
                }
            } catch (_) {}

            // Run OCR extraction
            let ocrData = null;
            try {
                if (slipStorageService.extractSlipData) {
                    ocrData = await slipStorageService.extractSlipData(file, uploadedUrl);
                } else if (slipStorageService.verifySlipOcr) {
                    const ocrRes = await slipStorageService.verifySlipOcr(uploadedUrl, orderIdForSlip, remainingToPay, file);
                    ocrData = ocrRes?.ocrData || null;
                } else if (slipStorageService.runClientTesseractOcr) {
                    ocrData = await slipStorageService.runClientTesseractOcr(file);
                }
            } catch (ocrErr) {
                console.warn("[POS OCR] Slip OCR extraction warning:", ocrErr);
            }

            const patch = {
                slipImage: uploadedUrl,
                slipUrl: uploadedUrl,
                slipStoragePath: storagePath || `slips/${orderIdForSlip}`,
                ocrResult: ocrData || null,
                slipVerificationStatus: ocrData ? 'verified' : 'unverified'
            };

            // Auto-populate bank reference fields if found by OCR
            if (ocrData) {
                if (ocrData.transactionRef && ocrData.transactionRef !== 'n/a') {
                    patch.transactionRef = ocrData.transactionRef;
                }
                if (ocrData.transferDateTime && ocrData.transferDateTime !== 'n/a') {
                    patch.transferDateTime = ocrData.transferDateTime;
                }
                if (ocrData.transferNote && ocrData.transferNote !== 'n/a') {
                    patch.transferNote = ocrData.transferNote;
                } else if (ocrData.senderName && ocrData.senderName !== 'n/a') {
                    patch.transferNote = `โอนโดย: ${ocrData.senderName}`;
                }
                if (ocrData.bankAccount && ['BAY', 'KBANK', 'SCB', 'BBL', 'KTB'].includes(ocrData.bankAccount)) {
                    patch.bankAccount = ocrData.bankAccount;
                }
            }

            updateActiveTab(patch);
            if (typeof onOcrComplete === 'function') {
                onOcrComplete(ocrData, uploadedUrl);
            }
            return { uploadedUrl, ocrData };
        } catch (error) {
            console.error("🔥 Error uploading slip:", error);
            toast.error(`อัปโหลดสลิปไม่สำเร็จ: ${error.message}`);
            return null;
        } finally {
            setIsUploadingSlip(false);
        }
    };

    const handleCheckout = async (status) => { 
        if (submitLockRef.current || posState.isProcessing) return;

        const activePhone = activeTab.customer ? (activeTab.customer.phone || activeTab.customer.phoneNumber || '') : (activeTab.walkInPhone || '');
        const isPhoneMissing = (!activeTab.hidePhone) && (!activePhone || activePhone.trim() === '');

        // Check both individual line stock and aggregated stock across split lines (Caveat 3.2)
        const lineOutOfStock = (activeTab.items || []).find(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));
        const aggregatedStockDemand = (activeTab.items || []).reduce((acc, item) => {
            const key = item.sku || item.id || item.name || 'unknown';
            const qty = sanitizeNum(item.qty);
            const stock = sanitizeNum(item.stock);
            if (!acc[key]) {
                acc[key] = {
                    key,
                    name: item.name || item.itemName || key,
                    totalQty: 0,
                    stock: stock
                };
            } else {
                acc[key].stock = Math.min(acc[key].stock, stock);
            }
            acc[key].totalQty += qty;
            return acc;
        }, {});

        const aggregatedOutOfStock = Object.values(aggregatedStockDemand).find(
            item => item.stock < item.totalQty
        );
        const outOfStockItem = aggregatedOutOfStock || lineOutOfStock;

        if (activeTab.items.length === 0) { toast.error('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'); return; }
        if (outOfStockItem && status === 'Paid') {
            toast.error(`สินค้า [${outOfStockItem.key || outOfStockItem.name}] สต็อกไม่เพียงพอ ไม่สามารถชำระเงินได้ (กรุณาบันทึกเป็นบิลร่าง Draft)`);
            return;
        }
        if (isPhoneMissing && status !== 'Draft') { toast.error('กรุณาระบุเบอร์โทรศัพท์ลูกค้า'); return; }
        if (status === 'Paid' && activeTab.paymentMethod === 'Cash' && sanitizeNum(activeTab.cashReceived) < remainingToPay) { toast.error('รับเงินมาไม่ครบ'); return; }
        if (netTotal < 0) { toast.error('ยอดสุทธิติดลบ'); return; }
        
        submitLockRef.current = true;
        setIsProcessing(true);

        try {
            if (activeTab.customer) localStorage.setItem(`dh_cust_pref_${activeTab.customer.uid}`, JSON.stringify({ priceMode: activeTab.priceMode, vatType: activeTab.vatType, fulfillmentType: activeTab.fulfillmentType, receiptFormat: activeTab.receiptFormat }));

            const now = new Date();
            const yy = String(now.getFullYear()).slice(2); const mm = String(now.getMonth() + 1).padStart(2, '0'); const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0'); const min = String(now.getMinutes()).padStart(2, '0'); const sec = String(now.getSeconds()).padStart(2, '0');
            
            let finalOrderId = activeTab.orderId || `DH-TEMP-${yy}${mm}${dd}-${hh}${min}${sec}`;

            const finalNote = activeTab.billNote ? `${activeTab.billNote}\n[บันทึกโดยระบบอัตโนมัติ]` : '[บันทึกโดยระบบอัตโนมัติ]';

            const freebieItems = eligibleFreebies.map(f => {
                let conditionText = [];
                if (f.minSpend > 0) conditionText.push(`ยอด${f.minSpend}฿`);
                if (f.minQty > 0) conditionText.push(`ครบ${f.minQty}ชิ้น`);
                if (f.applicableSkus?.length > 0) conditionText.push(`เฉพาะรุ่น`);
                const reasonStr = conditionText.length > 0 ? ` (${conditionText.join(', ')})` : '';
                return { 
                    sku: f.itemName, 
                    name: `[แถมฟรี] ${f.productName || f.itemName}`, 
                    qty: Math.min(sanitizeNum(f.qty), sanitizeNum(f.maxPerBill) || sanitizeNum(f.qty)), 
                    price: 0, discount: 0, total: 0, isFreebie: true, note: `${f.title}${reasonStr}`, noteColor: 'rose' 
                };
            });

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
                transactionRef: activeTab.paymentMethod === 'Transfer' ? (activeTab.transactionRef || '') : '',
                transferDateTime: activeTab.paymentMethod === 'Transfer' ? (activeTab.transferDateTime || '') : '',
                transferNote: activeTab.paymentMethod === 'Transfer' ? (activeTab.transferNote || '') : '',
                slipUrl: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipUrl || activeTab.slipImage || null) : null,
                slipImage: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipImage || activeTab.slipUrl || null) : null,
                slipStoragePath: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipStoragePath || null) : null,
                slipVerificationStatus: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipVerificationStatus || (activeTab.slipUrl || activeTab.slipImage ? 'unverified' : 'none')) : 'none',
                ocrResult: activeTab.paymentMethod === 'Transfer' ? (activeTab.ocrResult || null) : null,
                fulfillmentType: activeTab.fulfillmentType || 'Delivery', courier: activeTab.fulfillmentType === 'Delivery' ? (activeTab.courier || '') : null,
                receiptFormat: activeTab.receiptFormat || 'short', priceMode: activeTab.priceMode || 'wholesale', vatType: activeTab.vatType || 'exempt', vatOnShipping: Boolean(activeTab.vatOnShipping),
                subTotal: sanitizeNum(itemSubTotal), overallDiscount: manualDiscount, promoDiscount: promoDiscount, discountTotal: sanitizeNum(activeTab.items.reduce((sum, item) => sum + (sanitizeNum(item.discount) * Math.max(1, sanitizeNum(item.qty))), 0) + totalDiscount),
                shippingFee: shippingFee, otherFeeName: activeTab.otherFeeName || '', otherFeeAmount: otherFeeAmount, vatAmount: sanitizeNum(vatAmount), netTotal: sanitizeNum(netTotal), walletUsed: walletUsed,
                earnedPoints: status === 'Paid' ? earnedPoints : 0, remainingToPay: sanitizeNum(remainingToPay), cashReceived: activeTab.paymentMethod === 'Cash' ? sanitizeNum(activeTab.cashReceived) : null,
                changeAmount: sanitizeNum(changeAmount) > 0 ? sanitizeNum(changeAmount) : 0, 
                appliedPromotion: activeTab.appliedPromoDetails || null,
                appliedPromotions: activeTab.appliedPromoDetails ? [activeTab.appliedPromoDetails] : [],
                appliedFreebies: eligibleFreebies.length > 0 ? eligibleFreebies.map(f => ({ id: f.id, title: f.title, conditionText: (f.minSpend > 0 ? `ยอด${f.minSpend}฿ ` : '') + (f.minQty > 0 ? `ครบ${f.minQty}ชิ้น ` : '') + (f.applicableSkus?.length > 0 ? `เฉพาะรุ่น` : ''), itemName: f.itemName, productName: f.productName || null, qty: sanitizeNum(f.qty) })) : null,
                thaiBahtText: convertToThaiBahtText(remainingToPay) || '', billNote: finalNote, sellerUid: auth.currentUser?.uid || 'System',
                customer: activeTab.customer ? { uid: activeTab.customer.uid || '', accountName: getCustomerDisplayName(activeTab.customer, ''), phone: activeTab.customer.phone || activeTab.customer.phoneNumber || '', address: activeTab.customer.address || '', hidePhone: Boolean(activeTab.hidePhone) } : { uid: 'WALK-IN', accountName: activeTab.walkInName || 'ลูกค้าทั่วไป', phone: activeTab.walkInPhone || '', address: '', hidePhone: Boolean(activeTab.hidePhone) },
                items: finalOrderItems
            };

            // 🟢 [OFFLINE SUPPORT] Check if network is offline
            if (!navigator.onLine) {
                if ((status === 'Paid' || status === 'OnAccount') && finalOrderId.startsWith('DH-TEMP-')) {
                    finalOrderId = `DH${yy}${mm}${dd}-${hh}${min}${sec}`; 
                    orderData.orderId = finalOrderId;
                }
                orderData.offlineStatus = 'pending';
                await offlinePosService.saveOfflineOrder(orderData);
                posState.closeTab(activeTab.id); 
                onSwitchView();
                toast.success(`[ออฟไลน์] บันทึกบิล ${finalOrderId} ไว้ในเครื่องเรียบร้อย ระบบจะส่งข้อมูลเมื่อกลับมาออนไลน์`);
                return;
            }

            const result = await billingService.createOrder(orderData, auth.currentUser?.uid || 'System', 'POS');
            const actualOrderId = result?.orderId || finalOrderId;

            // ⚡ Sync recent orders catalog so order list displays new order immediately
            syncRecentOrdersCatalog(actualOrderId).catch(e => console.warn("[POS OrderSync] Background sync error:", e));
            
            // ลบแท็บปัจจุบันแบบไม่ต้องเด้งถาม เพราะเซฟเสร็จแล้ว
            posState.closeTab(activeTab.id); 
            onSwitchView();
            toast.success(`บันทึกบิล ${actualOrderId} สำเร็จ!`);
        } catch (error) { toast.error(`ข้อผิดพลาด: ${error.message}`); } finally { submitLockRef.current = false; setIsProcessing(false); }
    };

    return {
        addItemToCart,
        updateItemAction,
        removeItem,
        clearCart,
        handleSelectCustomer,
        handleApplyPromotion,
        handleRemovePromotion,
        handleRemoveFreebie,
        handleFileUpload,
        handleCheckout,
        applyPromotionLogic
    };
};
