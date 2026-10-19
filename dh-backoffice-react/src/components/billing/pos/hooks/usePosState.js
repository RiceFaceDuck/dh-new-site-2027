import { useState, useEffect, useCallback, useRef } from 'react';
import { promotionService } from '../../../../firebase/promotionService';
import { freebieService } from '../../../../firebase/freebieService';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';
import { catalogHydrationService } from '../../../../firebase/catalogHydrationService';

import { usePosCart } from './usePosCart';
import { usePosCustomer } from './usePosCustomer';
import { usePosPayment } from './usePosPayment';
import { auth } from '../../../../firebase/config';
import { useAuth } from '../../../../contexts/AuthContext';
import { staffPosDraftService, filterValidDraftTabs } from '../../../../firebase/staffPosDraftService';
import { readCachedOrders } from '../../../../firebase/orderCacheService';

import { safeJsonParse } from 'dh-shared';

// ⚡ Session & Memory Caching for Promotions & Freebies (Eliminates redundant Firestore reads on mount)
const MARKETING_CACHE_KEY_PROMOS = 'dh_pos_promos_cache_v1';
const MARKETING_CACHE_KEY_FREEBIES = 'dh_pos_freebies_cache_v1';
const MARKETING_CACHE_KEY_TIME = 'dh_pos_marketing_cache_time_v1';
const MARKETING_CACHE_TTL = 10 * 60 * 1000; // 10 minutes TTL

let inMemoryPromos = null;
let inMemoryFreebies = null;
let inMemoryMarketingTimestamp = 0;

const getFinishedOrderIdsSet = () => {
    try {
        const { orders } = readCachedOrders();
        if (Array.isArray(orders) && orders.length > 0) {
            const finishedSet = new Set();
            orders.forEach(o => {
                const stat = (o.orderStatus || o.status || o.paymentStatus || '').toLowerCase();
                if (stat === 'approved' || stat === 'completed' || stat === 'paid' || stat === 'cancelled' || stat === 'void') {
                    if (o.orderId) finishedSet.add(String(o.orderId).trim());
                    if (o.id) finishedSet.add(String(o.id).trim());
                    if (o.docId) finishedSet.add(String(o.docId).trim());
                }
            });
            return finishedSet;
        }
    } catch (e) {
        console.warn('[usePosState] getFinishedOrderIdsSet error:', e);
    }
    return null;
};

const createNewTab = () => {
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const orderId = `DH-TEMP-${rand4}`;
    return {
        id: Date.now().toString(), orderId, docId: null, items: [], customer: null, priceMode: 'wholesale',
        walkInName: '', walkInPhone: '', hidePhone: false, fulfillmentType: 'Delivery', courier: 'KEX', shippingFee: 0, vatOnShipping: false, vatType: 'exempt', 
        autoShippingEnabled: false, overallDiscount: 0, overallDiscountType: 'BAHT', promoDiscount: 0, autoPromoEnabled: true, autoFreebieEnabled: true, disabledFreebieIds: [], manualFreebieIds: [], otherFeeName: '', otherFeeAmount: 0, 
    paymentMethod: 'Transfer', bankAccount: 'KBANK', cashReceived: '', slipImage: null, billNote: '', receiptFormat: 'short',
    appliedPromoId: null, appliedPromoDetails: null, walletUsed: 0, useWallet: false
    };
};

const loadSavedState = (targetUid) => {
    try {
        const uid = targetUid || auth?.currentUser?.uid || 'guest';
        const saved = localStorage.getItem(`dh_pos_autosave_${uid}`);
        
        if (saved) {
            const parsed = safeJsonParse(saved);
            const finishedSet = getFinishedOrderIdsSet();
            const valid = filterValidDraftTabs(parsed, finishedSet);
            if (valid.length > 0) return valid;
        }
    } catch (e) { console.error('Failed to load autosave', e); }
    return [createNewTab()];
};

export default function usePosState(products, customers, initialDraft, onDraftHandled) {
    const { profile } = useAuth();
    const [cartTabs, setCartTabs] = useState(() => loadSavedState());
    const [activeTabId, setActiveTabId] = useState(() => {
        const state = loadSavedState();
        return state[0]?.id || Date.now().toString();
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewSlip, setPreviewSlip] = useState(null); 
    const [isUploadingSlip, setIsUploadingSlip] = useState(false);
    const [activePromotions, setActivePromotions] = useState([]);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [isFreebieModalOpen, setIsFreebieModalOpen] = useState(false);
    const [activeFreebies, setActiveFreebies] = useState([]);

    // 🔄 Switch Staff Account on Same PC & Cross-Device Cloud Hydration
    const currentUidRef = useRef(auth?.currentUser?.uid || 'guest');
    useEffect(() => {
        const unsubAuth = auth?.onAuthStateChanged?.(async (user) => {
            const newUid = user?.uid || 'guest';
            if (newUid !== currentUidRef.current) {
                currentUidRef.current = newUid;

                // 1. Try local cache for this staff account first (Instant 0ms)
                const localSaved = localStorage.getItem(`dh_pos_autosave_${newUid}`);
                if (localSaved) {
                    const parsed = safeJsonParse(localSaved);
                    const finishedSet = getFinishedOrderIdsSet();
                    const valid = filterValidDraftTabs(parsed, finishedSet);
                    if (valid.length > 0) {
                        setCartTabs(valid);
                        setActiveTabId(valid[0].id);
                        return;
                    }
                }

                // 2. Cross-Device Cloud Hydration: If opened on another PC, pull from Cloud
                if (newUid !== 'guest') {
                    const cloudTabs = await staffPosDraftService.getStaffCloudDrafts(newUid);
                    if (cloudTabs.length > 0) {
                        localStorage.setItem(`dh_pos_autosave_${newUid}`, JSON.stringify(cloudTabs));
                        setCartTabs(cloudTabs);
                        setActiveTabId(cloudTabs[0].id);
                        window.dispatchEvent(new CustomEvent('dh_cart_updated'));
                        return;
                    }
                }

                // 3. Fallback to clean state for new user
                const fresh = [createNewTab()];
                setCartTabs(fresh);
                setActiveTabId(fresh[0].id);
            }
        });

        return () => {
            unsubAuth?.();
        };
    }, []);

    // 💾 Save to local cache immediately + Debounced Cloud Sync to Firestore
    useEffect(() => {
        const uid = auth?.currentUser?.uid || 'guest';
        const cleanTabs = Array.isArray(cartTabs) ? cartTabs.filter(t => t && typeof t === 'object' && t.id) : [];
        localStorage.setItem(`dh_pos_autosave_${uid}`, JSON.stringify(cleanTabs));
        window.dispatchEvent(new CustomEvent('dh_cart_updated'));
        if (uid !== 'guest') {
            staffPosDraftService.saveStaffCloudDraftsDebounced(uid, cleanTabs);
        }
    }, [cartTabs]);

    // 🧹 Reactive Auto-Prune & Dedup Guard: Clean completed orders & deduplicate tabs
    useEffect(() => {
        const pruneTabs = () => {
            const finishedSet = getFinishedOrderIdsSet();
            setCartTabs(prev => {
                if (!Array.isArray(prev) || prev.length === 0) return prev;
                const filtered = filterValidDraftTabs(prev, finishedSet);
                // If every tab was filtered out, fallback to 1 fresh tab
                const resolved = filtered.length > 0 ? filtered : [createNewTab()];
                
                // Only trigger update if array changed
                if (resolved.length !== prev.length || resolved.some((t, i) => t.id !== prev[i]?.id)) {
                    setActiveTabId(currId => {
                        const stillExists = resolved.some(t => t.id === currId);
                        return stillExists ? currId : resolved[0].id;
                    });
                    return resolved;
                }
                return prev;
            });
        };

        // Run once on mount / initial check
        pruneTabs();

        // Listen for storage or catalog updates
        const handleStorage = (e) => {
            if (e.key === 'dh_recent_orders_cache_v1' || e.key === 'dh_recent_orders_meta_v1') {
                pruneTabs();
            }
        };
        const handleCustomUpdate = () => pruneTabs();

        window.addEventListener('storage', handleStorage);
        window.addEventListener('dh_recent_orders_updated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('dh_recent_orders_updated', handleCustomUpdate);
        };
    }, []);

    useEffect(() => {
        if (!initialDraft) return;

        const draftStat = (initialDraft.orderStatus || initialDraft.status || initialDraft.paymentStatus || '').toLowerCase();
        if (draftStat === 'approved' || draftStat === 'completed' || draftStat === 'paid' || draftStat === 'cancelled') {
            return;
        }

        const draftOrderId = initialDraft.orderId ? String(initialDraft.orderId) : null;
        const draftDocId = initialDraft.id ? String(initialDraft.id) : null;
        const normalizeId = (id) => String(id || '').replace(/^DH-TEMP-\d{6}-\d{6}-(\d{4})$/, 'DH-TEMP-$1');
        const normDraftOrderId = normalizeId(draftOrderId);
        const normDraftDocId = normalizeId(draftDocId);

        const isWebOrder = Boolean(initialDraft.isWebOrder || initialDraft.channel === 'storefront' || initialDraft.source === 'storefront');
        const effectiveSlip = initialDraft.paymentSlipUrl || initialDraft.slipUrl || initialDraft.slipImage || '';
        const promoFromDraft = (Array.isArray(initialDraft.appliedPromotions) && initialDraft.appliedPromotions.length > 0)
            ? initialDraft.appliedPromotions[0]
            : (initialDraft.appliedPromotion || null);
        const promoDiscountFromDraft = initialDraft.promoDiscount ?? initialDraft.totals?.discount ?? initialDraft.calculationLog?.discountAmount ?? (promoFromDraft?.discountValue ?? 0);
        const draftShippingFee = Number(initialDraft.shippingFee ?? initialDraft.shippingCost ?? initialDraft.totals?.shippingCost ?? initialDraft.totals?.shipping ?? 0);
        const draftCourier = initialDraft.courier || initialDraft.shippingMethod || (draftShippingFee > 0 ? 'จัดส่งเอกชน' : 'KEX');
        const draftFulfillment = initialDraft.fulfillmentType || ((initialDraft.shippingMethod === 'pickup' || (initialDraft.shippingMethod || '').includes('รับหน้าร้าน')) ? 'StorePickup' : (draftShippingFee > 0 || initialDraft.shippingMethod ? 'Delivery' : 'StorePickup'));
        
        // Normalize payment method to standard Title Case (Transfer or Cash)
        const rawMethod = String(initialDraft.paymentMethod || '').toLowerCase();
        const draftPaymentMethod = rawMethod === 'cash' ? 'Cash' : 'Transfer';

        // 👤 ดักจับชื่อเจ้าหน้าที่คนแรกที่เปิดบิล (First-Touch Staff Ownership)
        const currentStaffUser = auth?.currentUser;
        const currentStaffUid = currentStaffUser?.uid || profile?.uid || null;
        const currentStaffName = profile?.nickname || profile?.displayName || currentStaffUser?.displayName || currentStaffUser?.email?.split('@')[0] || 'พนักงาน';

        if (isWebOrder && !initialDraft.staffNickname && currentStaffUid) {
            const targetOrderId = draftDocId || draftOrderId;
            if (targetOrderId) {
                import('../../../../firebase/billingStatusTransaction').then(({ billingStatusTransaction }) => {
                    billingStatusTransaction.assignStaffHandler(targetOrderId, currentStaffUid, currentStaffName);
                }).catch(err => console.warn("Failed to assign staff handler:", err));
            }
        }

        const effectiveStaffNickname = initialDraft.staffNickname || (isWebOrder ? currentStaffName : null);
        const effectiveStaffUid = initialDraft.staffUid || (isWebOrder ? currentStaffUid : null);

        let fullCustomer = initialDraft.customer || null;
        if (fullCustomer && fullCustomer.uid && fullCustomer.uid !== 'WALK-IN') {
            const matchedCust = customers.find(c => c.uid === fullCustomer.uid || c.id === fullCustomer.uid);
            if (matchedCust) fullCustomer = matchedCust;
        }

        let targetTabId = null;

        setCartTabs(prev => {
            const validPrev = Array.isArray(prev) ? prev.filter(t => t && typeof t === 'object' && t.id) : [];

            // 🔍 1. ค้นหาแท็บเดิมในระบบที่มีอยู่แล้ว (เช็คทั้ง orderId, docId, และ id รวมถึง normalized id)
            const matchedExistingIndex = validPrev.findIndex(tab => {
                const normTabOrderId = normalizeId(tab.orderId);
                const normTabDocId = normalizeId(tab.docId || tab.id);

                if (draftOrderId && (tab.orderId === draftOrderId || normTabOrderId === normDraftOrderId)) return true;
                if (draftDocId && (tab.docId === draftDocId || tab.id === draftDocId || normTabDocId === normDraftDocId)) return true;
                if (draftOrderId && (tab.id === draftOrderId || normTabDocId === normDraftOrderId)) return true;
                return false;
            });

            if (matchedExistingIndex !== -1) {
                const existingTab = validPrev[matchedExistingIndex];
                targetTabId = existingTab.id; // 🔑 ใช้ tab.id ตัวจริงของแท็บนั้น

                const updatedTab = {
                    ...existingTab,
                    orderId: draftOrderId || existingTab.orderId,
                    docId: draftDocId || existingTab.docId,
                    isWebOrder,
                    channel: initialDraft.channel || (isWebOrder ? 'storefront' : 'pos'),
                    source: initialDraft.source || (isWebOrder ? 'storefront' : 'pos'),
                    staffNickname: effectiveStaffNickname,
                    staffUid: effectiveStaffUid,
                    openedBy: initialDraft.openedBy || (isWebOrder ? currentStaffUid : null),
                    customer: fullCustomer,
                    items: (initialDraft.items || []).filter(i => !i.isFreebie),
                    walkInName: initialDraft.customer?.uid === 'WALK-IN' ? initialDraft.customer.accountName : (existingTab.walkInName || ''),
                    walkInPhone: initialDraft.customer?.phone || (existingTab.walkInPhone || ''),
                    hidePhone: initialDraft.customer?.hidePhone || false,
                    slipUrl: effectiveSlip || existingTab.slipUrl || '',
                    slipImage: effectiveSlip || existingTab.slipImage || '',
                    paymentSlipUrl: effectiveSlip || existingTab.paymentSlipUrl || '',
                    billNote: initialDraft.billNote || existingTab.billNote || '',
                    priceMode: initialDraft.priceMode || existingTab.priceMode || 'wholesale',
                    shippingFee: (draftShippingFee > 0 ? draftShippingFee : (initialDraft.shippingFee ?? existingTab.shippingFee ?? 0)),
                    otherFeeAmount: initialDraft.otherFeeAmount ?? existingTab.otherFeeAmount ?? 0,
                    otherFeeName: initialDraft.otherFeeName || existingTab.otherFeeName || '',
                    vatType: initialDraft.vatType || existingTab.vatType || 'exempt',
                    vatOnShipping: initialDraft.vatOnShipping !== undefined ? initialDraft.vatOnShipping : existingTab.vatOnShipping,
                    overallDiscount: initialDraft.overallDiscount ?? existingTab.overallDiscount ?? 0,
                    overallDiscountType: initialDraft.overallDiscountType || existingTab.overallDiscountType || 'BAHT',
                    useWallet: Boolean(initialDraft.walletUsed > 0),
                    walletUsed: initialDraft.walletUsed ?? existingTab.walletUsed ?? 0,
                    promoDiscount: promoDiscountFromDraft || existingTab.promoDiscount || 0,
                    appliedPromoId: promoFromDraft?.id || existingTab.appliedPromoId || null,
                    appliedPromoDetails: promoFromDraft || existingTab.appliedPromoDetails || null,
                    autoPromoEnabled: isWebOrder ? false : (initialDraft.autoPromoEnabled ?? existingTab.autoPromoEnabled ?? false),
                    autoShippingEnabled: initialDraft.autoShippingEnabled !== undefined ? initialDraft.autoShippingEnabled : false,
                    paymentMethod: draftPaymentMethod || existingTab.paymentMethod || 'Transfer',
                    bankAccount: initialDraft.bankAccount || existingTab.bankAccount || 'KBANK',
                    fulfillmentType: draftFulfillment || existingTab.fulfillmentType || 'Delivery',
                    courier: draftCourier || existingTab.courier || 'KEX',
                    receiptFormat: initialDraft.receiptFormat || existingTab.receiptFormat || 'short',
                    transactionRef: initialDraft.transactionRef || existingTab.transactionRef || '',
                    transferDateTime: initialDraft.transferDateTime || existingTab.transferDateTime || ''
                };

                const newTabs = [...validPrev];
                newTabs[matchedExistingIndex] = updatedTab;
                return newTabs;
            }

            // 🌟 2. ถ้ายังไม่มีแท็บนี้ในระบบ -> สร้างแท็บใหม่พร้อมกำหนด ID ชัดเจน
            const assignedId = Date.now().toString();
            targetTabId = assignedId;

            const newTab = {
                id: assignedId,
                orderId: draftOrderId || null,
                docId: draftDocId || null,
                isWebOrder,
                channel: initialDraft.channel || (isWebOrder ? 'storefront' : 'pos'),
                source: initialDraft.source || (isWebOrder ? 'storefront' : 'pos'),
                staffNickname: effectiveStaffNickname,
                staffUid: effectiveStaffUid,
                openedBy: initialDraft.openedBy || (isWebOrder ? currentStaffUid : null),
                customer: fullCustomer,
                items: (initialDraft.items || []).filter(i => !i.isFreebie),
                walkInName: initialDraft.customer?.uid === 'WALK-IN' ? initialDraft.customer.accountName : '',
                walkInPhone: initialDraft.customer?.phone || '',
                hidePhone: initialDraft.customer?.hidePhone || false,
                slipUrl: effectiveSlip,
                slipImage: effectiveSlip,
                paymentSlipUrl: effectiveSlip,
                billNote: initialDraft.billNote || '',
                priceMode: initialDraft.priceMode || 'wholesale',
                shippingFee: draftShippingFee > 0 ? draftShippingFee : (initialDraft.shippingFee || 0),
                otherFeeAmount: initialDraft.otherFeeAmount || 0,
                otherFeeName: initialDraft.otherFeeName || '',
                vatType: initialDraft.vatType || 'exempt',
                vatOnShipping: initialDraft.vatOnShipping || false,
                overallDiscount: initialDraft.overallDiscount || 0,
                overallDiscountType: initialDraft.overallDiscountType || 'BAHT',
                useWallet: Boolean(initialDraft.walletUsed > 0),
                walletUsed: initialDraft.walletUsed || 0,
                promoDiscount: promoDiscountFromDraft || 0,
                appliedPromoId: promoFromDraft?.id || null,
                appliedPromoDetails: promoFromDraft || null,
                autoPromoEnabled: isWebOrder ? false : (initialDraft.autoPromoEnabled !== undefined ? initialDraft.autoPromoEnabled : true),
                autoShippingEnabled: initialDraft.autoShippingEnabled !== undefined ? initialDraft.autoShippingEnabled : false,
                paymentMethod: draftPaymentMethod || 'Transfer',
                bankAccount: initialDraft.bankAccount || 'KBANK',
                fulfillmentType: draftFulfillment,
                courier: draftCourier,
                receiptFormat: initialDraft.receiptFormat || 'short',
                transactionRef: initialDraft.transactionRef || '',
                transferDateTime: initialDraft.transferDateTime || ''
            };

            const emptyTabIndex = validPrev.findIndex(t => (!t.items || t.items.length === 0) && !t.customer && !t.walkInName && !t.orderId && !t.docId);
            if (emptyTabIndex !== -1) {
                const newPrev = [...validPrev];
                newPrev[emptyTabIndex] = newTab;
                targetTabId = newTab.id; // 🔑 รับประกันว่า focus ไปที่ newTab.id แม้จะ reuse ช่องว่างเดิม
                return newPrev;
            }

            targetTabId = newTab.id;
            return [...validPrev, newTab];
        });

        // 🚀 สั่งเปลี่ยนแท็บข้างนอก updater เพื่อกำจัด Side-effect และรับประกันว่า ID ตรงกับ tab.id เสมอ
        if (targetTabId) {
            setActiveTabId(targetTabId);
        }

        if (typeof onDraftHandled === 'function') {
            onDraftHandled();
        }
    }, [initialDraft, customers, onDraftHandled]);

    useEffect(() => {
        const fetchMarketingData = async () => {
            const now = Date.now();

            // 1. Check in-memory fast cache (0ms, 0 reads)
            if (inMemoryPromos && inMemoryFreebies && (now - inMemoryMarketingTimestamp) < MARKETING_CACHE_TTL) {
                setActivePromotions(inMemoryPromos);
                setActiveFreebies(inMemoryFreebies);
                return;
            }

            // 2. Check SessionStorage cache (0 reads across tab re-navigations)
            try {
                const cachedTime = sessionStorage.getItem(MARKETING_CACHE_KEY_TIME);
                if (cachedTime && (now - Number(cachedTime)) < MARKETING_CACHE_TTL) {
                    const rawP = sessionStorage.getItem(MARKETING_CACHE_KEY_PROMOS);
                    const rawF = sessionStorage.getItem(MARKETING_CACHE_KEY_FREEBIES);
                    if (rawP && rawF) {
                        const parsedP = safeJsonParse(rawP);
                        const parsedF = safeJsonParse(rawF);
                        if (Array.isArray(parsedP) && Array.isArray(parsedF)) {
                            inMemoryPromos = parsedP;
                            inMemoryFreebies = parsedF;
                            inMemoryMarketingTimestamp = Number(cachedTime);
                            setActivePromotions(parsedP);
                            setActiveFreebies(parsedF);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.warn('[usePosState] SessionStorage read error:', e);
            }

            // 3. Cache Miss: Fetch active promos and freebies from Firestore
            try {
                const [promos, freebies] = await Promise.all([
                    promotionService.getActivePromotions(), 
                    freebieService.getActiveFreebies()
                ]);
                
                // 🚀 Optimize: Read from fast cache to avoid N+1 queries
                let cacheMap = new Map();
                try {
                    const cachedStr = sessionStorage.getItem('search_hybrid_cache');
                    if (cachedStr) {
                        const cachedArr = safeJsonParse(cachedStr);
                        if (Array.isArray(cachedArr)) {
                            cachedArr.forEach(p => cacheMap.set(p.sku, p.name));
                        }
                    }
                } catch(e) {}

                const enrichedFreebies = [];
                for (const f of (freebies || [])) {
                    if (f.itemName) {
                        let pName = cacheMap.get(f.itemName) || catalogHydrationService.findProductInCache(f.itemName)?.name;
                        // ถ้าไม่มีในแคชค่อยไปดึงจาก Server (Fallback)
                        if (!pName) {
                            try {
                                const p = await inventoryQueryService.getProductBySku(f.itemName);
                                pName = p ? p.name : null;
                            } catch (e) {
                                pName = null;
                            }
                        }
                        enrichedFreebies.push({ ...f, productName: pName });
                    } else {
                        enrichedFreebies.push(f);
                    }
                }
                
                const validPromos = promos || [];
                inMemoryPromos = validPromos;
                inMemoryFreebies = enrichedFreebies;
                inMemoryMarketingTimestamp = Date.now();

                try {
                    sessionStorage.setItem(MARKETING_CACHE_KEY_PROMOS, JSON.stringify(validPromos));
                    sessionStorage.setItem(MARKETING_CACHE_KEY_FREEBIES, JSON.stringify(enrichedFreebies));
                    sessionStorage.setItem(MARKETING_CACHE_KEY_TIME, String(inMemoryMarketingTimestamp));
                } catch (storageErr) {
                    console.warn('[usePosState] SessionStorage write error:', storageErr);
                }

                setActivePromotions(validPromos); 
                setActiveFreebies(enrichedFreebies);
            } catch(e) { 
                console.error("🔥 Error loading marketing data:", e); 
            }
        };
        fetchMarketingData();
    }, []);

    const validCartTabs = Array.isArray(cartTabs) ? cartTabs.filter(t => t && typeof t === 'object' && t.id) : [];
    const safeCartTabs = validCartTabs.length > 0 ? validCartTabs : [createNewTab()];
    const activeTab = safeCartTabs.find(t => t?.id === activeTabId) || safeCartTabs[0];

    const updateActiveTab = useCallback((updates) => {
        setCartTabs(prev => (Array.isArray(prev) ? prev.filter(t => t && typeof t === 'object' && t.id) : []).map(tab => {
            if (tab.id === activeTabId) {
                const evaluatedUpdates = typeof updates === 'function' ? updates(tab) : updates;
                return { ...tab, ...evaluatedUpdates };
            }
            return tab;
        }));
    }, [activeTabId]);

    const closeTab = (tabId) => {
        setCartTabs(prev => {
            const newTabs = (Array.isArray(prev) ? prev.filter(t => t && typeof t === 'object' && t.id) : []).filter(t => t.id !== tabId);
            const resolvedTabs = newTabs.length === 0 ? [createNewTab()] : newTabs;
            
            if (newTabs.length === 0) {
                setActiveTabId(resolvedTabs[0].id);
            } else if (activeTabId === tabId) {
                setActiveTabId(resolvedTabs[0].id);
            }

            // ⚡ Immediate persistence to prevent race condition on page refresh or view switch
            const uid = auth?.currentUser?.uid || 'guest';
            localStorage.setItem(`dh_pos_autosave_${uid}`, JSON.stringify(resolvedTabs));
            window.dispatchEvent(new CustomEvent('dh_cart_updated'));
            if (uid !== 'guest') {
                staffPosDraftService.saveStaffCloudDraftsImmediately(uid, resolvedTabs);
            }

            return resolvedTabs;
        });
    };

    const handlePriceModeChange = (mode) => {
        const updatedItems = (activeTab?.items || []).map(item => { const newPrice = mode === 'wholesale' ? item.baseWholesale : item.baseRetail; return { ...item, price: newPrice }; });
        updateActiveTab({ priceMode: mode, items: updatedItems });
    };

    // --- Sub-hooks Composition ---
    const cartState = usePosCart(products);
    const customerState = usePosCustomer(customers);
    
    const currentCustomerType = customerState.determineCustomerType(activeTab?.customer, activeTab?.priceMode);

    const paymentState = usePosPayment({
        activeTab,
        activePromotions,
        activeFreebies,
        currentCustomerType
    });

    return {
        // Tab Management
        cartTabs: safeCartTabs, setCartTabs,
        activeTabId, setActiveTabId,
        createNewTab, closeTab, safeCartTabs, activeTab, updateActiveTab,
        handlePriceModeChange,
        
        // Processing & UI
        isProcessing, setIsProcessing,
        showPreview, setShowPreview,
        previewSlip, setPreviewSlip,
        isUploadingSlip, setIsUploadingSlip,
        isPromoModalOpen, setIsPromoModalOpen,
        isFreebieModalOpen, setIsFreebieModalOpen,
        
        // Marketing Data
        activePromotions, setActivePromotions,
        activeFreebies, setActiveFreebies,
        
        // From usePosCart
        searchQuery: cartState.searchQuery, setSearchQuery: cartState.setSearchQuery,
        showDropdown: cartState.showDropdown, setShowDropdown: cartState.setShowDropdown,
        actionBoxItem: cartState.actionBoxItem, setActionBoxItem: cartState.setActionBoxItem,
        searchResults: cartState.searchResults,
        isCacheLoading: cartState.isCacheLoading,
        products: cartState.products,

        // From usePosCustomer
        customerSearchText: customerState.customerSearchText, setCustomerSearchText: customerState.setCustomerSearchText,
        showCustDropdown: customerState.showCustDropdown, setShowCustDropdown: customerState.setShowCustDropdown,
        filteredCustomers: customerState.filteredCustomers,

        // From usePosPayment
        itemSubTotal: paymentState.itemSubTotal, manualDiscount: paymentState.manualDiscount, 
        promoDiscount: paymentState.promoDiscount, totalDiscount: paymentState.totalDiscount,
        shippingFee: paymentState.shippingFee, otherFeeAmount: paymentState.otherFeeAmount, 
        vatAmount: paymentState.vatAmount, netTotal: paymentState.netTotal,
        walletUsed: paymentState.walletUsed, remainingToPay: paymentState.remainingToPay, 
        earnedPoints: paymentState.earnedPoints, changeAmount: paymentState.changeAmount, 
        eligibleFreebies: paymentState.eligibleFreebies, 
        appliedPromoDetails: paymentState.appliedPromoDetails, 
        validPromotions: paymentState.validPromotions
    };
}
