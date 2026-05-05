const fs = require('fs');

let file1 = 'dh-frontend/src/pages/Checkout.jsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace('let orderId;', '');
content1 = content1.replace('orderId = await submitOrder', 'await submitOrder');
content1 = content1.replace('orderId = await createWholesaleRequest', 'await createWholesaleRequest');
fs.writeFileSync(file1, content1);
