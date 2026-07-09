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
            if (content.includes('getCustomerDisplayName') && !content.includes('import { getCustomerDisplayName }')) { 
                console.log('Fixing ' + fullPath); 
                const importStatement = "import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';\n"; 
                const lastImportIndex = content.lastIndexOf('import '); 
                
                if (lastImportIndex !== -1) { 
                    const endOfLastImport = content.indexOf('\n', lastImportIndex); 
                    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1); 
                } else { 
                    content = importStatement + content; 
                } 
                fs.writeFileSync(fullPath, content, 'utf8'); 
            } 
        } 
    } 
} 

apps.forEach(app => processDirectory(path.join('c:\\DH Notebook\\Management System', app, 'src'))); 
console.log('Done fixing imports.');
