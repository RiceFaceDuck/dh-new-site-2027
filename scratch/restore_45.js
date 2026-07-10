const fs = require('fs');
const list = [
'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js',
'dh-backoffice-react/src/components/inventory/InventoryExportModal.jsx',
'dh-backoffice-react/src/components/inventory/modal/ProductImageUpload.jsx',
'dh-backoffice-react/src/components/inventory/ProductModal.jsx',
'dh-backoffice-react/src/components/managers/featured/FeaturedSettings.jsx',
'dh-backoffice-react/src/components/managers/squad/SquadHighlightSettings.jsx',
'dh-backoffice-react/src/firebase/categoryService.js',
'dh-backoffice-react/src/firebase/claim/claimRequestService.js',
'dh-backoffice-react/src/firebase/freebieService.js',
'dh-backoffice-react/src/firebase/inventory/inventoryQueryService.js',
'dh-backoffice-react/src/firebase/transactionImportService.js',
'dh-backoffice-react/src/firebase/userManagementService.js',
'dh-backoffice-react/src/pages/Calendar/useCalendar.js',
'dh-backoffice-react/src/pages/Customers/components/forms/CustomerModal.jsx',
'dh-backoffice-react/src/pages/GenerateSync/components/daily-tasks/InventoryCountExport.jsx',
'dh-backoffice-react/src/pages/GenerateSync/components/daily-tasks/SkuMerchantExport.jsx',
'dh-backoffice-react/src/pages/GenerateSync/components/non-daily-tasks/ShopeeTemplateUpload.jsx',
'dh-backoffice-react/src/pages/GenerateSync/components/RecentImportsModal.jsx',
'dh-backoffice-react/src/pages/managers/components/staff/StaffAddModal.jsx',
'dh-backoffice-react/src/pages/managers/components/staff/StaffEditModal.jsx',
'dh-backoffice-react/src/pages/managers/components/theme/HeroConfigTab/index.jsx',
'dh-backoffice-react/src/pages/managers/hooks/useFreebies.js',
'dh-backoffice-react/src/pages/managers/hooks/usePromotions.js',
'dh-backoffice-react/src/pages/managers/hooks/useStaffManagement.js',
'dh-backoffice-react/src/pages/managers/pricing/hooks/usePricingSettings.js',
'dh-backoffice-react/src/pages/managers/settings/data_repair/useDataRepair.js',
'dh-backoffice-react/src/pages/managers/settings/inventory/hooks/useGlobalBufferSettings.js',
'dh-backoffice-react/src/pages/managers/settings/shipping/hooks/useShippingManagement.js',
'dh-frontend/src/components/product/ProductCommunitySection.jsx',
'dh-frontend/src/components/profile/forms/useProfileTaxLogic.js',
'dh-frontend/src/components/profile/tabs/claims/ClaimItemCard.jsx',
'dh-frontend/src/components/profile/tabs/history/useServiceAction.js',
'dh-frontend/src/components/profile/tabs/store-profile/hooks/useStoreProfile.js',
'dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx',
'dh-frontend/src/components/profile/tabs/TabAdManager.jsx',
'dh-frontend/src/components/profile/tabs/TabHistory.jsx',
'dh-frontend/src/components/profile/tabs/TabPrivacy.jsx',
'dh-frontend/src/components/profile/tabs/wallet/WithdrawModal.jsx',
'dh-frontend/src/firebase/authService.js',
'dh-frontend/src/firebase/credit/adCreditService.js',
'dh-frontend/src/firebase/credit/creditActionService.js',
'dh-frontend/src/firebase/driveService.js',
'dh-frontend/src/firebase/marketingService.js',
'dh-frontend/src/firebase/userService.js',
'dh-frontend/src/utils/memoryCache.js'
];
const { execSync } = require('child_process');
try {
  execSync('git checkout -- ' + list.map(f => '"' + f + '"').join(' '));
  console.log('Restored 45 files');
} catch (e) {
  console.error(e.message);
}
