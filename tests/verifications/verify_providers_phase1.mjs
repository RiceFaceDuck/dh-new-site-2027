import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("=== Verification: Service Providers Phase 1 (Security & Rules Alignment) ===");

// 1. Verify firestore.rules
const rulesPath = path.resolve('firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

assert(rulesContent.includes('match /ActivePartners/{partnerId}'), "firestore.rules must contain /ActivePartners/{partnerId}");
assert(rulesContent.includes('allow delete: if isManagerOrAdmin() || (isAuthenticated() && request.auth.uid == partnerId);'), "firestore.rules must allow partner to delete their own ActivePartner pin");
assert(rulesContent.includes('allow create, update: if isManagerOrAdmin();'), "firestore.rules must restrict create and update to manager/admin");
console.log("✅ Check 1: firestore.rules for ActivePartners verified successfully.");

// 2. Verify subcollection comments path
const hookPath = path.resolve('dh-frontend/src/pages/StoreProfile/hooks/usePartnerReviews.js');
const targetFile = fs.existsSync(hookPath) ? hookPath : path.resolve('dh-frontend/src/pages/StoreProfile/components/PartnerReviews.jsx');
const reviewsContent = fs.readFileSync(targetFile, 'utf8');

// Ensure no getCollectionPath('partner_reviews', partnerId, 'comments')
assert(!reviewsContent.includes("getCollectionPath('partner_reviews', partnerId, 'comments')"), "Must not pass subcollections directly into getCollectionPath");

// Ensure correct collection(db, getCollectionPath('partner_reviews'), partnerId, 'comments')
const subcollectionMatches = reviewsContent.match(/collection\(db,\s*getCollectionPath\('partner_reviews'\),\s*partnerId,\s*'comments'\)/g);
assert(subcollectionMatches && subcollectionMatches.length >= 2, "Both listener and addDoc must target the /partner_reviews/{partnerId}/comments subcollection");
console.log("✅ Check 2: Subcollection comments path verified successfully in " + path.basename(targetFile) + " (count: " + subcollectionMatches.length + ").");

console.log("\n🎉 ALL PHASE 1 VERIFICATION CHECKS PASSED!");
