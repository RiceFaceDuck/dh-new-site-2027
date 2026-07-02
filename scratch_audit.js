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
  
  // Rule 1: getDocs inside loops
  if (content.match(/for\s*\(.*?\)\s*\{[^}]*getDocs/s) || content.match(/\.map\(\s*.*?\=\>.*getDocs/s)) {
    issues.push('getDocs inside loop (potential N+1 problem)');
  }
  
  // Rule 2: updateDoc inside loops
  if (content.match(/for\s*\(.*?\)\s*\{[^}]*updateDoc/s) || content.match(/\.map\(\s*.*?\=\>.*updateDoc/s)) {
    issues.push('updateDoc inside loop (should use batch writes)');
  }

  // Rule 3: onSnapshot without unsubscribe
  if (content.includes('onSnapshot') && !content.includes('unsubscribe')) {
    issues.push('onSnapshot used without unsubscribe variable');
  }

  // Rule 4: getDocs without limit (rough check)
  if (content.includes('getDocs(') && !content.includes('limit(')) {
    issues.push('getDocs used without limit()');
  }

  if (issues.length > 0) {
    console.log(`\nFile: ${file}`);
    issues.forEach(i => console.log(` - ${i}`));
  }
}

const targetDirs = [
  path.join(__dirname, 'dh-backoffice-react', 'src'),
  path.join(__dirname, 'dh-frontend', 'src')
];

let pendingDirs = targetDirs.length;
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir, function(err, results) {
      if (err) throw err;
      results.forEach(analyzeFile);
      if (!--pendingDirs) {
        console.log('\nAudit complete.');
      }
    });
  } else {
    pendingDirs--;
  }
});
