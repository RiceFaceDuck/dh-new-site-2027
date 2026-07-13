const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'dh-frontend', 'src');

const stats = {
  totalFiles: 0,
  framerMotion: 0,
  loadingIndicators: 0,
  errorHandling: 0,
  toastUsage: 0,
  lazyImages: 0,
  missingAltTags: 0,
  ariaAttributes: 0,
  responsiveClasses: 0,
  hardcodedColors: 0,
  complexComponents: 0, // > 300 lines
};

const issues = [];

function analyzeFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js') && !filePath.endsWith('.css')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  stats.totalFiles++;

  const fileName = path.basename(filePath);
  const relativePath = path.relative(srcDir, filePath);

  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    if (content.includes('framer-motion')) stats.framerMotion++;
    if (content.match(/<Spinner|<Loader|<Skeleton|isLoading/i)) stats.loadingIndicators++;
    else if (filePath.includes('pages/') && !content.match(/<Spinner|<Loader|<Skeleton|isLoading/i)) {
      issues.push(`Possible missing loading state in ${relativePath}`);
    }

    if (content.match(/toast\.error|ErrorBoundary|catch\s*\(/)) stats.errorHandling++;
    if (content.includes('toast.')) stats.toastUsage++;

    // Image analysis
    const imgTags = content.match(/<img[^>]+>/g) || [];
    imgTags.forEach(img => {
      if (img.includes('loading="lazy"')) stats.lazyImages++;
      if (!img.includes('alt=')) {
        stats.missingAltTags++;
        issues.push(`Missing alt tag in <img> at ${relativePath}`);
      }
    });

    if (content.includes('aria-')) stats.ariaAttributes++;
    
    // Check for hardcoded inline colors (bad for dark mode / theming)
    if (content.match(/style={{[^}]*color:\s*['"]#[0-9a-fA-F]{3,6}['"][^}]*}}/)) {
      stats.hardcodedColors++;
      issues.push(`Hardcoded inline color in ${relativePath}`);
    }

    if (lines.length > 300) {
      stats.complexComponents++;
      issues.push(`Complex component (>300 lines): ${relativePath} (${lines.length} lines). Might be hard to maintain or cause lag.`);
    }
  }

  if (filePath.endsWith('.css') || filePath.endsWith('.jsx')) {
    if (content.match(/\bsm:|\bmd:|\blg:|\bxl:/)) stats.responsiveClasses++;
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else {
      analyzeFile(fullPath);
    }
  }
}

traverse(srcDir);

console.log(JSON.stringify({ stats, issues: issues.slice(0, 50) }, null, 2));
console.log(`Total issues found: ${issues.length}`);
