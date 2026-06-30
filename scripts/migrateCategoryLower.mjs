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
  
  let docs = [];
  let nextPageToken = null;
  
  do {
    let url = baseUrl + "?pageSize=300";
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }
    const res = await request(url, { method: 'GET' });
    if (res.data?.documents) {
      docs = docs.concat(res.data.documents);
    }
    nextPageToken = res.data?.nextPageToken;
  } while (nextPageToken);
  
  console.log(`Found ${docs.length} products.`);

  let updatedCount = 0;

  for (const doc of docs) {
    const fields = doc.fields || {};
    const sku = doc.name.split('/').pop();
    
    const category = fields.category?.stringValue;
    const currentCategoryLower = fields.category_lower?.stringValue;
    
    if (category) {
      const expectedCategoryLower = category.trim().toLowerCase();
      
      if (currentCategoryLower !== expectedCategoryLower) {
        console.log(`Updating product ${sku}: category_lower -> ${expectedCategoryLower}`);
        
        const url = `${baseUrl}/${sku}?updateMask.fieldPaths=category_lower`;
        
        const payload = {
          fields: {
            category_lower: { stringValue: expectedCategoryLower }
          }
        };

        const patchRes = await request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }, JSON.stringify(payload));
        if (patchRes.statusCode === 200) {
          updatedCount++;
        } else {
          console.error(`❌ Failed to update product ${sku}:`, patchRes.data);
        }
      }
    }
  }
  
  console.log(`Migration complete. Updated ${updatedCount} products.`);
}

migrate().catch(console.error);
