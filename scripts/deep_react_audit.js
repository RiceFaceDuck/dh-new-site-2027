const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

function analyzeFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  let issues = [];
  
  // Find all useEffect bodies
  const useEffects = content.match(/useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[.*?\]\s*\)/g) || [];
  
  useEffects.forEach(effect => {
    // Check for subscriptions
    const hasOnSnapshot = effect.includes('onSnapshot(') || effect.includes('.subscribe') || effect.includes('subscribeTo');
    const hasSetInterval = effect.includes('setInterval(');
    const hasSetTimeout = effect.includes('setTimeout(');
    const hasAddEventListener = effect.includes('addEventListener(');
    
    // Check for cleanup
    const hasCleanup = effect.includes('return () =>') || effect.includes('return function') || effect.includes('return unsubscribe') || effect.includes('return unsub');

    if (hasOnSnapshot && !hasCleanup) {
      issues.push('Missing Cleanup: Subscription inside useEffect without return cleanup function.');
    }
    if (hasSetInterval && !hasCleanup) {
      issues.push('Missing Cleanup: setInterval inside useEffect without return cleanup function.');
    }
    if (hasSetTimeout && !hasCleanup) {
      // setTimeout might not always need cleanup, but good practice
      issues.push('Missing Cleanup: setTimeout inside useEffect without return cleanup function.');
    }
    if (hasAddEventListener && !hasCleanup) {
      issues.push('Missing Cleanup: addEventListener inside useEffect without return cleanup function.');
    }
  });

  if (issues.length > 0) {
    issues = [...new Set(issues)];
    console.log(`\n📄 ${file.replace(__dirname, '')}`);
    issues.forEach(i => console.log(`  - 🔴 ${i}`));
  }
}

const targetDirs = [
  path.join(__dirname, '..', 'dh-backoffice-react', 'src'),
  path.join(__dirname, '..', 'dh-frontend', 'src'),
  path.join(__dirname, '..', 'dh-staff-app', 'src')
];

let pendingDirs = targetDirs.length;
console.log('🔍 Starting Deep React Audit...');
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir, function(err, results) {
      if (err) throw err;
      results.forEach(analyzeFile);
      if (!--pendingDirs) {
        console.log('\n✅ React Audit Complete.');
      }
    });
  } else {
    pendingDirs--;
  }
});
