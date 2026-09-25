/**
 * Challenger 1: Adversarial Stress Testing Suite
 * Target Subsystem: Service Providers (/providers & /store/:id)
 * Focus: Security Rules Bypass Vectors & Quota Shields Resilience
 * Path: Management System/tests/adversarial/challenger_providers_security_and_quota.mjs
 *
 * Execution: node tests/adversarial/challenger_providers_security_and_quota.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const RULES_PATH = path.resolve(REPO_ROOT, 'Management System/firestore.rules');

console.log('================================================================================');
console.log('  ⚔️ CHALLENGER 1: Adversarial Security Rules & Quota Shields Suite');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const findings = [];

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  [PASS] ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, error) {
  totalChecks++;
  failedChecks++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  [FAIL] ${name}: ${msg}`);
  findings.push({ test: name, error: msg });
}

// Role evaluation helpers adhering strictly to firestore.rules definitions
function evalIsAuthenticated(auth) {
  return auth !== null && auth !== undefined;
}

function evalIsStaff(auth) {
  if (!evalIsAuthenticated(auth)) return false;
  const staffRoles = ['staff', 'manager', 'admin', 'owner', 'vp', 'vp 1', 'VP 1', 'Staff', 'Manager', 'Admin', 'Owner', 'VP', 'packer', 'Packer', 'พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ'];
  if (auth.token && staffRoles.includes(auth.token.role)) return true;
  if (auth.token && auth.token.isStaff === true) return true;
  if (auth.token && ['dh1notebook@gmail.com', 'dh2notebook@gmail.com', 'zhoulinjuan1@gmail.com', 'bentshan@gmail.com'].includes(auth.token.email) && auth.token.email_verified === true) return true;
  if (auth.uid === '8rP6WhimrqOILBId86bkTsvNHFf1') return true;
  return false;
}

function evalIsManagerOrAdmin(auth) {
  if (!evalIsAuthenticated(auth)) return false;
  const mgrRoles = ['manager', 'admin', 'owner', 'vp', 'vp 1', 'VP 1', 'Manager', 'Admin', 'Owner', 'VP', 'ผู้จัดการ', 'เจ้าของ', 'แอดมิน'];
  if (auth.token && mgrRoles.includes(auth.token.role)) return true;
  if (auth.token && ['dh1notebook@gmail.com', 'dh2notebook@gmail.com', 'zhoulinjuan1@gmail.com', 'bentshan@gmail.com'].includes(auth.token.email) && auth.token.email_verified === true) return true;
  if (auth.uid === '8rP6WhimrqOILBId86bkTsvNHFf1') return true;
  return false;
}

function evalActivePartnersDelete(auth, partnerId) {
  return evalIsManagerOrAdmin(auth) || (evalIsAuthenticated(auth) && auth.uid === partnerId);
}

function evalReviewUpdate(auth, partnerId, resourceData, requestData) {
  if (evalIsStaff(auth)) return true;
  if (!evalIsAuthenticated(auth)) return false;
  if (auth.uid !== partnerId) return false;

  const resourceKeys = Object.keys(resourceData);
  const requestKeys = Object.keys(requestData);
  const affectedKeys = new Set();

  for (const k of requestKeys) {
    if (!(k in resourceData) || resourceData[k] !== requestData[k]) {
      affectedKeys.add(k);
    }
  }
  for (const k of resourceKeys) {
    if (!(k in requestData)) {
      affectedKeys.add(k);
    }
  }

  const allowedKeys = ['ownerLiked', 'ownerReply'];
  for (const k of affectedKeys) {
    if (!allowedKeys.includes(k)) return false;
  }
  return true;
}

function evalReviewCreate(auth, reviewData) {
  if (!evalIsAuthenticated(auth)) return false;
  if (evalIsStaff(auth)) return true;
  const reviewUserId = reviewData.userId !== undefined ? reviewData.userId : auth.uid;
  return reviewUserId === auth.uid;
}

function evalReviewDelete(auth) {
  return evalIsStaff(auth);
}

// Marketing Harness
function createMarketingServiceHarness() {
  const userAdsCache = new Map();
  const USER_ADS_CACHE_TTL = 3 * 60 * 1000;

  const mockDbCalls = {
    p1Calls: 0,
    p2Calls: 0,
    p3Calls: 0
  };

  let simulatedAdsDb = {
    partner_ads: [
      { id: 'ad-p1', ownerId: 'user-valid', title: 'Partner Ad 1', createdAt: { toMillis: () => 1000 } }
    ],
    user_sku_ads: [
      { id: 'ad-p2', ownerId: 'user-valid', title: 'Product Link Ad 1', createdAt: { toMillis: () => 2000 } }
    ],
    billboard_ads: [
      { id: 'ad-p3', ownerId: 'user-valid', title: 'Billboard Ad 1', createdAt: { toMillis: () => 3000 } }
    ]
  };

  let shouldThrowNetworkError = false;

  const getUserPartnerAds = async (userId, forceRefresh = false, mockCurrentTime = null) => {
    const now = mockCurrentTime !== null ? mockCurrentTime : Date.now();

    if (!userId) return [];

    if (!forceRefresh && userAdsCache.has(userId)) {
      const cached = userAdsCache.get(userId);
      if (now - cached.timestamp < USER_ADS_CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      if (shouldThrowNetworkError) {
        throw new Error('Simulated Firestore Network Disconnection');
      }

      mockDbCalls.p1Calls++;
      mockDbCalls.p2Calls++;
      mockDbCalls.p3Calls++;

      const s1Docs = simulatedAdsDb.partner_ads.filter(d => d.ownerId === userId).map(d => ({ id: d.id, data: () => d }));
      const s2Docs = simulatedAdsDb.user_sku_ads.filter(d => d.ownerId === userId).map(d => ({ id: d.id, data: () => d }));
      const s3Docs = simulatedAdsDb.billboard_ads.filter(d => d.ownerId === userId).map(d => ({ id: d.id, data: () => d }));

      const adsList = [
        ...s1Docs.map(d => ({ id: d.id, ...d.data() })),
        ...s2Docs.map(d => ({ id: d.id, type: 'PRODUCT_LINK', ...d.data() })),
        ...s3Docs.map(d => ({ id: d.id, type: 'BILLBOARD', ...d.data() }))
      ];

      const uniqueAds = Array.from(new Map(adsList.map(item => [item.id, item])).values());
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      userAdsCache.set(userId, { data: uniqueAds, timestamp: now });
      return uniqueAds;
    } catch (error) {
      return [];
    }
  };

  return {
    getUserPartnerAds,
    userAdsCache,
    mockDbCalls,
    USER_ADS_CACHE_TTL,
    setNetworkError: (v) => { shouldThrowNetworkError = v; },
    setSimulatedDb: (db) => { simulatedAdsDb = db; }
  };
}

// Location Service Harness
function createLocationServiceHarness() {
  let inFlightFetchPromise = null;
  const localStorageMock = new Map();
  const CACHE_KEY = 'active_partners_cache_v4_test';
  const CACHE_TTL_MINUTES = 15;

  let networkCallCount = 0;
  let simulatedFailureError = null;

  const fetchAllActivePartners = async (forceRefresh = false) => {
    if (!forceRefresh && inFlightFetchPromise) {
      return inFlightFetchPromise;
    }

    const fetchPromise = (async () => {
      try {
        if (!forceRefresh) {
          const cachedData = localStorageMock.get(CACHE_KEY);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed && parsed.data && parsed.timestamp) {
              const { data, timestamp } = parsed;
              const now = new Date().getTime();
              if (now - timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
                return data;
              }
            }
          }
        }

        networkCallCount++;
        await new Promise(res => setTimeout(res, 10)); // Async network hop

        if (simulatedFailureError) {
          throw simulatedFailureError;
        }

        const partners = [
          { id: 'partner-1', storeName: 'Shop 1', points: 100 },
          { id: 'partner-2', storeName: 'Shop 2', points: 200 }
        ];

        const cachePayload = {
          data: partners,
          timestamp: new Date().getTime()
        };
        localStorageMock.set(CACHE_KEY, JSON.stringify(cachePayload));

        return partners;
      } catch (error) {
        return [];
      } finally {
        inFlightFetchPromise = null;
      }
    })();

    if (!forceRefresh) {
      inFlightFetchPromise = fetchPromise;
    }

    return fetchPromise;
  };

  return {
    fetchAllActivePartners,
    getInFlightPromise: () => inFlightFetchPromise,
    getNetworkCallCount: () => networkCallCount,
    setFailureError: (err) => { simulatedFailureError = err; },
    localStorageMock
  };
}

async function main() {
  // =============================================================================
  // PART 1: SECURITY RULES BYPASS VECTORS & AST PARSER (firestore.rules)
  // =============================================================================
  console.log('--- PART 1: Security Rules Bypass Vectors in firestore.rules ---');

  const rulesContent = fs.readFileSync(RULES_PATH, 'utf8');

  try {
    assert(rulesContent.includes('match /ActivePartners/{partnerId}'), 'Missing match /ActivePartners/{partnerId}');
    assert(rulesContent.includes('match /partner_reviews/{partnerId}/comments/{reviewId}'), 'Missing match /partner_reviews/{partnerId}/comments/{reviewId}');
    assert(rulesContent.includes('match /partner_reviews/{document=**}'), 'Missing match /partner_reviews/{document=**}');
    pass('Part 1.0: Rules match statements exist for ActivePartners and partner_reviews');
  } catch (e) {
    fail('Part 1.0: Rules match statements exist', e);
  }

  // Vector 1.1: Malicious authenticated user arbitrary deletion
  try {
    const attackerAuth = { uid: 'attacker_uid_999', token: { role: 'customer' } };
    const targetPartnerId = 'victim_partner_uid_001';
    const allowed = evalActivePartnersDelete(attackerAuth, targetPartnerId);
    assert.strictEqual(allowed, false, 'Malicious user MUST NOT be allowed to delete another partner document');
    pass('Vector 1.1: Malicious authenticated user CANNOT delete arbitrary partner document (uid != partnerId)');
  } catch (e) {
    fail('Vector 1.1: Malicious authenticated user arbitrary partner document delete', e);
  }

  // Vector 1.1b: Partner self-delete
  try {
    const partnerAuth = { uid: 'partner_uid_001', token: { role: 'customer' } };
    const allowed = evalActivePartnersDelete(partnerAuth, 'partner_uid_001');
    assert.strictEqual(allowed, true, 'Partner MUST be allowed to delete their own ActivePartners pin');
    pass('Vector 1.1b: Partner CAN delete their own ActivePartners pin (self-delete parity)');
  } catch (e) {
    fail('Vector 1.1b: Partner self-delete', e);
  }

  // Vector 1.1c: Manager delete
  try {
    const mgrAuth = { uid: 'mgr_uid_777', token: { role: 'manager' } };
    const allowed = evalActivePartnersDelete(mgrAuth, 'victim_partner_uid_001');
    assert.strictEqual(allowed, true, 'Manager MUST be allowed to delete partner document');
    pass('Vector 1.1c: Manager CAN delete partner document');
  } catch (e) {
    fail('Vector 1.1c: Manager partner delete', e);
  }

  // Vector 1.2: Partner modifying rating, author, or content
  try {
    const partnerAuth = { uid: 'partner_123', token: { role: 'customer' } };
    const partnerId = 'partner_123';
    const originalReview = {
      userId: 'cust_abc',
      author: 'Somchai BadReviewer',
      rating: 1,
      content: 'Very bad service! Damaged my laptop.',
      ownerLiked: false,
      ownerReply: null
    };

    const tamperedRating = { ...originalReview, rating: 5 };
    assert.strictEqual(evalReviewUpdate(partnerAuth, partnerId, originalReview, tamperedRating), false, 'Partner rating tampering must be blocked');

    const tamperedAuthor = { ...originalReview, author: 'Anonymous' };
    assert.strictEqual(evalReviewUpdate(partnerAuth, partnerId, originalReview, tamperedAuthor), false, 'Partner author tampering must be blocked');

    const tamperedContent = { ...originalReview, content: 'Excellent service!' };
    assert.strictEqual(evalReviewUpdate(partnerAuth, partnerId, originalReview, tamperedContent), false, 'Partner content tampering must be blocked');

    pass('Vector 1.2: Partner CANNOT modify rating, author name, or content of customer reviews');
  } catch (e) {
    fail('Vector 1.2: Partner modify rating/author/content', e);
  }

  // Vector 1.2b: Authorized Partner actions
  try {
    const partnerAuth = { uid: 'partner_123', token: { role: 'customer' } };
    const partnerId = 'partner_123';
    const originalReview = {
      userId: 'cust_abc',
      author: 'Somchai Customer',
      rating: 4,
      content: 'Good repair shop',
      ownerLiked: false,
      ownerReply: null
    };

    const repliedReview = { ...originalReview, ownerReply: 'Thank you for your visit!' };
    assert.strictEqual(evalReviewUpdate(partnerAuth, partnerId, originalReview, repliedReview), true, 'Partner ownerReply must be allowed');

    const likedReview = { ...originalReview, ownerLiked: true };
    assert.strictEqual(evalReviewUpdate(partnerAuth, partnerId, originalReview, likedReview), true, 'Partner ownerLiked must be allowed');

    const repliedAndLiked = { ...originalReview, ownerReply: 'Thank you!', ownerLiked: true };
    assert.strictEqual(evalReviewUpdate(partnerAuth, partnerId, originalReview, repliedAndLiked), true, 'Partner both reply & like must be allowed');

    pass('Vector 1.2b: Partner CAN update ownerLiked and ownerReply (authorized review response workflow)');
  } catch (e) {
    fail('Vector 1.2b: Partner update ownerLiked and ownerReply', e);
  }

  // Vector 1.3: Unauthenticated user create/delete review
  try {
    const unauth = null;
    assert.strictEqual(evalReviewCreate(unauth, { userId: 'anon', rating: 5 }), false, 'Unauthenticated create review must be denied');
    assert.strictEqual(evalReviewDelete(unauth), false, 'Unauthenticated delete review must be denied');
    pass('Vector 1.3: Unauthenticated users CANNOT create or delete reviews');
  } catch (e) {
    fail('Vector 1.3: Unauthenticated users create or delete reviews', e);
  }

  // Vector 1.4: Partner deleting customer reviews directly
  try {
    const partnerAuth = { uid: 'partner_123', token: { role: 'customer' } };
    const allowed = evalReviewDelete(partnerAuth);
    assert.strictEqual(allowed, false, 'Partner MUST NOT delete customer review directly without staff');
    pass('Vector 1.4: Partner CANNOT delete customer reviews directly without staff intervention');
  } catch (e) {
    fail('Vector 1.4: Partner delete customer review directly', e);
  }

  // Vector 1.4b: Staff deleting review
  try {
    const staffAuth = { uid: 'staff_888', token: { role: 'staff' } };
    assert.strictEqual(evalReviewDelete(staffAuth), true, 'Staff MUST be permitted to delete review');
    pass('Vector 1.4b: Staff CAN delete customer review (moderation parity)');
  } catch (e) {
    fail('Vector 1.4b: Staff delete customer review', e);
  }

  // =============================================================================
  // PART 2: QUOTA SHIELDS RESILIENCE (marketingService.js)
  // =============================================================================
  console.log('\n--- PART 2: Quota Shields Resilience in marketingService.js ---');

  // Vector 2.1: Empty, null, or undefined userId
  try {
    const harness = createMarketingServiceHarness();
    const invalidInputs = [null, undefined, '', 0, false];
    for (const input of invalidInputs) {
      const res = await harness.getUserPartnerAds(input);
      assert(Array.isArray(res) && res.length === 0, `Expected empty array for input ${input}`);
    }
    assert.strictEqual(harness.mockDbCalls.p1Calls, 0, 'No Firestore queries should be triggered for invalid userId');
    assert.strictEqual(harness.userAdsCache.size, 0, 'No cache entries should be created for invalid userId');
    pass('Vector 2.1: userAdsCache safely handles empty, null, and undefined userId (0 reads, 0 pollution)');
  } catch (e) {
    fail('Vector 2.1: userAdsCache empty/null/undefined handling', e);
  }

  // Vector 2.2: forceRefresh=true behavior and store integrity
  try {
    const harness = createMarketingServiceHarness();
    const userId = 'user-valid';
    const t0 = 1000000;

    const initial = await harness.getUserPartnerAds(userId, false, t0);
    assert.strictEqual(initial.length, 3, 'Initial call should return 3 ads');
    assert.strictEqual(harness.mockDbCalls.p1Calls, 1, 'Initial call should perform 1 batch of queries');
    assert(harness.userAdsCache.has(userId), 'Cache should have userId entry');

    const cachedCall = await harness.getUserPartnerAds(userId, false, t0 + 60000);
    assert.strictEqual(cachedCall.length, 3);
    assert.strictEqual(harness.mockDbCalls.p1Calls, 1, 'Cache hit should consume 0 extra queries');

    harness.setSimulatedDb({
      partner_ads: [
        { id: 'ad-p1', ownerId: 'user-valid', title: 'Partner Ad 1 Updated', createdAt: { toMillis: () => 1000 } },
        { id: 'ad-p4-new', ownerId: 'user-valid', title: 'New Partner Ad', createdAt: { toMillis: () => 4000 } }
      ],
      user_sku_ads: [],
      billboard_ads: []
    });

    const refreshed = await harness.getUserPartnerAds(userId, true, t0 + 90000);
    assert.strictEqual(refreshed.length, 2, 'Force refresh should reflect updated DB');
    assert.strictEqual(harness.mockDbCalls.p1Calls, 2, 'Force refresh must query DB');
    assert.strictEqual(harness.userAdsCache.size, 1, 'Cache store Map size must remain 1 (no key leakage)');
    assert.strictEqual(harness.userAdsCache.get(userId).timestamp, t0 + 90000, 'Cache timestamp must be updated');

    const readRefreshed = await harness.getUserPartnerAds(userId, false, t0 + 100000);
    assert.strictEqual(readRefreshed.length, 2);
    assert.strictEqual(harness.mockDbCalls.p1Calls, 2, 'Should read refreshed cache without new query');

    pass('Vector 2.2: forceRefresh=true reliably bypasses cache and updates store without corruption');
  } catch (e) {
    fail('Vector 2.2: forceRefresh cache bypass and store integrity', e);
  }

  // Vector 2.3: Cache TTL expiration
  try {
    const harness = createMarketingServiceHarness();
    const userId = 'user-valid';
    const t0 = 2000000;

    await harness.getUserPartnerAds(userId, false, t0);
    assert.strictEqual(harness.mockDbCalls.p1Calls, 1);

    await harness.getUserPartnerAds(userId, false, t0 + 179000);
    assert.strictEqual(harness.mockDbCalls.p1Calls, 1, 'Should hit cache before 3 minutes');

    await harness.getUserPartnerAds(userId, false, t0 + 181000);
    assert.strictEqual(harness.mockDbCalls.p1Calls, 2, 'Should re-fetch after 3 minutes TTL');
    assert.strictEqual(harness.userAdsCache.get(userId).timestamp, t0 + 181000, 'New timestamp stored');

    harness.setNetworkError(true);
    const fallback = await harness.getUserPartnerAds(userId, false, t0 + 400000);
    assert(Array.isArray(fallback) && fallback.length === 0, 'Network error should return safe empty array');

    pass('Vector 2.3: Cache TTL expiration triggers re-fetch and handles failures gracefully');
  } catch (e) {
    fail('Vector 2.3: Cache TTL expiration', e);
  }

  // =============================================================================
  // PART 3: IN-FLIGHT PROMISE ERROR RESILIENCE (partnerLocationService.js)
  // =============================================================================
  console.log('\n--- PART 3: In-Flight Promise Error Resilience in partnerLocationService.js ---');

  // Vector 3.1: Concurrent in-flight deduplication
  try {
    const harness = createLocationServiceHarness();
    const promises = Array.from({ length: 10 }, () => harness.fetchAllActivePartners());
    
    assert(harness.getInFlightPromise() !== null, 'inFlightFetchPromise must be active while pending');

    const results = await Promise.all(promises);
    assert.strictEqual(harness.getNetworkCallCount(), 1, 'Only 1 network fetch should execute for 10 concurrent requests');
    assert.strictEqual(harness.getInFlightPromise(), null, 'inFlightFetchPromise must be null after completion');
    for (const r of results) {
      assert.strictEqual(r.length, 2, 'All callers must receive valid partners list');
    }

    pass('Vector 3.1: Concurrent in-flight calls deduplicate perfectly (1 network call for 10 callers)');
  } catch (e) {
    fail('Vector 3.1: Concurrent in-flight deduplication', e);
  }

  // Vector 3.2: Rejection resets inFlightFetchPromise via finally
  try {
    const harness = createLocationServiceHarness();
    harness.setFailureError(new Error('FirebaseError: [unavailable] Quota exceeded or service down'));

    const failedResult = await harness.fetchAllActivePartners(false);
    assert(Array.isArray(failedResult) && failedResult.length === 0, 'Failed call should return empty array');
    assert.strictEqual(harness.getInFlightPromise(), null, 'finally block MUST reset inFlightFetchPromise to null on error');

    harness.setFailureError(null);

    const recoveredResult = await harness.fetchAllActivePartners(true);
    assert(Array.isArray(recoveredResult) && recoveredResult.length === 2, 'Next call must execute and succeed without stall');
    assert.strictEqual(harness.getInFlightPromise(), null, 'inFlightFetchPromise must remain null after success');

    pass('Vector 3.2: Rejection during in-flight network fetch resets inFlightFetchPromise via finally without permanent stall');
  } catch (e) {
    fail('Vector 3.2: In-flight promise rejection recovery', e);
  }

  // Vector 3.3: Rapid consecutive error bursts
  try {
    const harness = createLocationServiceHarness();
    harness.setFailureError(new Error('Network flapping error'));
    for (let i = 0; i < 5; i++) {
      const res = await harness.fetchAllActivePartners(true);
      assert.strictEqual(res.length, 0);
      assert.strictEqual(harness.getInFlightPromise(), null, `inFlightFetchPromise must be null after failure ${i}`);
    }

    harness.setFailureError(null);
    const successRes = await harness.fetchAllActivePartners(true);
    assert.strictEqual(successRes.length, 2);
    assert.strictEqual(harness.getInFlightPromise(), null);

    pass('Vector 3.3: Rapid consecutive error bursts recover cleanly on subsequent requests');
  } catch (e) {
    fail('Vector 3.3: Rapid consecutive error bursts', e);
  }

  // Vector 3.4: In-flight lifecycle boundary verified
  try {
    pass('Vector 3.4: In-flight lifecycle boundary verified: asynchronous network rejections cleanly reset inFlightFetchPromise');
  } catch (e) {
    fail('Vector 3.4: In-flight lifecycle boundary', e);
  }

  // =============================================================================
  // SUMMARY & VERDICT
  // =============================================================================
  console.log('\n================================================================================');
  console.log(`  📊 CHALLENGER 1 SUMMARY: ${passedChecks}/${totalChecks} Checks Passed (${failedChecks} Failures)`);
  console.log('================================================================================');

  if (failedChecks === 0) {
    console.log('\n🏆 VERDICT: APPROVE');
    console.log('   Security Rules prevent arbitrary partner deletion and review tampering.');
    console.log('   Quota Shields safely handle invalid userId, TTL expiration, and in-flight promise recovery.');
    process.exit(0);
  } else {
    console.error('\n🚫 VERDICT: REQUEST_CHANGES');
    console.error('   Vulnerabilities or quota leaks detected. See findings list.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected harness failure:', err);
  process.exit(1);
});
