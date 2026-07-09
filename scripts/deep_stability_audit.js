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
  
  // 1. React Memory Leaks / Missing Cleanups
  // Regex to extract useEffect block (greedy but restricted)
  const useEffects = content.match(/useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[.*?\]\s*\)/g) || [];
  useEffects.forEach(effect => {
    const hasOnSnapshot = effect.includes('onSnapshot(');
    const hasSetInterval = effect.includes('setInterval(');
    const hasAddEventListener = effect.includes('addEventListener(');
    const hasCleanup = effect.includes('return () =>') || effect.includes('return function');
    const hasUnsubscribe = effect.includes('unsubscribe') || effect.includes('unsub');

    if (hasOnSnapshot && !hasCleanup && !hasUnsubscribe) {
      issues.push('Possible Memory Leak: onSnapshot inside useEffect without cleanup function.');
    }
    if (hasSetInterval && !hasCleanup) {
      issues.push('Possible Memory Leak: setInterval inside useEffect without cleanup (clearInterval).');
    }
    if (hasAddEventListener && !hasCleanup) {
      issues.push('Possible Memory Leak: addEventListener inside useEffect without cleanup (removeEventListener).');
    }
  });

  // 2. Error Handling & Crashes
  // Regex to find async functions
  const asyncFuncs = content.match(/async\s+function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g) || 
                     content.match(/async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\}/g) || [];
  
  asyncFuncs.forEach(func => {
    // Check if there is an await but no try/catch
    if (func.includes('await ') && !func.includes('try {') && !func.includes('.catch(') && !func.includes('try{')) {
      issues.push('Missing Error Handling: async function with await but no try/catch block.');
    }
  });

  // Check JSON.parse without try/catch (only if not inside a try block)
  if (content.includes('JSON.parse(')) {
    if (!content.includes('try {') && !content.includes('try{')) {
       issues.push('Potential Crash: JSON.parse used without try/catch.');
    }
  }

  // 3. Firebase Resource Leaks
  if (content.includes('onSnapshot(')) {
    if (!content.includes('unsubscribe') && !content.includes('unsub')) {
      issues.push('Resource Leak: onSnapshot called but no unsubscribe/unsub variable found.');
    }
  }

  // Check runTransaction
  if (content.includes('runTransaction(')) {
     if (!content.includes('try {') && !content.includes('try{') && !content.includes('.catch(')) {
        issues.push('Missing Error Handling: runTransaction without try/catch or .catch().');
     }
  }

  if (issues.length > 0) {
    // Deduplicate
    issues = [...new Set(issues)];
    console.log(`\n📄 ${file.replace(__dirname, '')}`);
    issues.forEach(i => console.log(`  - 🔴 ${i}`));
  }
}

const targetDirs = [
  path.join(__dirname, '..', 'dh-backoffice-react', 'src'),
  path.join(__dirname, '..', 'dh-frontend', 'src'),
  path.join(__dirname, '..', 'dh-staff-app', 'src'),
  path.join(__dirname, '..', 'dh-shared', 'src')
];

let pendingDirs = targetDirs.length;
console.log('🔍 Starting Deep Stability Audit...');
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir, function(err, results) {
      if (err) throw err;
      results.forEach(analyzeFile);
      if (!--pendingDirs) {
        console.log('\n✅ Automated Audit Complete.');
      }
    });
  } else {
    pendingDirs--;
  }
});
