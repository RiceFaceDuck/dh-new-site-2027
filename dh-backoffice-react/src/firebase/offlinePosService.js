import { billingService } from './billingService';

const getStorageKey = (staffUid) => {
  if (staffUid && staffUid !== 'System') {
    return `dh_pos_offline_orders_${staffUid}`;
  }
  return 'dh_pos_offline_orders';
};

export const offlinePosService = {
  // Save order to localStorage when offline
  saveOfflineOrder: async (orderData, staffUid) => {
    try {
      const key = getStorageKey(staffUid || orderData?.staffUid || orderData?.actorUid);
      const existingOrdersStr = localStorage.getItem(key);
      let offlineOrders = [];
      if (existingOrdersStr) {
        offlineOrders = JSON.parse(existingOrdersStr);
      }
      
      // Tag it with offline timestamp and staffUid
      const offlineOrder = {
        ...orderData,
        staffUid: staffUid || orderData?.staffUid || 'System',
        isOfflineSync: true,
        offlineSavedAt: new Date().toISOString()
      };
      
      offlineOrders.push(offlineOrder);
      localStorage.setItem(key, JSON.stringify(offlineOrders));
      
      return true;
    } catch (error) {
      console.error("Failed to save offline order:", error);
      throw error;
    }
  },

  // Get all pending offline orders for a specific staff (with legacy fallback)
  getOfflineOrders: (staffUid) => {
    try {
      const key = getStorageKey(staffUid);
      let orders = [];
      const staffOrdersStr = localStorage.getItem(key);
      if (staffOrdersStr) {
        orders = JSON.parse(staffOrdersStr);
      }
      
      // Legacy fallback: check global key if key is specific
      if (key !== 'dh_pos_offline_orders') {
        const legacyStr = localStorage.getItem('dh_pos_offline_orders');
        if (legacyStr) {
          try {
            const legacyOrders = JSON.parse(legacyStr);
            if (Array.isArray(legacyOrders) && legacyOrders.length > 0) {
              const matchedLegacy = legacyOrders.filter(o => !o.staffUid || o.staffUid === staffUid);
              if (matchedLegacy.length > 0) {
                orders = [...orders, ...matchedLegacy];
                // Clean up matched legacy
                const remainingLegacy = legacyOrders.filter(o => o.staffUid && o.staffUid !== staffUid);
                if (remainingLegacy.length > 0) {
                  localStorage.setItem('dh_pos_offline_orders', JSON.stringify(remainingLegacy));
                } else {
                  localStorage.removeItem('dh_pos_offline_orders');
                }
                localStorage.setItem(key, JSON.stringify(orders));
              }
            }
          } catch (e) {
            console.error("Error migrating legacy offline orders:", e);
          }
        }
      }
      
      return orders;
    } catch (error) {
      console.error("Failed to read offline orders:", error);
      return [];
    }
  },

  // Clear offline orders for a staff
  clearOfflineOrders: (staffUid) => {
    const key = getStorageKey(staffUid);
    localStorage.removeItem(key);
  },

  // Sync offline orders to server when online
  syncOfflineOrders: async (actorUid = 'System') => {
    const key = getStorageKey(actorUid);
    const orders = offlinePosService.getOfflineOrders(actorUid);
    if (!orders || orders.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    let remainingOrders = [];

    for (const order of orders) {
      try {
        await billingService.createOrder(order, actorUid, 'POS_OFFLINE_SYNC');
        successCount++;
      } catch (error) {
        console.error(`Failed to sync offline order ${order.orderId}:`, error);
        failedCount++;
        remainingOrders.push(order);
      }
    }

    if (remainingOrders.length > 0) {
      localStorage.setItem(key, JSON.stringify(remainingOrders));
    } else {
      offlinePosService.clearOfflineOrders(actorUid);
    }

    return { success: successCount, failed: failedCount, total: orders.length };
  }
};
