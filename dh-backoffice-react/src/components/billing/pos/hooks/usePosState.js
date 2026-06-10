import { useState, useMemo, useEffect } from 'react';
import { promotionService } from '../../../../firebase/promotionService';
import { freebieService } from '../../../../firebase/freebieService';

const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

const createNewTab = () => ({
    id: Date.now().toString(), orderId: null, docId: null, items: [], customer: null, priceMode: 'wholesale',
    walkInName: '', walkInPhone: '', hidePhone: false, fulfillmentType: 'Delivery', courier: 'KEX', shippingFee: 0, vatOnShipping: false, vatType: 'exempt', 
    overallDiscount: 0, promoDiscount: 0, autoPromoEnabled: true, otherFeeName: '', otherFeeAmount: 0, 
    paymentMethod: 'Transfer', bankAccount: 'KBANK', cashReceived: '', slipImage: null, billNote: '', receiptFormat: 'short',
    appliedPromoId: null, appliedPromoDetails: null, walletUsed: 0, useWallet: false
});

const loadSavedState = () => {
    try {
        const saved = localStorage.getItem('dh_pos_autosave');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) { console.error('Failed to load autosave', e); }
    return [createNewTab()];
};

export default function usePosState(products, customers, initialDraft) {
    const [cartTabs, setCartTabs] = useState(() => loadSavedState());
    const [activeTabId, setActiveTabId] = useState(() => {
        const state = loadSavedState();
        return state[0]?.id || Date.now().toString();
    });

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

    useEffect(() => {
        localStorage.setItem('dh_pos_autosave', JSON.stringify(cartTabs));
    }, [cartTabs]);

    useEffect(() => {
        if (initialDraft) {
            setCartTabs(prev => {
                const draftId = (initialDraft.id || initialDraft.orderId) ? String(initialDraft.id || initialDraft.orderId) : Date.now().toString();
                
                let fullCustomer = initialDraft.customer || null;
                if (fullCustomer && fullCustomer.uid && fullCustomer.uid !== 'WALK-IN') {
                    // ดึงข้อมูลลูกค้าแบบเต็มรูปแบบจากระบบ เพื่อให้ได้ walletBalance, creditPoints, และชื่อที่สมบูรณ์
                    const matchedCust = customers.find(c => c.uid === fullCustomer.uid || c.id === fullCustomer.uid);
                    if (matchedCust) fullCustomer = matchedCust;
                }

                const newTab = {
                    id: draftId,
                    orderId: initialDraft.orderId || null,
                    docId: initialDraft.id || null,
                    customer: fullCustomer,
                    items: (initialDraft.items || []).filter(i => !i.isFreebie), // กรองของแถมออก เพราะระบบจะคำนวณของแถมให้ใหม่เสมอตอนเปิดบิล ป้องกันการซ้ำซ้อน
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
                    useWallet: Boolean(initialDraft.walletUsed > 0),
                    walletUsed: initialDraft.walletUsed || 0,
                    promoDiscount: initialDraft.promoDiscount || 0,
                    appliedPromoId: initialDraft.appliedPromotion?.id || null,
                    appliedPromoDetails: initialDraft.appliedPromotion || null,
                    autoPromoEnabled: false,
                    paymentMethod: initialDraft.paymentMethod || 'Transfer',
                    bankAccount: initialDraft.bankAccount || 'KBANK',
                    fulfillmentType: initialDraft.fulfillmentType || 'Delivery',
                    courier: initialDraft.courier || 'KEX',
                    receiptFormat: initialDraft.receiptFormat || 'short',
                    transactionRef: initialDraft.transactionRef || '',
                    transferDateTime: initialDraft.transferDateTime || ''
                };

                if (prev.some(tab => tab.id === draftId || tab.orderId === draftId)) {
                    setActiveTabId(draftId);
                    // ทับข้อมูลเดิมด้วยข้อมูลล่าสุดจากฐานข้อมูล (initialDraft)
                    // เพื่อป้องกันบั๊กที่ localStorage จำข้อมูลเก่าที่ไม่มีข้อมูลลูกค้า
                    return prev.map(tab => {
                        if (tab.id === draftId || tab.orderId === draftId) {
                            return { ...tab, ...newTab, id: tab.id };
                        }
                        return tab;
                    });
                }


                setActiveTabId(draftId);

                // ถ้ามี tab เปล่าๆ อยู่ ให้เอาบิลร่างไปทับ tab นั้นเลย จะได้ไม่สร้าง tab ใหม่เพิ่ม
                const emptyTabIndex = prev.findIndex(t => t.items.length === 0 && !t.customer && !t.walkInName && !t.orderId);
                if (emptyTabIndex !== -1) {
                    const newPrev = [...prev];
                    newPrev[emptyTabIndex] = newTab;
                    return newPrev;
                }

                return [...prev, newTab];
            });
        }
    }, [initialDraft]);

    useEffect(() => {
        const fetchMarketingData = async () => {
            try {
                const [promos, freebies] = await Promise.all([promotionService.getActivePromotions(), freebieService.getActiveFreebies()]);
                setActivePromotions(promos || []); setActiveFreebies(freebies || []);
            } catch(e) { console.error(e); }
        };
        fetchMarketingData();
    }, []);

    const safeCartTabs = cartTabs.length > 0 ? cartTabs : [createNewTab()];
    const activeTab = safeCartTabs.find(t => t.id === activeTabId) || safeCartTabs[0];

    const updateActiveTab = (updates) => {
        setCartTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, ...updates } : tab));
    };

    const closeTab = (tabId) => {
        setCartTabs(prev => {
            const newTabs = prev.filter(t => t.id !== tabId);
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
        const updatedItems = activeTab.items.map(item => { const newPrice = mode === 'wholesale' ? item.baseWholesale : item.baseRetail; return { ...item, price: newPrice }; });
        updateActiveTab({ priceMode: mode, items: updatedItems });
    };

    const searchResults = useMemo(() => {
        // ถ้าไม่มีคำค้นหา ให้แสดงสินค้าขายดีสุด 15 อันดับแรก
        if (!searchQuery.trim()) {
            return [...products]
                .sort((a, b) => (b.stats?.sold || 0) - (a.stats?.sold || 0))
                .slice(0, 15)
                .map(p => ({ ...p, matchType: 'best-seller' }));
        }

        const q = searchQuery.trim().toLowerCase();
        
        // 1. หาคำที่ตรงกันเป๊ะๆ (Exact Match) ปกติพนักงานจะพิมพ์ SKU ตรงๆ
        const exactMatches = products.filter(p => p.sku?.toLowerCase() === q);
        
        // 2. หาคำที่ใกล้เคียง (Similar/Broad Match) โดยไม่เอาอันที่ตรงเป๊ะไปแล้ว
        const exactSkus = new Set(exactMatches.map(p => p.sku));
        const similarMatches = products.filter(p => {
            if (exactSkus.has(p.sku)) return false;
            return p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q);
        });

        // จัดเรียง Similar Matches ตามยอดขาย
        similarMatches.sort((a, b) => (b.stats?.sold || 0) - (a.stats?.sold || 0));

        // คืนค่า Exact Matches ก่อน แล้วค่อยตามด้วย Similar Matches (จำกัดรวม 15 รายการ)
        const combined = [
            ...exactMatches.map(p => ({ ...p, matchType: 'exact' })),
            ...similarMatches.slice(0, Math.max(0, 15 - exactMatches.length)).map(p => ({ ...p, matchType: 'similar' }))
        ];

        return combined;
    }, [searchQuery, products]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearchText.trim()) return customers.slice(0, 10);
        const q = customerSearchText.toLowerCase();
        return customers.filter(c => 
            (c.accountName || '').toLowerCase().includes(q) || 
            (c.firstName || '').toLowerCase().includes(q) || 
            (c.displayName || '').toLowerCase().includes(q) || 
            (c.email || '').toLowerCase().includes(q) || 
            (c.phone || '').includes(q) ||
            (c.uid || c.id || '').toLowerCase() === q
        ).slice(0, 15);
    }, [customerSearchText, customers]);

    const itemSubTotal = activeTab.items?.reduce((sum, item) => sum + ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty))), 0) || 0;
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

    let walletUsed = sanitizeNum(activeTab.walletUsed);
    if (activeTab.useWallet && activeTab.customer) {
        walletUsed = Math.min(sanitizeNum(activeTab.customer.walletBalance), netTotal);
    }
    const remainingToPay = Math.max(0, netTotal - walletUsed);
    const earnedPoints = activeTab.customer ? Math.floor(remainingToPay / 100) : 0;
    const changeAmount = (activeTab.paymentMethod === 'Cash' && activeTab.cashReceived) ? (sanitizeNum(activeTab.cashReceived) - remainingToPay) : 0;

    const eligibleFreebies = activeFreebies.filter(f => itemSubTotal > 0 && itemSubTotal >= f.minSpend);

    return {
        cartTabs, setCartTabs,
        activeTabId, setActiveTabId,
        searchQuery, setSearchQuery,
        showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem,
        isProcessing, setIsProcessing,
        showPreview, setShowPreview,
        previewSlip, setPreviewSlip,
        isUploadingSlip, setIsUploadingSlip,
        customerSearchText, setCustomerSearchText,
        showCustDropdown, setShowCustDropdown,
        activePromotions, setActivePromotions,
        isPromoModalOpen, setIsPromoModalOpen,
        activeFreebies, setActiveFreebies,
        createNewTab, closeTab, safeCartTabs, activeTab, updateActiveTab,
        handlePriceModeChange, searchResults, filteredCustomers,
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, eligibleFreebies
    };
}
