import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61",
  measurementId: "G-WN1STHEG7N"
};

// ✨ เช็คก่อนว่าเคย Initialize Firebase ไปหรือยัง ป้องกัน Error เวลาระบบ Hot Reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✨ เปิดใช้งาน Offline Persistence (Caching) ช่วยลดค่า Reads และจำข้อมูลลงเครื่องพนักงาน
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();