export const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export const getUsersPath = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('canvas') && typeof window.__app_id !== 'undefined') {
        return `artifacts/${window.__app_id}/public/data/users`;
    }
    return 'users';
};

export let historyCache = {}; 
export const CACHE_LIFETIME = 1000 * 60 * 5; 

export const invalidateCreditHistoryCache = (userId) => {
  if (userId) {
    delete historyCache[`${userId}_first_page`];
    console.log(`🧹 [CreditService] History cache forcefully invalidated for: ${userId}`);
  }
};
