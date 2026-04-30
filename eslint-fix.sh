#!/bin/bash
cd dh-frontend

# 1. FloatingMessenger.jsx
sed -i 's/import React, { useState, useRef, useEffect } from '"'"'react'"'"';/import React, { useState, useRef } from '"'"'react'"'"';/g' src/components/chat/FloatingMessenger.jsx
sed -i 's/const \[isSearching, setIsSearching\] = useState(false);/const [isSearching, setIsSearching] = useState(false);/g' src/components/chat/FloatingMessenger.jsx
sed -i 's/const error = null;/\/\/ const error = null;/g' src/components/chat/FloatingMessenger.jsx

# 2. CheckoutForms.jsx
sed -i 's/import { Briefcase, CreditCard, UploadCloud, Icon } from '"'"'lucide-react'"'"';/import { Briefcase, CreditCard, UploadCloud } from '"'"'lucide-react'"'"';/g' src/components/checkout/CheckoutForms.jsx

# 3. PrivilegeSelector.jsx
sed -i 's/setIsLoading(false);/\/\/ setIsLoading(false);/g' src/components/checkout/PrivilegeSelector.jsx

# 4. TabAdManager.jsx
sed -i 's/import { collection, query, getDocs, doc, updateDoc, setDoc, serverTimestamp }/import { collection, query, getDocs, doc, setDoc, serverTimestamp }/g' src/components/profile/tabs/TabAdManager.jsx
sed -i 's/const \[previewError, setPreviewError\] = useState('"'"''"'"');/\/\/ const [previewError, setPreviewError] = useState('"'"''"'"');/g' src/components/profile/tabs/TabAdManager.jsx

# 5. TabHistory.jsx
sed -i 's/import { collection, query, where, orderBy, getDocs, doc, updateDoc }/import { collection, query, orderBy, getDocs, doc, updateDoc }/g' src/components/profile/tabs/TabHistory.jsx

# 6. TabUserSku.jsx
sed -i 's/import { collection, query, where, orderBy, getDocs, doc, writeBatch, serverTimestamp }/import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp }/g' src/components/profile/tabs/TabUserSku.jsx

# 7. TabWallet.jsx
sed -i 's/const \[activeTab, setActiveTab\] = useState('"'"'wallet'"'"');/\/\/ const [activeTab, setActiveTab] = useState('"'"'wallet'"'"');/g' src/components/profile/tabs/TabWallet.jsx

# 8. partnerService.js
sed -i '/try {/,/throw error;/d' src/firebase/partnerService.js
sed -i '/return await getDocs(q);/!b;n;c\    return await getDocs(q);' src/firebase/partnerService.js
