import { execSync } from 'child_process';
import path from 'path';

console.log("======================================================================");
console.log("🚀 MASTER VERIFICATION SUITE: PHASE FINAL REVIEW - SERVICE PROVIDERS");
console.log("======================================================================\n");

const tests = [
  { name: "Phase 1: Security Rules & Subcollection Path", file: "verify_providers_phase1.mjs" },
  { name: "Phase 2: UI Rendering, GPS 0m & Fallback", file: "verify_providers_phase2.mjs" },
  { name: "Phase 3: Schema Parity, Top Banner & Cache v4", file: "verify_providers_phase3.mjs" },
  { name: "Watchlist: Clean Architecture & Quota Shields", file: "verify_providers_watchlist.mjs" },
  { name: "Speed & Console: Image w400, No Double-Lazy & Promise Lock", file: "verify_providers_speed_and_warnings.mjs" }
];

let totalPassed = 0;
let totalFailed = 0;

for (const t of tests) {
  console.log(`▶ Running ${t.name} (${t.file})...`);
  try {
    const output = execSync(`node tests/verifications/${t.file}`, {
      cwd: path.resolve('.'),
      encoding: 'utf-8',
      timeout: 15000
    });
    console.log(output.trim());
    console.log(`✅ [SUITE PASSED]: ${t.name}\n`);
    totalPassed++;
  } catch (err) {
    console.error(`❌ [SUITE FAILED]: ${t.name}`);
    console.error(err.stdout || err.message);
    totalFailed++;
  }
}

console.log("======================================================================");
console.log(`🏁 MASTER SUMMARY: ${totalPassed} suites passed, ${totalFailed} suites failed.`);
console.log("======================================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("✨ ALL 5 TEST SUITES PASSED WITH 100% INTEGRITY!");
  process.exit(0);
}
