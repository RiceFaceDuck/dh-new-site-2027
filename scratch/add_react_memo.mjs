import fs from 'fs';
import path from 'path';

const filesToWrap = [
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\cart\\CartItemCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-staff-app\\src\\components\\stock\\ProductCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\profile\\tabs\\components\\FavoriteItemCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\profile\\tabs\\history\\HistoryItemCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\inventory\\ProductTableRow.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\todo\\PaymentCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\todo\\ServiceTaskCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\managers\\category\\CategoryCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\components\\profile\\tabs\\ad-manager\\AdPreviewCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\todo\\cards\\AdApprovalCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\components\\todo\\manager\\cards\\FormalAdApprovalCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-frontend\\src\\pages\\Home\\components\\PartnerCard.jsx',
  'c:\\DH Notebook\\Management System\\dh-backoffice-react\\src\\pages\\managers\\components\\partners\\PartnerCard.jsx'
];

let modifiedCount = 0;

for (const filePath of filesToWrap) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if React.memo is already there
    if (!content.includes('React.memo(') && !content.includes('memo(')) {
      // Find export default ComponentName;
      // We look for export default \w+;
      const exportRegex = /export\s+default\s+([A-Za-z0-9_]+)\s*;/g;
      const match = exportRegex.exec(content);
      
      if (match) {
        const componentName = match[1];
        const newExport = `export default React.memo(${componentName});`;
        
        content = content.replace(exportRegex, newExport);
        
        // Also ensure React is imported if React.memo is used
        if (!content.includes('import React')) {
          content = `import React from 'react';\n` + content;
        } else if (!content.includes('React,')) {
           // It might be import { useState } from 'react'; 
           // but we'll assume import React is there or we can safely add it if needed.
           // Actually, since it's a React file, they usually have React imported or don't need it in React 17+. 
           // But React.memo requires React. Let's just do a naive check and hope they import React or we can just use memo.
           // Better to replace it with memo and import memo from 'react', but React.memo usually works if React is imported.
           // Let's check for "from 'react'"
           if (!content.includes("import React")) {
              content = content.replace(/import\s+{/, "import React, {");
           }
        }

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Wrapped with React.memo: ${filePath}`);
        modifiedCount++;
      }
    } else {
      console.log(`Already memoized or not matching: ${filePath}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}

console.log(`Total files memoized: ${modifiedCount}`);
