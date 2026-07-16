const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '.agents', 'memory', 'Audit Checklist.md');
let content = fs.readFileSync(targetPath, 'utf8');

// The files we just fixed
const fixedFiles = [
    'dh-frontend/src/firebase/checkout/checkoutOrderActionService.js',
    'dh-frontend/src/firebase/checkout/checkoutWholesaleService.js',
    'dh-frontend/src/firebase/credit/creditActionService.js'
];

let changed = false;

fixedFiles.forEach(file => {
    // Look for lines that look like: - [ ] `dh-frontend/...` 🔴 
    const regex = new RegExp(`- \\[ \\] \`?${file.replace(/\//g, '\\\\?/')}\`?(.*)`, 'g');
    if (regex.test(content)) {
        content = content.replace(regex, `- [x] \`${file}\`$1 ✅ (Wrapped runTransaction/async in try/catch to prevent silent failures)`);
        changed = true;
    }
});

// Also update the global status for Frontend Checkout
const sectionRegex = /(### 🛒 หมวด Frontend Checkout \n\n)([\s\S]*?)(?=\n### )/;
const match = content.match(sectionRegex);
if (match) {
    let section = match[2];
    if (!section.includes('- [ ]')) {
        // All done in this section, we can update the status badge if it exists
        // Wait, it might be easier to just leave it as is if it doesn't have a badge
    }
}

if (changed) {
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log("Successfully updated Audit Checklist.md");
} else {
    console.log("No matching lines found to update in Audit Checklist.md");
}
