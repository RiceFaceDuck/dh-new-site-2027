// One-off maintenance: purge paused / zombie partner documents from ActivePartners and catalogs/active_partners_bundle
// Target: 0AUxlnHivLdwa4gxTAGO9yWmhS82 (ช่างเบนท์ วังแดง / GHUE8VJZ) and any paused card ads
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '../../functions/package.json'));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const TARGET_UID = '0AUxlnHivLdwa4gxTAGO9yWmhS82';
const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tempAdcPath = path.join(os.tmpdir(), `dh_purge_adc_${Date.now()}.json`);
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
  console.log('🚀 Starting Partner Bundle & Zombie Cleanup...');

  // 1. Check & Delete ActivePartners/0AUxlnHivLdwa4gxTAGO9yWmhS82
  const apRef = db.collection('ActivePartners').doc(TARGET_UID);
  const apSnap = await apRef.get();
  if (apSnap.exists) {
    console.log(`🗑️ Deleting zombie document in ActivePartners for UID: ${TARGET_UID}`);
    await apRef.delete();
    console.log('✅ ActivePartners document deleted successfully.');
  } else {
    console.log(`ℹ️ No document found in ActivePartners for UID: ${TARGET_UID}`);
  }

  // 2. Clean up catalogs/active_partners_bundle
  const bundleRef = db.collection('catalogs').doc('active_partners_bundle');
  const bundleSnap = await bundleRef.get();
  if (bundleSnap.exists) {
    const bundleData = bundleSnap.data() || {};
    const items = Array.isArray(bundleData.items) ? bundleData.items : [];
    console.log(`📦 Current bundle items count: ${items.length}`);

    const filtered = items.filter(i => (i.id !== TARGET_UID && i.partnerId !== TARGET_UID));
    if (filtered.length !== items.length) {
      console.log(`🎯 Found and removed target partner ${TARGET_UID} from bundle. Remaining: ${filtered.length}`);
      await bundleRef.set({
        items: filtered,
        totalActivePartners: filtered.length,
        bundledCount: filtered.length,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('✅ catalogs/active_partners_bundle updated successfully in Firestore.');
    } else {
      console.log('ℹ️ Target partner was not found in bundle items.');
    }
  } else {
    console.log('⚠️ catalogs/active_partners_bundle not found.');
  }

  console.log('🎉 Cleanup finished successfully.');
} catch (error) {
  console.error('❌ Error during cleanup:', error);
} finally {
  try {
    if (fs.existsSync(tempAdcPath)) fs.unlinkSync(tempAdcPath);
  } catch (_) {}
}
