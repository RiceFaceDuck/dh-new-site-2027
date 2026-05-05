const fs = require('fs');

let file1 = 'dh-frontend/src/components/checkout/CheckoutSummary.jsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace('import { collection, onSnapshot, query } from \'firebase/firestore\';', 'import { collection, onSnapshot } from \'firebase/firestore\';');
fs.writeFileSync(file1, content1);

let file2 = 'dh-frontend/src/firebase/checkoutService.js';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace('import { doc, collection, runTransaction, writeBatch, serverTimestamp, addDoc } from \'firebase/firestore\';', 'import { doc, collection, runTransaction, writeBatch, serverTimestamp } from \'firebase/firestore\';');
fs.writeFileSync(file2, content2);
