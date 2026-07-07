import fs from 'fs';
import path from 'path';

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-backoffice-react', 'dh-frontend', 'dh-staff-app', 'dh-shared'];

const stats = {
  memoryCache: 0,
  indexedDB: 0,
  onSnapshot: 0,
  getDocs: 0,
  reactQuery: 0
};

const exts = ['.js', '.jsx', '.ts', '.tsx'];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (exts.includes(path.extname(fullPath))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const memoryCacheMatches = content.match(/memoryCache/g);
      if (memoryCacheMatches) stats.memoryCache += memoryCacheMatches.length;
      
      const indexedDBMatches = content.match(/indexedDB/gi);
      if (indexedDBMatches) stats.indexedDB += indexedDBMatches.length;

      const onSnapshotMatches = content.match(/onSnapshot\(/g);
      if (onSnapshotMatches) stats.onSnapshot += onSnapshotMatches.length;

      const getDocsMatches = content.match(/getDocs\(/g);
      if (getDocsMatches) stats.getDocs += getDocsMatches.length;

      const reactQueryMatches = content.match(/useQuery\(/g);
      if (reactQueryMatches) stats.reactQuery += reactQueryMatches.length;
    }
  }
}

apps.forEach(app => scanDir(path.join(rootDir, app)));

console.log('=== Caching & Firebase Stats ===');
console.log(`- memoryCache usage: ${stats.memoryCache}`);
console.log(`- indexedDB usage: ${stats.indexedDB}`);
console.log(`- onSnapshot (Real-time): ${stats.onSnapshot}`);
console.log(`- getDocs (One-time fetch): ${stats.getDocs}`);
console.log(`- React Query (useQuery): ${stats.reactQuery}`);
