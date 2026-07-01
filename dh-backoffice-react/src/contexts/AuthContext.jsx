import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { userService, SUPER_ADMINS } from '../firebase/userService';
import { gasHistoryService } from '../firebase/gasHistoryService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isProfileSetupRequired, setIsProfileSetupRequired] = useState(false);
  
  const [accessDenied, setAccessDenied] = useState(false);
  const [denyReason, setDenyReason] = useState('pending'); // 'pending' | 'blocked' | 'error'

  useEffect(() => {
    let unsubscribeRole = () => {};
    let timeoutId;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setIsCheckingAuth(true);
      
      if (currentUser) {
        // Fallback timeout in case DB connection hangs
        timeoutId = setTimeout(() => {
          console.warn("⚠️ [AuthContext] Connection timeout. Forcing access denied.");
          setIsCheckingAuth(false);
          setLoading(false);
          setAccessDenied(true);
          setDenyReason('error');
        }, 30000);

        const userEmail = (currentUser.email || '').toLowerCase();
        const isExecutive = SUPER_ADMINS.includes(userEmail);

        unsubscribeRole = userService.listenToUserRole(currentUser.uid, (roleStr, roleData, error) => {
          clearTimeout(timeoutId);
          setLoading(false);

          if (error) {
            console.error("🔥 [AuthContext] Error fetching role:", error);
            setIsCheckingAuth(false);
            setAccessDenied(true);
            setDenyReason('error');
            setUser(currentUser);
            return;
          }

          const currentRoleStr = String(roleStr || roleData?.userType || '').toLowerCase();
          
          // Check Staff role
          const isStaffMember = roleData?.isStaff || 
            ['admin', 'manager', 'staff', 'packer', 'developer', 'owner', 'ผู้จัดการ', 'เจ้าของ'].includes(currentRoleStr);
          
          const isPending = currentRoleStr === 'pending_approval' || currentRoleStr === 'pending' || roleData?.status === 'pending';
          const isSuspended = roleData?.isActive === false || roleData?.status === 'suspended';
          const needsSetup = !roleData?.role && !roleData?.firstName; // Slightly modified, depending on legacy data

          // Determine Profile Setup
          if (needsSetup && !isPending && !isStaffMember && !isExecutive) {
             setIsProfileSetupRequired(true);
             setIsPendingApproval(false);
             setAccessDenied(false);
          } 
          // Determine Pending status for new registrations
          else if (isPending) {
             setIsPendingApproval(true);
             setIsProfileSetupRequired(false);
             setAccessDenied(true);
             setDenyReason('pending');
          }
          // Determine Gatekeeper Access (Staff + Admin)
          else if (isExecutive || (isStaffMember && !isSuspended && !isPending)) {
            setIsCheckingAuth(false);
            setAccessDenied(false);
            setIsPendingApproval(false);
            setIsProfileSetupRequired(false);
            
            // Format Display Role
            let displayRole = roleData?.roles ? roleData.roles[0] : (roleData?.role || 'Staff');
            if (isExecutive && userEmail === 'zhoulinjuan1@gmail.com') displayRole = 'Owner (เจ้าของ)';
            if (isExecutive && userEmail === 'dh1notebook@gmail.com') displayRole = 'VP 1 (รองประธาน)';

            const finalProfile = {
              ...roleData,
              firstName: roleData?.displayName || currentUser.displayName || 'พนักงาน',
              nickname: roleData?.nickname || '',
              role: displayRole,
              uid: currentUser.uid,
              email: userEmail
            };
            setProfile(finalProfile);
            gasHistoryService.setProfile(finalProfile);
          } else {
             // Access denied (Blocked or unknown non-staff)
             setIsCheckingAuth(false);
             setAccessDenied(true);
             setDenyReason(isSuspended ? 'blocked' : 'pending');
          }

          setUser(currentUser);
        });

      } else {
        clearTimeout(timeoutId);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setIsCheckingAuth(false);
        setIsPendingApproval(false);
        setIsProfileSetupRequired(false);
        setAccessDenied(false);
        localStorage.removeItem('dh_last_activity');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribeAuth();
      unsubscribeRole();
    };
  }, []);

  // 🕒 12-Hour Inactivity Timeout (เตะออกเมื่อไม่มีการเคลื่อนไหวเกิน 12 ชั่วโมง)
  useEffect(() => {
    if (!user) return; // Only track if user is logged in

    let intervalId;
    const INACTIVITY_LIMIT_MS = 12 * 60 * 60 * 1000; // 12 ชั่วโมง
    const ACTIVITY_KEY = 'dh_last_activity';

    const checkInactivity = () => {
      const lastActivityStr = localStorage.getItem(ACTIVITY_KEY);
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        const now = Date.now();
        if (now - lastActivity > INACTIVITY_LIMIT_MS) {
          console.warn("⚠️ [AuthContext] Inactivity timeout reached. Logging out.");
          signOut(auth).catch(err => console.error("Logout error:", err));
          return true;
        }
      }
      return false;
    };

    // Check immediately on mount/refresh
    if (checkInactivity()) return; 

    const updateActivity = () => {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    };

    // Initial update
    updateActivity();

    // Throttle update to avoid writing to localStorage too frequently
    let throttleTimer = false;
    const throttledUpdateActivity = () => {
      if (!throttleTimer) {
        updateActivity();
        throttleTimer = true;
        setTimeout(() => { throttleTimer = false; }, 10000); // 10 seconds throttle
      }
    };

    // Listen to user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(e => window.addEventListener(e, throttledUpdateActivity, { passive: true }));

    // Check every minute
    intervalId = setInterval(checkInactivity, 60000);

    return () => {
      events.forEach(e => window.removeEventListener(e, throttledUpdateActivity));
      clearInterval(intervalId);
    };
  }, [user]);

  const logout = async () => {
    try {
      localStorage.removeItem('dh_last_activity');
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isManagerOrOwner = () => {
    if (!profile) return false;
    const r = (profile.role || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    return r === 'manager' || r.includes('owner') || r.includes('vp 1') || r === 'ผู้จัดการ' || r === 'เจ้าของ' || SUPER_ADMINS.includes(email);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isCheckingAuth,
      isPendingApproval,
      isProfileSetupRequired,
      accessDenied,
      denyReason,
      logout,
      isManagerOrOwner,
      setIsProfileSetupRequired
    }}>
      {children}
    </AuthContext.Provider>
  );
};
