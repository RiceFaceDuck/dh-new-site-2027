const fs = require('fs');
const execSync = require('child_process').execSync;

const txt = fs.readFileSync('dh-frontend/lint_frontend_fixed2.txt', 'utf8');
const files = new Set();
let currentFile = '';
txt.split('\n').forEach(line => {
  if (line.startsWith('C:\\')) {
    currentFile = line.trim();
  } else if (line.includes('react/jsx-no-undef')) {
    files.add(currentFile);
  }
});

const editedFiles = [
  'dh-frontend\\src\\firebase\\authService.js',
  'dh-frontend\\src\\firebase\\featuredQueryService.js',
  'dh-frontend\\src\\hooks\\useAdInjection.js',
  'dh-frontend\\src\\hooks\\useCartLogic.js',
  'dh-frontend\\src\\components\\checkout\\hooks\\useCheckoutLogic.js',
  'dh-frontend\\src\\components\\product\\ProductCommunitySection.jsx',
  'dh-frontend\\src\\components\\profile\\tabs\\store-profile\\StoreProfileLocation.jsx',
  'dh-frontend\\src\\context\\CartProvider.jsx',
  'dh-frontend\\src\\pages\\AdProductDetail\\AdProductDetail.jsx'
];

const toRestore = Array.from(files).filter(f => !editedFiles.some(edited => f.includes(edited)));
toRestore.forEach(f => {
  console.log('Restoring:', f);
  try {
    execSync(`git checkout -- "${f}"`);
  } catch (e) {
    console.error('Failed to restore ' + f);
  }
});
console.log('Done restoring ' + toRestore.length + ' files');
