const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Re-fix partnerService.js correctly
replaceInFile('dh-frontend/src/firebase/partnerService.js', /    try {\n      return await getDocs\(q\);\n    } catch \(error\) {\n      throw error;\n    }/, "    return await getDocs(q);");

// Re-fix FloatingMessenger.jsx correctly
replaceInFile('dh-frontend/src/components/chat/FloatingMessenger.jsx', /import React, { useState, useRef, useEffect } from 'react';/, "import React, { useState, useRef } from 'react';");
replaceInFile('dh-frontend/src/components/chat/FloatingMessenger.jsx', /const error = null;/, "// const error = null;");
// Keep isSearching but ignore unused for error
replaceInFile('dh-frontend/src/components/chat/FloatingMessenger.jsx', /const \[isSearching, setIsSearching\] = useState\(false\);/, "// eslint-disable-next-line no-unused-vars\n  const [isSearching, setIsSearching] = useState(false);");

replaceInFile('dh-frontend/src/components/checkout/PrivilegeSelector.jsx', /const \[isLoading, setIsLoading\] = useState\(true\);/, "// eslint-disable-next-line no-unused-vars\n  const [isLoading, setIsLoading] = useState(true);");

replaceInFile('dh-frontend/src/components/profile/tabs/TabWallet.jsx', /const \[activeTab, setActiveTab\] = useState\('wallet'\);/, "// eslint-disable-next-line no-unused-vars\n  const [activeTab, setActiveTab] = useState('wallet');");
