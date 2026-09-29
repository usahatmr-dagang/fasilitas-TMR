import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDRPLoFws3I_JoagIKpdj28JSX4hw_DvUk",
    authDomain: "fasilitas-tmr.firebaseapp.com",
    projectId: "fasilitas-tmr",
    storageBucket: "fasilitas-tmr.firebasestorage.app",
    messagingSenderId: "905355425334",
    appId: "1:905355425334:web:71aa3289c7cb54e1a60a97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
    await signInWithEmailAndPassword(auth, "api_service@ragunan.com", "SandiApiRahasia123!");
    const snap = await getDocs(collection(db, 'sewaList'));
    const doc = snap.docs.find(d => d.data().nama_penyewa === 'rombongan tes aja');
    if (doc) console.log(JSON.stringify(doc.data(), null, 2));
    process.exit(0);
}
run();
