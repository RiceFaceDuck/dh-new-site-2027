import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

// Read config from dh-backoffice-react/src/firebase/config.js
// We can't easily import it because of JSX/Vite, so we will just read the file and extract the config object
const configContent = fs.readFileSync("c:/DH Notebook/Management System/dh-backoffice-react/src/firebase/config.js", "utf-8");

// Extract the firebaseConfig object using a regex
const match = configContent.match(/const firebaseConfig = ({[\s\S]*?});/);
if (match) {
  const configObjString = match[1]
    .replace(/import\.meta\.env\.VITE_FIREBASE_[A-Z_]+/g, '""'); // dummy replace if env vars are used
    
  // Actually, wait, if env vars are used, we can't connect without them.
  // Let's check how config.js is written first.
} else {
  console.log("No config found");
}
