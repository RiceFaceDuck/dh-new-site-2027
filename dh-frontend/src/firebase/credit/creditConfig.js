export const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export { getUsersPath } from 'dh-shared/src/firebase/pathUtils';

export let historyCache = {}; 
export const CACHE_LIFETIME = 1000 * 60 * 5; 

export const invalidateCreditHistoryCache = (userId) => {
  if (userId) {
    delete historyCache[`${userId}_first_page`];
    console.log(`🧹 [CreditService] History cache forcefully invalidated for: ${userId}`);
  }
};
