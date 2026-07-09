import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, onSnapshot, getDoc } from "firebase/firestore";
import fs from "fs";

const env = fs.readFileSync(".env.production", "utf8");
const config = {};
env.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) config[key.trim()] = val.trim();
});

const app = initializeApp({
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID
});

const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Logging in...");
    const userCredential = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Logged in as:", userCredential.user.uid);
    
    console.log("Fetching user profile...");
    const userRef = doc(db, "users", userCredential.user.uid);
    const snap = await getDoc(userRef);
    console.log("Exists:", snap.exists());
    if (snap.exists()) {
      console.log("Data:", snap.data());
    }

    console.log("Setting up snapshot listener...");
    onSnapshot(userRef, (docSnap) => {
      console.log("Snapshot received! Exists:", docSnap.exists());
      process.exit(0);
    }, (err) => {
      console.error("Snapshot error:", err);
      process.exit(1);
    });

  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
