const fs = require('fs');
const path = require('path');

const filesToFix = {
  'dh-backoffice-react/src/pages/GenerateSync/components/TemplateSettingsModal.jsx': [
    { search: "import('../../../firebase/historyService').then(({ historyService }) => {", replace: "import('../../../firebase/historyService').then(({ historyService }) => {" },
  ],
  'dh-backoffice-react/src/pages/claims/components/detail/ClaimDetailModal.jsx': [
    { search: "import('../../../../firebase/warrantyService').then(({ warrantyService }) => {", replace: "import('../../../../firebase/warrantyService').then(({ warrantyService }) => {"}
  ],
  'dh-frontend/src/components/cart/CartItemCard.jsx': [
    { search: "}).catch(console.error);\n      })\n    }", replace: "}).catch(console.error);\n      }).catch(console.error);\n    }" }
  ]
};

for (const [relPath, replaces] of Object.entries(filesToFix)) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    
    // For import().then() missing catch
    content = content.replace(/import\(([^)]+)\)\.then\(\(([^)]+)\)\s*=>\s*\{([\s\S]*?)\}\)(?!\.catch)/g, (match) => {
      return match + ".catch(console.error)";
    });

    // Special fix for CartItemCard
    content = content.replace(/}\)\.catch\(console\.error\);\n\s*}\)\.catch\(console\.error\);\n\s*}\)\n/g, 
        "}).catch(console.error);\n        }).catch(console.error);\n      }).catch(console.error);\n");

    if (content !== original) {
      fs.writeFileSync(fullPath, content);
      console.log('Fixed promises in', relPath);
    }
  }
}
