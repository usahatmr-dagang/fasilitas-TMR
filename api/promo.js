import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDRPLoFws3I_JoagIKpdj28JSX4hw_DvUk",
    authDomain: "fasilitas-tmr.firebaseapp.com",
    projectId: "fasilitas-tmr",
    storageBucket: "fasilitas-tmr.firebasestorage.app",
    messagingSenderId: "905355425334",
    appId: "1:905355425334:web:71aa3289c7cb54e1a60a97"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
    // Pengaturan CORS agar bisa diakses oleh web app dari domain lain
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
        // Mengambil data dari collection 'promoList' (Promo)
        const q = query(collection(db, 'promoList'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({
            success: true,
            total: data.length,
            data: data
        });
    } catch (error) {
        console.error("Error fetching promo data:", error);
        
        // Fallback query tanpa orderBy jika index belum dibuat di Firebase
        if (error.message.includes('index')) {
            try {
                const querySnapshot = await getDocs(collection(db, 'promoList'));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                return res.status(200).json({
                    success: true,
                    total: data.length,
                    data: data
                });
            } catch (fallbackError) {
                return res.status(500).json({ success: false, error: fallbackError.message });
            }
        }

        res.status(500).json({ success: false, error: error.message });
    }
}
