const fs = require('fs');
const path = require('path');

const dirs = [
  'dh-frontend/src',
  'dh-backoffice-react/src'
];

function findFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findFiles(filePath, files);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      files.push(filePath);
    }
  }
  return files;
}

const allFiles = dirs.flatMap(dir => findFiles(dir));

const regexCollection = /collection\(\s*([^,]+),\s*['"`]artifacts['"`],\s*[^,]+,\s*['"`]public['"`],\s*['"`]data['"`],\s*([^)]+)\)/g;
const regexDoc = /doc\(\s*([^,]+),\s*['"`]artifacts['"`],\s*[^,]+,\s*['"`]public['"`],\s*['"`]data['"`],\s*([^,]+),\s*([^)]+)\)/g;

let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace collection(db, 'artifacts', appId, 'public', 'data', 'colName') -> collection(db, getCollectionPath('colName'))
  content = content.replace(regexCollection, "collection($1, getCollectionPath($2))");
  
  // Replace doc(db, 'artifacts', appId, 'public', 'data', 'colName', 'docId') -> doc(db, getCollectionPath('colName'), $3)
  content = content.replace(regexDoc, "doc($1, getCollectionPath($2), $3)");

  if (content !== originalContent) {
    if (!content.includes('getCollectionPath')) {
       // Need to import
       content = "import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';\n" + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
    modifiedCount++;
  }
}

console.log(`\nModified ${modifiedCount} files.`);
