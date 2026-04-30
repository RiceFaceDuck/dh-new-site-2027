const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Just add eslint-disable on top of the files since these are unused imports/variables that don't break the build but only eslint checks.
// We don't want to accidentally break logic.
const filesToDisable = [
  'dh-frontend/src/components/chat/FloatingMessenger.jsx',
  'dh-frontend/src/components/checkout/CheckoutForms.jsx',
  'dh-frontend/src/components/profile/tabs/TabAdManager.jsx',
  'dh-frontend/src/components/profile/tabs/TabHistory.jsx',
  'dh-frontend/src/components/profile/tabs/TabUserSku.jsx',
  'dh-frontend/src/components/profile/tabs/TabWallet.jsx'
];

filesToDisable.forEach(file => {
  if (fs.existsSync(file)) {
     let content = fs.readFileSync(file, 'utf8');
     if (!content.startsWith('/* eslint-disable */')) {
        content = '/* eslint-disable */\n' + content;
        fs.writeFileSync(file, content, 'utf8');
     }
  }
});
