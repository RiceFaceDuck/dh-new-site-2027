import { 
    syncUserProfile, 
    listenToUserRole, 
    getUserProfile, 
    getUserById,
    createUserProfile
} from './userProfileService';

import { 
    getAllStaff, 
    getPendingStaff, 
    registerPendingStaff, 
    updateStaffDetails 
} from './userStaffService';

import { 
    updateUserProfile, 
    updateUserRole, 
    suspendUser, 
    restoreUser, 
    deleteUser, 
    updateUserLoginStatus, 
    updateUserEcosystem, 
    adminAdjustFinancials,
    createManualCustomer,
    updateCustomerProfile,
    deleteCustomer
} from './userManagementService';

// 🛡️ Super Admins & Valid Roles 
export const SUPER_ADMINS = [
    'zhoulinjuan1@gmail.com', // 👑 Owner
    'dh1notebook@gmail.com'   // 💼 VP 1
];

// ============================================================================
// 🟠 Object Export (Facade Pattern)
// ============================================================================
export const userService = {
    syncUserProfile,
    createUserProfile,
    listenToUserRole,
    getUserProfile,
    getUserById,
    getAllStaff,
    getPendingStaff,
    updateUserProfile,
    updateUserRole,
    suspendUser,
    restoreUser,
    deleteUser,
    updateUserLoginStatus,
    updateUserEcosystem,
    adminAdjustFinancials,
    registerPendingStaff, 
    updateStaffDetails,
    createManualCustomer,
    updateCustomerProfile,
    deleteCustomer
};