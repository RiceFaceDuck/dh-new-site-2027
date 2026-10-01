import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { userDocumentSubscriptionManager } from '../firebase/user/userDocumentSubscriptionManager';

export const AuthStateContext = createContext();
export const AuthDispatchContext = createContext();

const ACTIVITY_KEY = 'dh_frontend_last_activity';
const INACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 Hours

/**
 * SRP Hook for consuming Auth Context in dh-frontend
 */
export const useAuth = () => {
  const state = useContext(AuthStateContext) || {};
  const dispatch = useContext(AuthDispatchContext) || {};
  return { ...state, ...dispatch };
};

export const useAuthState = () => useContext(AuthStateContext);
export const useAuthDispatch = () => useContext(AuthDispatchContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 12-Hour Session Inactivity Auto-Logout
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    };

    const checkTimeout = () => {
      const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY) || 0);
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
        console.warn('Session expired due to inactivity. Logging out.');
        localStorage.removeItem(ACTIVITY_KEY);
        firebaseSignOut(auth);
      }
    };

    updateActivity();
    const interval = setInterval(checkTimeout, 60000); // Check every minute
    window.addEventListener('pointerdown', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [user]);

  // Single Auth & Profile Listener
  useEffect(() => {
    let unsubProfile = () => {};

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        unsubProfile = userDocumentSubscriptionManager.subscribe(currentUser.uid, (data) => {
          if (data) {
            setProfile({ uid: currentUser.uid, ...data });
          } else {
            setProfile({ uid: currentUser.uid, email: currentUser.email });
          }
          setLoading(false);
        });
      } else {
        unsubProfile();
        setProfile(null);
        setLoading(false);
        localStorage.removeItem(ACTIVITY_KEY);
      }
    });

    return () => {
      unsubAuth();
      unsubProfile();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem(ACTIVITY_KEY);
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, []);

  const stateValue = useMemo(() => {
    if (!user) {
      return {
        user: null,
        currentUser: null,
        profile: null,
        loading,
        isAuthenticated: false
      };
    }

    const mergedUser = {
      ...user,
      ...profile,
      uid: user.uid,
      email: user.email || profile?.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      phoneNumber: profile?.phoneNumber || profile?.phone || user.phoneNumber || '',
      photoURL: profile?.photoURL || profile?.avatarUrl || user.photoURL || null,
      displayName: profile?.displayName || profile?.name || profile?.accountName || user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
    };

    return {
      user,
      currentUser: mergedUser,
      profile,
      loading,
      isAuthenticated: true
    };
  }, [user, profile, loading]);

  const dispatchValue = useMemo(() => ({
    logout
  }), [logout]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthDispatchContext.Provider value={dispatchValue}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};
