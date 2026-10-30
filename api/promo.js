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

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr !== 'string') return '';
    const cleanStr = dateStr.split(',')[0].trim().split(' ')[0].trim();
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return cleanStr;
}

function transformPromoDoc(doc) {
    const d = doc.data();
    const buktiUrl = d.buktiTransferUrl || d.bukti_transfer || d.buktiTransferDocUrl || null;

    const nominalNumeric = d.jumlahTransferNumeric || (typeof d.jumlahTransfer === 'string' ? Number(d.jumlahTransfer.replace(/[^0-9]/g, '')) : Number(d.jumlahTransfer)) || Number(d.totalBiaya || 0) || 0;
    const tgl = normalizeDate(d.tanggalTransfer || d.tanggal_transfer || d.createdAt);

    return {
        id: doc.id,
        docId: doc.id,
        source: 'Promo',
        tipe_transaksi: 'Promo & Event',
        kategori: 'Promo Penjualan Produk',
        nama_penyewa: d.namaPerusahaan || d.namaPenandaTangan || '-',
        namaPerusahaan: d.namaPerusahaan || '-',
        pic_rombongan: d.namaPenandaTangan || '-',
        namaProduk: d.namaProduk || '-',
        tanggalEvent: d.tanggalPromo || d.tanggalEvent || (Array.isArray(d.selectedDates) ? d.selectedDates.map(s => typeof s === 'object' ? s.date : s).join(', ') : '-'),
        jumlahHari: Number(d.jumlahHari) || (Array.isArray(d.selectedDates) ? d.selectedDates.length : 1),
        jumlahTitik: Number(d.jumlahTitik) || (d.titik ? Number(d.titik) : 1),
        jumlahBanner: Number(d.jumlahBanner) || Number(d.banner) || 0,
        jumlahSpanduk: Number(d.jumlahSpanduk) || Number(d.spanduk) || 0,
        lokasi_sewa: `Promo (${d.jumlahTitik || 1} Titik, ${d.jumlahBanner || 0} Banner)`,
        keterangan_transaksi: `Promo: ${d.namaProduk || '-'} (${d.namaPerusahaan || '-'})`,
        jumlahTransfer: nominalNumeric,
        jumlahTransferNumeric: nominalNumeric,
        tanggal_transfer: tgl,
        tanggalTransfer: tgl,
        buktiTransferUrl: buktiUrl,
        buktiTransferDocUrl: d.buktiTransferDocUrl || d.pksDriveUrl || null,
        status_pembayaran: d.status || 'Menunggu Verifikasi',
        keterangan: d.keterangan || d.catatan || '',
        ...d
    };
}

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

        let querySnapshot;
        try {
            const q = query(collection(db, 'promoList'), orderBy('createdAt', 'desc'));
            querySnapshot = await getDocs(q);
        } catch(e) {
            querySnapshot = await getDocs(collection(db, 'promoList'));
        }
        
        const dateFilter = req.query.date ? normalizeDate(req.query.date) : null;

        let data = querySnapshot.docs.map(transformPromoDoc).filter(Boolean);

        if (dateFilter && dateFilter !== 'semua' && dateFilter !== 'all') {
            data = data.filter(item => item.tanggalTransfer === dateFilter);
        }

        res.status(200).json({ success: true, total: data.length, data });
    } catch (error) {
        console.error("Error fetching promo data:", error);
        
        if (error.message.includes('auth/')) {
            return res.status(401).json({ 
                success: false, 
                error: "Gagal login API. Pastikan Anda sudah membuat akun email dan password ini di Firebase Authentication.",
                detail: error.message
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}
