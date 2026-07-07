import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

let serviceAccount;
try {
    serviceAccount = JSON.parse(fs.readFileSync('firebase-adminsdk.json', 'utf8'));
} catch (e) {
    // ignore
}

if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
} else {
    // Application default credentials or emulate
    initializeApp({ projectId: "dh-new-site-2027" });
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function auditOrders() {
    console.log("--- 🕵️‍♂️ AUDITING ORDERS (Last 100) ---");
    const snapshot = await db.collection("orders").orderBy("createdAt", "desc").limit(100).get();
    let inconsistentOrders = 0;
    let missingCustomers = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const { orderId, subTotal, netTotal, overallDiscount, promoDiscount, shippingFee, walletUsed, items, customer } = data;

        if (!customer || !customer.uid) {
            console.log(`❌ Order ${orderId} is missing customer.uid`);
            missingCustomers++;
        }

        if (items && Array.isArray(items)) {
            const calculatedSubTotal = items.reduce((sum, item) => sum + ((item.priceAtPurchase || 0) * (item.qty || 1)), 0);
            
            if (Math.abs(calculatedSubTotal - (subTotal || 0)) > 1) {
                console.log(`⚠️ Order ${orderId} subTotal mismatch! Stored: ${subTotal}, Calculated: ${calculatedSubTotal}`);
                inconsistentOrders++;
            }

            const calculatedNetTotal = (calculatedSubTotal || 0) 
                                     - (overallDiscount || 0) 
                                     - (promoDiscount || 0) 
                                     - (walletUsed || 0) 
                                     + (shippingFee || 0);

            if (Math.abs(calculatedNetTotal - (netTotal || 0)) > 1) {
                console.log(`⚠️ Order ${orderId} netTotal mismatch! Stored: ${netTotal}, Calculated: ${calculatedNetTotal}`);
                inconsistentOrders++;
            }
        }
    });

    console.log(`✅ Order Audit Complete. Inconsistencies: ${inconsistentOrders}, Missing Customers: ${missingCustomers}`);
}

async function auditCredits() {
    console.log("\n--- 🕵️‍♂️ AUDITING CREDITS (Sample 50 Users with points) ---");
    const usersSnap = await db.collection("users").where("creditPoints", ">", 0).limit(50).get();
    let inconsistentUsers = 0;

    for (const doc of usersSnap.docs) {
        const user = doc.data();
        const txSnap = await db.collection("credit_transactions").where("uid", "==", user.uid).get();
        
        let calculatedBalance = 0;
        txSnap.forEach(txDoc => {
            const tx = txDoc.data();
            if (tx.type === "deposit" || tx.type === "refund") calculatedBalance += tx.amount;
            if (tx.type === "spend") calculatedBalance -= tx.amount;
        });

        if (Math.abs(calculatedBalance - user.creditPoints) > 1) {
            console.log(`❌ User ${user.email} (${user.uid}) balance mismatch! Stored: ${user.creditPoints}, Calculated from TX: ${calculatedBalance}`);
            inconsistentUsers++;
        }
    }

    console.log(`✅ Credit Audit Complete. Inconsistent Users: ${inconsistentUsers}`);
}

async function run() {
    try {
        await auditOrders();
        await auditCredits();
        console.log("\n🚀 All audits finished.");
    } catch (e) {
        console.error("Audit Failed: ", e);
    }
}

run();
