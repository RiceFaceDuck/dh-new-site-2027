import { useState, useEffect } from 'react';
import { billingService } from '../../../firebase/billingService';

export default function useBillingOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [limitAmount, setLimitAmount] = useState(25); 
    const [isSearching, setIsSearching] = useState(false);
    const [recentOrders, setRecentOrders] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Subscribe to recent orders
    useEffect(() => {
        setLoading(true);
        const unsubscribe = billingService.subscribeRecentOrders(limitAmount, dateRange, (data) => {
            setRecentOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [limitAmount, dateRange]);

    // Handle normal view
    useEffect(() => {
        if (!isSearching && (!searchQuery || searchQuery.length < 3)) {
            setOrders(recentOrders);
        }
    }, [recentOrders, isSearching, searchQuery]);

    // Search logic with debounce
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setIsSearching(false);
            setOrders(recentOrders); 
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            const searchResults = await billingService.searchOrders(searchQuery);
            if (searchResults) setOrders(searchResults);
            else setOrders(recentOrders); 
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, recentOrders]);

    // Derived filtered orders
    const filteredOrders = orders.filter(o => {
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
                              String(o.customer?.phone || '').includes(searchTarget) ||
                              String(o.walkInName || '').toLowerCase().includes(searchTarget) ||
                              String(o.walkInPhone || '').includes(searchTarget);
        
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
    });

    return {
        orders,
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
