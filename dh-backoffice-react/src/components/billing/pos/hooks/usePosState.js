import { useState, useMemo, useEffect } from 'react';
import { promotionService } from '../../../../firebase/promotionService';
import { freebieService } from '../../../../firebase/freebieService';

const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

export default function usePosState(products, customers, cartTabs, setCartTabs, activeTabId, setActiveTabId, initialDraft) {
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
        if (initialDraft) {
            const exists = cartTabs.some(tab => tab.id === initialDraft.id);
            if (!exists) {
                const newTab = {
                    id: initialDraft.id,
                    name: `บิล #${initialDraft.id.slice(-4)}`,
                    customer: initialDraft.customerInfo || initialDraft.customer || null,
                    items: initialDraft.items || [],
                    walkInPhone: initialDraft.walkInPhone || '',
                    hidePhone: initialDraft.hidePhone || false,
                    slipImage: initialDraft.slipImage || '',
                    note: initialDraft.note || '',
                    noteColor: initialDraft.noteColor || 'slate',
                    priceMode: initialDraft.priceMode || 'retail',
                    shippingCost: initialDraft.shippingCost || 0,
                    customDiscount: initialDraft.customDiscount || 0,
                    customDiscountType: initialDraft.customDiscountType || 'amount',
                    useWallet: initialDraft.useWallet || 0,
                    walletAmount: initialDraft.walletAmount || 0,
                    promoDiscount: initialDraft.promoDiscount || 0,
                    appliedPromoId: initialDraft.appliedPromoId || null,
                    appliedPromoDetails: initialDraft.appliedPromoDetails || null,
                    autoPromoEnabled: initialDraft.autoPromoEnabled ?? true,
                    transactionRef: initialDraft.transactionRef || '',
                    transferDateTime: initialDraft.transferDateTime || ''
                };
                if(typeof setCartTabs === 'function') setCartTabs(prev => [...prev, newTab]);
                setActiveTabId(initialDraft.id);
            } else {
                setActiveTabId(initialDraft.id);
            }
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

    const createNewTab = () => ({
        id: Date.now().toString(), orderId: null, docId: null, items: [], customer: null, priceMode: 'wholesale',
        walkInName: '', walkInPhone: '', hidePhone: false, fulfillmentType: 'Delivery', courier: 'KEX', shippingFee: 0, vatOnShipping: false, vatType: 'exempt', 
        overallDiscount: 0, promoDiscount: 0, autoPromoEnabled: true, otherFeeName: '', otherFeeAmount: 0, 
        paymentMethod: 'Transfer', bankAccount: 'KBANK', cashReceived: '', slipImage: null, billNote: '', receiptFormat: 'short',
        appliedPromoId: null, appliedPromoDetails: null, walletUsed: 0 
    });

    const safeCartTabs = Array.isArray(cartTabs) && cartTabs.length > 0 ? cartTabs : [createNewTab()];
    const activeTab = safeCartTabs.find(t => t.id === activeTabId) || safeCartTabs[0];

    const updateActiveTab = (updates) => {
        if (typeof setCartTabs === 'function') setCartTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, ...updates } : tab));
    };

    const handlePriceModeChange = (mode) => {
        const updatedItems = activeTab.items.map(item => { const newPrice = mode === 'wholesale' ? item.baseWholesale : item.baseRetail; return { ...item, price: newPrice }; });
        updateActiveTab({ priceMode: mode, items: updatedItems });
    };

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return products.slice(0, 15);
        const q = searchQuery.toLowerCase();
        return products.filter(p => p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q)).slice(0, 15);
    }, [searchQuery, products]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearchText.trim()) return customers.slice(0, 10);
        const q = customerSearchText.toLowerCase();
        return customers.filter(c => (c.accountName || '').toLowerCase().includes(q) || (c.firstName || '').toLowerCase().includes(q) || (c.phone || '').includes(q)).slice(0, 15);
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

    const walletUsed = sanitizeNum(activeTab.walletUsed);
    const remainingToPay = Math.max(0, netTotal - walletUsed);
    const earnedPoints = activeTab.customer ? Math.floor(remainingToPay / 100) : 0;
    const changeAmount = (activeTab.paymentMethod === 'Cash' && activeTab.cashReceived) ? (sanitizeNum(activeTab.cashReceived) - remainingToPay) : 0;

    const eligibleFreebies = activeFreebies.filter(f => itemSubTotal > 0 && itemSubTotal >= f.minSpend);

    return {
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
        createNewTab, safeCartTabs, activeTab, updateActiveTab,
        handlePriceModeChange, searchResults, filteredCustomers,
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, eligibleFreebies
    };
}
