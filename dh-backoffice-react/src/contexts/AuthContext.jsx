import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { userService, SUPER_ADMINS } from '../firebase/userService';
import { gasHistoryService } from '../firebase/gasHistoryService';
import { VALID_STAFF_ROLES } from '../firebase/userStaffService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const AuthStateContext = createContext();
export const AuthDispatchContext = createContext();

export const useAuth = () => {
  const state = useContext(AuthStateContext) || {};
  const dispatch = useContext(AuthDispatchContext) || {};
  return { ...state, ...dispatch };
};

export const useAuthState = () => useContext(AuthStateContext);
export const useAuthDispatch = () => useContext(AuthDispatchContext);

// 🛡️ RBAC Safe Defaults & In-Memory / Session Storage Cache (Zero Quota Read on Warm Cache)
const DEFAULT_RBAC_PERMISSIONS = {
  canEditProduct: ['owner', 'admin', 'manager', 'staff'],
  canDeleteOrder: ['owner', 'admin'],
  canEditProductPrice: ['owner', 'admin', 'manager'],
  canApproveRefund: ['owner', 'admin', 'manager'],
  canViewReports: ['owner', 'admin', 'manager'],
  canManageUsers: ['owner', 'admin'],
  canBypassBufferStock: ['owner', 'admin', 'manager']
};

const RBAC_CACHE_KEY = 'dh_rbac_permissions_cache';
let inMemoryRbacCache = null;

const resolveUserRoles = (profile, user) => {
  const roles = new Set();
  const email = (user?.email || profile?.email || '').toLowerCase().trim();
  if (SUPER_ADMINS.includes(email)) {
    roles.add('owner');
    roles.add('admin');
  }
  const roleStrings = [];
  if (profile?.role) roleStrings.push(String(profile.role));
  if (Array.isArray(profile?.roles)) profile.roles.forEach(r => roleStrings.push(String(r)));
  if (profile?.userType) roleStrings.push(String(profile.userType));

  roleStrings.forEach(r => {
    const lower = r.toLowerCase().trim();
    if (lower.includes('owner') || lower.includes('เจ้าของ') || lower.includes('vp 1') || lower.includes('ประธาน')) roles.add('owner');
    if (lower.includes('admin') || lower.includes('แอดมิน') || lower.includes('ผู้ดูแลระบบ')) roles.add('admin');
    if (lower.includes('manager') || lower.includes('ผู้จัดการ')) roles.add('manager');
    if (lower.includes('packer') || lower.includes('แพ็ค') || lower.includes('แพก')) roles.add('packer');
    if (lower.includes('finance') || lower.includes('บัญชี') || lower.includes('การเงิน')) roles.add('finance');
    if (lower.includes('developer') || lower.includes('นักพัฒนา') || lower.includes('ไอที') || lower === 'it') roles.add('developer');
    if (lower.includes('staff') || lower.includes('พนักงาน')) roles.add('staff');
  });

  if (roles.size === 0 && (profile || user)) {
    roles.add('staff');
  }
  return Array.from(roles);
};

export const useRbac = (profile, user) => {
  const [permissions, setPermissions] = useState(() => {
    if (inMemoryRbacCache) return inMemoryRbacCache;
    try {
      const cached = sessionStorage.getItem(RBAC_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        inMemoryRbacCache = parsed;
        return parsed;
      }
    } catch (_err) {
      /* ignore cache read error */
    }
    return DEFAULT_RBAC_PERMISSIONS;
  });
  const [rbacLoading, setRbacLoading] = useState(!inMemoryRbacCache);

  useEffect(() => {
    let isMounted = true;
    const docRef = doc(db, getCollectionPath('settings'), 'rbac_permissions');
    const unsub = onSnapshot(docRef, snap => {
      if (isMounted) {
        if (snap.exists()) {
          const data = snap.data();
          inMemoryRbacCache = data;
          try {
            sessionStorage.setItem(RBAC_CACHE_KEY, JSON.stringify(data));
          } catch (_err) {
            /* ignore storage quota error */
          }
          setPermissions(data);
        } else {
          inMemoryRbacCache = DEFAULT_RBAC_PERMISSIONS;
          setPermissions(DEFAULT_RBAC_PERMISSIONS);
        }
        setRbacLoading(false);
      }
    }, err => {
      console.warn('⚠️ [RBAC] Failed to load rbac_permissions, fallback to safe defaults:', err);
      if (isMounted) {
        setPermissions(DEFAULT_RBAC_PERMISSIONS);
        setRbacLoading(false);
      }
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const userRoles = useMemo(() => resolveUserRoles(profile, user), [profile, user]);
  const isOwnerOrSuperAdmin = useMemo(() => {
    const email = (user?.email || profile?.email || '').toLowerCase().trim();
    return SUPER_ADMINS.includes(email) || userRoles.includes('owner');
  }, [userRoles, user, profile]);

  const hasPermission = useCallback((permissionKey) => {
    if (isOwnerOrSuperAdmin) return true;
    const raw = permissions?.[permissionKey];
    const roleList = Array.isArray(raw) ? raw : (DEFAULT_RBAC_PERMISSIONS[permissionKey] || []);
    const allowedRoles = roleList.map(r => String(r).toLowerCase().trim());
    return userRoles.some(r => allowedRoles.includes(r));
  }, [permissions, userRoles, isOwnerOrSuperAdmin]);

  return {
    hasPermission,
    userRoles,
    isOwnerOrSuperAdmin,
    rbacLoading,
    canEditProduct: hasPermission('canEditProduct'),
    canEditProductPrice: hasPermission('canEditProductPrice'),
    canDeleteOrder: hasPermission('canDeleteOrder'),
    canApproveRefund: hasPermission('canApproveRefund'),
    canViewReports: hasPermission('canViewReports'),
    canManageUsers: hasPermission('canManageUsers'),
    canBypassBufferStock: hasPermission('canBypassBufferStock')
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isProfileSetupRequired, setIsProfileSetupRequired] = useState(false);
  
  const [accessDenied, setAccessDenied] = useState(false);
  const [denyReason, setDenyReason] = useState('pending'); // 'pending' | 'blocked' | 'error'

  const unsubscribeRoleRef = useRef(null);

  useEffect(() => {
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

        if (unsubscribeRoleRef.current) {
          unsubscribeRoleRef.current();
          unsubscribeRoleRef.current = null;
        }

        unsubscribeRoleRef.current = userService.listenToUserRole(currentUser.uid, (roleStr, roleData, error) => {
          clearTimeout(timeoutId);
          setLoading(false);

          if (error) {
            console.error("🔥 [AuthContext] Error fetching role:", error);
            // 🛡️ หากหลุดการเชื่อมต่อ หรือ user ถูก sign out ไปแล้ว ไม่ต้องตั้ง accessDenied
            if (!auth.currentUser) {
              setIsCheckingAuth(false);
              setUser(null);
              setProfile(null);
              setAccessDenied(false);
              return;
            }
            setIsCheckingAuth(false);
            setAccessDenied(true);
            setDenyReason('error');
            setUser(currentUser);
            return;
          }

          const currentRoleStr = String(roleStr || roleData?.userType || '').toLowerCase();
          
          // Check Staff role
          const isStaffMember = roleData?.isStaff || VALID_STAFF_ROLES.includes(currentRoleStr);
          
          const isPending = currentRoleStr === 'pending_approval' || currentRoleStr === 'pending' || roleData?.status === 'pending';
          const isSuspended = roleData?.isActive === false || roleData?.status === 'suspended';
          const needsSetup = !roleData?.role && !roleData?.firstName; // Slightly modified, depending on legacy data

          // Determine Profile Setup
          if (needsSetup && !isPending && !isStaffMember && !isExecutive) {
             setIsCheckingAuth(false);
             setIsProfileSetupRequired(true);
             setIsPendingApproval(false);
             setAccessDenied(false);
          } 
          // Determine Pending status for new registrations
          else if (isPending) {
             setIsCheckingAuth(false);
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
        if (unsubscribeRoleRef.current) {
          unsubscribeRoleRef.current();
          unsubscribeRoleRef.current = null;
        }
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
      if (unsubscribeRoleRef.current) {
        unsubscribeRoleRef.current();
        unsubscribeRoleRef.current = null;
      }
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
          localStorage.removeItem(ACTIVITY_KEY);
          if (unsubscribeRoleRef.current) {
            unsubscribeRoleRef.current();
            unsubscribeRoleRef.current = null;
          }
          signOut(auth)
            .catch(err => console.error("Logout error:", err))
            .finally(() => {
              window.location.reload();
            });
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

  const logout = useCallback(async () => {
    try {
      if (user) {
        gasHistoryService.log({
          level: 'INFO',
          module: 'AUTH',
          action: 'LOGOUT',
          target: { id: user.uid, name: user.email },
          details: { method: 'User Action' }
        });
      }
      localStorage.removeItem('dh_last_activity');
      if (unsubscribeRoleRef.current) {
        unsubscribeRoleRef.current();
        unsubscribeRoleRef.current = null;
      }
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [user]);

  const isManagerOrOwner = useCallback(() => {
    if (!profile) return false;
    const r = (profile.role || '').toLowerCase();
    const email = (user?.email || '').toLowerCase().trim();
    const rolesArray = Array.isArray(profile.roles) ? profile.roles.map(x => String(x).toLowerCase()) : [];

    const isMatchedRole = 
      r === 'manager' || r.includes('owner') || r.includes('admin') || r.includes('vp 1') || 
      r.includes('ผู้จัดการ') || r.includes('เจ้าของ') || r.includes('แอดมิน') ||
      rolesArray.some(x => x.includes('manager') || x.includes('owner') || x.includes('admin') || x.includes('ผู้จัดการ') || x.includes('เจ้าของ') || x.includes('แอดมิน'));

    return isMatchedRole || SUPER_ADMINS.map(e => e.toLowerCase().trim()).includes(email);
  }, [profile, user]);

  const rbac = useRbac(profile, user);

  const stateValue = useMemo(() => ({
    user,
    currentUser: user,
    profile,
    loading,
    isCheckingAuth,
    isPendingApproval,
    isProfileSetupRequired,
    accessDenied,
    denyReason,
    isManagerOrOwner,
    rbac,
    hasPermission: rbac.hasPermission,
    canEditProduct: rbac.canEditProduct,
    canEditProductPrice: rbac.canEditProductPrice,
    canDeleteOrder: rbac.canDeleteOrder,
    canApproveRefund: rbac.canApproveRefund,
    canViewReports: rbac.canViewReports,
    canManageUsers: rbac.canManageUsers,
    canBypassBufferStock: rbac.canBypassBufferStock
  }), [user, profile, loading, isCheckingAuth, isPendingApproval, isProfileSetupRequired, accessDenied, denyReason, isManagerOrOwner, rbac]);

  const dispatchValue = useMemo(() => ({
    logout,
    setIsProfileSetupRequired
  }), [logout]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthDispatchContext.Provider value={dispatchValue}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};
