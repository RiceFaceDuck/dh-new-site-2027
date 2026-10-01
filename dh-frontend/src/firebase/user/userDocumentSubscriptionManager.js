import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

let userCache = {};
let taxCache = {};
let userCacheTime = {};
let taxCacheTime = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const userProfileCache = {
  getProfile: (uid) => {
    const now = Date.now();
    return userCache[uid] && now - (userCacheTime[uid] || 0) < CACHE_TTL_MS ? userCache[uid] : null;
  },
  setProfile: (uid, profile) => {
    userCache[uid] = profile;
    userCacheTime[uid] = Date.now();
  },
  getTaxInfo: (uid) => {
    const now = Date.now();
    return taxCache[uid] && now - (taxCacheTime[uid] || 0) < CACHE_TTL_MS ? taxCache[uid] : null;
  },
  setTaxInfo: (uid, tax) => {
    taxCache[uid] = tax;
    taxCacheTime[uid] = Date.now();
  },
  clearCache: (uid = null) => {
    if (uid) {
      delete userCache[uid];
      delete taxCache[uid];
      delete userCacheTime[uid];
      delete taxCacheTime[uid];
    } else {
      userCache = {};
      taxCache = {};
      userCacheTime = {};
      taxCacheTime = {};
    }
  }
};

const handleLogout = () => {
  userProfileCache.clearCache();
};

if (typeof window !== 'undefined') {
  window.removeEventListener('dh_auth_logout', handleLogout);
  window.addEventListener('dh_auth_logout', handleLogout);
}

const subscriptionMap = new Map();

export const userDocumentSubscriptionManager = {
  subscribe: (uid, callback) => {
    if (!uid) {
      callback(null);
      return () => {};
    }

    let sub = subscriptionMap.get(uid);
    if (sub) {
      sub.callbacks.add(callback);
      if (sub.lastData !== undefined) {
        callback(sub.lastData);
      }
    } else {
      const callbacks = new Set();
      callbacks.add(callback);
      const userRef = doc(db, getCollectionPath('users'), uid);
      sub = {
        callbacks,
        lastData: userProfileCache.getProfile(uid) || null,
        unsub: () => {}
      };
      subscriptionMap.set(uid, sub);
      sub.unsub = onSnapshot(
        userRef,
        (snapshot) => {
          const data = snapshot.exists() ? snapshot.data() : null;
          if (data) userProfileCache.setProfile(uid, data);
          sub.lastData = data;
          callbacks.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error('Error in subscriber callback:', err);
            }
          });
        },
        (err) => {
          console.error('🔥 [userDocumentSubscriptionManager] Listener error:', err);
          callbacks.forEach((cb) => {
            try {
              cb(null);
            } catch (errCb) {
              console.error('Error in subscriber error fallback:', errCb);
            }
          });
        }
      );
    }

    return () => {
      const currentSub = subscriptionMap.get(uid);
      if (currentSub) {
        currentSub.callbacks.delete(callback);
        if (currentSub.callbacks.size === 0) {
          currentSub.unsub();
          subscriptionMap.delete(uid);
        }
      }
    };
  }
};
