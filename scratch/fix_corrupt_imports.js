const fs = require('fs'); 
const path = require('path'); 
const apps = ['dh-frontend', 'dh-backoffice-react', 'dh-staff-app']; 

function processDirectory(dir) { 
    if (!fs.existsSync(dir)) return; 
    const files = fs.readdirSync(dir); 
    for (const file of files) { 
        const fullPath = path.join(dir, file); 
        const stat = fs.statSync(fullPath); 
        if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== '.git') { 
            processDirectory(fullPath); 
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) { 
            let content = fs.readFileSync(fullPath, 'utf8'); 
            if (content.includes('import {\nimport { getCustomerDisplayName')) { 
                console.log('Fixing ' + fullPath); 
                content = content.replace("import {\nimport { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';\n", "import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';\nimport {\n"); 
                fs.writeFileSync(fullPath, content, 'utf8'); 
            } else if (content.includes('import {\r\nimport { getCustomerDisplayName')) { 
                console.log('Fixing ' + fullPath); 
                content = content.replace("import {\r\nimport { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';\r\n", "import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';\r\nimport {\r\n"); 
                fs.writeFileSync(fullPath, content, 'utf8'); 
            } 
        } 
    } 
} 

apps.forEach(app => processDirectory(path.join('c:\\DH Notebook\\Management System', app, 'src'))); 
console.log('Done fixing imports again.');
