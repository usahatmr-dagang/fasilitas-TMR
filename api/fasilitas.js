import { initializeApp, getApps, getApp } from 'firebase/app';
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

function transformSewaDoc(doc) {
    const d = doc.data();
    const transactions = [];

    const rawTotal = Number(d.total_biaya) || 0;
    const hasBuktiLokasi = Boolean(d.buktiTransferDocUrl || d.bukti_transfer);
    const hasBuktiListrik = Boolean(d.buktiTransferListrikDocUrl || d.bukti_transfer_listrik);

    const biayaListrik = 100000;
    // Jika fasilitas memiliki listrik tambahan dan bukti listrik terpisah, nominal lokasi dipisahkan (karena ada 2 transaksi mutasi bank terpisah).
    // Jika bukti listrik tidak terpisah (dibayar sekaligus dalam satu transfer), nominal lokasi tetap utuh total_biaya.
    const biayaLokasi = (d.listrik_tambahan && hasBuktiListrik)
        ? Math.max(0, rawTotal - biayaListrik)
        : rawTotal;

    const tglLokasi = normalizeDate(d.tanggal_transfer) || normalizeDate(d.tanggal_sewa);
    const tglListrik = normalizeDate(d.tanggal_transfer_listrik) || tglLokasi;
    const tglSewa = normalizeDate(d.tanggal_sewa) || '';
    const luasLahan = Number(d.luas_lahan) || 0;

    // Transaksi 1: Sewa Lokasi / Fasilitas Utama
    if (hasBuktiLokasi || d.status_pembayaran === 'Sudah Transfer' || d.tanggal_transfer || rawTotal > 0) {
        transactions.push({
            ...d,
            id: hasBuktiListrik ? `${doc.id}_lokasi` : doc.id,
            docId: doc.id,
            id_sewa: d.id_sewa || doc.id,
            source: 'Fasilitas',
            tipe_transaksi: 'Sewa Fasilitas',
            kategori: 'Pemakaian Fasilitas',
            nama_penyewa: d.nama_penyewa || '-',
            pic_rombongan: d.pic_rombongan || '-',
            lokasi_sewa: d.lokasi_sewa || '-',
            tanggal_sewa: tglSewa,
            tanggalPemakaian: tglSewa,
            luas_lahan: luasLahan,
            keterangan_transaksi: `Sewa Lokasi: ${d.lokasi_sewa || '-'} (${d.nama_penyewa || '-'})`,
            keterangan: d.keterangan || d.catatan || '',
            detail_lokasi: d.detail_lokasi || '',
            jumlahTransfer: biayaLokasi,
            jumlahTransferNumeric: biayaLokasi,
            tanggal_transfer: tglLokasi,
            tanggalTransfer: tglLokasi,
            buktiTransferUrl: d.buktiTransferDocUrl || d.bukti_transfer || null,
            buktiTransferDocUrl: d.buktiTransferDocUrl || null,
            status_pembayaran: d.status_pembayaran || 'Sudah Transfer',
            listrik_tambahan: d.listrik_tambahan || false
        });
    }

    // Transaksi 2: Listrik Tambahan
    if (hasBuktiListrik) {
        transactions.push({
            ...d,
            id: `${doc.id}_listrik`,
            docId: doc.id,
            id_sewa: d.id_sewa ? `${d.id_sewa}-LST` : `${doc.id}-LST`,
            source: 'Fasilitas',
            tipe_transaksi: 'Listrik Tambahan',
            kategori: 'Listrik Tambahan',
            nama_penyewa: d.nama_penyewa || '-',
            pic_rombongan: d.pic_rombongan || '-',
            lokasi_sewa: d.lokasi_sewa || '-',
            tanggal_sewa: tglSewa,
            tanggalPemakaian: tglSewa,
            luas_lahan: 0,
            keterangan_transaksi: `Listrik Tambahan: ${d.lokasi_sewa || '-'} (${d.nama_penyewa || '-'})`,
            keterangan: d.keterangan || d.catatan || '',
            detail_lokasi: d.detail_lokasi || '',
            jumlahTransfer: biayaListrik,
            jumlahTransferNumeric: biayaListrik,
            tanggal_transfer: tglListrik,
            tanggalTransfer: tglListrik,
            buktiTransferUrl: d.buktiTransferListrikDocUrl || d.bukti_transfer_listrik,
            buktiTransferDocUrl: d.buktiTransferListrikDocUrl || null,
            status_pembayaran: d.status_pembayaran || 'Sudah Transfer',
            listrik_tambahan: true
        });
    }

    return transactions;
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

        const querySnapshot = await getDocs(collection(db, 'sewaList'));
        
        const dateFilter = req.query.date ? normalizeDate(req.query.date) : null;

        let allTransactions = [];
        querySnapshot.docs.forEach(doc => {
            allTransactions.push(...transformSewaDoc(doc));
        });

        if (dateFilter && dateFilter !== 'semua' && dateFilter !== 'all') {
            allTransactions = allTransactions.filter(item => item.tanggal_transfer === dateFilter);
        }

        res.status(200).json({ success: true, total: allTransactions.length, data: allTransactions });
    } catch (error) {
        console.error("Error fetching fasilitas data:", error);
        
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
