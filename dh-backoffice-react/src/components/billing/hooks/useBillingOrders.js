import { useState, useEffect } from 'react';
import { billingService } from '../../../firebase/billingService';
import { getStaffNickname } from 'dh-shared/src/utils/staffUtils';
import { readCachedOrders, subscribeRecentOrdersCatalog } from '../../../firebase/orderCacheService';

export default function useBillingOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); 
    const initialSearch = new URLSearchParams(window.location.search).get('search') || '';
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [limitAmount, setLimitAmount] = useState(50); 
    const [isSearching, setIsSearching] = useState(false);
    const [recentOrders, setRecentOrders] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [serviceMap, setServiceMap] = useState({});
    const [staffMap, setStaffMap] = useState({});

    // Load staff map for nickname resolution
    useEffect(() => {
        let isMounted = true;
        import('../../../firebase/userStaffService').then(({ getAllStaff }) => {
            getAllStaff().then((staffList) => {
                if (!isMounted || !Array.isArray(staffList)) return;
                const map = {};
                staffList.forEach(s => {
                    if (s.id || s.uid) {
                        map[s.id || s.uid] = s;
                    }
                });
                setStaffMap(map);
            }).catch(err => {
                console.error("Error loading staff data:", err);
            });
        }).catch(err => {
            console.error("Error dynamically importing userStaffService:", err);
        });

        return () => { isMounted = false; };
    }, []);

    // Subscribe to active service todos
    useEffect(() => {
        if (typeof billingService.subscribeActiveServiceTodos === 'function') {
            const unsubscribeTodos = billingService.subscribeActiveServiceTodos((map) => {
                setServiceMap(map);
            });
            return () => unsubscribeTodos();
        }
    }, []);

    // ⚡ Fast Tier 1: Check Local Session/Memory Cache on initial mount (0ms instant render)
    useEffect(() => {
        const { orders: cached } = readCachedOrders();
        if (cached && Array.isArray(cached) && cached.length > 0) {
            setRecentOrders(cached);
            setLoading(false);
        }
    }, []);

    // ⚡ Tier 2: Subscribe to recent orders (Cache & Overwrite via catalogs/recent_orders with direct query fallback)
    useEffect(() => {
        setLoading(true);

        // If filtering by custom date, use direct collection query
        if (dateRange.start || dateRange.end) {
            const unsubscribe = billingService.subscribeRecentOrders(limitAmount, dateRange, (data) => {
                setRecentOrders(data);
                setLoading(false);
            });
            return () => unsubscribe();
        }

        let isFallbackActive = false;
        let fallbackUnsub = null;

        const unsubscribeCatalog = subscribeRecentOrdersCatalog(
            (catalogOrders) => {
                setRecentOrders(catalogOrders);
                setLoading(false);
            },
            (fallbackReason) => {
                if (!isFallbackActive) {
                    isFallbackActive = true;
                    console.log(`[OrderCache] Using direct collection query fallback (Reason: ${fallbackReason})`);
                    fallbackUnsub = billingService.subscribeRecentOrders(limitAmount, dateRange, (data) => {
                        setRecentOrders(data);
                        setLoading(false);
                    });
                }
            }
        );

        return () => {
            if (typeof unsubscribeCatalog === 'function') unsubscribeCatalog();
            if (typeof fallbackUnsub === 'function') fallbackUnsub();
        };
    }, [limitAmount, dateRange]);

    // Enrich order with active service tasks and resolved staff nickname
    const enrichOrder = (order) => {
        const key = order.orderId || order.id;
        const svc = serviceMap[key] || serviceMap[order.id] || serviceMap[order.orderId] || {};
        const staffNickname = getStaffNickname(order, staffMap);
        return {
            ...order,
            staffNickname,
            hasPendingClaim: order.hasPendingClaim || svc.hasPendingClaim || false,
            hasPendingReturn: order.hasPendingReturn || svc.hasPendingReturn || false,
            hasPendingTax: order.hasPendingTax || svc.hasPendingTax || false
        };
    };

    // Handle normal view when searchQuery is empty
    useEffect(() => {
        if (!isSearching && (!searchQuery || searchQuery.trim().length < 2)) {
            setOrders(recentOrders);
        }
    }, [recentOrders, isSearching, searchQuery]);

    // Search logic triggered on searchQuery update (Enter / submit)
    useEffect(() => {
        const trimmedQuery = (searchQuery || '').trim();
        if (!trimmedQuery || trimmedQuery.length < 2) {
            setIsSearching(false);
            setOrders(recentOrders); 
            return;
        }

        let isCancelled = false;
        const fetchSearchResults = async () => {
            setIsSearching(true);
            const searchResults = await billingService.searchOrders(trimmedQuery);
            if (!isCancelled) {
                if (searchResults) setOrders(searchResults);
                else setOrders(recentOrders); 
                setIsSearching(false);
            }
        };

        fetchSearchResults();

        return () => { isCancelled = true; };
    }, [searchQuery, recentOrders]);

    const enrichedOrders = orders.map(enrichOrder);

    // Derived filtered orders
    const filteredOrders = enrichedOrders.filter(o => {
        const stat = (o.orderStatus || o.status || '').toLowerCase();
        const payStat = (o.paymentStatus || '').toLowerCase();

        const isCancelled = stat === 'cancelled' || stat === 'void';
        const isPaidOrCompleted = !isCancelled && (stat === 'paid' || stat === 'completed' || stat === 'approved' || payStat === 'paid');
        const isDraftOrPending = !isCancelled && !isPaidOrCompleted && (stat === 'draft' || stat === 'pending' || stat === 'waiting_payment' || stat === 'waiting_verification' || payStat === 'unpaid');

        const matchesFilter = filter === 'All' || 
            (filter === 'Paid' && isPaidOrCompleted) || 
            (filter === 'Draft' && isDraftOrPending) ||
            (filter === 'Cancelled' && isCancelled);
        
        const searchTarget = (searchQuery || '').toLowerCase().trim();
        const matchesSearch = !searchTarget || 
                              String(o.orderId || '').toLowerCase().includes(searchTarget) || 
                              String(o.customer?.accountName || '').toLowerCase().includes(searchTarget) ||
                              String(o.customer?.firstName || '').toLowerCase().includes(searchTarget) ||
                              String(o.customer?.lastName || '').toLowerCase().includes(searchTarget) ||
                              String(o.customer?.phone || '').includes(searchTarget) ||
                              String(o.customerInfo?.fullName || '').toLowerCase().includes(searchTarget) ||
                              String(o.customerInfo?.phone || '').includes(searchTarget) ||
                              String(o.walkInName || '').toLowerCase().includes(searchTarget) ||
                              String(o.walkInPhone || '').includes(searchTarget) ||
                              String(o.staffNickname || '').toLowerCase().includes(searchTarget) ||
                              String(o.createdBy || '').toLowerCase().includes(searchTarget) ||
                              String(o.trackingNumber || o.trackingNo || o.shippingTracking || '').toLowerCase().includes(searchTarget) ||
                              String(o.taxInvoiceInfo?.taxId || o.taxId || o.companyTaxId || '').toLowerCase().includes(searchTarget) ||
                              String(o.taxInvoiceInfo?.companyName || '').toLowerCase().includes(searchTarget) ||
                              String(o.notes || o.remark || o.memo || '').toLowerCase().includes(searchTarget) ||
                              String(o.paymentMethod || o.paymentType || '').toLowerCase().includes(searchTarget) ||
                              (Array.isArray(o.items) && o.items.some(item => 
                                  String(item.sku || item.productCode || item.code || '').toLowerCase().includes(searchTarget) ||
                                  String(item.name || item.productName || item.title || '').toLowerCase().includes(searchTarget) ||
                                  String(item.model || item.brand || '').toLowerCase().includes(searchTarget) ||
                                  String(item.sn || item.serialNumber || '').toLowerCase().includes(searchTarget)
                              ));
        
        let matchesDate = true;
        if (dateRange.start || dateRange.end) {
            let orderDate = null;
            if (o.createdAt) {
                if (typeof o.createdAt.toDate === 'function') {
                    orderDate = o.createdAt.toDate();
                } else if (o.createdAt.seconds) {
                    orderDate = new Date(o.createdAt.seconds * 1000);
                } else {
                    orderDate = new Date(o.createdAt);
                }
            }
            
            if (orderDate && !isNaN(orderDate.getTime())) {
                if (dateRange.start) {
                    const start = new Date(dateRange.start); start.setHours(0,0,0,0);
                    if (orderDate < start) matchesDate = false;
                }
                if (dateRange.end) {
                    const end = new Date(dateRange.end); end.setHours(23,59,59,999);
                    if (orderDate > end) matchesDate = false;
                }
            } else {
                matchesDate = false; // Exclude invalid or missing dates when filtering by date
            }
        }
                              
        return matchesFilter && matchesSearch && matchesDate;
    }).sort((a, b) => {
        const getTs = (o) => {
            if (!o) return 0;
            const t = o.createdAt || o.updatedAt || o.date;
            if (!t) return 0;
            if (typeof t.toDate === 'function') return t.toDate().getTime();
            if (t.seconds) return t.seconds * 1000;
            if (typeof t === 'number') return t;
            const n = new Date(t).getTime();
            return isNaN(n) ? 0 : n;
        };
        return getTs(b) - getTs(a);
    });

    return {
        orders: enrichedOrders,
        filteredOrders,
        loading,
        isSearching,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        limitAmount,
        setLimitAmount,
        dateRange,
        setDateRange
    };
}

