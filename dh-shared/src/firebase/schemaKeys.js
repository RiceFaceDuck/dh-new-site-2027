/**
 * Centralized Firestore Schema Dictionary for DH Notebook monorepo.
 * Eliminates hardcoded collection strings and prevents typos across environments.
 */

export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  BILLINGS: 'billings',
  CLAIMS: 'claims',
  TODOS: 'todos',
  PARTNER_ADS: 'partner_ads',
  BILLBOARD_ADS: 'billboard_ads',
  USER_SKU_ADS: 'user_sku_ads',
  SYSTEM_LOGS: 'system_logs',
  USERS_DELETED_LOG: 'users_deleted_log',
  CATEGORIES: 'categories',
  WARRANTIES: 'warranties',
  STOCK_RECEIPTS: 'stock_receipts',
  STOCK_ADJUSTMENTS: 'stock_adjustments',
  INVENTORY_IMPORT_BATCHES: 'inventory_import_batches',
  CATALOGS: 'catalogs',
  SETTINGS: 'settings',
  SOURCING_REQUESTS: 'sourcing_requests',
  TRANSACTIONS: 'transactions',
  ATTENDANCE_LOGS: 'attendance_logs',
  ADMIN_AUDITS: 'admin_audits',
  WALLET_REQUESTS: 'wallet_requests',
  ORDER_REQUESTS: 'order_requests',
  YEARLY_ARCHIVES: 'yearly_archives',
  PARTNER_REVIEWS: 'partner_reviews'
};

export const COLLECTION_GROUPS = {
  WALLET_TRANSACTIONS: 'wallet_transactions',
  AUDIT_LOGS: 'audit_logs',
};

export const SUBCOLLECTIONS = {
  STORE_PROFILE: 'storeProfile',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
};
