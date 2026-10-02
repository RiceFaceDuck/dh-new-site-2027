import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

let cachedTiers = null;
let isSubscribed = false;

let unsubscribe = null;

export const setCachedTiers = (tiers) => {
  if (Array.isArray(tiers) && tiers.length > 0) {
    cachedTiers = tiers;
  }
};

export const getCachedTiers = () => cachedTiers;

export const fetchAndCacheRoleTiers = async () => {
  if (cachedTiers) return cachedTiers;
  try {
    const docRef = doc(db, getCollectionPath('settings'), 'role_tier_config');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.tiers) {
      cachedTiers = snap.data().tiers;
    }
  } catch (err) {
    console.warn("Could not fetch and cache role tiers in frontend:", err);
  }
  return cachedTiers;
};

export const initRoleTierConfigListener = () => {
  if (isSubscribed) return;
  isSubscribed = true;
  try {
    const docRef = doc(db, getCollectionPath('settings'), 'role_tier_config');
    unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data()?.tiers) {
        cachedTiers = snap.data().tiers;
      }
    }, (err) => {
      console.warn("RoleTierConfig listener warning:", err);
    });
  } catch (e) {
    console.warn("Failed to init RoleTierConfig listener:", e);
  }
};

export const stopRoleTierConfigListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  isSubscribed = false;
};

// Note: Explicit listener initialization on demand rather than top-level import execution
export const startRoleTierConfigListener = initRoleTierConfigListener;

export const getUserTier = (points = 0, customTiers = null) => {
  const activeTiers = customTiers || cachedTiers;
  if (activeTiers && Array.isArray(activeTiers) && activeTiers.length > 0) {
    const sortedTiers = [...activeTiers].sort((a, b) => (b.minPoints || 0) - (a.minPoints || 0));
    const matched = sortedTiers.find(t => points >= (t.minPoints || 0));
    if (matched) {
      return {
        name: matched.name || 'Member',
        icon: matched.icon || '🌟',
        color: matched.color || 'text-blue-600',
        bg: matched.bg || 'bg-blue-50',
        border: matched.border || 'border-blue-200',
        multiplier: Number(matched.multiplier || 1.0)
      };
    }
  }

  if (points >= 100000) return { name: 'Diamond', icon: '💎', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', multiplier: 1.5 };
  if (points >= 10000) return { name: 'Platinum', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', multiplier: 1.2 };
  if (points >= 5000) return { name: 'Gold', icon: '🥇', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', multiplier: 1.1 };
  if (points >= 1000) return { name: 'Silver', icon: '🥈', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', multiplier: 1.05 };
  return { name: 'Member', icon: '🌟', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', multiplier: 1 };
};

export const formatCredit = (points = 0) => {
  if (points === undefined || points === null) return '0';
  return new Intl.NumberFormat('th-TH').format(points);
};
