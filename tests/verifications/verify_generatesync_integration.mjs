import { execSync } from 'node:child_process';

console.log('====================================================');
console.log('   DH NOTEBOOK /GENERATE FULL INTEGRATION SUITE      ');
console.log('====================================================');

const tests = [
  'verify_phase2_hydration.mjs',
  'verify_phase3_allsku.mjs',
  'verify_phase4_reconciliation.mjs',
  'verify_phase5_shopee_parser.mjs'
];

let allPassed = true;
for (const test of tests) {
  try {
    console.log(`\n▶ Running ${test}...`);
    const output = execSync(`node "c:/_DH Notebook/Management System/tests/verifications/${test}"`, {
      encoding: 'utf-8',
      cwd: 'c:/_DH Notebook/Management System'
    });
    console.log(output.trim());
    console.log(`✔ ${test} PASSED`);
  } catch (err) {
    console.error(`❌ ${test} FAILED:`, err.message);
    if (err.stdout) console.log('STDOUT:', err.stdout);
    if (err.stderr) console.error('STDERR:', err.stderr);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n====================================================');
  console.log('🎉 ALL 4 GENERATE SYNC TEST SUITES PASSED (100%)');
  console.log('====================================================');
} else {
  process.exit(1);
}
