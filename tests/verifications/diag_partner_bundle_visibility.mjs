// READ-ONLY diagnostic: compares catalogs/active_partners_bundle vs ActivePartners vs partner_ads (BUSINESS_CARD) vs owner credit.
// Usage (from Management System/functions): node ../tests/verifications/diag_partner_bundle_visibility.mjs
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import os from 'os';

const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tempAdcPath = path.join(os.tmpdir(), `dh_diag_adc_${Date.now()}.json`);
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
  const bundle = (await db.collection('catalogs').doc('active_partners_bundle').get()).data() || {};
  const items = bundle.items || [];
  const apSnap = await db.collection('ActivePartners').get();
  const ap = new Map(apSnap.docs.map(d => [d.id, d.data()]));
  const adsSnap = await db.collection('partner_ads').where('type', '==', 'BUSINESS_CARD').get();
  const adByOwner = new Map(adsSnap.docs.map(d => [d.data().ownerId, { id: d.id, ...d.data() }]));

  console.log(`bundle generatedAt=${bundle.generatedAt?.toDate?.()?.toISOString?.()} updatedAt=${bundle.updatedAt?.toDate?.()?.toISOString?.()} items=${items.length}`);
  console.log(`ActivePartners docs=${ap.size}`);
  const ids = new Set([...items.map(i => i.id || i.partnerId), ...ap.keys()]);
  for (const id of ids) {
    const it = items.find(i => (i.id || i.partnerId) === id);
    const a = ap.get(id);
    const ad = adByOwner.get(id);
    const u = (await db.collection('users').doc(id).get()).data() || {};
    console.log([
      (it?.storeName || a?.storeName || '?').slice(0, 40).padEnd(40),
      `inBundle=${!!it}`,
      `AP=${a ? (a.isActive === false ? 'inactive' : 'active') : 'none'}`,
      `ad=${ad ? `${ad.status}/${ad.isActive}` : 'none'}`,
      `credit=${u.creditPoints ?? 'n/a'}`,
      `AP.points=${a?.points ?? 'n/a'}`,
      `uid=${id}`
    ].join(' | '));
  }
} finally {
  fs.unlinkSync(tempAdcPath);
}
