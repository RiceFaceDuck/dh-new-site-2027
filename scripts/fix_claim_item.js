const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'dh-frontend', 'src', 'components', 'profile', 'tabs', 'claims', 'ClaimItemCard.jsx');

let content = fs.readFileSync(file, 'utf8');

// Fix 1: Remove const { showToast } = useToast(); inside getClaimStatusDisplay
content = content.replace(/const getClaimStatusDisplay = \(status, type\) => {\s+const { showToast } = useToast\(\);\s+const isCancel/, 'const getClaimStatusDisplay = (status, type) => {\n  const isCancel');

// Fix 2: Remove toast.error
content = content.replace(/console\.error\("🔥 Error:", error\);\s+toast\.error\(error\?\.message \|\| "เกิดข้อผิดพลาด"\);\s+showToast\('เกิดข้อผิดพลาด: ' \+ error\.message, 'error'\);/, 'console.error("🔥 Error:", error);\n      showToast(\'เกิดข้อผิดพลาด: \' + error.message, \'error\');');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ClaimItemCard.jsx');
