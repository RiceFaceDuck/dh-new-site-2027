import { useState, useEffect } from 'react';
import { promotionService } from '../../../../firebase/promotionService';
import { freebieService } from '../../../../firebase/freebieService';

import { usePosCart } from './usePosCart';
import { usePosCustomer } from './usePosCustomer';
import { usePosPayment } from './usePosPayment';

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

    const [isProcessing, setIsProcessing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewSlip, setPreviewSlip] = useState(null); 
    const [isUploadingSlip, setIsUploadingSlip] = useState(false);
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
                    const matchedCust = customers.find(c => c.uid === fullCustomer.uid || c.id === fullCustomer.uid);
                    if (matchedCust) fullCustomer = matchedCust;
                }

                const newTab = {
                    id: draftId,
                    orderId: initialDraft.orderId || null,
                    docId: initialDraft.id || null,
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
                    return prev.map(tab => {
                        if (tab.id === draftId || tab.orderId === draftId) {
                            return { ...tab, ...newTab, id: tab.id };
                        }
                        return tab;
                    });
                }

                setActiveTabId(draftId);

                const emptyTabIndex = prev.findIndex(t => t.items.length === 0 && !t.customer && !t.walkInName && !t.orderId);
                if (emptyTabIndex !== -1) {
                    const newPrev = [...prev];
                    newPrev[emptyTabIndex] = newTab;
                    return newPrev;
                }

                return [...prev, newTab];
            });
        }
    }, [initialDraft, customers]);

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
        cartTabs, setCartTabs,
        activeTabId, setActiveTabId,
        createNewTab, closeTab, safeCartTabs, activeTab, updateActiveTab,
        handlePriceModeChange,
        
        // Processing & UI
        isProcessing, setIsProcessing,
        showPreview, setShowPreview,
        previewSlip, setPreviewSlip,
        isUploadingSlip, setIsUploadingSlip,
        isPromoModalOpen, setIsPromoModalOpen,
        
        // Marketing Data
        activePromotions, setActivePromotions,
        activeFreebies, setActiveFreebies,
        
        // From usePosCart
        searchQuery: cartState.searchQuery, setSearchQuery: cartState.setSearchQuery,
        showDropdown: cartState.showDropdown, setShowDropdown: cartState.setShowDropdown,
        actionBoxItem: cartState.actionBoxItem, setActionBoxItem: cartState.setActionBoxItem,
        searchResults: cartState.searchResults,

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
