// นำเข้า functions ที่จำเป็นจาก Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth"; // [UPDATE] เพิ่ม GoogleAuthProvider และ Persistence
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ข้อมูล Config จาก Firestore Project settings (DH New Site)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
let appCheck;
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-undef
  if (import.meta.env.VITE_RECAPTCHA_SITE_KEY && import.meta.env.VITE_RECAPTCHA_SITE_KEY !== 'your-recaptcha-site-key') {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn("App Check is skipped because VITE_RECAPTCHA_SITE_KEY is missing or invalid.");
  }
}

// Initialize Services (Export ไปใช้งานใน Service อื่นๆ ของ Backoffice)
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
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