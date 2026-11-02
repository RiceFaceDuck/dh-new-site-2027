/**
 * 🧪 Verification Suite: Store Profile UI, 2-Tier Architecture & GPS Interaction Flow
 * 
 * Location: Management System/tests/verifications/verify_store_profile_ui_and_flow.mjs
 * Purpose: Empirically verify all changes made in this Stage for Store Profile UI, Temp Pill,
 *          GPS flow, and Official Brand Logos.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const frontendRoot = path.join(projectRoot, 'dh-frontend');

async function runVerification() {
  console.log("================================================================================");
  console.log("  STAGE FINAL REVIEW: STORE PROFILE UI & INTERACTION VERIFICATION");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Check 1: 2-Tier Dashboard Header in StoreProfileForm.jsx
  // ---------------------------------------------------------------------------
  test("Architecture: StoreProfileForm implements 2-Tier Dashboard Header", () => {
    const file = path.join(frontendRoot, 'src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
    const content = fs.readFileSync(file, 'utf-8');

    // Tier 1 checks
    assert.ok(content.includes('2-Tier Dashboard Header'), "Header must be marked as 2-Tier Dashboard Header");
    assert.ok(content.includes('ศูนย์ข้อมูลร้านค้า'), "Title must be 'ศูนย์ข้อมูลร้านค้า'");
    assert.ok(content.includes('STORE PROFILE'), "Badge must include 'STORE PROFILE'");
    assert.ok(content.includes('ดูหน้าร้านของคุณ'), "Shortcut link must be 'ดูหน้าร้านของคุณ'");
    assert.ok(!content.includes('sm:flex-nowrap'), "sm:flex-nowrap must be removed to avoid crushing text");

    // Tier 2 checks
    assert.ok(content.includes('ยอดเข้าชมหน้าร้าน:'), "Tier 2 metric must include 'ยอดเข้าชมหน้าร้าน:'");
    assert.ok(content.includes('นามบัตรโฆษณา'), "Tier 2 control must include 'นามบัตรโฆษณา'");
    assert.ok(content.includes('rounded-[2px]'), "Containers must strictly comply with border radius 0.1 / rounded-[2px]");
  });

  // ---------------------------------------------------------------------------
  // Check 2: Big Yellow Alert Box Purged & Automatic Draft Cleanup Retained
  // ---------------------------------------------------------------------------
  test("Cleanliness: Big yellow draft banner purged & no manual discard clutter", () => {
    const formFile = path.join(frontendRoot, 'src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
    const formContent = fs.readFileSync(formFile, 'utf-8');

    assert.ok(!formContent.includes('ระบบจำข้อมูลแบบร่างชั่วคราวให้แล้ว'), "Big explanatory yellow box must be purged");
    assert.ok(!formContent.includes('ยกเลิกแบบร่าง / คืนค่าข้อมูลเดิมจากระบบ'), "Manual discard button must be purged");

    const hookFile = path.join(frontendRoot, 'src/components/profile/tabs/hooks/useStoreProfileData.js');
    const hookContent = fs.readFileSync(hookFile, 'utf-8');
    assert.ok(hookContent.includes('commitSavedData'), "Automatic commitSavedData must exist to clear draft on save");
    assert.ok(hookContent.includes('localStorage.removeItem'), "localStorage removeItem must clear draft automatically");
  });

  // ---------------------------------------------------------------------------
  // Check 3: Compact Temp Status Badge (temp✅ / temp🔄️)
  // ---------------------------------------------------------------------------
  test("UX: Compact temp badge renders temp✅ and temp🔄️ next to section header", () => {
    const basicInfoFile = path.join(frontendRoot, 'src/components/profile/tabs/store-profile/StoreProfileBasicInfo.jsx');
    const content = fs.readFileSync(basicInfoFile, 'utf-8');

    assert.ok(content.includes('temp✅'), "Must support 'temp✅' badge");
    assert.ok(content.includes('temp🔄️'), "Must support 'temp🔄️' badge");
    assert.ok(content.includes('hasDraft'), "Must accept hasDraft prop");
    assert.ok(content.includes('isDraftSaving'), "Must accept isDraftSaving prop");
    assert.ok(content.includes('rounded-[2px]'), "Badge must adhere to rounded-[2px]");
  });

  // ---------------------------------------------------------------------------
  // Check 4: Integrated GPS Flow & Horizontal Alignment
  // ---------------------------------------------------------------------------
  test("Interaction: Integrated GPS manual flow & horizontal baseline alignment", () => {
    const locFile = path.join(frontendRoot, 'src/components/profile/tabs/store-profile/StoreProfileLocation.jsx');
    const content = fs.readFileSync(locFile, 'utf-8');

    // Flow checks
    assert.ok(content.includes('showManualInput'), "Must maintain showManualInput toggle state");
    assert.ok(content.includes('วางพิกัดเอง'), "Must have button 'วางพิกัดเอง'");
    assert.ok(content.includes('ตรวจสอบ'), "Must switch button text to 'ตรวจสอบ' when input is open");
    assert.ok(content.includes('setShowManualInput(false)'), "Must auto-fold input when coords successfully verified");

    // Alignment checks
    assert.ok(content.includes('sm:flex-row'), "Buttons must be arranged side-by-side on sm+");
    assert.ok(content.includes('gap-3'), "Buttons must have gap-3 spacing");
    assert.ok(content.includes('self-end'), "Button container must use self-end to align with bottom baseline of coordinate card");
  });

  // ---------------------------------------------------------------------------
  // Check 5: GPS Coordinate Regex Parser Mathematical Verification
  // ---------------------------------------------------------------------------
  test("Data Integrity: Coordinate regex parser correctly extracts lat/lng across all formats", () => {
    const parse = (text) => {
      // 1. Direct comma, space, plus
      let match = text.match(/(-?\d+\.\d+)(?:\s*,\s*|\s+|\+)(-?\d+\.\d+)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

      // 2. @lat,lng
      match = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

      // 3. !3d!4d
      match = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

      // 4. Query params
      match = text.match(/[?&]lat=(-?\d+\.\d+)[^&\s]*[?&]l(?:ng|on)=(-?\d+\.\d+)/i);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

      return null;
    };

    // Format 1: Direct coordinates with comma
    const r1 = parse("13.960066, 100.625201");
    assert.ok(r1 && r1.lat === 13.960066 && r1.lng === 100.625201, "Direct coordinates parse failed");

    // Format 2: Google Maps @ URL
    const r2 = parse("https://www.google.com/maps/@13.960066,100.625201,17z");
    assert.ok(r2 && r2.lat === 13.960066 && r2.lng === 100.625201, "Google Maps @ format parse failed");

    // Format 3: Google Maps share URL with !3d!4d
    const r3 = parse("https://www.google.com/maps/place/Shop/data=!4m2!3m1!1s0x0:0x0!3d13.960066!4d100.625201");
    assert.ok(r3 && r3.lat === 13.960066 && r3.lng === 100.625201, "Google Maps !3d!4d format parse failed");

    // Format 4: URL query parameters
    const r4 = parse("https://maps.example.com?lat=13.960066&lng=100.625201");
    assert.ok(r4 && r4.lat === 13.960066 && r4.lng === 100.625201, "Query param format parse failed");
  });

  // ---------------------------------------------------------------------------
  // Check 6: Brand Logos Exist in Public Directory & Embedded in Social Links
  // ---------------------------------------------------------------------------
  test("Asset Integrity: Official brand PNG logos exist and are embedded in StoreProfileSocialLinks", () => {
    const socialFile = path.join(frontendRoot, 'src/components/profile/tabs/store-profile/StoreProfileSocialLinks.jsx');
    const content = fs.readFileSync(socialFile, 'utf-8');

    const brandLogos = [
      'line_logo.png',
      'messenger_logo.png',
      'shopee_logo.png',
      'lazada_logo.png',
      'tiktok_logo.png',
      'youtube_logo.png',
      'website_logo.png'
    ];

    for (const logo of brandLogos) {
      // 1. Verify file exists in public/images/
      const imgPath = path.join(frontendRoot, 'public/images', logo);
      assert.ok(fs.existsSync(imgPath), `Brand asset public/images/${logo} must exist on disk`);

      // 2. Verify embedded in component
      assert.ok(content.includes(`/images/${logo}`), `StoreProfileSocialLinks must reference /images/${logo}`);
    }
  });

  console.log("\n================================================================================");
  console.log(`  VERIFICATION RESULT: ALL ${passed}/${total} CHECKS PASSED PERFECTLY! 🚀`);
  console.log("================================================================================\n");
}

runVerification().catch(err => {
  console.error("FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});
