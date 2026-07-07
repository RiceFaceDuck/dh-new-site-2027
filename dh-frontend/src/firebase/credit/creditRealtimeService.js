import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config';
import { getUsersPath } from './creditConfig';
import { getUserTier } from './creditFormatService';

export const listenToUserCredit = (userId, callback) => {
  if (!userId) {
    callback({ balance: 0, tier: getUserTier(0), totalAccumulated: 0, pendingCredits: 0 });
    return () => {};
  }

  const usersPath = getUsersPath();
  const profileRef = doc(db, usersPath, userId);

  let state = {
    balance: 0,
    totalAccumulated: 0,
    pendingCredits: 0
  };

  const notifyUI = () => {
    callback({
      balance: state.balance,
      tier: getUserTier(state.totalAccumulated),
      totalAccumulated: state.totalAccumulated,
      pendingCredits: state.pendingCredits
    });
  };

  const unsubProfile = onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      state.balance = Number(data.creditPoints || 0);
      state.totalAccumulated = Number(data.totalAccumulatedPoints || data.creditPoints || 0);
      state.pendingCredits = Number(data.pendingCredits) || 0;
      
      notifyUI();
    }
  });

  return () => {
    unsubProfile();
  };
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
