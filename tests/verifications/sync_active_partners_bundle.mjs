// Re-syncs catalogs/active_partners_bundle directly from live ActivePartners collection.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '../../functions/package.json'));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tempAdcPath = path.join(os.tmpdir(), `dh_sync_adc_${Date.now()}.json`);
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
  console.log('🔄 Fetching current ActivePartners collection...');
  const apSnap = await db.collection('ActivePartners').get();
  const validPartners = [];

  for (const doc of apSnap.docs) {
    const p = doc.data() || {};
    // Check points and isActive
    const points = Number(p.points || 0);
    const isActive = p.isActive !== false;
    if (isActive && points > 0) {
      validPartners.push({
        id: doc.id,
        partnerId: p.partnerId || doc.id,
        storeName: p.storeName || p.partnerName || 'ร้านช่างพาร์ทเนอร์',
        partnerName: p.partnerName || p.storeName || 'ร้านช่างพาร์ทเนอร์',
        services: p.services || '',
        phone: p.phone || '',
        messengerUrl: p.messengerUrl || '',
        lineUrl: p.lineUrl || '',
        googleMapLink: p.googleMapLink || p.googleMapsUrl || '',
        latitude: Number(p.latitude || 0),
        longitude: Number(p.longitude || 0),
        storeImage: p.storeImage || p.imageUrl || p.photoURL || '',
        imageUrl: p.imageUrl || p.storeImage || p.photoURL || '',
        address: p.address || '',
        landmarks: p.landmarks || '',
        openHours: p.openHours || '',
        points: points,
        viewsCount: Number(p.viewsCount || p.visitCount || 0),
        isVerified: p.isVerified === true,
        isActive: true
      });
    } else {
      console.log(`⚠️ Skipped partner ${doc.id} (${p.storeName}): isActive=${p.isActive}, points=${points}`);
    }
  }

  console.log(`\nFound ${validPartners.length} active partners with valid credit.`);
  validPartners.forEach((vp, idx) => {
    console.log(`  ${idx + 1}. [${vp.id}] ${vp.storeName} (points: ${vp.points})`);
  });

  const bundlePayload = {
    chunkId: 'active_partners_bundle',
    type: 'ACTIVE_PARTNERS_BUNDLE',
    totalActivePartners: validPartners.length,
    bundledCount: validPartners.length,
    updatedAt: FieldValue.serverTimestamp(),
    generatedAt: FieldValue.serverTimestamp(),
    items: validPartners
  };

  const bundleRef = db.collection('catalogs').doc('active_partners_bundle');
  await bundleRef.set(bundlePayload, { merge: true });
  console.log('\n✅ Successfully updated catalogs/active_partners_bundle in Firestore!');

} finally {
  try { fs.unlinkSync(tempAdcPath); } catch (e) {}
}
