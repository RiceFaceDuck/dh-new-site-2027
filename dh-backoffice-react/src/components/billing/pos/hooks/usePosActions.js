import { auth } from '../../../../firebase/config';
import { useAuth } from '../../../../contexts/AuthContext';
import { billingService } from '../../../../firebase/billingService';
import { syncRecentOrdersCatalog } from '../../../../firebase/orderSyncService';
import { offlinePosService } from '../../../../firebase/offlinePosService';
import { slipStorageService } from '../../../../firebase/slipStorageService';
import { toast } from 'react-hot-toast';
import { useCallback } from 'react';

import { safeJsonParse } from 'dh-shared';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
export const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

// Centralized Slip Storage Service (with Canvas WebP compression, Firebase Storage upload, async GAS Drive backup, and OCR verification)
export { slipStorageService };

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
        activeTab, updateActiveTab, createNewTab, closeTab,
        setSearchQuery, setShowDropdown, setCustomerSearchText,
        setShowCustDropdown, setIsPromoModalOpen,
        setActionBoxItem, setIsProcessing, setIsUploadingSlip,
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, eligibleFreebies
    } = posState;
    const { profile } = useAuth();

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
        updateActiveTab(tab => ({
            items: tab.items.map(i => {
                if (i.sku !== sku) return i;
                let cleanVal = value;
                if (field === 'qty') cleanVal = Math.max(1, parseInt(value, 10) || 1);
                else if (field === 'price') cleanVal = Math.max(0, sanitizeNum(value));
                else if (field === 'discount') cleanVal = Math.min(Math.max(0, sanitizeNum(i.price)), Math.max(0, sanitizeNum(value)));
                const next = { ...i, [field]: cleanVal };
                if (field === 'price' && sanitizeNum(next.discount) > cleanVal) {
                    next.discount = cleanVal;
                }
                return next;
            })
        }));
    }, [updateActiveTab]);
    
    const removeItem = useCallback((sku) => { 
        updateActiveTab(tab => ({ items: tab.items.filter(i => i.sku !== sku) })); 
        setActionBoxItem(prev => prev === sku ? null : prev); 
    }, [updateActiveTab, setActionBoxItem]);
    
    const clearCart = () => {
        if(window.confirm('คุณต้องการล้างบิลนี้ทิ้งใช่หรือไม่?')) { 
            const freshTab = createNewTab();
            updateActiveTab({ ...freshTab, id: activeTab.id }); 
            setActionBoxItem(null); 
            setCustomerSearchText(''); 
            searchRef.current?.querySelector('input')?.focus(); 
        }
    };

    const handleSelectCustomer = (uidOrId) => {
        const cust = customers.find(c => c.uid === uidOrId || c.id === uidOrId);
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
            const updatedItems = activeTab.items.map(item => {
                const matchedProd = Array.isArray(products) ? products.find(p => p.sku === item.sku || p.id === item.sku) : null;
                const resolvedWholesale = item.baseWholesale ?? matchedProd?.Price ?? matchedProd?.retailPrice ?? item.price ?? 0;
                const resolvedRetail = item.baseRetail ?? matchedProd?.retailPrice ?? matchedProd?.Price ?? item.price ?? 0;
                const candidate = targetMode === 'wholesale' ? resolvedWholesale : resolvedRetail;
                const safePrice = (candidate !== undefined && candidate !== null && Number(candidate) > 0) ? Number(candidate) : Math.max(0, sanitizeNum(item.price));
                return { ...item, baseWholesale: Number(resolvedWholesale || 0), baseRetail: Number(resolvedRetail || 0), price: safePrice };
            });

            const prevFulfillment = activeTab.fulfillmentType;
            updateActiveTab({ 
                customer: cust, priceMode: targetMode, vatType: targetVat,
                fulfillmentType: targetFulfillment, courier: targetCourier,
                receiptFormat: targetReceiptFormat, paymentMethod: 'Transfer', walkInName: '', walkInPhone: '', hidePhone: false, items: updatedItems, walletUsed: 0 
            });
            if (prevFulfillment && prevFulfillment !== targetFulfillment) {
                toast(`ปรับการรับสินค้าเป็น "${targetFulfillment === 'StorePickup' ? 'รับหน้าร้าน' : 'ส่งพัสดุ'}" ตามค่าของลูกค้า`, { id: 'pos-cust-fulfillment', icon: '📦', duration: 3000 });
            }
            setCustomerSearchText(''); 
        } else {
            posState.handlePriceModeChange('wholesale');
            updateActiveTab({ customer: null, vatType: 'exempt', fulfillmentType: 'Delivery', paymentMethod: 'Transfer', receiptFormat: 'short', walletUsed: 0 });
            setCustomerSearchText('');
        }
        setShowCustDropdown(false);
    };

    const applyPromotionLogic = useCallback((promo, subTotalAmount, items = []) => {
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
                    const cleanPrice = Math.max(0, sanitizeNum(item.price));
                    const cleanDiscount = Math.min(cleanPrice, Math.max(0, sanitizeNum(item.discount)));
                    return acc + ((cleanPrice - cleanDiscount) * Math.max(1, sanitizeNum(item.qty)));
                }
                return acc;
            }, 0);
        }

        let calculatedDiscount = promo.type === 'PERCENTAGE' ? eligibleTotal * (promo.value / 100) : Math.min(promo.value, eligibleTotal);
        if (promo.type === 'PERCENTAGE' && promo.maxDiscount > 0) {
            calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
        }
        return Math.round(calculatedDiscount * 100) / 100;
    }, []);

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
            const uploadFn = slipStorageService.uploadSlip || slipStorageService.uploadSlipImage;
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
            let isOcrVerified = false;
            try {
                if (slipStorageService.verifySlipOcr) {
                    const expectedAmount = sanitizeNum(remainingToPay);
                    const ocrRes = await slipStorageService.verifySlipOcr(uploadedUrl, orderIdForSlip, expectedAmount, file);
                    if (ocrRes?.success && !ocrRes?.requiresManualVerification && ocrRes?.ocrData) {
                        ocrData = ocrRes.ocrData;
                        isOcrVerified = true;
                    }
                } else if (slipStorageService.extractSlipData) {
                    ocrData = await slipStorageService.extractSlipData(file, uploadedUrl);
                    isOcrVerified = Boolean(ocrData?.transactionRef || ocrData?.transferDateTime);
                }
            } catch (ocrErr) {
                console.warn("[POS OCR] Slip OCR extraction warning:", ocrErr);
            }

            const patch = {
                slipImage: uploadedUrl,
                slipUrl: uploadedUrl,
                slipStoragePath: storagePath || `slips/${orderIdForSlip}`,
                ocrResult: ocrData || null,
                slipVerificationStatus: isOcrVerified ? 'verified' : 'unverified'
            };

            // Auto-populate bank reference fields strictly when OCR genuinely verified
            if (isOcrVerified && ocrData) {
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

        // Check aggregated stock across split lines, crediting already-deducted storefront quantities
        const prevDeductedMap = new Map();
        if (activeTab.isStockDeducted && Array.isArray(activeTab.originalDeductedItems)) {
            activeTab.originalDeductedItems.forEach(oi => {
                const k = oi.sku || oi.id;
                if (k) prevDeductedMap.set(k, (prevDeductedMap.get(k) || 0) + Math.max(1, sanitizeNum(oi.qty)));
            });
        }
        const aggregatedStockDemand = (activeTab.items || []).reduce((acc, item) => {
            const key = item.sku || item.id || item.name || 'unknown';
            const qty = Math.max(1, sanitizeNum(item.qty));
            const baseStock = sanitizeNum(item.stock);
            if (!acc[key]) {
                acc[key] = {
                    key,
                    name: item.name || item.itemName || key,
                    totalQty: 0,
                    stock: baseStock + (prevDeductedMap.get(key) || 0)
                };
            } else {
                acc[key].stock = Math.min(acc[key].stock, baseStock + (prevDeductedMap.get(key) || 0));
            }
            acc[key].totalQty += qty;
            return acc;
        }, {});

        const outOfStockItem = Object.values(aggregatedStockDemand).find(
            item => item.stock < item.totalQty
        );

        const preCustUid = activeTab.customer?.uid || activeTab.customer?.id || '';
        const preResolvedAddress = activeTab.customer
            ? (typeof activeTab.customer.address === 'object'
                ? (activeTab.customer.address?.fullAddress || activeTab.customer.legacyAddress || '')
                : (activeTab.customer.address || activeTab.customer.legacyAddress || ''))
            : '';
        const rawTaxIdVal = activeTab.customer?.taxId || activeTab.customer?.taxInvoice?.taxId || '';
        const cleanTaxId = (typeof rawTaxIdVal === 'object' ? (rawTaxIdVal.taxId || rawTaxIdVal.number || '') : String(rawTaxIdVal || '')).replace(/\D/g, '');

        if (activeTab.items.length === 0) { toast.error('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'); return; }
        if (status === 'OnAccount' && (!activeTab.customer || !preCustUid || preCustUid === 'WALK-IN')) {
            toast.error('การขายเครดิต (On Acc) ใช้ได้เฉพาะลูกค้าสมาชิกเท่านั้น กรุณาเลือกลูกค้าก่อน');
            return;
        }
        if (outOfStockItem && (status === 'Paid' || status === 'OnAccount')) {
            toast.error(`สินค้า [${outOfStockItem.key || outOfStockItem.name}] สต็อกไม่เพียงพอ ไม่สามารถ${status === 'OnAccount' ? 'เปิดบิลเครดิต' : 'ชำระเงิน'}ได้ (กรุณาบันทึกเป็นบิลร่าง Draft)`);
            return;
        }
        if (isPhoneMissing && status !== 'Draft') { toast.error('กรุณาระบุเบอร์โทรศัพท์ลูกค้า'); return; }
        if (status !== 'Draft' && activeTab.receiptFormat === 'full' && activeTab.vatType !== 'exempt') {
            if (cleanTaxId.length !== 13 || !String(preResolvedAddress || '').trim()) {
                toast.error('ใบกำกับภาษีเต็มรูป กรุณาระบุเลขผู้เสียภาษี 13 หลักและที่อยู่ลูกค้าให้ครบถ้วน');
                return;
            }
        }
        if (status === 'Paid' && activeTab.paymentMethod === 'Cash' && sanitizeNum(activeTab.cashReceived) < remainingToPay) { toast.error('รับเงินมาไม่ครบ'); return; }
        if (netTotal < 0) { toast.error('ยอดสุทธิติดลบ'); return; }
        
        submitLockRef.current = true;
        setIsProcessing(true);

        try {
            const custUid = activeTab.customer?.uid || activeTab.customer?.id || '';
            if (activeTab.customer && custUid) localStorage.setItem(`dh_cust_pref_${custUid}`, JSON.stringify({ priceMode: activeTab.priceMode, vatType: activeTab.vatType, fulfillmentType: activeTab.fulfillmentType, receiptFormat: activeTab.receiptFormat }));

            const now = new Date();
            const yy = String(now.getFullYear()).slice(2); const mm = String(now.getMonth() + 1).padStart(2, '0'); const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0'); const min = String(now.getMinutes()).padStart(2, '0'); const sec = String(now.getSeconds()).padStart(2, '0');
            const rand4 = Math.floor(1000 + Math.random() * 9000);
            
            let finalOrderId = activeTab.orderId || `DH-TEMP-${rand4}`;

            const autoNoteTag = '[บันทึกโดยระบบอัตโนมัติ]';
            const trimmedBillNote = String(activeTab.billNote || '').trim();
            const finalNote = trimmedBillNote
                ? (trimmedBillNote.includes(autoNoteTag) ? trimmedBillNote : `${trimmedBillNote}\n${autoNoteTag}`)
                : autoNoteTag;

            const freebieItems = eligibleFreebies.map(f => {
                let conditionText = [];
                if (f.minSpend > 0) conditionText.push(`ยอด${f.minSpend}฿`);
                if (f.minQty > 0) conditionText.push(`ครบ${f.minQty}ชิ้น`);
                if (f.applicableSkus?.length > 0) conditionText.push(`เฉพาะรุ่น`);
                const reasonStr = conditionText.length > 0 ? ` (${conditionText.join(', ')})` : '';
                const resolvedQty = sanitizeNum(f.calculatedQty || f.qty || 1);
                const finalFreebieQty = (f.maxPerBill && Number(f.maxPerBill) > 0)
                    ? Math.min(resolvedQty, Number(f.maxPerBill))
                    : resolvedQty;
                return { 
                    sku: f.itemName, 
                    name: `[แถมฟรี] ${f.productName || f.itemName}`, 
                    qty: Math.max(1, finalFreebieQty), 
                    price: 0, discount: 0, total: 0, isFreebie: true, note: `${f.title}${reasonStr}`, noteColor: 'rose' 
                };
            });

            const finalOrderItems = [
                ...activeTab.items.map(i => {
                    const cleanPrice = Math.max(0, sanitizeNum(i.price));
                    const cleanDiscount = Math.min(cleanPrice, Math.max(0, sanitizeNum(i.discount)));
                    const cleanQty = Math.max(1, sanitizeNum(i.qty));
                    return { 
                        sku: i.sku || '', 
                        name: i.name || '', 
                        qty: cleanQty, 
                        price: cleanPrice, 
                        discount: cleanDiscount, 
                        baseWholesale: sanitizeNum(i.baseWholesale ?? cleanPrice),
                        baseRetail: sanitizeNum(i.baseRetail ?? cleanPrice),
                        total: Math.max(0, (cleanPrice - cleanDiscount) * cleanQty), 
                        note: i.note || '', 
                        noteColor: i.noteColor || 'fuchsia', 
                        isFreebie: false,
                        image: i.image || i.imageUrl || (Array.isArray(i.images) && i.images[0]) || null
                    };
                }), ...freebieItems 
            ];

            const resolvedCustAddress = activeTab.customer
                ? (typeof activeTab.customer.address === 'object'
                    ? (activeTab.customer.address?.fullAddress || activeTab.customer.legacyAddress || '')
                    : (activeTab.customer.address || activeTab.customer.legacyAddress || ''))
                : '';

            const validCustUid = (custUid && custUid !== 'WALK-IN') ? custUid : null;

            const orderData = {
                id: activeTab.docId || null, orderId: finalOrderId,
                userId: validCustUid,
                customerId: validCustUid,
                isWebOrder: Boolean(activeTab.isWebOrder),
                canBypassBuffer: true,
                isStockDeducted: Boolean(activeTab.isStockDeducted),
                isWalletDeducted: Boolean(activeTab.isWalletDeducted),
                isPromoQuotaDeducted: Boolean(activeTab.isPromoQuotaDeducted),
                originalDeductedItems: activeTab.originalDeductedItems || null,
                channel: activeTab.channel || (activeTab.isWebOrder ? 'storefront' : 'pos'),
                source: activeTab.source || (activeTab.isWebOrder ? 'storefront' : 'pos'),
                orderStatus: status === 'Draft' ? 'Draft' : (status === 'OnAccount' ? 'on_account' : (status === 'Paid' ? 'Paid' : 'Pending')),
                status: status === 'Draft' ? 'Draft' : (status === 'OnAccount' ? 'on_account' : (status === 'Paid' ? 'Paid' : 'Pending')),
                isDraft: status === 'Draft',
                isCreditBill: status === 'OnAccount',
                paymentStatus: status === 'Draft' ? 'Unpaid' : (status === 'OnAccount' ? 'on_account' : status),
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
                customer: activeTab.customer ? { uid: custUid, accountName: getCustomerDisplayName(activeTab.customer, ''), phone: activeTab.customer.phone || activeTab.customer.phoneNumber || '', address: resolvedCustAddress, taxId: cleanTaxId || '', branch: (typeof activeTab.customer.branch === 'string' ? activeTab.customer.branch : (activeTab.customer.taxInvoice?.branch || '')), hidePhone: Boolean(activeTab.hidePhone) } : { uid: 'WALK-IN', accountName: activeTab.walkInName || 'ลูกค้าทั่วไป', phone: activeTab.walkInPhone || '', address: '', hidePhone: Boolean(activeTab.hidePhone) },
                items: finalOrderItems,
                itemSkus: Array.from(new Set(
                    (finalOrderItems || [])
                        .map(i => String(i.sku || '').trim().toUpperCase())
                        .filter(Boolean)
                ))
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

            const currentStaffName = profile?.nickname || profile?.displayName || auth.currentUser?.displayName || (activeTab.isWebOrder ? 'หน้าเว็บ' : 'พนักงาน');
            const result = await billingService.createOrder(orderData, auth.currentUser?.uid || 'System', currentStaffName);
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
