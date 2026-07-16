const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'dh-frontend', 'src');
let replacedCount = 0;

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('object-cover')) {
                // Replace object-cover with object-contain
                const newContent = content.replace(/object-cover/g, 'object-contain');
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    replacedCount++;
                    console.log(`Replaced in ${path.relative(__dirname, fullPath)}`);
                }
            }
        }
    }
}

walkDir(FRONTEND_DIR);
console.log(`Done. Replaced object-cover in ${replacedCount} files.`);
