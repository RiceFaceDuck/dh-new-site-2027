import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🚀 Running Verification Test: Profile Overview Phase 3 (Quota Optimization & Shared Subscription)');

// 1. Verify walletService.js uses userDocumentSubscriptionManager
const walletServicePath = path.resolve('dh-frontend/src/firebase/walletService.js');
assert(fs.existsSync(walletServicePath), 'walletService.js exists');
const walletServiceSrc = fs.readFileSync(walletServicePath, 'utf8');

assert(walletServiceSrc.includes("import { userDocumentSubscriptionManager } from './user/userDocumentSubscriptionManager';"), 'Imports userDocumentSubscriptionManager');
assert(walletServiceSrc.includes('userDocumentSubscriptionManager.subscribe(uid, (data) => {'), 'useWalletBalance subscribes via manager');
assert(!walletServiceSrc.includes('const unsubscribe = onSnapshot(userRef,'), 'No duplicate onSnapshot in useWalletBalance');
console.log('✅ 1. walletService consolidated into userDocumentSubscriptionManager');

// 2. Verify TabOverview uses userDocumentSubscriptionManager for profile
const tabOverviewPath = path.resolve('dh-frontend/src/components/profile/tabs/TabOverview.jsx');
assert(fs.existsSync(tabOverviewPath), 'TabOverview.jsx exists');
const tabOverviewSrc = fs.readFileSync(tabOverviewPath, 'utf8');

assert(tabOverviewSrc.includes('userDocumentSubscriptionManager.subscribe(user.uid,'), 'TabOverview subscribes via manager');
assert(tabOverviewSrc.includes('userProfileCache.getProfile(user.uid)'), 'Initial state utilizes userProfileCache');
assert(!tabOverviewSrc.includes('fetchProfile(false)'), 'Removed automatic fetchProfile getDoc on mount');
console.log('✅ 2. TabOverview real-time sync via userDocumentSubscriptionManager verified');

console.log('🎉 ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
