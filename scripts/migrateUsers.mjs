import https from 'https';

const projectId = 'dh-notebook-69f3b';
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;

// Helper to make https requests using promises
const request = (url, options, bodyData = null) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
};

async function migrate() {
  console.log("Fetching all users...");
  const res = await request(baseUrl, { method: 'GET' });
  const docs = res.data.documents || [];
  console.log(`Found ${docs.length} users.`);

  for (const doc of docs) {
    const fields = doc.fields || {};
    const uid = doc.name.split('/').pop();

    // Read legacy points
    const cp1 = Number(fields.creditPoints?.integerValue || fields.creditPoints?.doubleValue || 0);
    const cp2 = Number(fields.creditPoint?.integerValue || fields.creditPoint?.doubleValue || 0);
    const cp3 = Number(fields.partnerCredit?.integerValue || fields.partnerCredit?.doubleValue || 0);
    const cp4 = Number(fields.stats?.mapValue?.fields?.creditBalance?.integerValue || fields.stats?.mapValue?.fields?.creditBalance?.doubleValue || 0);
    const cp5 = Number(fields.financials?.mapValue?.fields?.credit?.integerValue || fields.financials?.mapValue?.fields?.credit?.doubleValue || 0);

    const highestPoints = Math.max(cp1, cp2, cp3, cp4, cp5);

    // Read legacy wallet
    const w1 = Number(fields.walletBalance?.integerValue || fields.walletBalance?.doubleValue || 0);
    const w2 = Number(fields.stats?.mapValue?.fields?.currentWallet?.integerValue || fields.stats?.mapValue?.fields?.currentWallet?.doubleValue || 0);
    const w3 = Number(fields.financials?.mapValue?.fields?.wallet?.integerValue || fields.financials?.mapValue?.fields?.wallet?.doubleValue || 0);

    const highestWallet = Math.max(w1, w2, w3);

    // Check if migration is needed (if any legacy field exists, or if highest values differ from primary fields)
    const needsMigration = 
      (fields.creditPoint !== undefined) || 
      (fields.partnerCredit !== undefined) ||
      (fields.stats?.mapValue?.fields?.creditBalance !== undefined) ||
      (fields.stats?.mapValue?.fields?.currentWallet !== undefined) ||
      (fields.financials?.mapValue?.fields?.credit !== undefined) ||
      (fields.financials?.mapValue?.fields?.wallet !== undefined) ||
      (cp1 !== highestPoints) ||
      (w1 !== highestWallet);

    if (needsMigration) {
      console.log(`Migrating user ${uid}... Points -> ${highestPoints}, Wallet -> ${highestWallet}`);
      
      const updateMask = [
        'creditPoints', 
        'walletBalance', 
        'creditPoint', 
        'partnerCredit', 
        'stats.creditBalance', 
        'stats.currentWallet',
        'financials.credit',
        'financials.wallet'
      ];

      let url = `${baseUrl}/${uid}?`;
      updateMask.forEach(mask => url += `updateMask.fieldPaths=${encodeURIComponent(mask)}&`);

      // Prepare payload. We ONLY include creditPoints and walletBalance.
      // Since the others are in updateMask but NOT in the payload fields, Firestore will DELETE them!
      const payload = {
        fields: {
          creditPoints: { integerValue: String(highestPoints) },
          walletBalance: { integerValue: String(highestWallet) }
        }
      };

      const patchRes = await request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }, JSON.stringify(payload));
      if (patchRes.statusCode === 200) {
        console.log(`✅ Successfully migrated user ${uid}`);
      } else {
        console.error(`❌ Failed to migrate user ${uid}:`, patchRes.data);
      }
    } else {
      console.log(`Skipping user ${uid} (already normalized)`);
    }
  }
  console.log("Migration complete.");
}

migrate().catch(console.error);
