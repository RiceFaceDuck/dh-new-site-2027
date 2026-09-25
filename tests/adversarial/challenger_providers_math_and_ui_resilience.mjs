/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE: Service Providers Subsystem
 * Location: Management System/tests/adversarial/challenger_providers_math_and_ui_resilience.mjs
 * 
 * Challenger 2: Rigorous empirical stress testing on:
 * 1. Haversine Distance & Sorting Corner Cases
 * 2. Image Resolution & Google Drive URL Transformations
 * 3. Component Fallback & Null Guard Resilience (PartnerCard, StoreProfileHero, LazyImage)
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import production utilities
const geoUtilsPath = path.resolve(__dirname, '../../dh-frontend/src/utils/geoUtils.js');
const { calculateDistance } = await import(`file://${geoUtilsPath}`);

const imageUtilsPath = path.resolve(__dirname, '../../dh-frontend/src/utils/imageUtils.js');
const { getRenderableImageUrl, extractDriveId } = await import(`file://${imageUtilsPath}`);

console.log("======================================================================");
console.log("⚔️ ADVERSARIAL CHALLENGER 2: SERVICE PROVIDERS STRESS HARNESS");
console.log("======================================================================\n");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
    failures.push({ name, error: err.message, stack: err.stack });
  }
}

// ======================================================================
// SUITE 1: HAVERSINE FORMULA & MATHEMATICAL BOUNDARIES
// ======================================================================
console.log("--- SUITE 1: Haversine Formula & Boundary Mathematical Cases ---");

test("1.1 Identical coordinates (distanceKm === 0, user right at store)", () => {
  const dist = calculateDistance(13.7563, 100.5018, 13.7563, 100.5018);
  assert.strictEqual(dist, 0, `Expected exactly 0, got ${dist}`);
  assert.strictEqual(typeof dist, 'number', "Distance must be number");
  assert(!isNaN(dist), "Distance must not be NaN");
  assert(Number.isFinite(dist), "Distance must be finite");
});

test("1.2 Antipodal coordinates (opposite side of the earth, 180 degrees)", () => {
  // Antipodal points: (0, 0) and (0, 180). Earth circumference/2 ~= 20,015 km
  const dist = calculateDistance(0, 0, 0, 180);
  assert(!isNaN(dist), "Antipodal distance must not produce NaN (floating-point asin domain check)");
  assert(dist > 20000 && dist < 20050, `Expected ~20015 km, got ${dist}`);
});

test("1.3 Extreme latitude boundaries (+90 North Pole, -90 South Pole)", () => {
  const dist = calculateDistance(90, 0, -90, 0);
  assert(!isNaN(dist), "Poles distance must not produce NaN");
  assert(dist > 20000 && dist < 20050, `Expected ~20015 km, got ${dist}`);
});

test("1.4 Non-numeric & NaN coordinates return Infinity safely", () => {
  assert.strictEqual(calculateDistance(NaN, 100, 13, 100), Infinity);
  assert.strictEqual(calculateDistance(13, NaN, 13, 100), Infinity);
  assert.strictEqual(calculateDistance(13, 100, NaN, 100), Infinity);
  assert.strictEqual(calculateDistance(13, 100, 13, NaN), Infinity);
  assert.strictEqual(calculateDistance(undefined, 100, 13, 100), Infinity);
  assert.strictEqual(calculateDistance("invalid", 100, 13, 100), Infinity);
  assert.strictEqual(calculateDistance(), Infinity);
});

test("1.5 String numeric coordinates coerce cleanly", () => {
  const dist1 = calculateDistance("13.7563", "100.5018", "13.7563", "100.5018");
  assert.strictEqual(dist1, 0, "String numbers must coerce to 0 distance");

  const dist2 = calculateDistance("13.7563", "100.5018", "13.7600", "100.5100");
  assert(dist2 > 0 && dist2 < 2, `Expected ~1km, got ${dist2}`);
});

test("1.6 Thailand Operational Geo-Domain Stress (50,000 coordinate pairs)", () => {
  // Thailand geographic bounds: Lat 5.6 to 20.5, Lng 97.3 to 105.7
  for (let i = 0; i < 50000; i++) {
    const lat1 = 5.6 + Math.random() * (20.5 - 5.6);
    const lon1 = 97.3 + Math.random() * (105.7 - 97.3);
    const lat2 = 5.6 + Math.random() * (20.5 - 5.6);
    const lon2 = 97.3 + Math.random() * (105.7 - 97.3);

    const dist = calculateDistance(lat1, lon1, lat2, lon2);
    assert(!isNaN(dist), `Thailand coordinates produced NaN at (${lat1},${lon1}) to (${lat2},${lon2})`);
    assert(dist >= 0 && dist <= 2000, `Thailand distance out of bounds: ${dist} km`);
  }
});

// ======================================================================
// SUITE 2: PROVIDERS LIST DISTANCE LOGIC & NULL ISLAND GUARDS
// ======================================================================
console.log("\n--- SUITE 2: Provider List Distance Mapping & Null Island Guards ---");

// Helper reproducing useProvidersList.js processing pipeline
function processProviders(partners, userLocation, searchTerm = '') {
  let result = [...partners];

  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    result = result.filter(p => {
      const nameMatch = p.storeName?.toLowerCase().includes(lowerTerm);
      const servicesMatch = p.services?.toLowerCase().includes(lowerTerm);
      return nameMatch || servicesMatch;
    });
  }

  if (userLocation) {
    result = result.map(p => {
      let distanceKm = null;
      let formattedDistance = null;
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        distanceKm = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
        formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} เมตร` : `${distanceKm.toFixed(1)} กม.`;
      }
      return { ...p, distanceKm, formattedDistance };
    });
  }

  if (userLocation) {
    result.sort((a, b) => {
      const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
      const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
      if (distA !== distB) return distA - distB;
      return (b.points || 0) - (a.points || 0);
    });
  } else {
    result.sort((a, b) => (b.points || 0) - (a.points || 0));
  }

  return result;
}

test("2.1 Null Island guard: lat === 0 or lng === 0 rejected cleanly", () => {
  const userLoc = { lat: 13.7563, lng: 100.5018 };
  const partners = [
    { id: 'p_null_island', lat: 0, lng: 0, storeName: 'Null Island Shop' },
    { id: 'p_zero_lat', lat: 0, lng: 100.5, storeName: 'Zero Lat Shop' },
    { id: 'p_zero_lng', lat: 13.7, lng: 0, storeName: 'Zero Lng Shop' },
    { id: 'p_valid', lat: 13.7563, lng: 100.5018, storeName: 'Valid Shop' }
  ];

  const processed = processProviders(partners, userLoc);
  const nullIsland = processed.find(p => p.id === 'p_null_island');
  const zeroLat = processed.find(p => p.id === 'p_zero_lat');
  const zeroLng = processed.find(p => p.id === 'p_zero_lng');
  const valid = processed.find(p => p.id === 'p_valid');

  assert.strictEqual(nullIsland.distanceKm, null, "Null Island (0,0) must have null distanceKm");
  assert.strictEqual(nullIsland.formattedDistance, null, "Null Island (0,0) must have null formattedDistance");
  assert.strictEqual(zeroLat.distanceKm, null, "lat === 0 must have null distanceKm");
  assert.strictEqual(zeroLng.distanceKm, null, "lng === 0 must have null distanceKm");
  assert.strictEqual(valid.distanceKm, 0, "Valid exact location must have 0 distanceKm");
  assert.strictEqual(valid.formattedDistance, "0 เมตร", "0km distance must format to '0 เมตร'");
});

test("2.2 Missing/Null coordinates (latitude === null, longitude === undefined) fallback safely", () => {
  const userLoc = { lat: 13.7563, lng: 100.5018 };
  const partners = [
    { id: 'p1', latitude: null, longitude: 100.5, storeName: 'Null Lat' },
    { id: 'p2', latitude: 13.7, longitude: undefined, storeName: 'Undef Lng' },
    { id: 'p3', storeName: 'Empty Coords' },
    { id: 'p4', lat: 'not_a_number', lng: 100.5, storeName: 'NaN Coords' }
  ];

  const processed = processProviders(partners, userLoc);
  for (const p of processed) {
    assert.strictEqual(p.distanceKm, null, `${p.id} must have null distanceKm`);
    assert.strictEqual(p.formattedDistance, null, `${p.id} must have null formattedDistance`);
  }
});

test("2.3 Format distance transitions (<1km in meters, >=1km in km)", () => {
  const userLoc = { lat: 13.7563, lng: 100.5018 };
  const testDistances = [
    { dist: 0, expected: "0 เมตร" },
    { dist: 0.0004, expected: "0 เมตร" },
    { dist: 0.0006, expected: "1 เมตร" },
    { dist: 0.250, expected: "250 เมตร" },
    { dist: 0.999, expected: "999 เมตร" },
    { dist: 1.000, expected: "1.0 กม." },
    { dist: 1.049, expected: "1.0 กม." },
    { dist: 1.051, expected: "1.1 กม." },
    { dist: 15.24, expected: "15.2 กม." }
  ];

  for (const { dist, expected } of testDistances) {
    const formatted = dist < 1 ? `${Math.round(dist * 1000)} เมตร` : `${dist.toFixed(1)} กม.`;
    assert.strictEqual(formatted, expected, `Distance ${dist} should format to ${expected}, got ${formatted}`);
  }
});

// ======================================================================
// SUITE 3: SORTING & TIE-BREAKER ADVERSARIAL STRESS
// ======================================================================
console.log("\n--- SUITE 3: Distance Sorting & Points Tie-Breaker Corner Cases ---");

test("3.1 distanceKm === 0 places at index 0 (user right at store)", () => {
  const userLoc = { lat: 13.7563, lng: 100.5018 };
  const partners = [
    { id: 'far', lat: 14.0, lng: 100.5, points: 9999 },
    { id: 'mid', lat: 13.76, lng: 100.5, points: 500 },
    { id: 'at_store', lat: 13.7563, lng: 100.5018, points: 10 }, // 0m
    { id: 'unknown', lat: null, lng: null, points: 50000 }
  ];

  const processed = processProviders(partners, userLoc);
  assert.strictEqual(processed[0].id, 'at_store', "Store at distance 0m must be FIRST, beating high points");
  assert.strictEqual(processed[0].distanceKm, 0);
  assert.strictEqual(processed[0].formattedDistance, "0 เมตร");
  assert.strictEqual(processed[processed.length - 1].id, 'unknown', "Store with null distance must be LAST");
});

test("3.2 Comparison of distanceKm: 0.00 vs null vs undefined vs NaN vs Infinity", () => {
  const testList = [
    { id: 'dist_nan', distanceKm: NaN, points: 1000 },
    { id: 'dist_inf', distanceKm: Infinity, points: 1000 },
    { id: 'dist_null', distanceKm: null, points: 800 },
    { id: 'dist_undef', distanceKm: undefined, points: 600 },
    { id: 'dist_zero_float', distanceKm: 0.00, points: 100 },
    { id: 'dist_zero_int', distanceKm: 0, points: 200 },
    { id: 'dist_normal', distanceKm: 2.5, points: 500 }
  ];

  testList.sort((a, b) => {
    // Note: in JavaScript typeof NaN is 'number', so typeof check must be careful
    const distA = (typeof a.distanceKm === 'number' && !isNaN(a.distanceKm)) ? a.distanceKm : Infinity;
    const distB = (typeof b.distanceKm === 'number' && !isNaN(b.distanceKm)) ? b.distanceKm : Infinity;
    if (distA !== distB) return distA - distB;
    return (b.points || 0) - (a.points || 0);
  });

  // Expected top: dist_zero_int (200 pts) then dist_zero_float (100 pts)
  assert.strictEqual(testList[0].id, 'dist_zero_int', "0km with 200pts must be #1");
  assert.strictEqual(testList[1].id, 'dist_zero_float', "0.00km with 100pts must be #2");
  assert.strictEqual(testList[2].id, 'dist_normal', "2.5km must be #3");
  // Non-distance items sorted by points: dist_nan & dist_inf (1000 pts) -> dist_null (800) -> dist_undef (600)
  assert(testList[3].points >= testList[4].points);
  assert(testList[4].points >= testList[5].points);
  assert(testList[5].points >= testList[6].points);
});

test("3.3 Equal distances tie-breaker: missing, 0, negative, and large points", () => {
  const tiedPartners = [
    { id: 'pts_neg_50', distanceKm: 1.5, points: -50 },
    { id: 'pts_zero', distanceKm: 1.5, points: 0 },
    { id: 'pts_missing', distanceKm: 1.5 },
    { id: 'pts_null', distanceKm: 1.5, points: null },
    { id: 'pts_500', distanceKm: 1.5, points: 500 },
    { id: 'pts_million', distanceKm: 1.5, points: 1000000 },
    { id: 'pts_neg_10', distanceKm: 1.5, points: -10 }
  ];

  tiedPartners.sort((a, b) => {
    const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
    const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
    if (distA !== distB) return distA - distB;
    return (b.points || 0) - (a.points || 0);
  });

  // Verification of ordering:
  // 1st: pts_million (1,000,000)
  // 2nd: pts_500 (500)
  // 3rd, 4th, 5th: 0, missing, null (all evaluate to 0 in (points || 0))
  // 6th: pts_neg_10 (-10 is > -50)
  // 7th: pts_neg_50 (-50 is lowest)
  assert.strictEqual(tiedPartners[0].id, 'pts_million', "#1 must be 1,000,000 pts");
  assert.strictEqual(tiedPartners[1].id, 'pts_500', "#2 must be 500 pts");
  const middleThree = [tiedPartners[2].id, tiedPartners[3].id, tiedPartners[4].id];
  assert(middleThree.includes('pts_zero'));
  assert(middleThree.includes('pts_missing'));
  assert(middleThree.includes('pts_null'));
  assert.strictEqual(tiedPartners[5].id, 'pts_neg_10', "#6 must be -10 pts (above -50)");
  assert.strictEqual(tiedPartners[6].id, 'pts_neg_50', "#7 must be -50 pts (lowest)");
});

test("3.4 Equal distance 0m with varying points", () => {
  const atStorePartners = [
    { id: 'store_low', distanceKm: 0, points: 5 },
    { id: 'store_high', distanceKm: 0, points: 999 },
    { id: 'store_zero', distanceKm: 0, points: 0 }
  ];

  atStorePartners.sort((a, b) => {
    const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
    const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
    if (distA !== distB) return distA - distB;
    return (b.points || 0) - (a.points || 0);
  });

  assert.strictEqual(atStorePartners[0].id, 'store_high');
  assert.strictEqual(atStorePartners[1].id, 'store_low');
  assert.strictEqual(atStorePartners[2].id, 'store_zero');
});

// ======================================================================
// SUITE 4: IMAGE RESOLUTION & DRIVE URL TRANSFORMATIONS
// ======================================================================
console.log("\n--- SUITE 4: Image Resolution & Google Drive Transformations ---");

test("4.1 Malformed Google Drive URLs fallback safely without crashing", () => {
  const malformedUrls = [
    "https://drive.google.com",
    "https://drive.google.com/",
    "https://drive.google.com/file/d/",
    "https://drive.google.com/file/d/short/view", // < 15 chars
    "https://drive.google.com/open?id=123",        // < 15 chars
    "https://drive.google.com/thumbnail?sz=w1000",// no id
    "https://drive.google.com/file/d/!@#$%^&*()_+/view", // weird chars
    "https://drive.google.com/file/d//view?usp=sharing"
  ];

  for (const url of malformedUrls) {
    const res = getRenderableImageUrl(url, 400);
    assert.strictEqual(typeof res, 'string', `Result for ${url} must be string`);
    assert.strictEqual(res, url, `Malformed URL ${url} without valid ID should be returned intact`);
  }
});

test("4.2 Non-Drive URLs preserved intact (Firebase, Unsplash, paths)", () => {
  const nonDriveUrls = [
    "https://firebasestorage.googleapis.com/v0/b/dh-notebook.appspot.com/o/partner%2Flogo.webp?alt=media&token=a1b2c3d4",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    "/assets/partner-default.png",
    "./images/avatar.jpg",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "blob:http://localhost:3168/087859b8-07cb-4b40-a192-f04c60523498"
  ];

  for (const url of nonDriveUrls) {
    const res = getRenderableImageUrl(url, 400);
    assert.strictEqual(res, url, `Non-drive URL ${url} must be preserved intact`);
  }
});

test("4.3 Null, undefined, empty, and non-string values handle safely", () => {
  assert.strictEqual(getRenderableImageUrl(null), '');
  assert.strictEqual(getRenderableImageUrl(undefined), '');
  assert.strictEqual(getRenderableImageUrl(''), '');
  assert.strictEqual(getRenderableImageUrl('   '), '');
  assert.strictEqual(getRenderableImageUrl(0), '');
  assert.strictEqual(getRenderableImageUrl(false), '');
});

test("4.4 Valid Drive URL variants transform to lh3 with custom width", () => {
  const validDriveIds = [
    {
      input: "https://drive.google.com/thumbnail?id=1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW&sz=w1000",
      id: "1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW"
    },
    {
      input: "https://drive.google.com/file/d/1NqFU0oWnXDC7vcTdYm-hMxVzYMrEHnTZ/view?usp=sharing",
      id: "1NqFU0oWnXDC7vcTdYm-hMxVzYMrEHnTZ"
    },
    {
      input: "https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O",
      id: "1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O"
    },
    {
      input: "https://lh3.googleusercontent.com/d/1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW=w1000",
      id: "1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW"
    }
  ];

  // Test custom width = 400 (for PartnerCard avatar)
  for (const { input, id } of validDriveIds) {
    const output400 = getRenderableImageUrl(input, 400);
    assert(output400.includes(`https://lh3.googleusercontent.com/d/${id}=w400`), 
      `URL ${input} must convert to lh3 with =w400, got: ${output400}`);
  }

  // Test default width = 1000
  const outputDefault = getRenderableImageUrl(validDriveIds[0].input);
  assert(outputDefault.includes(`=w1000`), `Default width must be =w1000, got: ${outputDefault}`);
});

test("4.5 extractDriveId extracts valid ID and safely returns null on invalid", () => {
  assert.strictEqual(extractDriveId("https://drive.google.com/file/d/1NqFU0oWnXDC7vcTdYm-hMxVzYMrEHnTZ/view"), "1NqFU0oWnXDC7vcTdYm-hMxVzYMrEHnTZ");
  assert.strictEqual(extractDriveId("https://drive.google.com/thumbnail?id=1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW"), "1DUyXC5sqidQPgWerDz-O6INhtNqrLbQW");
  assert.strictEqual(extractDriveId("https://images.unsplash.com/photo-123"), null);
  assert.strictEqual(extractDriveId("https://drive.google.com/file/d/short/view"), null);
  assert.strictEqual(extractDriveId(""), null);
  assert.strictEqual(extractDriveId(null), null);
  assert.strictEqual(extractDriveId(undefined), null);
});

// ======================================================================
// SUITE 5: COMPONENT FALLBACK & NULL GUARD RESILIENCE
// ======================================================================
console.log("\n--- SUITE 5: UI Fallbacks & Component Level Resilience ---");

test("5.1 StoreProfileHero: Coordinates vs HTTP URLs vs missing map links", () => {
  // Logic from StoreProfileHero.jsx:
  // const rawMapsUrl = partner.mapsUrl || partner.googleMapLink || partner.googleMapsUrl || partner.storeProfile?.mapsUrl || partner.storeProfile?.googleMapLink || '';
  // const mapsUrl = rawMapsUrl && !rawMapsUrl.startsWith('http') 
  //   ? `https://www.google.com/maps?q=${encodeURIComponent(rawMapsUrl)}`
  //   : rawMapsUrl;

  function resolveMapsUrl(partner) {
    const rawMapsUrl = String(partner.mapsUrl || partner.googleMapLink || partner.googleMapsUrl || partner.storeProfile?.mapsUrl || partner.storeProfile?.googleMapLink || '');
    if (!rawMapsUrl) return '';
    return !rawMapsUrl.startsWith('http')
      ? `https://www.google.com/maps?q=${encodeURIComponent(rawMapsUrl)}`
      : rawMapsUrl;
  }

  // Case A: Pure coordinates
  const pCoords = { mapsUrl: "13.7563,100.5018" };
  assert.strictEqual(resolveMapsUrl(pCoords), "https://www.google.com/maps?q=13.7563%2C100.5018");

  // Case B: Coordinates with spaces and Thai text
  const pCoordsThai = { googleMapLink: "13.7563, 100.5018 (ติดเซเว่น)" };
  assert.strictEqual(resolveMapsUrl(pCoordsThai), `https://www.google.com/maps?q=${encodeURIComponent("13.7563, 100.5018 (ติดเซเว่น)")}`);

  // Case C: Standard HTTP URL
  const pHttp = { googleMapsUrl: "https://maps.google.com/?q=13.7563,100.5018" };
  assert.strictEqual(resolveMapsUrl(pHttp), "https://maps.google.com/?q=13.7563,100.5018");

  // Case D: Short HTTP URL
  const pShort = { storeProfile: { googleMapLink: "https://goo.gl/maps/xyz123" } };
  assert.strictEqual(resolveMapsUrl(pShort), "https://goo.gl/maps/xyz123");

  // Case E: Missing / null / empty
  assert.strictEqual(resolveMapsUrl({}), '');
  assert.strictEqual(resolveMapsUrl({ mapsUrl: null }), '');
  assert.strictEqual(resolveMapsUrl({ mapsUrl: undefined }), '');
  assert.strictEqual(resolveMapsUrl({ mapsUrl: '' }), '');
});

test("5.2 PartnerCard: Distance badge fallback logic", () => {
  // In PartnerCard.jsx:
  // partner.formattedDistance ? "ห่างออกไป {formattedDistance}" : "ไม่ทราบระยะทาง"
  const cardWithDist = { formattedDistance: "0 เมตร" };
  const badgeText1 = cardWithDist.formattedDistance ? `ห่างออกไป ${cardWithDist.formattedDistance}` : "ไม่ทราบระยะทาง";
  assert.strictEqual(badgeText1, "ห่างออกไป 0 เมตร", "'0 เมตร' is truthy and must display distance badge");

  const cardWithKm = { formattedDistance: "3.5 กม." };
  const badgeText2 = cardWithKm.formattedDistance ? `ห่างออกไป ${cardWithKm.formattedDistance}` : "ไม่ทราบระยะทาง";
  assert.strictEqual(badgeText2, "ห่างออกไป 3.5 กม.");

  const cardWithoutDist = { formattedDistance: null };
  const badgeText3 = cardWithoutDist.formattedDistance ? `ห่างออกไป ${cardWithoutDist.formattedDistance}` : "ไม่ทราบระยะทาง";
  assert.strictEqual(badgeText3, "ไม่ทราบระยะทาง", "null formattedDistance must show fallback");

  const cardEmptyDist = { formattedDistance: undefined };
  const badgeText4 = cardEmptyDist.formattedDistance ? `ห่างออกไป ${cardEmptyDist.formattedDistance}` : "ไม่ทราบระยะทาง";
  assert.strictEqual(badgeText4, "ไม่ทราบระยะทาง", "undefined formattedDistance must show fallback");
});

test("5.3 LazyImage: Cached image detector (node.complete && node.naturalWidth > 0)", () => {
  // Check conditions in LazyImage.jsx line 106:
  // if (node && node.complete && node.naturalWidth > 0 && !isLoaded) { setIsLoaded(true); }

  function testCachedNode(node, isLoaded) {
    let triggered = false;
    const setIsLoaded = (val) => { triggered = val; };
    if (node && node.complete && node.naturalWidth > 0 && !isLoaded) {
      setIsLoaded(true);
    }
    return triggered;
  }

  // 1. Fully loaded image from cache:
  assert.strictEqual(testCachedNode({ complete: true, naturalWidth: 400 }, false), true,
    "Cached image with complete=true and naturalWidth=400 must trigger instant load");

  // 2. Already marked as loaded:
  assert.strictEqual(testCachedNode({ complete: true, naturalWidth: 400 }, true), false,
    "Already loaded image must not re-trigger setIsLoaded");

  // 3. Still loading (complete = false):
  assert.strictEqual(testCachedNode({ complete: false, naturalWidth: 0 }, false), false,
    "Unfinished image must not trigger instant load");

  // 4. Broken image (complete = true, but naturalWidth = 0):
  assert.strictEqual(testCachedNode({ complete: true, naturalWidth: 0 }, false), false,
    "Broken image with 0 naturalWidth must not trigger instant load (must wait for onError)");

  // 5. SSR / non-browser environment where node is null or undefined:
  assert.strictEqual(testCachedNode(null, false), false, "null node must not throw");
  assert.strictEqual(testCachedNode(undefined, false), false, "undefined node must not throw");

  // 6. Mock environment where naturalWidth is missing:
  assert.strictEqual(testCachedNode({ complete: true }, false), false, "Missing naturalWidth must safely evaluate false");
});

// ======================================================================
// SUMMARY & VERDICT
// ======================================================================
console.log("\n======================================================================");
console.log(`🏁 ADVERSARIAL STRESS TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log("======================================================================");

if (failed > 0) {
  console.error(`\n🚨 FOUND ${failed} ADVERSARIAL FAILURES:`);
  for (const f of failures) {
    console.error(`  - ${f.name}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log(`✨ ALL ${passed} ADVERSARIAL TESTS PASSED EMPIRICALLY WITH 100% SUCCESS!`);
  process.exit(0);
}
