import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_SHARD_URL = 'https://firestore.googleapis.com/v1/projects/dh-notebook-69f3b/databases/(default)/documents/catalogs';
const THRESHOLD_BYTES = 300 * 1024; // 300 KB
const CONCURRENCY = 25;

async function fetchCatalogImages() {
  const targets = []; // { sku, url }
  const seenUrls = new Set();

  for (let i = 1; i <= 7; i++) {
    const r = await fetch(`${BASE_SHARD_URL}/search_index_p${i}`);
    if (!r.ok) continue;
    const j = await r.json();
    const items = j.fields?.items?.arrayValue?.values || [];
    for (const v of items) {
      const m = v.mapValue?.fields || {};
      const sku = m.sku?.stringValue || m.id?.stringValue || 'UNKNOWN';
      const img =
        m.image?.stringValue ||
        m.img?.stringValue ||
        m.images?.arrayValue?.values?.[0]?.stringValue ||
        '';
      if (img && img.includes('firebasestorage.googleapis.com') && !seenUrls.has(img)) {
        seenUrls.add(img);
        targets.push({ sku, url: img });
      }
    }
  }
  return targets;
}

async function headImage(target) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target.url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      return { ...target, status: res.status, bytes: 0, contentType: res.headers.get('content-type') || '' };
    }
    const bytes = Number(res.headers.get('content-length') || 0);
    const contentType = res.headers.get('content-type') || '';
    return { ...target, status: 200, bytes, contentType };
  } catch (err) {
    return { ...target, status: 'ERR', bytes: 0, error: err.message };
  }
}

async function run() {
  console.log('🔍 Phase 4 Dry-Run: Scanning cover images from 7 catalog shards (HEAD-only, 7 Firestore reads)...');
  const targets = await fetchCatalogImages();
  console.log(`📦 Found ${targets.length} unique Firebase Storage cover images to check...\n`);

  const results = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const chunk = targets.slice(i, i + CONCURRENCY);
    const chunkRes = await Promise.all(chunk.map(headImage));
    results.push(...chunkRes);
    if ((i + CONCURRENCY) % 500 === 0 || i + CONCURRENCY >= targets.length) {
      console.log(`   ...scanned ${Math.min(i + CONCURRENCY, targets.length)} / ${targets.length}`);
    }
  }

  const ok = results.filter(r => r.status === 200);
  const broken = results.filter(r => r.status !== 200);
  const oversized = ok.filter(r => r.bytes > THRESHOLD_BYTES).sort((a, b) => b.bytes - a.bytes);
  const over500k = oversized.filter(r => r.bytes > 500 * 1024);
  const over1m = oversized.filter(r => r.bytes > 1024 * 1024);
  const nonWebp = ok.filter(r => r.contentType && !r.contentType.includes('webp'));

  const totalBytes = ok.reduce((sum, r) => sum + r.bytes, 0);
  const oversizedBytes = oversized.reduce((sum, r) => sum + r.bytes, 0);
  const estAfterBytes = oversized.length * 90 * 1024; // ~90KB target per compressed WebP
  const estSavedBytes = Math.max(0, oversizedBytes - estAfterBytes);

  const summary = {
    scannedAt: new Date().toISOString(),
    totalUniqueCoverImages: targets.length,
    okCount: ok.length,
    brokenCount: broken.length,
    oversizedOver300KB: oversized.length,
    oversizedOver500KB: over500k.length,
    oversizedOver1MB: over1m.length,
    nonWebpCount: nonWebp.length,
    totalCoverSizeMB: +(totalBytes / (1024 * 1024)).toFixed(2),
    oversizedTotalMB: +(oversizedBytes / (1024 * 1024)).toFixed(2),
    estimatedSavingsMB: +(estSavedBytes / (1024 * 1024)).toFixed(2),
    top15Largest: oversized.slice(0, 15).map(r => ({
      sku: r.sku,
      sizeKB: +(r.bytes / 1024).toFixed(1),
      contentType: r.contentType
    })),
    brokenSamples: broken.slice(0, 10).map(r => ({
      sku: r.sku,
      status: r.status
    }))
  };

  const outPath = path.join(__dirname, 'phase4_image_size_audit.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary, oversizedList: oversized.map(r => ({ sku: r.sku, bytes: r.bytes, url: r.url })) }, null, 2), 'utf8');

  console.log('\n================ 📊 PHASE 4 DRY-RUN SUMMARY ================');
  console.log(`- Total Scanned Cover Images : ${summary.totalUniqueCoverImages}`);
  console.log(`- Healthy (200 OK)           : ${summary.okCount}`);
  console.log(`- Broken (!= 200)            : ${summary.brokenCount}`);
  console.log(`- Non-WebP Format            : ${summary.nonWebpCount}`);
  console.log(`- Oversized (> 300 KB)       : ${summary.oversizedOver300KB} images (${summary.oversizedTotalMB} MB)`);
  console.log(`  ├─ > 500 KB                : ${summary.oversizedOver500KB} images`);
  console.log(`  └─ > 1 MB                  : ${summary.oversizedOver1MB} images`);
  console.log(`- Total Cover Size           : ${summary.totalCoverSizeMB} MB`);
  console.log(`- Estimated Savings (~90KB)  : ~${summary.estimatedSavingsMB} MB`);
  console.log('\n🔝 Top 10 Largest Cover Images:');
  summary.top15Largest.slice(0, 10).forEach((item, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, ' ')}. ${item.sku} | ${item.sizeKB} KB | ${item.contentType}`);
  });
  if (broken.length > 0) {
    console.log('\n⚠️ Broken Cover Images (Sample):');
    summary.brokenSamples.forEach(b => console.log(`  - ${b.sku}: status ${b.status}`));
  }
  console.log(`\n📝 Full report saved to: ${outPath}`);
}

run().catch(err => {
  console.error('❌ Audit Error:', err);
  process.exit(1);
});
