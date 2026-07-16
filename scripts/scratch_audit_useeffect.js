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
  
  // Find useEffect without dependency array
  // We can look for useEffect(() => { ... }) where there is no comma before the last parenthesis
  // Since regex for this is hard, we can just split by 'useEffect' and check the block.
  
  let chunks = content.split('useEffect(');
  for(let i=1; i<chunks.length; i++) {
     let chunk = chunks[i];
     // naive check: does this chunk have `,[something]` before the closing of useEffect?
     // Actually, it's easier to use a simple heuristic: if a file has useEffect and no `]` in the whole file, it's bad.
     // Better: let's just log potential issues manually.
  }

}
