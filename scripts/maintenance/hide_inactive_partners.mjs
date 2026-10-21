// One-off maintenance: hide paused / zero-credit / mock partners from storefront radar.
// - Removes AI Technical Service mock (ActivePartners + all ads -> INACTIVE). Account is kept.
// - Partners with creditPoints <= 0 (or missing) -> delete ActivePartners + active ads -> OUT_OF_CREDIT.
// - Remaining partners -> sync ActivePartners.points = users.creditPoints.
// - Removes hidden partners from catalogs/active_partners_bundle (if it exists).
// Usage: node "Management System/scripts/maintenance/hide_inactive_partners.mjs" [--dry-run]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '../../functions/package.json'));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const DRY_RUN = process.argv.includes('--dry-run');
const MOCK_PARTNER_UIDS = ['y2rGbkQNZugOcSebVUx5xdYNpjs1']; // AI Technical Service (ร้านซ่อมปัญญาประดิษฐ์)
const ACTIVE_AD_STATUSES = ['active', 'ACTIVE', 'APPROVED', 'approved'];

const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tempAdcPath = path.join(os.tmpdir(), `dh_maint_adc_${Date.now()}.json`);
fs.writeFileSync(tempAdcPath, JSON.stringify({
  type: 'authorized_user',
  client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
  client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
  refresh_token: config.tokens?.refresh_token
}));
process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;
initializeApp({ projectId: 'dh-notebook-69f3b' });
const db = getFirestore();

try {
  console.log(DRY_RUN ? '🔍 DRY RUN (no writes)\n' : '✍️ LIVE RUN\n');
  const apSnap = await db.collection('ActivePartners').get();
  const hiddenIds = new Set();
  const batch = db.batch();
  let ops = 0;

  for (const apDoc of apSnap.docs) {
    const uid = apDoc.id;
    const ap = apDoc.data() || {};
    const userSnap = await db.collection('users').doc(uid).get();
    const credit = Number(userSnap.exists ? userSnap.data().creditPoints : 0) || 0;
    const isMock = MOCK_PARTNER_UIDS.includes(uid);
    const name = ap.storeName || uid;

    if (isMock || credit <= 0) {
      hiddenIds.add(uid);
      const nextStatus = isMock ? 'INACTIVE' : 'OUT_OF_CREDIT';
      const adsSnap = await db.collection('partner_ads').where('ownerId', '==', uid).get();
      const targetAds = adsSnap.docs.filter(d => isMock || ACTIVE_AD_STATUSES.includes(d.data().status));
      console.log(`🛑 HIDE  ${name} | credit=${credit} | reason=${isMock ? 'MOCK' : 'NO_CREDIT'} | ads->${nextStatus}: ${targetAds.map(d => d.id).join(', ') || '-'}`);
      batch.delete(apDoc.ref); ops++;
      targetAds.forEach(d => { batch.update(d.ref, { status: nextStatus, isActive: false, updatedAt: FieldValue.serverTimestamp() }); ops++; });
    } else if (Number(ap.points) !== credit) {
      console.log(`🔄 SYNC  ${name} | AP.points ${ap.points ?? 'n/a'} -> ${credit}`);
      batch.update(apDoc.ref, { points: credit, updatedAt: FieldValue.serverTimestamp() }); ops++;
    } else {
      console.log(`✅ KEEP  ${name} | credit=${credit}`);
    }
  }

  const bundleRef = db.collection('catalogs').doc('active_partners_bundle');
  const bundleSnap = await bundleRef.get();
  const items = bundleSnap.exists && Array.isArray(bundleSnap.data().items) ? bundleSnap.data().items : [];
  if (items.length > 0) {
    const kept = items.filter(i => !hiddenIds.has(i.id || i.partnerId));
    console.log(`📦 bundle items ${items.length} -> ${kept.length}`);
    batch.set(bundleRef, { items: kept, bundledCount: kept.length, totalActivePartners: kept.length, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); ops++;
  } else {
    console.log('📦 bundle empty / missing — skip');
  }

  console.log(`\nTotal write ops: ${ops}`);
  if (!DRY_RUN && ops > 0) {
    await batch.commit();
    console.log('✅ Committed.');
  }
} finally {
  fs.unlinkSync(tempAdcPath);
}
