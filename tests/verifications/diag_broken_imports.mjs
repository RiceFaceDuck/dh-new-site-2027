import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '../../..');
const MGMT_SYS = path.resolve(REPO_ROOT, 'Management System');

const PACKAGES = [
  { name: 'dh-backoffice-react', dir: path.resolve(MGMT_SYS, 'dh-backoffice-react') },
  { name: 'dh-frontend', dir: path.resolve(MGMT_SYS, 'dh-frontend') },
  { name: 'dh-staff-app', dir: path.resolve(MGMT_SYS, 'dh-staff-app') },
  { name: 'functions', dir: path.resolve(MGMT_SYS, 'functions') },
  { name: 'dh-shared', dir: path.resolve(MGMT_SYS, 'dh-shared') },
];

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const RESOLVE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.svg', '.png', '.jpg', '.webp', '.mjs', '.cjs'];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.firebase', '_Backups'].includes(entry.name)) {
        continue;
      }
      getAllFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function resolveTarget(sourceFile, specifier, pkgDir) {
  let targetBase;
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    targetBase = path.resolve(path.dirname(sourceFile), specifier);
  } else if (specifier.startsWith('@/')) {
    targetBase = path.resolve(pkgDir, 'src', specifier.slice(2));
  } else if (specifier === 'dh-shared') {
    targetBase = path.resolve(MGMT_SYS, 'dh-shared');
  } else if (specifier.startsWith('dh-shared/')) {
    targetBase = path.resolve(MGMT_SYS, 'dh-shared', specifier.slice('dh-shared/'.length));
  } else {
    // external or node_modules
    return { type: 'external' };
  }

  // Check exact
  if (fs.existsSync(targetBase) && fs.statSync(targetBase).isFile()) {
    return { type: 'resolved', path: targetBase };
  }

  // Check with extensions
  for (const ext of RESOLVE_EXTENSIONS) {
    const testPath = targetBase + ext;
    if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
      return { type: 'resolved', path: testPath };
    }
  }

  // Check directory index
  if (fs.existsSync(targetBase) && fs.statSync(targetBase).isDirectory()) {
    for (const ext of RESOLVE_EXTENSIONS) {
      const testIndex = path.join(targetBase, 'index' + ext);
      if (fs.existsSync(testIndex) && fs.statSync(testIndex).isFile()) {
        return { type: 'resolved', path: testIndex };
      }
    }
    // Check package.json main if exists
    const pkgJson = path.join(targetBase, 'package.json');
    if (fs.existsSync(pkgJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
        const main = pkg.main || pkg.module || 'index.js';
        const mainPath = path.resolve(targetBase, main);
        if (fs.existsSync(mainPath)) return { type: 'resolved', path: mainPath };
        for (const ext of RESOLVE_EXTENSIONS) {
          if (fs.existsSync(mainPath + ext)) return { type: 'resolved', path: mainPath + ext };
        }
      } catch (e) {}
    }
  }

  return { type: 'missing', attempted: targetBase };
}

function extractExports(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = new Set();
  let hasDefaultExport = false;

  // regex based extraction
  // export default ...
  if (/export\s+default\s+/m.test(content)) {
    hasDefaultExport = true;
  }

  // export const/let/var/function/class name
  const declRegex = /export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/gm;
  let m;
  while ((m = declRegex.exec(content)) !== null) {
    exports.add(m[1]);
  }

  // export { a, b as c, ... }
  const namedRegex = /export\s*\{([^}]+)\}/gm;
  while ((m = namedRegex.exec(content)) !== null) {
    const raw = m[1];
    const parts = raw.split(',');
    for (const part of parts) {
      const clean = part.trim();
      if (!clean) continue;
      if (clean.includes(' as ')) {
        const alias = clean.split(/\s+as\s+/)[1].trim();
        exports.add(alias);
      } else {
        exports.add(clean);
      }
    }
  }

  // module.exports = ...
  if (/module\.exports\s*=\s*/m.test(content)) {
    hasDefaultExport = true;
  }
  // exports.foo = ...
  const cjsNamed = /exports\.([a-zA-Z0-9_$]+)\s*=/gm;
  while ((m = cjsNamed.exec(content)) !== null) {
    exports.add(m[1]);
  }

  return { exports, hasDefaultExport, rawContent: content };
}

function parseImports(content) {
  const lines = content.split('\n');
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Static imports: import ... from '...'
    const staticImportMatch = line.match(/(?:import|export)\s+(?:(\*\s+as\s+[a-zA-Z0-9_$]+|{[^}]+}|[a-zA-Z0-9_$]+(?:\s*,\s*\{[^}]+\})?)\s+from\s+)?['"]([^'"]+)['"]/);
    if (staticImportMatch) {
      const importedClause = staticImportMatch[1] ? staticImportMatch[1].trim() : null;
      const specifier = staticImportMatch[2];
      results.push({ lineNum, line: line.trim(), specifier, importedClause, isDynamic: false });
      continue;
    }

    // Dynamic imports: import('...')
    const dynamicMatch = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (dynamicMatch) {
      results.push({ lineNum, line: line.trim(), specifier: dynamicMatch[1], importedClause: null, isDynamic: true });
      continue;
    }

    // require('...')
    const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      results.push({ lineNum, line: line.trim(), specifier: requireMatch[1], importedClause: null, isDynamic: false });
      continue;
    }
  }

  return results;
}

function runDiagnostic() {
  console.log('=== STARTING BROKEN IMPORTS & MISSING FILES SCAN ===\n');

  const allBrokenImports = [];
  const allMissingExports = [];
  let totalFilesScanned = 0;
  let totalImportsChecked = 0;

  for (const pkg of PACKAGES) {
    console.log(`Scanning package: ${pkg.name} (${pkg.dir})`);
    if (!fs.existsSync(pkg.dir)) {
      console.log(`  [WARN] Package directory does not exist: ${pkg.dir}`);
      continue;
    }

    const files = getAllFiles(pkg.dir);
    console.log(`  Found ${files.length} source files.`);
    totalFilesScanned += files.length;

    for (const file of files) {
      let content;
      try {
        content = fs.readFileSync(file, 'utf-8');
      } catch (err) {
        console.error(`  Error reading file ${file}: ${err.message}`);
        continue;
      }

      const imports = parseImports(content);
      totalImportsChecked += imports.length;

      for (const imp of imports) {
        const resolved = resolveTarget(file, imp.specifier, pkg.dir);
        if (resolved.type === 'missing') {
          allBrokenImports.push({
            package: pkg.name,
            file,
            relativeFile: path.relative(MGMT_SYS, file),
            lineNum: imp.lineNum,
            lineText: imp.line,
            specifier: imp.specifier,
            attempted: path.relative(MGMT_SYS, resolved.attempted)
          });
        } else if (resolved.type === 'resolved' && imp.importedClause) {
          // Check named exports if possible
          // Parse importedClause: e.g. "{ a, b as c }" or "DefaultComp, { a, b }" or "DefaultComp"
          const clause = imp.importedClause;
          const targetExports = extractExports(resolved.path);
          if (targetExports) {
            // Check default import
            const defaultMatch = clause.match(/^([a-zA-Z0-9_$]+)(?:\s*,\s*\{|\s*$)/);
            if (defaultMatch) {
              const defName = defaultMatch[1];
              if (defName !== 'type' && !targetExports.hasDefaultExport && !targetExports.exports.has('default')) {
                // Warning: missing default export
                // Note: in commonjs or re-exported libraries, might be dynamic, so check if export exists
                allMissingExports.push({
                  package: pkg.name,
                  file,
                  relativeFile: path.relative(MGMT_SYS, file),
                  lineNum: imp.lineNum,
                  lineText: imp.line,
                  importedName: 'default (' + defName + ')',
                  targetFile: path.relative(MGMT_SYS, resolved.path),
                  availableExports: Array.from(targetExports.exports)
                });
              }
            }

            // Check named imports: {...}
            const namedMatch = clause.match(/\{([^}]+)\}/);
            if (namedMatch) {
              const items = namedMatch[1].split(',').map(s => s.trim()).filter(Boolean);
              for (const item of items) {
                // item can be "a" or "a as b" or "type a"
                const cleanItem = item.replace(/^type\s+/, '').trim();
                const origName = cleanItem.split(/\s+as\s+/)[0].trim();
                if (!targetExports.exports.has(origName)) {
                  // Double check if file has export * from ... or dynamic exports
                  const hasExportStar = /export\s+\*\s+from/m.test(targetExports.rawContent);
                  if (!hasExportStar) {
                    allMissingExports.push({
                      package: pkg.name,
                      file,
                      relativeFile: path.relative(MGMT_SYS, file),
                      lineNum: imp.lineNum,
                      lineText: imp.line,
                      importedName: origName,
                      targetFile: path.relative(MGMT_SYS, resolved.path),
                      availableExports: Array.from(targetExports.exports)
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('\n=== SCAN SUMMARY ===');
  console.log(`Total Source Files Scanned: ${totalFilesScanned}`);
  console.log(`Total Imports Checked: ${totalImportsChecked}`);
  console.log(`Broken Imports (Target File Missing): ${allBrokenImports.length}`);
  console.log(`Missing Named/Default Exports: ${allMissingExports.length}\n`);

  if (allBrokenImports.length > 0) {
    console.log('--- BROKEN IMPORTS (TARGET MISSING) ---');
    for (const b of allBrokenImports) {
      console.log(`[BROKEN_IMPORT] ${b.relativeFile}:${b.lineNum}`);
      console.log(`  Import: "${b.specifier}" in line: ${b.lineText}`);
      console.log(`  Attempted path: ${b.attempted}`);
    }
    console.log('');
  }

  if (allMissingExports.length > 0) {
    console.log('--- MISSING EXPORTS ---');
    for (const m of allMissingExports) {
      console.log(`[MISSING_EXPORT] ${m.relativeFile}:${m.lineNum}`);
      console.log(`  Imported: "${m.importedName}" from ${m.targetFile}`);
      console.log(`  Line: ${m.lineText}`);
      console.log(`  Available in target: [${m.availableExports.slice(0, 10).join(', ')}${m.availableExports.length > 10 ? '...' : ''}]`);
    }
    console.log('');
  }

  const resultObj = {
    totalFilesScanned,
    totalImportsChecked,
    brokenImports: allBrokenImports,
    missingExports: allMissingExports
  };

  const outJsonPath = path.resolve(__dirname, 'diag_broken_imports_result.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(resultObj, null, 2));
  console.log(`Results saved to: ${outJsonPath}`);
}

runDiagnostic();
