const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'dh-frontend', 'src');
let filesWithImg = [];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('<img')) {
                // Check if it has loading="lazy"
                const imgTags = content.match(/<img[^>]*>/g) || [];
                const unoptimized = imgTags.filter(tag => !tag.includes('loading="lazy"') && !tag.includes('loading={\'lazy\'}'));
                
                if (unoptimized.length > 0) {
                    filesWithImg.push({
                        file: fullPath.replace(__dirname, ''),
                        count: unoptimized.length,
                        tags: unoptimized
                    });
                }
            }
        }
    }
}

walkDir(srcDir);
console.log(JSON.stringify(filesWithImg, null, 2));
