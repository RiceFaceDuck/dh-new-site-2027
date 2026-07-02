import https from 'https';

const projectId = 'dh-notebook-69f3b';
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;

const generateAccountId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

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
  console.log("Fetching all users for customerCode migration...");
  const res = await request(baseUrl, { method: 'GET' });
  const docs = res.data.documents || [];
  console.log(`Found ${docs.length} users.`);

  let usersToUpdate = [];

  for (const doc of docs) {
    const fields = doc.fields || {};
    const uid = doc.name.split('/').pop();
    
    const accountId = fields.accountId?.stringValue || '';
    const customerCode = fields.customerCode?.stringValue || '';

    // If they have a customerCode, they need migration (we want to eradicate customerCode completely)
    if (customerCode) {
      let newAccountId = accountId;
      let reason = '';

      if (!accountId) {
        if (!customerCode.startsWith('DH-UID-') && customerCode.length === 8) {
           newAccountId = customerCode; // Promote good customerCode to accountId
           reason = `Promote customerCode '${customerCode}' to accountId`;
        } else {
           newAccountId = generateAccountId(); // Generate new standard ID
           reason = `Generate new accountId '${newAccountId}' (replacing legacy '${customerCode}')`;
        }
      } else {
        reason = `Delete redundant customerCode '${customerCode}' (accountId is '${accountId}')`;
      }

      usersToUpdate.push({
        uid,
        newAccountId,
        reason
      });
    } else if (!accountId) {
      // Missing both! Generate a new one.
      const newAccountId = generateAccountId();
      usersToUpdate.push({
        uid,
        newAccountId,
        reason: `Missing both IDs. Generated new accountId '${newAccountId}'`
      });
    }
  }

  console.log(`\nFound ${usersToUpdate.length} users needing migration.`);
  
  if (usersToUpdate.length > 0) {
    console.log("\n--- DRY RUN PREVIEW ---");
    usersToUpdate.forEach(u => console.log(`[${u.uid}] ${u.reason}`));
    console.log("-----------------------\n");
    
    const isDryRun = process.argv.includes('--execute') ? false : true;

    if (isDryRun) {
      console.log("To execute this migration, run: node scripts/migrateCustomerCodes.mjs --execute");
    } else {
      console.log("EXECUTING MIGRATION...");
      let successCount = 0;
      let errorCount = 0;

      for (const u of usersToUpdate) {
        const updateMask = ['accountId', 'customerCode'];
        let url = `${baseUrl}/${u.uid}?`;
        updateMask.forEach(mask => url += `updateMask.fieldPaths=${encodeURIComponent(mask)}&`);

        const payload = {
          fields: {
            accountId: { stringValue: u.newAccountId }
            // Omit customerCode to let Firestore delete it
          }
        };

        const patchRes = await request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }, JSON.stringify(payload));
        if (patchRes.statusCode === 200) {
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Failed to update ${u.uid}:`, patchRes.data);
        }
      }

      console.log(`\nMigration complete! Success: ${successCount}, Errors: ${errorCount}`);
    }
  }
}

migrate().catch(console.error);
