const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const targetFiles = [
  'customerSyncService.js',
  'walletFunctions.js',
  'purgeOldSlips.js',
  'AdCard.jsx',
  'useAdManager.js',
  'slipStorageService.js',
  'ssr memory cloud_functions.md',
  'ssr memory security_audit.md'
];

if (fs.existsSync(historyDir)) {
  const folders = fs.readdirSync(historyDir);
  console.log(`Scanning ${folders.length} history folders...`);
  
  for (const folder of folders) {
    const entryJsonPath = path.join(historyDir, folder, 'entries.json');
    if (fs.existsSync(entryJsonPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(entryJsonPath, 'utf8'));
        const fileUri = data.resource || '';
        const fileName = path.basename(fileUri);
        
        if (targetFiles.includes(fileName) || fileName.includes('customerSyncService')) {
          console.log(`\nFOUND: ${fileUri}`);
          console.log(`Folder: ${folder}`);
          const entries = data.entries || [];
          if (entries.length > 0) {
            // Get the most recent entry
            const latest = entries[entries.length - 1];
            console.log(`Latest entry ID: ${latest.id}, Timestamp: ${new Date(latest.timestamp).toISOString()}`);
            
            // Output to a recovery folder
            const recoverDir = "C:\\_DH Notebook\\Management System\\recovered_history";
            if (!fs.existsSync(recoverDir)) fs.mkdirSync(recoverDir, { recursive: true });
            
            const sourcePath = path.join(historyDir, folder, latest.id);
            const destPath = path.join(recoverDir, fileName);
            fs.copyFileSync(sourcePath, destPath);
            console.log(`-> Copied to ${destPath}`);
          }
        }
      } catch(e) {}
    }
  }
  console.log("Done scanning.");
} else {
  console.log("History dir not found.");
}
