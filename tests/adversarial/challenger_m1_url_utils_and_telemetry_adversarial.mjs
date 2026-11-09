/**
 * ⚔️ EMPIRICAL CHALLENGER 2: URL UTILS, SERVICE LAYER & TELEMETRY ADVERSARIAL SUITE
 * File: Management System/tests/adversarial/challenger_m1_url_utils_and_telemetry_adversarial.mjs
 * 
 * Verifies Milestone 1 implementation:
 * 1. Management System/dh-frontend/src/pages/StoreProfile/utils/storeUrlUtils.js
 *    - Malformed URLs, XSS attack strings, unicode strings, non-numeric latitude/longitude
 *    - All social links combinations in resolveSocialLinks
 * 2. Management System/dh-frontend/src/firebase/marketingAnalyticsService.js
 *    - Anti-fraud cooldown: store_view 30-min (1,800,000ms) vs ads 5-min (300,000ms)
 *    - Cross-tab synchronization via localStorage
 *    - Private browsing fallback to in-memory cache
 *    - trackStoreView parameter overloading (string vs object vs edge cases)
 *    - Beacon payload Blob MIME type 'text/plain;charset=UTF-8' and CORS preflight bypass
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');

const URL_UTILS_PATH = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/utils/storeUrlUtils.js');
const ANALYTICS_SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/marketingAnalyticsService.js');

console.log('================================================================================');
console.log('  ⚔️ CHALLENGER 2: EMPIRICAL STRESS TEST HARNESS — URL UTILS & TELEMETRY');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failures.push({ name, error: err.message, stack: err.stack });
  }
}

async function checkAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failures.push({ name, error: err.message, stack: err.stack });
  }
}

// =============================================================================
// SECTION 1: DYNAMIC MODULE IMPORT & VERIFICATION OF storeUrlUtils.js
// =============================================================================
console.log('--- SECTION 1: storeUrlUtils.js Robustness & Edge Cases ---');

assert.ok(fs.existsSync(URL_UTILS_PATH), `Target file does not exist: ${URL_UTILS_PATH}`);
const storeUrlUtils = await import(`file://${URL_UTILS_PATH.replace(/\\/g, '/')}`);

const {
  formatLineUrl,
  formatMessengerUrl,
  formatYoutubeUrl,
  formatTiktokUrl,
  formatExternalUrl,
  resolveMapsUrl,
  resolveSocialLinks
} = storeUrlUtils;

// 1.1 Malformed URLs & Falsy Fuzzing
check('1.1.1 formatLineUrl handles null, undefined, empty, whitespace and falsy primitives', () => {
  assert.equal(formatLineUrl(null), '');
  assert.equal(formatLineUrl(undefined), '');
  assert.equal(formatLineUrl(''), '');
  assert.equal(formatLineUrl('   '), '');
  assert.equal(formatLineUrl(0), '');
  assert.equal(formatLineUrl(false), '');
});

check('1.1.2 formatLineUrl normalizes @ handles, id prefixes, and lin.ee shortlinks', () => {
  assert.equal(formatLineUrl('@dhnotebook'), 'https://line.me/R/ti/p/@dhnotebook');
  assert.equal(formatLineUrl('id: dhstore'), 'https://line.me/R/ti/p/~dhstore');
  assert.equal(formatLineUrl('lin.ee/abc1234'), 'https://lin.ee/abc1234');
  assert.equal(formatLineUrl('https://lin.ee/xyz987'), 'https://lin.ee/xyz987');
  assert.equal(formatLineUrl('line.me/R/ti/p/~direct'), 'https://line.me/R/ti/p/~direct');
  assert.equal(formatLineUrl('mystore'), 'https://line.me/R/ti/p/~mystore');
});

check('1.1.3 formatMessengerUrl handles null, undefined, handles, and URLs', () => {
  assert.equal(formatMessengerUrl(null), '');
  assert.equal(formatMessengerUrl(''), '');
  assert.equal(formatMessengerUrl('  '), '');
  assert.equal(formatMessengerUrl('dhstore'), 'https://m.me/dhstore');
  assert.equal(formatMessengerUrl('m.me/dhstore'), 'https://m.me/dhstore');
  assert.equal(formatMessengerUrl('facebook.com/dhstore'), 'https://facebook.com/dhstore');
  assert.equal(formatMessengerUrl('https://facebook.com/dhstore'), 'https://facebook.com/dhstore');
});

check('1.1.4 formatYoutubeUrl normalizes channel handles, direct URLs, and IDs', () => {
  assert.equal(formatYoutubeUrl(null), '');
  assert.equal(formatYoutubeUrl(''), '');
  assert.equal(formatYoutubeUrl('@dhchannel'), 'https://www.youtube.com/@dhchannel');
  assert.equal(formatYoutubeUrl('https://@dhchannel'), 'https://www.youtube.com/@dhchannel');
  assert.equal(formatYoutubeUrl('youtube.com/c/dhnotebook'), 'https://youtube.com/c/dhnotebook');
  assert.equal(formatYoutubeUrl('youtu.be/video123'), 'https://youtu.be/video123');
  assert.equal(formatYoutubeUrl('dhpartner'), 'https://www.youtube.com/@dhpartner');
});

check('1.1.5 formatTiktokUrl normalizes handles, direct URLs, and email exclusion', () => {
  assert.equal(formatTiktokUrl(null), '');
  assert.equal(formatTiktokUrl(''), '');
  assert.equal(formatTiktokUrl('@dhtiktok'), 'https://www.tiktok.com/@dhtiktok');
  assert.equal(formatTiktokUrl('tiktok.com/@dhtiktok'), 'https://tiktok.com/@dhtiktok');
  assert.equal(formatTiktokUrl('dhtiktokuser'), 'https://www.tiktok.com/@dhtiktokuser');
  // Email exclusion: should not prepend tiktok handle to a raw email
  assert.equal(formatTiktokUrl('user@gmail.com'), 'https://user@gmail.com');
});

check('1.1.6 formatExternalUrl prefixes arbitrary URLs with https:// if missing', () => {
  assert.equal(formatExternalUrl(null), '');
  assert.equal(formatExternalUrl(''), '');
  assert.equal(formatExternalUrl('shopee.co.th/dhstore'), 'https://shopee.co.th/dhstore');
  assert.equal(formatExternalUrl('http://lazada.co.th/dhstore'), 'http://lazada.co.th/dhstore');
  assert.equal(formatExternalUrl('https://lazada.co.th/dhstore'), 'https://lazada.co.th/dhstore');
});

// 1.2 XSS Attack Strings & Protocol Poisoning Defense
check('1.2.1 XSS Attack strings in formatLineUrl NEVER produce executable javascript:', () => {
  const attackPayloads = [
    'javascript:alert(1)',
    'javascript:alert("XSS")',
    'javascript:/*--></title></style></textarea><script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)'
  ];

  for (const payload of attackPayloads) {
    const formatted = formatLineUrl(payload);
    assert.ok(
      formatted.startsWith('https://'),
      `formatLineUrl should strictly prepend https:// to neutralize javascript scheme: got "${formatted}" for payload "${payload}"`
    );
    assert.ok(
      !formatted.startsWith('javascript:'),
      `Executable javascript scheme must be blocked: got "${formatted}"`
    );
  }
});

check('1.2.2 XSS Attack strings in formatExternalUrl and formatMessengerUrl never produce executable javascript:', () => {
  const jsPayload = 'javascript:alert(document.cookie)';
  const lineOut = formatMessengerUrl(jsPayload);
  assert.ok(lineOut.startsWith('https://'), `Expected https:// prefix, got ${lineOut}`);
  assert.ok(!lineOut.startsWith('javascript:'));

  const extOut = formatExternalUrl(jsPayload);
  assert.ok(extOut.startsWith('https://'), `Expected https:// prefix, got ${extOut}`);
  assert.ok(!extOut.startsWith('javascript:'));
});

// 1.3 Unicode & Thai Characters Fuzzing
check('1.3.1 Unicode and Thai characters handled without corruption', () => {
  const thaiLine = '@ร้านส้มตำปูม้า';
  assert.equal(formatLineUrl(thaiLine), 'https://line.me/R/ti/p/@ร้านส้มตำปูม้า');

  const thaiMessenger = 'ร้านส้มตำปูม้า';
  assert.equal(formatMessengerUrl(thaiMessenger), 'https://m.me/ร้านส้มตำปูม้า');

  const thaiYoutube = '@ดีเอชโน้ตบุ๊ก';
  assert.equal(formatYoutubeUrl(thaiYoutube), 'https://www.youtube.com/@ดีเอชโน้ตบุ๊ก');

  const thaiWebsite = 'ร้านค้าดีเอช.ไทย';
  assert.equal(formatExternalUrl(thaiWebsite), 'https://ร้านค้าดีเอช.ไทย');
});

// 1.4 resolveMapsUrl Edge Cases: GPS Coordinates & Non-Numeric Fuzzing
check('1.4.1 resolveMapsUrl handles numeric GPS coordinates', () => {
  const partner = { latitude: 13.7563, longitude: 100.5018 };
  const url = resolveMapsUrl(partner);
  assert.equal(url, 'https://www.google.com/maps?q=13.7563,100.5018');
});

check('1.4.2 resolveMapsUrl parses string coordinates and nested storeProfile', () => {
  const partner = { storeProfile: { latitude: '7.8804', longitude: '98.3923' } };
  const url = resolveMapsUrl(partner);
  assert.equal(url, 'https://www.google.com/maps?q=7.8804,98.3923');
});

check('1.4.3 resolveMapsUrl safely ignores non-numeric latitude/longitude and Null Island (0,0)', () => {
  // Non-numeric strings
  assert.equal(resolveMapsUrl({ latitude: 'invalid_lat', longitude: 'invalid_lng' }), '');
  assert.equal(resolveMapsUrl({ latitude: NaN, longitude: 100.5 }), '');
  assert.equal(resolveMapsUrl({ latitude: null, longitude: undefined }), '');
  // Null Island: (0, 0) default must not generate a dummy maps link
  assert.equal(resolveMapsUrl({ latitude: 0, longitude: 0 }), '');
  assert.equal(resolveMapsUrl({ latitude: 0, longitude: 100.5 }), '');
  assert.equal(resolveMapsUrl({ latitude: 13.75, longitude: 0 }), '');
});

check('1.4.4 resolveMapsUrl preserves priority: mapsUrl > googleMapLink > coordsUrl', () => {
  const partner = {
    latitude: 13.75,
    longitude: 100.5,
    googleMapLink: 'https://goo.gl/maps/customLink',
    mapsUrl: 'https://maps.app.goo.gl/primaryLink'
  };
  assert.equal(resolveMapsUrl(partner), 'https://maps.app.goo.gl/primaryLink');

  const fallbackPartner = {
    latitude: 13.75,
    longitude: 100.5,
    googleMapLink: 'https://goo.gl/maps/customLink'
  };
  assert.equal(resolveMapsUrl(fallbackPartner), 'https://goo.gl/maps/customLink');
});

check('1.4.5 resolveMapsUrl URL-encodes plain text address query and protects against XSS', () => {
  const textPartner = { mapsUrl: '123 ถนนสีลม บางรัก กรุงเทพฯ' };
  const url = resolveMapsUrl(textPartner);
  assert.ok(url.startsWith('https://www.google.com/maps?q='), 'Must be Google Maps search query');
  assert.ok(url.includes('%E0%B8%96%E0%B8%99%E0%B8%99'), 'Must properly percent-encode Thai string');

  // XSS attack string in mapsUrl
  const xssPartner = { mapsUrl: 'javascript:alert(1)' };
  const xssUrl = resolveMapsUrl(xssPartner);
  assert.equal(xssUrl, `https://www.google.com/maps?q=${encodeURIComponent('javascript:alert(1)')}`);
  assert.ok(!xssUrl.startsWith('javascript:'));
});

// 1.5 resolveSocialLinks: All Combinations and Boundary States
check('1.5.1 resolveSocialLinks returns empty structured object for empty/null partner', () => {
  const emptyRes = resolveSocialLinks({});
  assert.equal(emptyRes.lineUrl, '');
  assert.equal(emptyRes.messengerUrl, '');
  assert.equal(emptyRes.websiteUrl, '');
  assert.equal(emptyRes.youtubeUrl, '');
  assert.equal(emptyRes.tiktokUrl, '');
  assert.equal(emptyRes.shopeeUrl, '');
  assert.equal(emptyRes.lazadaUrl, '');
  assert.equal(emptyRes.hasSocialLinks, false);

  const nullRes = resolveSocialLinks(null);
  assert.equal(nullRes.hasSocialLinks, false);
});

check('1.5.2 resolveSocialLinks aggregates all 7 social channels correctly', () => {
  const partner = {
    lineUrl: '@dhpartner',
    messengerUrl: 'dhfbpage',
    websiteUrl: 'https://dhnotebook.com',
    youtubeUrl: '@dhyt',
    tiktokUrl: '@dhtt',
    shopeeUrl: 'shopee.co.th/dhstore',
    lazadaUrl: 'lazada.co.th/dhstore'
  };

  const res = resolveSocialLinks(partner);
  assert.equal(res.lineUrl, 'https://line.me/R/ti/p/@dhpartner');
  assert.equal(res.messengerUrl, 'https://m.me/dhfbpage');
  assert.equal(res.websiteUrl, 'https://dhnotebook.com');
  assert.equal(res.youtubeUrl, 'https://www.youtube.com/@dhyt');
  assert.equal(res.tiktokUrl, 'https://www.tiktok.com/@dhtt');
  assert.equal(res.shopeeUrl, 'https://shopee.co.th/dhstore');
  assert.equal(res.lazadaUrl, 'https://lazada.co.th/dhstore');
  assert.equal(res.hasSocialLinks, true);
});

check('1.5.3 resolveSocialLinks merges root and storeProfile properties with fallbacks', () => {
  const partner = {
    lineUrl: '@rootline',
    storeWebsite: 'dhnotebook.org', // storeWebsite fallback
    storeProfile: {
      lineUrl: '@nestedline', // root takes precedence
      shopeeUrl: 'shopee.co.th/nestedshop',
      tiktokUrl: '@nestedtiktok'
    }
  };

  const res = resolveSocialLinks(partner);
  assert.equal(res.lineUrl, 'https://line.me/R/ti/p/@rootline'); // Root precedence
  assert.equal(res.websiteUrl, 'https://dhnotebook.org'); // storeWebsite fallback
  assert.equal(res.shopeeUrl, 'https://shopee.co.th/nestedshop'); // Nested pickup
  assert.equal(res.tiktokUrl, 'https://www.tiktok.com/@nestedtiktok');
  assert.equal(res.hasSocialLinks, true);
});

check('1.5.4 resolveSocialLinks ignores whitespace-only fields', () => {
  const partner = {
    lineUrl: '   ',
    messengerUrl: ' \t\n '
  };
  const res = resolveSocialLinks(partner);
  assert.equal(res.hasSocialLinks, false);
});


// =============================================================================
// SECTION 2: ADVERSARIAL SANDBOX FOR marketingAnalyticsService.js
// =============================================================================
console.log('\n--- SECTION 2: marketingAnalyticsService.js Telemetry & Cooldown ---');

assert.ok(fs.existsSync(ANALYTICS_SERVICE_PATH), `Target file does not exist: ${ANALYTICS_SERVICE_PATH}`);

// Mock Browser Storage with Event and TTL Tracking
class MockStorage {
  constructor(shouldThrow = false) {
    this.map = new Map();
    this.shouldThrow = shouldThrow;
  }
  getItem(key) {
    if (this.shouldThrow) throw new Error('SecurityError: Access denied in restricted environment');
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    if (this.shouldThrow) throw new Error('SecurityError: Access denied in restricted environment');
    this.map.set(key, String(value));
  }
  removeItem(key) {
    if (this.shouldThrow) throw new Error('SecurityError: Access denied in restricted environment');
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

function createTelemetrySandbox(options = {}) {
  let currentTime = options.initialTime || 1773000000000;
  const localStorageInstance = options.localStorage || new MockStorage(options.localStorageThrows);
  const sessionStorageInstance = options.sessionStorage || new MockStorage(options.sessionStorageThrows);

  const beaconInvocations = [];
  const fetchInvocations = [];
  const gaInvocations = [];

  const mockDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) super(currentTime);
      else super(...args);
    }
    static now() {
      return currentTime;
    }
  };

  const rawServiceCode = fs.readFileSync(ANALYTICS_SERVICE_PATH, 'utf8');
  const cleanedCode = rawServiceCode
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+let\s+/g, 'let ')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+default\s+[\s\S]*?;?$/m, '')
    .replace(/import\.meta/g, 'mockImportMeta');

  const mockImportMeta = {
    env: {
      VITE_FIREBASE_PROJECT_ID: 'dh-notebook-69f3b'
    }
  };

  const mockAnalytics = { app: 'mock-analytics' };
  const mockLogEvent = (instance, eventName, params) => {
    gaInvocations.push({ eventName, params, time: currentTime });
  };

  const mockFetch = async (url, opts) => {
    fetchInvocations.push({ url, opts, time: currentTime });
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };

  const mockSendBeacon = options.beaconEnabled === false
    ? undefined
    : (url, blob) => {
        if (options.beaconThrows) {
          throw new Error('TypeError: sendBeacon failed in browser');
        }
        if (options.beaconReturnsFalse) {
          return false;
        }
        beaconInvocations.push({ url, blob, time: currentTime });
        return true;
      };

  const mockWindow = {
    localStorage: localStorageInstance,
    sessionStorage: sessionStorageInstance,
    __dh_ad_telemetry_attached: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const mockNavigator = {
    sendBeacon: mockSendBeacon
  };

  const mockDocument = {
    visibilityState: 'visible'
  };

  const sandboxFn = new Function(
    'mockImportMeta',
    'analytics',
    'logEvent',
    'Date',
    'setTimeout',
    'clearTimeout',
    'fetch',
    'navigator',
    'window',
    'document',
    'Blob',
    `
    ${cleanedCode}

    return {
      trackStoreView,
      trackAdView,
      trackAdClick,
      flushTelemetryQueue,
      checkAntiFraud,
      getEventQueue: () => eventQueue,
      setEventQueue: (q) => { eventQueue = q; },
      getFlushTimer: () => flushTimer,
      getAdStatsBuffer: () => adStatsBuffer,
      getInMemoryCache: () => inMemoryAntiFraudCache
    };
    `
  );

  const sandbox = sandboxFn(
    mockImportMeta,
    mockAnalytics,
    mockLogEvent,
    mockDate,
    (fn, ms) => setTimeout(fn, 0), // synchronous fast-forward
    clearTimeout,
    mockFetch,
    mockNavigator,
    mockWindow,
    mockDocument,
    globalThis.Blob
  );

  return {
    sandbox,
    localStorage: localStorageInstance,
    sessionStorage: sessionStorageInstance,
    beaconInvocations,
    fetchInvocations,
    gaInvocations,
    advanceTime: (ms) => { currentTime += ms; },
    setTime: (t) => { currentTime = t; },
    getTime: () => currentTime
  };
}

// 2.1 Anti-Fraud 30-Minute Cooldown Verification
await checkAsync('2.1.1 Anti-fraud: store_view strictly enforces 30 minutes (1,800,000ms) cooldown', async () => {
  const env = createTelemetrySandbox({ initialTime: 1000000000 });
  const { sandbox, advanceTime } = env;

  // Visit 1: First view at T = 0
  await sandbox.trackStoreView('PARTNER-001');
  assert.equal(sandbox.getEventQueue().length, 1, 'First view must enter eventQueue');
  assert.equal(sandbox.getEventQueue()[0].storeId, 'PARTNER-001');

  // Visit 2: Immediate duplicate at T = 1s (1,000ms) -> Must be blocked
  advanceTime(1000);
  await sandbox.trackStoreView('PARTNER-001');
  assert.equal(sandbox.getEventQueue().length, 1, 'View at T = 1s must be blocked by anti-fraud cooldown');

  // Visit 3: Re-visit at T = 29 minutes (1,740,000ms) -> Must still be blocked
  advanceTime(29 * 60 * 1000);
  await sandbox.trackStoreView('PARTNER-001');
  assert.equal(sandbox.getEventQueue().length, 1, 'View at T = 29m 1s must be blocked (< 30 minutes)');

  // Visit 4: Re-visit at T = 29m 59s -> Still blocked
  advanceTime(58 * 1000);
  await sandbox.trackStoreView('PARTNER-001');
  assert.equal(sandbox.getEventQueue().length, 1, 'View at T = 29m 59s must be blocked (< 30 minutes)');

  // Visit 5: Re-visit at T = 30m 1s (total elapsed > 1,800,000ms) -> Must SUCCEED
  advanceTime(2000); // Now 30m 1s
  await sandbox.trackStoreView('PARTNER-001');
  assert.equal(sandbox.getEventQueue().length, 2, 'View after 30m 1s must succeed and push new event');
  assert.equal(sandbox.getEventQueue()[1].storeId, 'PARTNER-001');
});

await checkAsync('2.1.2 Anti-fraud: store_view (30m) vs ad_view (5m) cooldown parity check', async () => {
  const env = createTelemetrySandbox({ initialTime: 1000000000 });
  const { sandbox, advanceTime } = env;

  // Track ad view and store view simultaneously at T = 0
  await sandbox.trackAdView('partner_ads', 'AD-001');
  await sandbox.trackStoreView('STORE-001');
  assert.equal(sandbox.getEventQueue().length, 2);

  // At T = 6 minutes (360,000ms):
  // Ad view cooldown is 5 minutes -> Should SUCCEED
  // Store view cooldown is 30 minutes -> Must be BLOCKED
  advanceTime(6 * 60 * 1000);
  await sandbox.trackAdView('partner_ads', 'AD-001');
  await sandbox.trackStoreView('STORE-001');

  // Total queue size should be 3 (1 previous ad + 1 previous store + 1 new ad, store was blocked)
  assert.equal(sandbox.getEventQueue().length, 3, 'Ad view after 6 min must succeed while store view remains blocked');
  assert.equal(sandbox.getEventQueue()[2].type, 'view');
  assert.equal(sandbox.getEventQueue()[2].adId, 'AD-001');
});

// 2.2 Cross-Tab Synchronization Verification
await checkAsync('2.2.1 Cross-tab synchronization: store_view uses localStorage and blocks duplicate across simulated tabs', async () => {
  // Shared localStorage between simulated Tab 1 and Tab 2
  const sharedLocalStorage = new MockStorage();
  const sharedSessionStorageTab1 = new MockStorage();
  const sharedSessionStorageTab2 = new MockStorage();

  const tab1 = createTelemetrySandbox({
    initialTime: 2000000000,
    localStorage: sharedLocalStorage,
    sessionStorage: sharedSessionStorageTab1
  });

  const tab2 = createTelemetrySandbox({
    initialTime: 2000000000,
    localStorage: sharedLocalStorage,
    sessionStorage: sharedSessionStorageTab2
  });

  // Tab 1 records store view at T = 0
  await tab1.sandbox.trackStoreView('PARTNER-SHARED');
  assert.equal(tab1.sandbox.getEventQueue().length, 1, 'Tab 1 must enqueue store view');

  // Verify that localStorage recorded the cooldown timestamp
  const storedLock = sharedLocalStorage.getItem('dh_ad_store_view_PARTNER-SHARED');
  assert.ok(storedLock, 'localStorage must contain dh_ad_store_view_PARTNER-SHARED');
  assert.equal(storedLock, '2000000000');

  // Tab 2 opens at T = 5s and attempts to record store view for the same partner
  tab2.setTime(2000000000 + 5000);
  await tab2.sandbox.trackStoreView('PARTNER-SHARED');

  // Tab 2 must have blocked it because of shared localStorage!
  assert.equal(tab2.sandbox.getEventQueue().length, 0, 'Tab 2 MUST be blocked by cross-tab localStorage cooldown');
});

await checkAsync('2.2.2 Private browsing resilience: falls back to in-memory cache when localStorage throws SecurityError', async () => {
  const env = createTelemetrySandbox({
    initialTime: 3000000000,
    localStorageThrows: true,
    sessionStorageThrows: true
  });
  const { sandbox, advanceTime } = env;

  // Visit 1: Should not throw, should use in-memory cache
  await sandbox.trackStoreView('PARTNER-INCOGNITO');
  assert.equal(sandbox.getEventQueue().length, 1, 'Incognito mode must not throw and must enqueue view');

  // Visit 2 at T = 10s: Must be blocked by inMemoryAntiFraudCache
  advanceTime(10000);
  await sandbox.trackStoreView('PARTNER-INCOGNITO');
  assert.equal(sandbox.getEventQueue().length, 1, 'Incognito mode must block duplicate via in-memory cache');

  // Visit 3 at T = 31 minutes: Must succeed via in-memory cache expiration
  advanceTime(31 * 60 * 1000);
  await sandbox.trackStoreView('PARTNER-INCOGNITO');
  assert.equal(sandbox.getEventQueue().length, 2, 'Incognito mode must allow view after 30-min in-memory cooldown');
});

// 2.3 Parameter Overloading in trackStoreView
await checkAsync('2.3.1 trackStoreView accepts string parameter trackStoreView("PARTNER-STR")', async () => {
  const env = createTelemetrySandbox({ initialTime: 4000000000 });
  const { sandbox, gaInvocations } = env;

  await sandbox.trackStoreView('PARTNER-STR-999');

  const queue = sandbox.getEventQueue();
  assert.equal(queue.length, 1);
  const event = queue[0];
  assert.equal(event.type, 'store_view');
  assert.equal(event.storeId, 'PARTNER-STR-999');
  assert.equal(event.store_id, 'PARTNER-STR-999');
  assert.equal(event.ownerId, 'PARTNER-STR-999');
  assert.equal(event.source, 'direct');

  // Check GA4 custom event invocation
  assert.equal(gaInvocations.length, 1);
  assert.equal(gaInvocations[0].eventName, 'store_profile_view');
  assert.equal(gaInvocations[0].params.store_id, 'PARTNER-STR-999');
});

await checkAsync('2.3.2 trackStoreView accepts object parameter trackStoreView({ storeId, partnerName, ownerId, source })', async () => {
  const env = createTelemetrySandbox({ initialTime: 4000000000 });
  const { sandbox, gaInvocations } = env;

  await sandbox.trackStoreView({
    storeId: 'PARTNER-OBJ-888',
    partnerName: 'Somtam Deluxe',
    ownerId: 'OWNER-DELUXE-1',
    source: 'social_share'
  });

  const queue = sandbox.getEventQueue();
  assert.equal(queue.length, 1);
  const event = queue[0];
  assert.equal(event.type, 'store_view');
  assert.equal(event.storeId, 'PARTNER-OBJ-888');
  assert.equal(event.store_id, 'PARTNER-OBJ-888');
  assert.equal(event.partnerName, 'Somtam Deluxe');
  assert.equal(event.ownerId, 'OWNER-DELUXE-1');
  assert.equal(event.source, 'social_share');

  // Check GA4 custom event invocation
  assert.equal(gaInvocations.length, 1);
  assert.equal(gaInvocations[0].eventName, 'store_profile_view');
  assert.equal(gaInvocations[0].params.partner_name, 'Somtam Deluxe');
  assert.equal(gaInvocations[0].params.owner_id, 'OWNER-DELUXE-1');
  assert.equal(gaInvocations[0].params.source, 'social_share');
});

await checkAsync('2.3.3 trackStoreView safely ignores falsy or missing storeId', async () => {
  const env = createTelemetrySandbox({ initialTime: 4000000000 });
  const { sandbox } = env;

  await sandbox.trackStoreView('');
  await sandbox.trackStoreView(null);
  await sandbox.trackStoreView(undefined);
  await sandbox.trackStoreView({});
  await sandbox.trackStoreView({ partnerName: 'No Store ID' });

  assert.equal(sandbox.getEventQueue().length, 0, 'No event should be pushed for invalid storeId');
});

// 2.4 Beacon Payload MIME Type & CORS Preflight Bypass
await checkAsync('2.4.1 Beacon payload uses Blob with MIME type "text/plain;charset=UTF-8" to bypass CORS preflight', async () => {
  const env = createTelemetrySandbox({ initialTime: 5000000000 });
  const { sandbox, beaconInvocations } = env;

  await sandbox.trackStoreView('PARTNER-BEACON-TEST');
  assert.equal(sandbox.getEventQueue().length, 1);

  // Trigger flush with isExiting = true (simulating pagehide / visibilitychange hidden)
  await sandbox.flushTelemetryQueue(true);

  // Assert beacon was called
  assert.equal(beaconInvocations.length, 1, 'navigator.sendBeacon must be called on exit');
  const beaconCall = beaconInvocations[0];

  assert.ok(beaconCall.url.includes('recordAdTelemetry'), 'Beacon endpoint must target recordAdTelemetry Cloud Function');
  assert.ok(beaconCall.blob instanceof Blob, 'Beacon payload must be wrapped in a Blob');

  // 🛡️ CRITICAL CHECK: MIME type must be 'text/plain;charset=UTF-8' (normalized to lowercase by W3C Blob API)
  assert.equal(
    beaconCall.blob.type.toLowerCase(),
    'text/plain;charset=utf-8',
    `Blob MIME type must be 'text/plain;charset=UTF-8' to avoid CORS preflight drops: got "${beaconCall.blob.type}"`
  );

  // Verify blob body content
  const blobText = await beaconCall.blob.text();
  const parsed = JSON.parse(blobText);
  assert.ok(Array.isArray(parsed.events), 'Payload must contain events array');
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].storeId, 'PARTNER-BEACON-TEST');

  // Verify eventQueue was drained immediately
  assert.equal(sandbox.getEventQueue().length, 0, 'eventQueue must be cleared after flush to prevent duplicate writes');
});

await checkAsync('2.4.2 Fetch keepalive fallback uses text/plain;charset=UTF-8 header when exiting and application/json on normal flush', async () => {
  // Case A: Normal flush (isExiting = false) -> headers['Content-Type'] === 'application/json'
  const normalEnv = createTelemetrySandbox({ initialTime: 6000000000, beaconEnabled: false });
  await normalEnv.sandbox.trackStoreView('PARTNER-NORMAL-FLUSH');
  await normalEnv.sandbox.flushTelemetryQueue(false);

  assert.equal(normalEnv.fetchInvocations.length, 1, 'Fetch must be invoked');
  assert.equal(normalEnv.fetchInvocations[0].opts.headers['Content-Type'], 'application/json', 'Normal flush must use application/json');
  assert.equal(normalEnv.fetchInvocations[0].opts.keepalive, true, 'Fetch must specify keepalive: true');

  // Case B: Exiting flush with beacon failing/disabled -> headers['Content-Type'] === 'text/plain;charset=UTF-8'
  const exitEnv = createTelemetrySandbox({ initialTime: 6000000000, beaconEnabled: false });
  await exitEnv.sandbox.trackStoreView('PARTNER-EXIT-FLUSH');
  await exitEnv.sandbox.flushTelemetryQueue(true);

  assert.equal(exitEnv.fetchInvocations.length, 1, 'Fetch fallback must be invoked when beacon is absent');
  assert.equal(
    exitEnv.fetchInvocations[0].opts.headers['Content-Type'],
    'text/plain;charset=UTF-8',
    'Exiting flush must use text/plain;charset=UTF-8 to prevent CORS preflight drop upon page close'
  );
  assert.equal(exitEnv.fetchInvocations[0].opts.keepalive, true);
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n================================================================================');
console.log(`  CHALLENGE SUMMARY: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================\n');

if (failedTests > 0) {
  console.error('❌ FAILURES DETECTED:');
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('🎉 ALL EMPIRICAL CHALLENGES PASSED WITH ZERO REGRESSIONS!');
  process.exit(0);
}
