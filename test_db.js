import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
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
    const q = query(collection(db, 'sewaList'), orderBy('createdAt', 'desc'));
    let snap;
    try {
        snap = await getDocs(q);
    } catch(e) {
        console.error("Index error, fetching without orderBy");
        snap = await getDocs(collection(db, 'sewaList'));
    }
    const data = snap.docs.map(doc => {
       const d = doc.data();
       return { 
           id: doc.id,
           ...d,
           jumlahTransfer: d.total_biaya,
           buktiTransferUrl: d.buktiTransferDocUrl || d.bukti_transfer 
       };
    }).filter(item => item.buktiTransferUrl);
    
    console.log("Found:", data.length);
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}
run();
