import { initializeApp, getApps, getApp } from 'firebase/app';
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // Login sebagai "Sistem API" agar lolos dari Firebase Rules (request.auth != null)
        const email = process.env.FIREBASE_API_EMAIL || "api_service@ragunan.com";
        const password = process.env.FIREBASE_API_PASSWORD || "SandiApiRahasia123!";
        
        await signInWithEmailAndPassword(auth, email, password);

        // Mengambil data karena sekarang kita sudah dianggap "Admin yang login"
        const q = query(collection(db, 'sewaList'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, total: data.length, data });
    } catch (error) {
        console.error("Error fetching fasilitas data:", error);
        
        if (error.message.includes('auth/')) {
            return res.status(401).json({ 
                success: false, 
                error: "Gagal login API. Pastikan Anda sudah membuat akun email dan password ini di Firebase Authentication.",
                detail: error.message
            });
        }

        if (error.message.includes('index')) {
            try {
                const querySnapshot = await getDocs(collection(db, 'sewaList'));
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return res.status(200).json({ success: true, total: data.length, data });
            } catch (fallbackError) {
                return res.status(500).json({ success: false, error: fallbackError.message });
            }
        }

        res.status(500).json({ success: false, error: error.message });
    }
}
