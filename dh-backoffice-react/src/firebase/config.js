// นำเข้า functions ที่จำเป็นจาก Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // [UPDATE] เพิ่ม GoogleAuthProvider และ Persistence
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ข้อมูล Config จาก Firestore Project settings (DH New Site)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "dh-notebook-69f3b.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "dh-notebook-69f3b",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "713635574580",
  appId: env.VITE_FIREBASE_APP_ID || "1:713635574580:web:8d60ac45a28d5938972b61",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-2L7Q326K4S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
let appCheck;
if (typeof window !== "undefined") {
   
  if (env.VITE_RECAPTCHA_SITE_KEY && env.VITE_RECAPTCHA_SITE_KEY !== 'your-recaptcha-site-key') {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn("App Check is skipped because VITE_RECAPTCHA_SITE_KEY is missing or invalid.");
  }
}

// Initialize Services (Export ไปใช้งานใน Service อื่นๆ ของ Backoffice)
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider(); // [UPDATE] Export ตัวแปร googleProvider สำหรับ Login

// Analytics
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
