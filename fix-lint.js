const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Fix FloatingMessenger.jsx
replaceInFile('dh-frontend/src/components/chat/FloatingMessenger.jsx', /import React, { useState, useRef, useEffect } from 'react';/, "import React, { useState, useRef } from 'react';");
replaceInFile('dh-frontend/src/components/chat/FloatingMessenger.jsx', /const \[isSearching, setIsSearching\] = useState\(false\);/, "// const [isSearching, setIsSearching] = useState(false);");
replaceInFile('dh-frontend/src/components/chat/FloatingMessenger.jsx', /const error = null;/, "// const error = null;");

// Fix CheckoutForms.jsx
replaceInFile('dh-frontend/src/components/checkout/CheckoutForms.jsx', /import { Briefcase, CreditCard, UploadCloud, Icon } from 'lucide-react';/, "import { Briefcase, UploadCloud } from 'lucide-react';");

// Fix PrivilegeSelector.jsx - we need to skip it for now or do a careful replace
replaceInFile('dh-frontend/src/components/checkout/PrivilegeSelector.jsx', /setIsLoading\(false\);\n      return;/, "return;");

// Fix TabAdManager.jsx
replaceInFile('dh-frontend/src/components/profile/tabs/TabAdManager.jsx', /import { collection, query, getDocs, doc, updateDoc, setDoc, serverTimestamp }/, "import { collection, query, getDocs, doc, setDoc, serverTimestamp }");
replaceInFile('dh-frontend/src/components/profile/tabs/TabAdManager.jsx', /const \[previewError, setPreviewError\] = useState\(''\);/, "// const [previewError, setPreviewError] = useState('');");

// Fix TabHistory.jsx
replaceInFile('dh-frontend/src/components/profile/tabs/TabHistory.jsx', /import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase\/firestore';/, "import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';");

// Fix TabUserSku.jsx
replaceInFile('dh-frontend/src/components/profile/tabs/TabUserSku.jsx', /import { collection, query, where, orderBy, getDocs, doc, writeBatch, serverTimestamp } from 'firebase\/firestore';/, "import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';");

// Fix TabWallet.jsx
replaceInFile('dh-frontend/src/components/profile/tabs/TabWallet.jsx', /const \[activeTab, setActiveTab\] = useState\('wallet'\);/, "// const [activeTab, setActiveTab] = useState('wallet');");

// Fix checkoutService.js
replaceInFile('dh-frontend/src/firebase/checkoutService.js', /      shippingAddress,\n      contactPhone,\n      paymentMethod,\n/, "      // shippingAddress,\n      // contactPhone,\n      // paymentMethod,\n");
replaceInFile('dh-frontend/src/firebase/checkoutService.js', /const cartRef = doc\(db, 'artifacts', appId, 'users', userId, 'cart', 'data'\);/, "// const cartRef = doc(db, 'artifacts', appId, 'users', userId, 'cart', 'data');");

// Fix partnerService.js
replaceInFile('dh-frontend/src/firebase/partnerService.js', /    try {\n      return await getDocs\(q\);\n    } catch \(error\) {\n      throw error;\n    }/, "    return await getDocs(q);");

console.log('Linting errors fixed.');
