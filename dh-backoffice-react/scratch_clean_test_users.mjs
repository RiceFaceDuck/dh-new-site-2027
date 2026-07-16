import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function clean() {
    try {
        console.log("Logging in as AI Manager...");
        await signInWithEmailAndPassword(auth, 'ai.manager@dhnotebook.com', 'Password123!');
        console.log("Logged in successfully.");

        console.log("=== SCANNING FOR TEST/BUGGY ACCOUNTS TO SYNC ===");
        
        const snap = await getDocs(collection(db, 'users'));
        const toDelete = [];
        
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const name = data.accountName || data.displayName || data.name || data.firstName || '';
            const email = data.email || '';
            
            const isFantasy = name.includes('Fantasy');
            const isTest = name.includes('TEST') || name.includes('test');
            const isUnknown = name.includes('Unknown') || name === '';
            const isPMS = name === 'PMS';
            const isDH1Admin2 = name.includes('Admin2'); 
            const isNumberName = name === '0994578458';

            // We include already deleted ones to force updatedAt bump
            if (isFantasy || isTest || isUnknown || isPMS || isDH1Admin2 || isNumberName) {
                toDelete.push({
                    id: docSnap.id,
                    name: name,
                    email: email,
                    customerCode: data.customerCode || data.accountId || 'N/A'
                });
            }
        });

        console.log(`Found ${toDelete.length} accounts to bump updatedAt:`);
        toDelete.forEach(u => {
            console.log(`- ${u.name} (ID: ${u.id}, Code: ${u.customerCode}, Email: ${u.email})`);
        });

        console.log("\n=== FORCING SYNC WITH FRONTEND ===");
        let successCount = 0;
        for (const u of toDelete) {
            try {
                await updateDoc(doc(db, 'users', u.id), {
                    status: 'deleted',
                    isActive: false,
                    updatedAt: serverTimestamp()
                });
                console.log(`Force Synced: ${u.id}`);
                successCount++;
            } catch (err) {
                console.error(`Failed to force sync ${u.id}:`, err.message);
            }
        }
        
        console.log(`=== DONE: Synced ${successCount} accounts ===`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

clean();
