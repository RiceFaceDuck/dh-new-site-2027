import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    projectId: "dh-notebook-69f3b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    const docRef = doc(db, "products", "TEST-4598");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
    } else {
        console.log("No such document!");
    }
    process.exit(0);
}
test();
