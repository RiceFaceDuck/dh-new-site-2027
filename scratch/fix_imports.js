const fs = require('fs');
const path = require('path');
const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-frontend', 'dh-backoffice-react', 'dh-staff-app'];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['node_modules', 'dist', '.git', 'build'].includes(file)) processDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Fix import { \n import { getCollectionPath
            const regex1 = /import\s*\{\s*\n*import\s*\{\s*getCollectionPath\s*\}\s*from\s*'dh-shared\/src\/firebase\/pathUtils';\n*/g;
            if (regex1.test(content)) {
                content = content.replace(regex1, 'import { \n');
                content = "import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';\n" + content;
            }

            // Fix import {\r\nimport { getCollectionPath
            const regex2 = /import\s*\{\s*\r\n*import\s*\{\s*getCollectionPath\s*\}\s*from\s*'dh-shared\/src\/firebase\/pathUtils';\r\n*/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, 'import { \n');
                content = "import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';\n" + content;
            }
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}
apps.forEach(app => processDirectory(path.join(rootDir, app)));
