import https from 'https';

const projectId = 'dh-notebook-69f3b';
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products`;

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
  console.log("Fetching all products...");
  const res = await request(baseUrl + "?pageSize=1000", { method: 'GET' });
  const docs = res.data?.documents || [];
  console.log(`Found ${docs.length} products.`);

  let cleanedCount = 0;

  for (const doc of docs) {
    const fields = doc.fields || {};
    const sku = doc.name.split('/').pop();

    if (fields.compatiblePartNumbers && fields.compatiblePartNumbers.arrayValue && fields.compatiblePartNumbers.arrayValue.values) {
      const parts = fields.compatiblePartNumbers.arrayValue.values;
      
      let needsMigration = false;
      let newParts = [];

      for (const p of parts) {
        const val = p.stringValue;
        // UUIDs contain hyphens and are long (36 chars typically).
        // If it's longer than 30 chars and contains a hyphen, it's garbage.
        if (val && val.length > 30 && val.includes('-')) {
          needsMigration = true;
          console.log(`[${sku}] Removing garbage UUID: ${val.substring(0, 20)}...`);
        } else {
          newParts.push(p);
        }
      }

      if (needsMigration) {
        console.log(`Updating product ${sku}...`);
        
        const url = `${baseUrl}/${sku}?updateMask.fieldPaths=compatiblePartNumbers`;
        
        const payload = {
          fields: {
            compatiblePartNumbers: { arrayValue: { values: newParts } }
          }
        };

        const patchRes = await request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }, JSON.stringify(payload));
        if (patchRes.statusCode === 200) {
          console.log(`✅ Successfully cleaned product ${sku}`);
          cleanedCount++;
        } else {
          console.error(`❌ Failed to clean product ${sku}:`, patchRes.data);
        }
      }
    }
  }
  console.log(`Cleanup complete. Cleaned ${cleanedCount} products.`);
}

migrate().catch(console.error);
