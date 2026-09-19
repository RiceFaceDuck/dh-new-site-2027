import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('=== Challenger M1: Comprehensive Empirical Dynamic Import & Bundle Resolution Suite ===\n');

const APPS = [
  {
    name: 'dh-frontend',
    distDir: path.resolve(REPO_ROOT, 'Management System/dh-frontend/dist')
  },
  {
    name: 'dh-backoffice-react',
    distDir: path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/dist')
  },
  {
    name: 'dh-staff-app',
    distDir: path.resolve(REPO_ROOT, 'Management System/dh-staff-app/dist')
  }
];

let totalChecks = 0;
let passedChecks = 0;
const errors = [];

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`[PASS] ${desc}`);
  } catch (err) {
    console.error(`[FAIL] ${desc}: ${err.message}`);
    errors.push({ desc, error: err.message });
  }
}

for (const app of APPS) {
  console.log(`\n======================================================`);
  console.log(`App: ${app.name} (${app.distDir})`);
  console.log(`======================================================`);

  // 1. Check dist directory existence
  check(`${app.name}: dist directory exists`, () => {
    assert.ok(fs.existsSync(app.distDir), `Dist dir missing at ${app.distDir}`);
  });

  // 2. Check index.html exists
  const indexPath = path.join(app.distDir, 'index.html');
  check(`${app.name}: index.html exists`, () => {
    assert.ok(fs.existsSync(indexPath), `index.html missing at ${indexPath}`);
  });

  if (!fs.existsSync(indexPath)) continue;

  const htmlContent = fs.readFileSync(indexPath, 'utf-8');

  // 3. Extract and check all script/link assets in index.html
  const assetRegex = /(?:src|href)=["']([^"']+\.(?:js|css|png|svg|ico|webmanifest|json))["']/gi;
  let match;
  const referencedAssets = [];
  while ((match = assetRegex.exec(htmlContent)) !== null) {
    const rawAsset = match[1];
    if (rawAsset.startsWith('http://') || rawAsset.startsWith('https://')) continue;
    referencedAssets.push(rawAsset);
  }

  check(`${app.name}: index.html references valid, existing assets (${referencedAssets.length} assets)`, () => {
    assert.ok(referencedAssets.length > 0, 'index.html should reference at least 1 asset');
    for (const relAsset of referencedAssets) {
      const cleanPath = relAsset.startsWith('/') ? relAsset.slice(1) : relAsset;
      const fullPath = path.join(app.distDir, cleanPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Asset referenced in index.html does not exist on disk: ${relAsset} -> ${fullPath}`
      );
    }
  });

  // 4. Scan all JS files in dist
  const allJsFiles = [];
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanDir(full);
      } else if (ent.isFile() && ent.name.endsWith('.js') && !ent.name.endsWith('.gz')) {
        allJsFiles.push(full);
      }
    }
  }
  scanDir(app.distDir);

  check(`${app.name}: built JS chunks exist (${allJsFiles.length} chunks)`, () => {
    assert.ok(allJsFiles.length > 0, `No JS files found in ${app.distDir}`);
  });

  // 5. Scan JS chunks for imports and dynamic imports
  let staticImportsCount = 0;
  let dynamicImportsCount = 0;
  let runtimeVariablesCount = 0;
  const brokenImports = [];
  const verifiedDynamicImports = [];

  for (const jsFile of allJsFiles) {
    const code = fs.readFileSync(jsFile, 'utf-8');
    const dir = path.dirname(jsFile);
    const chunkRelName = path.relative(app.distDir, jsFile);

    // Static imports: from "./..." or from "../..." or import "./..."
    const staticImportRegex = /(?:import|from)\s*['"](\.[^'"]+)['"]/g;
    let sMatch;
    while ((sMatch = staticImportRegex.exec(code)) !== null) {
      staticImportsCount++;
      const targetSpec = sMatch[1];
      const targetPath = path.resolve(dir, targetSpec);
      if (!fs.existsSync(targetPath)) {
        brokenImports.push({ file: chunkRelName, type: 'static', target: targetSpec, resolved: targetPath });
      }
    }

    // Dynamic imports: import("..."), import('...'), import(`...`), or import(variable)
    const dynamicImportRegex = /import\s*\(([^)]+)\)/g;
    let dMatch;
    while ((dMatch = dynamicImportRegex.exec(code)) !== null) {
      dynamicImportsCount++;
      const rawArg = dMatch[1].trim();

      // Check if it's a literal string enclosed in quotes or backticks
      const literalMatch = rawArg.match(/^['"`](\.[^'"`]+)['"`]$/);
      if (literalMatch) {
        const targetSpec = literalMatch[1];
        const targetPath = path.resolve(dir, targetSpec);
        if (!fs.existsSync(targetPath)) {
          brokenImports.push({ file: chunkRelName, type: 'dynamic', target: targetSpec, resolved: targetPath });
        } else {
          verifiedDynamicImports.push({ file: chunkRelName, target: targetSpec });
        }
      } else {
        runtimeVariablesCount++;
        // If it's a variable or template with interpolation, ensure it is not undefined or empty
        if (/undefined|null|NaN/.test(rawArg)) {
          brokenImports.push({ file: chunkRelName, type: 'suspicious_expression', target: rawArg });
        }
      }
    }
  }

  check(`${app.name}: all static imports resolve to existing chunk files (${staticImportsCount} verified)`, () => {
    const brokenStatics = brokenImports.filter(b => b.type === 'static');
    assert.strictEqual(brokenStatics.length, 0, `Broken static imports: ${JSON.stringify(brokenStatics)}`);
  });

  check(`${app.name}: all literal dynamic imports resolve to existing chunk files (${verifiedDynamicImports.length} verified, ${runtimeVariablesCount} runtime expressions)`, () => {
    const brokenDynamics = brokenImports.filter(b => b.type === 'dynamic' || b.type === 'suspicious_expression');
    assert.strictEqual(brokenDynamics.length, 0, `Broken dynamic imports: ${JSON.stringify(brokenDynamics)}`);
  });
}

console.log('\n======================================================');
console.log(`TOTAL AUDIT RESULT: ${passedChecks}/${totalChecks} checks passed across all 3 applications.`);
if (errors.length > 0) {
  console.error(`FAILED CHECKS (${errors.length}):`);
  for (const e of errors) {
    console.error(`- ${e.desc}: ${e.error}`);
  }
  process.exit(1);
} else {
  console.log('VERDICT: ZERO BROKEN DYNAMIC OR STATIC IMPORTS IN PRODUCTION DIST CHUNKS.');
  process.exit(0);
}
