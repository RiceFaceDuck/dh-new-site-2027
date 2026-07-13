const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "components/partner/PartnerSupportBox.jsx",
  "components/product/ProductCommunitySection.jsx",
  "components/profile/tabs/TabAdManager.jsx",
  "components/profile/tabs/TabHistory.jsx",
  "components/profile/tabs/TabPrivacy.jsx",
  "components/profile/tabs/claims/ClaimItemCard.jsx",
  "components/profile/tabs/history/useServiceAction.js",
  "components/profile/tabs/store-profile/StoreProfileForm.jsx",
  "components/profile/tabs/store-profile/StoreProfileLocation.jsx",
  "components/profile/tabs/store-profile/hooks/useStoreProfile.js",
  "pages/Home/components/QuickActions.jsx",
  "pages/StoreProfile/StoreProfilePage.jsx",
  "pages/StoreProfile/components/PartnerReviews.jsx"
];

const baseDir = path.join(__dirname, 'dh-frontend', 'src');

filesToUpdate.forEach(file => {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes('alert(')) return;

  // 1. Determine relative path to ToastContext
  const depth = file.split('/').length - 1;
  const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);
  const toastPath = `${relativePrefix}context/ToastContext`;

  // 2. Add import if missing
  if (!content.includes('useToast')) {
    content = content.replace(/(import React.*?;\n)/, `$1import { useToast } from '${toastPath}';\n`);
  }

  // 3. Inject `const { showToast } = useToast();` inside component/hook if missing
  if (!content.includes('showToast')) {
    // find main function export or declaration
    // const MyComp = () => {
    // export default function MyComp() {
    content = content.replace(/(const \w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*{)/, `$1\n  const { showToast } = useToast();`);
    content = content.replace(/(export default function \w+\([^)]*\)\s*{)/, `$1\n  const { showToast } = useToast();`);
  }

  // 4. Replace alert(...) with showToast(..., 'type')
  content = content.replace(/alert\((.*?)\)/g, (match, inner) => {
    let type = "'error'";
    if (inner.includes('สำเร็จ') || inner.includes('เรียบร้อย')) type = "'success'";
    else if (inner.includes('ข้อมูล') || inner.includes('กำลัง')) type = "'info'";
    
    return `showToast(${inner}, ${type})`;
  });

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated: ${file}`);
});
