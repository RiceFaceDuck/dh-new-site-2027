// นำเข้า functions ที่จำเป็นจาก Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// ข้อมูล Config จาก Firestore Project settings (DH New Site)
// Hardcode ค่าลงไปเพื่อป้องกันปัญหาตัวแปร .env หายตอน Deploy ขึ้น Production
const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61",
  measurementId: "G-WN1STHEG7N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services (Export ไปใช้งานใน Service อื่นๆ)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (จะทำงานได้ดีเมื่ออยู่บน Production)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;