/**
 * Verification Test: Wallet Phase 5 Domain Terminology & UI Integration
 * Path: Management System/tests/verifications/verify_wallet_phase5_domain_ui.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../');

console.log('========================================================');
console.log('🧪 VERIFY: Wallet Phase 5 Domain Terminology & UI Integration');
console.log('========================================================\n');

let passCount = 0;
let totalChecks = 5;

// Check 1: Files Existence
const checkoutHookPath = path.join(baseDir, 'dh-frontend/src/components/checkout/hooks/useCheckoutLogic.js');
const toggleBoxPath = path.join(baseDir, 'dh-frontend/src/components/checkout/CreditToggleBox.jsx');
const checkoutPagePath = path.join(baseDir, 'dh-frontend/src/pages/Checkout.jsx');
const checkoutIndexPath = path.join(baseDir, 'dh-frontend/src/components/checkout/index.js');

if (
  fs.existsSync(checkoutHookPath) &&
  fs.existsSync(toggleBoxPath) &&
  fs.existsSync(checkoutPagePath) &&
  fs.existsSync(checkoutIndexPath)
) {
  console.log('✅ 1. Required Phase 5 files exist');
  passCount++;
} else {
  console.error('❌ 1. Missing required files for Phase 5');
}

// Check 2: useCheckoutLogic.js Domain Refactoring & Backward Compatibility
const checkoutHookContent = fs.readFileSync(checkoutHookPath, 'utf8');

const hookHasWalletState = checkoutHookContent.includes('const { walletBalance, loading: walletLoading } = useWalletBalance');
const hookHasWalletToggle = checkoutHookContent.includes('const [useWalletToggle, setUseWalletToggle] = useState(false);');
const hookUsesWalletInEffect = checkoutHookContent.includes('useWalletToggle && walletBalance > 0') &&
  checkoutHookContent.includes('Math.min(walletBalance,');
const hookReturnsWalletVariables = checkoutHookContent.includes('walletBalance,') &&
  checkoutHookContent.includes('walletLoading,') &&
  checkoutHookContent.includes('useWalletToggle,') &&
  checkoutHookContent.includes('setUseWalletToggle,');
const hookHasCompatibilityAliases = checkoutHookContent.includes('creditBalance: walletBalance') &&
  checkoutHookContent.includes('creditLoading: walletLoading') &&
  checkoutHookContent.includes('useCreditToggle: useWalletToggle') &&
  checkoutHookContent.includes('setUseCreditToggle: setUseWalletToggle');

if (
  hookHasWalletState &&
  hookHasWalletToggle &&
  hookUsesWalletInEffect &&
  hookReturnsWalletVariables &&
  hookHasCompatibilityAliases
) {
  console.log('✅ 2. useCheckoutLogic uses clean wallet state & maintains 100% backward compatibility');
  passCount++;
} else {
  console.error('❌ 2. useCheckoutLogic domain naming verification failed:', {
    hookHasWalletState,
    hookHasWalletToggle,
    hookUsesWalletInEffect,
    hookReturnsWalletVariables,
    hookHasCompatibilityAliases
  });
}

// Check 3: CreditToggleBox.jsx supports wallet props & Wallet icon
const toggleBoxContent = fs.readFileSync(toggleBoxPath, 'utf8');

const boxImportsWalletIcon = toggleBoxContent.includes('Wallet') && toggleBoxContent.includes("'lucide-react'");
const boxAcceptsWalletProps = toggleBoxContent.includes('walletLoading') &&
  toggleBoxContent.includes('walletBalance') &&
  toggleBoxContent.includes('useWalletToggle') &&
  toggleBoxContent.includes('setUseWalletToggle');
const boxSupportsBackwardProps = toggleBoxContent.includes('creditLoading') &&
  toggleBoxContent.includes('creditBalance') &&
  toggleBoxContent.includes('useCreditToggle');
const boxUsesWalletIcon = toggleBoxContent.includes('<Wallet className="w-5 h-5" />');

if (
  boxImportsWalletIcon &&
  boxAcceptsWalletProps &&
  boxSupportsBackwardProps &&
  boxUsesWalletIcon
) {
  console.log('✅ 3. CreditToggleBox accepts wallet props and displays Wallet icon with fallback');
  passCount++;
} else {
  console.error('❌ 3. CreditToggleBox verification failed:', {
    boxImportsWalletIcon,
    boxAcceptsWalletProps,
    boxSupportsBackwardProps,
    boxUsesWalletIcon
  });
}

// Check 4: Checkout.jsx integration
const checkoutPageContent = fs.readFileSync(checkoutPagePath, 'utf8');

const pageDestructuresWallet = checkoutPageContent.includes('walletBalance') &&
  checkoutPageContent.includes('walletLoading') &&
  checkoutPageContent.includes('useWalletToggle') &&
  checkoutPageContent.includes('setUseWalletToggle');
const pagePassesWalletProps = checkoutPageContent.includes('walletBalance={walletBalance}') &&
  checkoutPageContent.includes('walletLoading={walletLoading}') &&
  checkoutPageContent.includes('useWalletToggle={useWalletToggle}') &&
  checkoutPageContent.includes('setUseWalletToggle={setUseWalletToggle}');

if (pageDestructuresWallet && pagePassesWalletProps) {
  console.log('✅ 4. Checkout.jsx successfully binds wallet state to CreditToggleBox');
  passCount++;
} else {
  console.error('❌ 4. Checkout.jsx integration failed:', {
    pageDestructuresWallet,
    pagePassesWalletProps
  });
}

// Check 5: index.js exports alias WalletToggleBox
const checkoutIndexContent = fs.readFileSync(checkoutIndexPath, 'utf8');

const exportsCreditToggleBox = checkoutIndexContent.includes("export { default as CreditToggleBox } from './CreditToggleBox';");
const exportsWalletToggleBox = checkoutIndexContent.includes("export { default as WalletToggleBox } from './CreditToggleBox';");

if (exportsCreditToggleBox && exportsWalletToggleBox) {
  console.log('✅ 5. index.js exports both CreditToggleBox and WalletToggleBox alias');
  passCount++;
} else {
  console.error('❌ 5. index.js exports verification failed:', {
    exportsCreditToggleBox,
    exportsWalletToggleBox
  });
}

console.log('\n--------------------------------------------------------');
if (passCount === totalChecks) {
  console.log(`🎉 ALL ${passCount}/${totalChecks} VERIFICATION CHECKS FOR PHASE 5 PASSED PERFECTLY!\n`);
  process.exit(0);
} else {
  console.error(`💥 FAILED: Only ${passCount}/${totalChecks} checks passed.\n`);
  process.exit(1);
}
