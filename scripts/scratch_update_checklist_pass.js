const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '.agents', 'memory', 'Audit Checklist.md');
let content = fs.readFileSync(filePath, 'utf8');

// Replace PENDING with PASS for UX-033, 034, 036
content = content.replace(/@ID:P2-UX-033(.*?)@STAT:🟡PENDING(.*?)@EV:/g, '@ID:P2-UX-033$1@STAT:🟢PASS$2@EV:Verified; implemented memoryCache for checkout data | ');
content = content.replace(/@ID:P2-UX-034(.*?)@STAT:🟡PENDING(.*?)@EV:/g, '@ID:P2-UX-034$1@STAT:🟢PASS$2@EV:Verified; increased search limit to 5000 and used memoryCache | ');
content = content.replace(/@ID:P2-UX-036(.*?)@STAT:🟡PENDING(.*?)@EV:/g, '@ID:P2-UX-036$1@STAT:🟢PASS$2@EV:Verified; added rootMargin 400px to IntersectionObserver | ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated Audit Checklist.md to PASS for UX-033, UX-034, UX-036');
