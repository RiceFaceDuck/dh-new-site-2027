/**
 * Resolves the best display name for a customer object.
 * Acts as a single source of truth for fallback naming across DH Notebook apps.
 * @param {Object|String} customer - The customer object or string name
 * @param {String} fallback - Default fallback name if no valid name is found
 * @returns {String} The resolved display name
 */
export const getCustomerDisplayName = (customer, fallback = 'ลูกค้าทั่วไป') => {
    if (!customer) return fallback;
    
    // Sometimes it's a primitive string (if someone passed a name directly)
    if (typeof customer === 'string') return customer;

    // Ordered priority based on DH Notebook business logic
    return customer.storeName || 
           customer.accountName || 
           customer.displayName || 
           customer.firstName || 
           customer.name || 
           customer.email || 
           fallback;
};
