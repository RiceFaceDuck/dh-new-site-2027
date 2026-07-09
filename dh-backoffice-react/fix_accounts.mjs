import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
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

async function fixPendingAccounts() {
    try {
        console.log("Logging in as AI Manager...");
        await signInWithEmailAndPassword(auth, 'ai.manager@dhnotebook.com', 'Password123!');
        console.log("Logged in successfully.");

        const emails = ['dh2notebook@gmail.com', 'kik.love.tan2021@gmail.com'];
        console.log(`Querying for accounts: ${emails.join(', ')}`);

        const q = query(collection(db, 'users'), where('email', 'in', emails));
        const snap = await getDocs(q);

        if (snap.empty) {
            console.log("No accounts found with these emails.");
            return;
        }

        console.log(`Found ${snap.size} accounts. Updating...`);
        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            console.log(`- Found ${data.email} (Current Role: ${data.role || 'none'})`);
            
            await updateDoc(doc(db, 'users', docSnap.id), {
                role: 'pending_approval',
                isApproved: false,
                isStaff: false,
                isActive: false
            });
            console.log(`  -> Updated ${data.email} to pending_approval!`);
        }
        
        console.log("Done fixing accounts.");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

fixPendingAccounts();
