import fs from 'fs';
import path from 'path';

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-backoffice-react', 'dh-frontend', 'dh-staff-app', 'dh-shared'];

const stats = {
  useMemo: 0,
  useCallback: 0,
  reactMemo: 0,
  reactLazy: 0,
  dynamicImport: 0,
  imageLazy: 0,
  largeFiles: [],
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
      
      const lines = content.split('\n').length;
      if (lines > 300) {
        stats.largeFiles.push({ file: fullPath.replace(rootDir, ''), lines });
      }

      const useMemoMatches = content.match(/useMemo\(/g);
      if (useMemoMatches) stats.useMemo += useMemoMatches.length;

      const useCallbackMatches = content.match(/useCallback\(/g);
      if (useCallbackMatches) stats.useCallback += useCallbackMatches.length;

      const reactMemoMatches = content.match(/React\.memo|memo\(/g);
      if (reactMemoMatches) stats.reactMemo += reactMemoMatches.length;

      const reactLazyMatches = content.match(/React\.lazy|lazy\(/g);
      if (reactLazyMatches) stats.reactLazy += reactLazyMatches.length;

      const dynamicImportMatches = content.match(/import\(/g);
      if (dynamicImportMatches) stats.dynamicImport += dynamicImportMatches.length;

      const imageLazyMatches = content.match(/loading=["']lazy["']/gi);
      if (imageLazyMatches) stats.imageLazy += imageLazyMatches.length;
    }
  }
}

apps.forEach(app => scanDir(path.join(rootDir, app)));

// Sort large files
stats.largeFiles.sort((a, b) => b.lines - a.lines);

console.log('=== Performance Audit Stats ===');
console.log('Hooks & Memoization:');
console.log(`- useMemo: ${stats.useMemo}`);
console.log(`- useCallback: ${stats.useCallback}`);
console.log(`- React.memo: ${stats.reactMemo}`);
console.log('\nLazy Loading & Splitting:');
console.log(`- React.lazy / lazy(): ${stats.reactLazy}`);
console.log(`- dynamic import(): ${stats.dynamicImport}`);
console.log(`- loading="lazy": ${stats.imageLazy}`);

console.log('\nLarge Files (>300 lines) which may need splitting:');
stats.largeFiles.slice(0, 15).forEach(f => console.log(`- ${f.file}: ${f.lines} lines`));

// Check Vite Configs
console.log('\n=== Vite Config Check ===');
apps.forEach(app => {
  const vitePath = path.join(rootDir, app, 'vite.config.js');
  const viteTsPath = path.join(rootDir, app, 'vite.config.ts');
  let configPath = null;
  if (fs.existsSync(vitePath)) configPath = vitePath;
  else if (fs.existsSync(viteTsPath)) configPath = viteTsPath;
  
  if (configPath) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const hasManualChunks = content.includes('manualChunks');
    const hasVisualizer = content.includes('rollup-plugin-visualizer');
    console.log(`[${app}] manualChunks: ${hasManualChunks}, visualizer: ${hasVisualizer}`);
  }
});
