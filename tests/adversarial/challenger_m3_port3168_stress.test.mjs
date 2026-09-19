/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE — MILESTONE 3: DEV SERVER PORT 3168
 * Location: Management System/tests/adversarial/challenger_m3_port3168_stress.test.mjs
 * 
 * Verifies:
 * 1. High-concurrency route probing across all routes (/, /inventory, /generate, /generate/details, /claims, /billing)
 * 2. Zero white-screen conditions, complete asset/module dependency resolution, no Vite compilation 500s
 * 3. Query param route persistence (/generate/details?type=order, ?type=claim, ?type=count) without redirect to root
 * 4. Adversarial inputs, boundary conditions, malformed query injection, and post-stress recovery
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3168';

let totalPassed = 0;
let totalFailed = 0;

async function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    totalPassed++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    totalFailed++;
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason: ${err.message}`);
  }
}

console.log('================================================================');
console.log('🔥 EMPIRICAL ADVERSARIAL CHALLENGER SUITE — MILESTONE 3 (PORT 3168)');
console.log('================================================================');

async function main() {
  // --------------------------------------------------------------------------
  // SUITE 1: High-Concurrency Route Probing
  // --------------------------------------------------------------------------
  console.log('\n🚀 SUITE 1: High-Concurrency Route Probing Across All Core Endpoints');
  
  const targetRoutes = [
    '/',
    '/inventory',
    '/generate',
    '/generate/details',
    '/generate/details?type=order',
    '/generate/details?type=claim',
    '/generate/details?type=count',
    '/claims',
    '/billing'
  ];

  await test('Dev server is online and responding with HTTP 200 on port 3168', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const text = await res.text();
    assert.ok(text.includes('<div id="root"></div>'), 'HTML must contain #root mount point');
    assert.ok(text.includes('/src/main.jsx'), 'HTML must contain main.jsx script tag');
  });

  await test('High-concurrency burst: 900 total requests across 9 routes (450 concurrency waves)', async () => {
    const allResults = [];
    const startTime = Date.now();

    // Execute in two 450-request waves to ensure TCP socket pool stability
    for (let wave = 1; wave <= 2; wave++) {
      const waveTasks = [];
      for (const route of targetRoutes) {
        for (let i = 0; i < 50; i++) {
          waveTasks.push(
            (async () => {
              const reqStart = Date.now();
              const res = await fetch(`${BASE_URL}${route}`, {
                headers: { 'Accept': 'text/html' }
              });
              const duration = Date.now() - reqStart;
              return {
                route,
                status: res.status,
                redirected: res.redirected,
                duration
              };
            })()
          );
        }
      }
      const waveResults = await Promise.all(waveTasks);
      allResults.push(...waveResults);
    }

    const totalTime = Date.now() - startTime;

    assert.strictEqual(allResults.length, 900, 'All 900 requests must complete');
    
    const failedRequests = allResults.filter(r => r.status !== 200);
    assert.strictEqual(failedRequests.length, 0, `All requests must succeed with HTTP 200. Failures: ${failedRequests.length}`);

    const redirectedRequests = allResults.filter(r => r.redirected);
    assert.strictEqual(redirectedRequests.length, 0, `No requests should be redirected. Redirects: ${redirectedRequests.length}`);

    const durations = allResults.map(r => r.duration).sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

    console.log(`     Metrics: 900 requests in ${totalTime}ms | Avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
    assert.ok(p95 < 2000, `p95 latency (${p95}ms) must be under 2000ms`);
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Module Asset Resolution & Zero White-Screen Verification
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 2: Module Asset Resolution & Zero White-Screen Verification');

  await test('Vite client runtime (/@vite/client) loads with HTTP 200 text/javascript', async () => {
    const res = await fetch(`${BASE_URL}/@vite/client`);
    assert.strictEqual(res.status, 200);
    const ct = res.headers.get('content-type') || '';
    assert.ok(ct.includes('javascript'), `Expected javascript, got ${ct}`);
  });

  const criticalAppModules = [
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/layouts/AdminLayout.jsx',
    '/src/contexts/AuthContext.jsx',
    '/src/pages/dashboard/Overview.jsx',
    '/src/pages/inventory/InventoryMain.jsx',
    '/src/pages/inventory/useInventoryController.js',
    '/src/components/inventory/InventoryHeader.jsx',
    '/src/firebase/inventory/inventoryStatsService.js',
    '/src/pages/GenerateSync/index.jsx',
    '/src/pages/GenerateSync/GenerateSyncDetails.jsx',
    '/src/pages/GenerateSync/hooks/useTransactionDetailsData.js',
    '/src/pages/GenerateSync/components/details/TransactionMetricsHeader.jsx',
    '/src/pages/GenerateSync/components/details/TransactionFilterBar.jsx',
    '/src/pages/GenerateSync/components/details/TransactionItemizedTable.jsx',
    '/src/pages/GenerateSync/components/details/TransactionGroupedList.jsx',
    '/src/pages/claims/ClaimMain.jsx',
    '/src/pages/billing/BillingMain.jsx'
  ];

  await test('All 18 critical application modules compile and serve with HTTP 200 without error overlays or 500s', async () => {
    for (const modPath of criticalAppModules) {
      const res = await fetch(`${BASE_URL}${modPath}`);
      assert.strictEqual(res.status, 200, `Module ${modPath} failed: HTTP ${res.status} ${res.statusText}`);
      
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('javascript') || contentType.includes('text/'), `Module ${modPath} invalid content-type: ${contentType}`);

      const content = await res.text();
      assert.ok(content.length > 50, `Module ${modPath} content too short (${content.length} chars)`);

      // Ensure no Vite compilation errors or unhandled syntax crashes
      assert.ok(!content.includes('[vite] Internal server error'), `Module ${modPath} contains internal server error`);
      assert.ok(!content.includes('vite-error-overlay'), `Module ${modPath} contains vite-error-overlay`);
      assert.ok(!content.includes('Uncaught SyntaxError'), `Module ${modPath} contains Uncaught SyntaxError`);
    }
  });

  await test('Transitive import crawling: verify all lazy-loaded pages from App.jsx compile and resolve cleanly', async () => {
    const res = await fetch(`${BASE_URL}/src/App.jsx`);
    const appJsx = await res.text();
    
    // Extract dynamic import paths: import("/src/pages/...")
    const regex = /import\((?:_c\d*\s*=\s*)?['"](\/src\/[^'"]+)['"]/g;
    const lazyPaths = [];
    let match;
    while ((match = regex.exec(appJsx)) !== null) {
      lazyPaths.push(match[1]);
    }

    assert.ok(lazyPaths.length >= 25, `Expected at least 25 lazy components in App.jsx, found ${lazyPaths.length}`);

    const failedPages = [];
    for (const pagePath of lazyPaths) {
      const pageRes = await fetch(`${BASE_URL}${pagePath}`);
      if (pageRes.status !== 200) {
        failedPages.push({ path: pagePath, status: pageRes.status, statusText: pageRes.statusText });
      } else {
        const body = await pageRes.text();
        if (body.includes('[vite] Internal server error') || body.includes('vite-error-overlay')) {
          failedPages.push({ path: pagePath, status: 'VITE_ERROR_OVERLAY' });
        }
      }
    }

    assert.strictEqual(failedPages.length, 0, `Failed to load lazy pages: ${JSON.stringify(failedPages)}`);
    console.log(`     Verified all ${lazyPaths.length} lazy-loaded route pages compile cleanly (0 errors)`);
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Sub-Route Query Parameters & Redirect Prevention
  // --------------------------------------------------------------------------
  console.log('\n🧭 SUITE 3: Sub-Route Query Parameters & Redirect Prevention (/generate/details)');

  const detailVariants = [
    { type: 'order', path: '/generate/details?type=order' },
    { type: 'claim', path: '/generate/details?type=claim' },
    { type: 'count', path: '/generate/details?type=count' },
    { type: 'all', path: '/generate/details' }
  ];

  for (const variant of detailVariants) {
    await test(`Direct URL fetch for ${variant.path} returns HTTP 200 without redirecting to root (/)`, async () => {
      const res = await fetch(`${BASE_URL}${variant.path}`, {
        redirect: 'manual' // Do not follow redirects automatically
      });

      // Assert it did NOT return 301, 302, 307, 308 redirect
      assert.strictEqual(res.status, 200, `Expected HTTP 200 OK directly, got ${res.status}`);
      assert.strictEqual(res.headers.get('location'), null, `Must not contain Location redirect header`);
      
      const body = await res.text();
      assert.ok(body.includes('<div id="root"></div>'), 'Must serve HTML shell with #root');
    });
  }

  await test('App.jsx router table declares explicit "generate/details" and "generate/details/:referenceId" routes', () => {
    const appPath = path.resolve(__dirname, '../../dh-backoffice-react/src/App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');

    // Verify both routes exist
    assert.ok(
      content.includes('<Route path="generate/details" element={<GenerateSyncDetails />} />'),
      'App.jsx must contain explicit <Route path="generate/details" element={<GenerateSyncDetails />} />'
    );
    assert.ok(
      content.includes('<Route path="generate/details/:referenceId" element={<GenerateSyncDetails />}/>'),
      'App.jsx must contain <Route path="generate/details/:referenceId" ... />'
    );

    // Verify route ordering: generate/details precedes wildcard *
    const detailsIdx = content.indexOf('generate/details');
    const wildcardIdx = content.indexOf('path="*"');
    assert.ok(detailsIdx < wildcardIdx, 'generate/details must be defined before the catch-all wildcard * route');
  });

  await test('useTransactionDetailsData hook processes "order", "claim", "count" types and syncs with searchParams', () => {
    const hookPath = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/GenerateSync/hooks/useTransactionDetailsData.js');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(content.includes("const [searchParams] = useSearchParams();"), 'Hook must use useSearchParams');
    assert.ok(content.includes("searchParams.get('type')"), 'Hook must extract type parameter');
    assert.ok(content.includes("setSelectedType(typeFromUrl)"), 'Hook must synchronize selectedType from URL searchParams');
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Adversarial Input Injection, Fuzzing & Resilience
  // --------------------------------------------------------------------------
  console.log('\n🛡️ SUITE 4: Adversarial Input Injection, Fuzzing & Resilience');

  const adversarialCases = [
    { name: 'XSS script injection in query param', path: '/generate/details?type=%3Cscript%3Ealert(1)%3C/script%3E' },
    { name: 'Path traversal attempt in query param', path: '/generate/details?type=../../../../etc/passwd' },
    { name: 'Null byte injection in query param', path: '/generate/details?type=%00%00%00' },
    { name: 'Oversized query param (5KB string)', path: `/generate/details?type=${'A'.repeat(5000)}` },
    { name: 'Unknown event type query param', path: '/generate/details?type=unknown_quantum_event_9999' },
    { name: 'Multiple duplicate query params', path: '/generate/details?type=order&type=claim&type=count' },
    { name: 'Non-existent deep sub-route (SPA catch-all test)', path: '/generate/details/nonexistent/deep/subpath' }
  ];

  for (const aCase of adversarialCases) {
    await test(`Survives ${aCase.name} without 500 error or process crash`, async () => {
      const res = await fetch(`${BASE_URL}${aCase.path}`);
      // Vite dev server SPA should either return 200 (serving SPA) or 400/404, but NEVER 500
      assert.ok(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
      assert.notStrictEqual(res.status, 500, 'Server must never throw HTTP 500 on adversarial inputs');
    });
  }

  await test('Post-stress health check: dev server remains healthy, low-latency, and responsive', async () => {
    const healthStart = Date.now();
    const res = await fetch(`${BASE_URL}/overview`);
    const duration = Date.now() - healthStart;

    assert.strictEqual(res.status, 200, 'Server must be 200 OK after stress tests');
    assert.ok(duration < 100, `Server health check latency (${duration}ms) must be under 100ms`);
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`CHALLENGER M3 TEST SUITE COMPLETE: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal unhandled error in Challenger M3 suite:', err);
  process.exit(1);
});
