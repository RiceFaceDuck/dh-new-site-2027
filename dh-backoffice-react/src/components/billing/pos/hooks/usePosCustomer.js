import { useState, useMemo } from 'react';

export function usePosCustomer(customers) {
    const [customerSearchText, setCustomerSearchText] = useState('');
    const [showCustDropdown, setShowCustDropdown] = useState(false);

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

    const determineCustomerType = (customer, priceMode) => {
        if (!customer) return 'RETAIL';
        if (customer.customerType === 'VIP') return 'VIP';
        if (customer.customerType === 'WHOLESALE' || customer.level === 'agent' || priceMode === 'wholesale') return 'WHOLESALE';
        return 'RETAIL';
    };

    return {
        customerSearchText, setCustomerSearchText,
        showCustDropdown, setShowCustDropdown,
        filteredCustomers,
        determineCustomerType
    };
}
