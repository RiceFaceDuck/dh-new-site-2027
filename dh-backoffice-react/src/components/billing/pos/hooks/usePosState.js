import { useState, useEffect, useCallback, useRef } from 'react';
import { promotionService } from '../../../../firebase/promotionService';
import { freebieService } from '../../../../firebase/freebieService';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';
import { catalogHydrationService } from '../../../../firebase/catalogHydrationService';

import { usePosCart } from './usePosCart';
import { usePosCustomer } from './usePosCustomer';
import { usePosPayment } from './usePosPayment';
import { auth } from '../../../../firebase/config';
import { staffPosDraftService, filterValidDraftTabs } from '../../../../firebase/staffPosDraftService';

import { safeJsonParse } from 'dh-shared';

// ⚡ Session & Memory Caching for Promotions & Freebies (Eliminates redundant Firestore reads on mount)
const MARKETING_CACHE_KEY_PROMOS = 'dh_pos_promos_cache_v1';
const MARKETING_CACHE_KEY_FREEBIES = 'dh_pos_freebies_cache_v1';
const MARKETING_CACHE_KEY_TIME = 'dh_pos_marketing_cache_time_v1';
const MARKETING_CACHE_TTL = 10 * 60 * 1000; // 10 minutes TTL

let inMemoryPromos = null;
let inMemoryFreebies = null;
let inMemoryMarketingTimestamp = 0;

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
            const valid = filterValidDraftTabs(parsed);
            if (valid.length > 0) return valid;
        }
    } catch (e) { console.error('Failed to load autosave', e); }
    return [createNewTab()];
};

export default function usePosState(products, customers, initialDraft, onDraftHandled) {
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
                    const valid = filterValidDraftTabs(parsed);
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

    useEffect(() => {
        if (!initialDraft) return;

        const draftStat = (initialDraft.orderStatus || initialDraft.status || initialDraft.paymentStatus || '').toLowerCase();
        if (draftStat === 'approved' || draftStat === 'completed' || draftStat === 'paid' || draftStat === 'cancelled') {
            return;
        }

        const draftOrderId = initialDraft.orderId ? String(initialDraft.orderId) : null;
        const draftDocId = initialDraft.id ? String(initialDraft.id) : null;

        let fullCustomer = initialDraft.customer || null;
        if (fullCustomer && fullCustomer.uid && fullCustomer.uid !== 'WALK-IN') {
            const matchedCust = customers.find(c => c.uid === fullCustomer.uid || c.id === fullCustomer.uid);
            if (matchedCust) fullCustomer = matchedCust;
        }

        let targetTabId = null;

        setCartTabs(prev => {
            const validPrev = Array.isArray(prev) ? prev.filter(t => t && typeof t === 'object' && t.id) : [];

            // 🔍 1. ค้นหาแท็บเดิมในระบบที่มีอยู่แล้ว (เช็คทั้ง orderId, docId, และ id)
            const matchedExistingIndex = validPrev.findIndex(tab => {
                if (draftOrderId && tab.orderId === draftOrderId) return true;
                if (draftDocId && (tab.docId === draftDocId || tab.id === draftDocId)) return true;
                if (draftOrderId && tab.id === draftOrderId) return true;
                return false;
            });

            if (matchedExistingIndex !== -1) {
                const existingTab = validPrev[matchedExistingIndex];
                targetTabId = existingTab.id; // 🔑 ใช้ tab.id ตัวจริงของแท็บนั้น

                const updatedTab = {
                    ...existingTab,
                    orderId: draftOrderId || existingTab.orderId,
                    docId: draftDocId || existingTab.docId,
                    customer: fullCustomer,
                    items: (initialDraft.items || []).filter(i => !i.isFreebie),
                    walkInName: initialDraft.customer?.uid === 'WALK-IN' ? initialDraft.customer.accountName : (existingTab.walkInName || ''),
                    walkInPhone: initialDraft.customer?.phone || (existingTab.walkInPhone || ''),
                    hidePhone: initialDraft.customer?.hidePhone || false,
                    slipImage: initialDraft.slipImage || existingTab.slipImage || '',
                    billNote: initialDraft.billNote || existingTab.billNote || '',
                    priceMode: initialDraft.priceMode || existingTab.priceMode || 'wholesale',
                    shippingFee: initialDraft.shippingFee ?? existingTab.shippingFee ?? 0,
                    otherFeeAmount: initialDraft.otherFeeAmount ?? existingTab.otherFeeAmount ?? 0,
                    otherFeeName: initialDraft.otherFeeName || existingTab.otherFeeName || '',
                    vatType: initialDraft.vatType || existingTab.vatType || 'exempt',
                    vatOnShipping: initialDraft.vatOnShipping !== undefined ? initialDraft.vatOnShipping : existingTab.vatOnShipping,
                    overallDiscount: initialDraft.overallDiscount ?? existingTab.overallDiscount ?? 0,
                    overallDiscountType: initialDraft.overallDiscountType || existingTab.overallDiscountType || 'BAHT',
                    useWallet: Boolean(initialDraft.walletUsed > 0),
                    walletUsed: initialDraft.walletUsed ?? existingTab.walletUsed ?? 0,
                    promoDiscount: initialDraft.promoDiscount ?? existingTab.promoDiscount ?? 0,
                    appliedPromoId: initialDraft.appliedPromotion?.id || existingTab.appliedPromoId || null,
                    appliedPromoDetails: initialDraft.appliedPromotion || existingTab.appliedPromoDetails || null,
                    autoPromoEnabled: false,
                    autoShippingEnabled: initialDraft.autoShippingEnabled !== undefined ? initialDraft.autoShippingEnabled : false,
                    paymentMethod: initialDraft.paymentMethod || existingTab.paymentMethod || 'Transfer',
                    bankAccount: initialDraft.bankAccount || existingTab.bankAccount || 'KBANK',
                    fulfillmentType: initialDraft.fulfillmentType || existingTab.fulfillmentType || 'Delivery',
                    courier: initialDraft.courier || existingTab.courier || 'KEX',
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
                customer: fullCustomer,
                items: (initialDraft.items || []).filter(i => !i.isFreebie),
                walkInName: initialDraft.customer?.uid === 'WALK-IN' ? initialDraft.customer.accountName : '',
                walkInPhone: initialDraft.customer?.phone || '',
                hidePhone: initialDraft.customer?.hidePhone || false,
                slipImage: initialDraft.slipImage || '',
                billNote: initialDraft.billNote || '',
                priceMode: initialDraft.priceMode || 'wholesale',
                shippingFee: initialDraft.shippingFee || 0,
                otherFeeAmount: initialDraft.otherFeeAmount || 0,
                otherFeeName: initialDraft.otherFeeName || '',
                vatType: initialDraft.vatType || 'exempt',
                vatOnShipping: initialDraft.vatOnShipping || false,
                overallDiscount: initialDraft.overallDiscount || 0,
                overallDiscountType: initialDraft.overallDiscountType || 'BAHT',
                useWallet: Boolean(initialDraft.walletUsed > 0),
                walletUsed: initialDraft.walletUsed || 0,
                promoDiscount: initialDraft.promoDiscount || 0,
                appliedPromoId: initialDraft.appliedPromotion?.id || null,
                appliedPromoDetails: initialDraft.appliedPromotion || null,
                autoPromoEnabled: false,
                autoShippingEnabled: initialDraft.autoShippingEnabled !== undefined ? initialDraft.autoShippingEnabled : false,
                paymentMethod: initialDraft.paymentMethod || 'Transfer',
                bankAccount: initialDraft.bankAccount || 'KBANK',
                fulfillmentType: initialDraft.fulfillmentType || 'Delivery',
                courier: initialDraft.courier || 'KEX',
                receiptFormat: initialDraft.receiptFormat || 'short',
                transactionRef: initialDraft.transactionRef || '',
                transferDateTime: initialDraft.transferDateTime || ''
            };

            const emptyTabIndex = validPrev.findIndex(t => (!t.items || t.items.length === 0) && !t.customer && !t.walkInName && !t.orderId && !t.docId);
            if (emptyTabIndex !== -1) {
                const newPrev = [...validPrev];
                newPrev[emptyTabIndex] = newTab;
                return newPrev;
            }

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
            if (newTabs.length === 0) {
                const newTab = createNewTab();
                setActiveTabId(newTab.id);
                return [newTab];
            }
            if (activeTabId === tabId) {
                setActiveTabId(newTabs[0].id);
            }
            return newTabs;
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
