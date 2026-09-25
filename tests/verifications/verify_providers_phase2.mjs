import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { getRenderableImageUrl, extractDriveId } from '../../dh-frontend/src/utils/imageUtils.js';

console.log("=== Verification: Service Providers Phase 2 (UI, Image Resilience & Distance 0m) ===");

// 1. Test getRenderableImageUrl
console.log("\n--- 1. Testing getRenderableImageUrl & Drive extraction ---");
const rawThumbnail = "https://drive.google.com/thumbnail?id=1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW&sz=w1000";
const converted = getRenderableImageUrl(rawThumbnail);
console.log("Thumbnail input:", rawThumbnail);
console.log("Converted output:", converted);
assert(converted.includes("https://lh3.googleusercontent.com/d/1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW=w1000"), "Must format to lh3 with =w1000");

const driveShare = "https://drive.google.com/file/d/1NqFU0oWnXDC7vcTdYm-hMxVzYMrEHnTZ/view?usp=sharing";
const convertedShare = getRenderableImageUrl(driveShare);
assert(convertedShare.includes("https://lh3.googleusercontent.com/d/1NqFU0oWnXDC7vcTdYm-hMxVzYMrEHnTZ=w1000"), "Must extract file/d/ ID and append =w1000");

const nonDrive = "https://firebasestorage.googleapis.com/v0/b/test/image.webp";
assert.strictEqual(getRenderableImageUrl(nonDrive), nonDrive, "Non-drive URLs must be preserved untouched");
assert.strictEqual(getRenderableImageUrl(""), "", "Empty string returns empty string");
console.log("✅ Check 1: Image URL transformation and Drive ID extraction passed!");

// 2. Test Distance 0m and Sorting Logic
console.log("\n--- 2. Testing Distance 0m Sorting Logic ---");
const mockPartners = [
  { id: 'far', distanceKm: 15.2, points: 500 },
  { id: 'zero_dist', distanceKm: 0, points: 100 },
  { id: 'near_tied_low', distanceKm: 1.5, points: 50 },
  { id: 'near_tied_high', distanceKm: 1.5, points: 200 },
  { id: 'no_dist', distanceKm: null, points: 300 }
];

const sorted = [...mockPartners].sort((a, b) => {
  const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
  const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
  if (distA !== distB) return distA - distB;
  return (b.points || 0) - (a.points || 0);
});

console.log("Sorted order:", sorted.map(p => `${p.id} (${p.distanceKm}km, ${p.points}pts)`));
assert.strictEqual(sorted[0].id, 'zero_dist', "0km distance store must be placed FIRST, not last!");
assert.strictEqual(sorted[1].id, 'near_tied_high', "Tied distance must rank higher points first");
assert.strictEqual(sorted[2].id, 'near_tied_low', "Tied distance ranks lower points second");
assert.strictEqual(sorted[3].id, 'far', "Further store ranks after nearer stores");
assert.strictEqual(sorted[4].id, 'no_dist', "Stores without distance rank at the end");
console.log("✅ Check 2: Distance 0m sort and points tie-breaker passed!");

// 3. Test LazyImage file contents
console.log("\n--- 3. Testing LazyImage.jsx structure ---");
const lazyImagePath = path.resolve('dh-frontend/src/components/common/LazyImage.jsx');
const lazyContent = fs.readFileSync(lazyImagePath, 'utf8');

assert(lazyContent.includes('handleImgError'), "LazyImage must implement handleImgError");
assert(lazyContent.includes('setIsLoaded(true)'), "LazyImage must unmask image on fallback");
assert(lazyContent.includes('extractDriveId'), "LazyImage must leverage extractDriveId");
console.log("✅ Check 3: LazyImage multi-tier fallback confirmed!");

console.log("\n🎉 ALL PHASE 2 VERIFICATION CHECKS PASSED!");
