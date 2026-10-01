import { useState, useEffect } from 'react';
import { getUserTier } from './creditFormatService';
import { userDocumentSubscriptionManager } from '../user/userDocumentSubscriptionManager';

export const listenToUserCredit = (userId, callback) => {
  if (!userId) {
    callback({ balance: 0, tier: getUserTier(0), totalAccumulated: 0, pendingCredits: 0 });
    return () => {};
  }

  return userDocumentSubscriptionManager.subscribe(userId, (data) => {
    if (data) {
      const balance = Number(data.creditPoints || 0);
      const totalAccumulated = Number(data.totalAccumulatedPoints || data.creditPoints || 0);
      const pendingCredits = Number(data.pendingCredits || 0);
      callback({
        balance,
        tier: getUserTier(totalAccumulated),
        totalAccumulated,
        pendingCredits
      });
    } else {
      callback({ balance: 0, tier: getUserTier(0), totalAccumulated: 0, pendingCredits: 0 });
    }
  });
};

export const useUserCredit = (userId) => {
  const [creditInfo, setCreditInfo] = useState({
    balance: 0,
    tier: getUserTier(0),
    totalAccumulated: 0,
    pendingCredits: 0,
    loading: true,
    error: false
  });

  useEffect(() => {
    if (!userId) {
      setCreditInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = listenToUserCredit(userId, (data) => {
      setCreditInfo({
        ...data,
        loading: false,
        error: data.error || false
      });
    });

    return () => unsubscribe();
  }, [userId]);

  return creditInfo;
};
