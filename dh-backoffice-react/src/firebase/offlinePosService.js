import { billingService } from './billingService';

const OFFLINE_STORAGE_KEY = 'dh_pos_offline_orders';

export const offlinePosService = {
  // Save order to localStorage when offline
  saveOfflineOrder: async (orderData) => {
    try {
      const existingOrdersStr = localStorage.getItem(OFFLINE_STORAGE_KEY);
      let offlineOrders = [];
      if (existingOrdersStr) {
        offlineOrders = JSON.parse(existingOrdersStr);
      }
      
      // Tag it with offline timestamp
      const offlineOrder = {
        ...orderData,
        isOfflineSync: true,
        offlineSavedAt: new Date().toISOString()
      };
      
      offlineOrders.push(offlineOrder);
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineOrders));
      
      return true;
    } catch (error) {
      console.error("Failed to save offline order:", error);
      throw error;
    }
  },

  // Get all pending offline orders
  getOfflineOrders: () => {
    try {
      const existingOrdersStr = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (existingOrdersStr) {
        return JSON.parse(existingOrdersStr);
      }
      return [];
    } catch (error) {
      console.error("Failed to read offline orders:", error);
      return [];
    }
  },

  // Clear offline orders (used after successful sync)
  clearOfflineOrders: () => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
  },

  // Sync offline orders to server when online
  syncOfflineOrders: async (actorUid = 'System') => {
    const orders = offlinePosService.getOfflineOrders();
    if (!orders || orders.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    let remainingOrders = [];

    for (const order of orders) {
      try {
        // The billingTransactionService will handle TEMP- automatically if status is Paid.
        await billingService.createOrder(order, actorUid, 'POS_OFFLINE_SYNC');
        successCount++;
      } catch (error) {
        console.error(`Failed to sync offline order ${order.orderId}:`, error);
        failedCount++;
        remainingOrders.push(order);
      }
    }

    if (remainingOrders.length > 0) {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(remainingOrders));
    } else {
      offlinePosService.clearOfflineOrders();
    }

    return { success: successCount, failed: failedCount, total: orders.length };
  }
};
