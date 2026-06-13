import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default function MigrateData() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const parseIndoDate = (dateStr) => {
    // format expected: DD/Bulan/YYYY (e.g., 13/Juni/2026)
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    
    let month = 1;
    if (mStr.includes('jan')) month = 1;
    else if (mStr.includes('feb')) month = 2;
    else if (mStr.includes('mar')) month = 3;
    else if (mStr.includes('apr')) month = 4;
    else if (mStr.includes('mei')) month = 5;
    else if (mStr.includes('jun')) month = 6;
    else if (mStr.includes('jul')) month = 7;
    else if (mStr.includes('agu')) month = 8;
    else if (mStr.includes('sep')) month = 9;
    else if (mStr.includes('okt')) month = 10;
    else if (mStr.includes('nov')) month = 11;
    else if (mStr.includes('des')) month = 12;

    return { day, month, year };
  };

  const parseRow = (str) => {
    let result = [];
    let inQuotes = false;
    let current = '';
    for(let i=0; i<str.length; i++) {
        let char = str[i];
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
        else { current += char; }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, ''));
  };

  const handleMigrate = async () => {
    setLoading(true);
    setLog(['Mulai proses migrasi... Membaca Google Sheet...']);
    
    try {
      const targetUrl = 'https://docs.google.com/spreadsheets/d/1vp2CK15g_ZCSBF29JB_w9kSg8DAZGLTu9Xbgt0jwBfU/export?format=csv&gid=0';
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
      
      if (!res.ok) throw new Error('Gagal mengunduh CSV dari Google Sheet via Proxy');
      
      const csvText = await res.text();
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
      
      addLog(`Berhasil mengunduh ${lines.length} baris data (termasuk header).`);
      
      const dataRows = lines.slice(1); // skip header
      let countSuccess = 0;
      let countSkippedDate = 0;
      let countSkippedExists = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const parsed = parseRow(row);
        
        // 0:id_sewa, 1:tanggal_sewa, 2:lokasi_sewa, 3:nama_penyewa, 4:no.hp_penyewa, 5:tanggal_booking, 6:luas_lahan, 7:keterangan, 8:PIC
        const idSewaAsli = parsed[0];
        const tanggalStr = parsed[1];
        
        const dateObj = parseIndoDate(tanggalStr);
        if (!dateObj) {
            continue;
        }

        const { day, month, year } = dateObj;
        
        // Cek >= 13 Juni 2026
        const isAfterTarget = year > 2026 || (year === 2026 && month > 6) || (year === 2026 && month === 6 && day >= 13);
        
        if (!isAfterTarget) {
            countSkippedDate++;
            continue;
        }

        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const lokasi = parsed[2] || '';
        const nama = parsed[3] || '';
        const hp = parsed[4] || '-';
        const tglBooking = parsed[5] || '';
        const luasLahanStr = parsed[6] || '';
        const keterangan = parsed[7] || '';
        const pic = parsed[8] || '';

        // Hitung Luas
        const isLapangan = lokasi.toLowerCase().includes('lap');
        const luas = isLapangan ? (parseInt(luasLahanStr, 10) || 50) : null;

        // Hitung Biaya
        let baseHarga = 250000;
        if (lokasi === 'PENDOPO TSA 1') baseHarga = 500000;
        if (lokasi === 'AULA SERBAGUNA') baseHarga = 2000000;
        if (isLapangan) baseHarga = luas * 2000;
        
        const newData = {
            id_sewa: idSewaAsli || `TMR-${Math.floor(Math.random() * 90000) + 10000}`,
            tanggal_sewa: formattedDate,
            lokasi_sewa: lokasi,
            nama_penyewa: nama,
            pic_rombongan: nama,
            no_hp_penyewa: hp,
            pic_kantor: pic,
            keterangan: keterangan,
            status_pembayaran: 'Sudah Transfer', // Anggap sudah fix atau sesuaikan
            tanggal_booking: tglBooking || new Date().toLocaleString('id-ID'),
            tanggal_transfer: null,
            bukti_transfer: null,
            bukti_transfer_listrik: null,
            ocr_data: null,
            history_reschedule: [],
            listrik_tambahan: keterangan.toLowerCase().includes('listrik') || keterangan.toLowerCase().includes('tenda'),
            akses_upload_listrik: false,
            luas_lahan: luas,
            total_biaya: baseHarga
        };

        // Cek duplikasi
        const q = query(collection(db, 'sewaList'), 
            where('tanggal_sewa', '==', formattedDate),
            where('lokasi_sewa', '==', lokasi),
            where('nama_penyewa', '==', nama)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
            await addDoc(collection(db, 'sewaList'), newData);
            countSuccess++;
            if (countSuccess % 5 === 0) {
                addLog(`Telah menambahkan ${countSuccess} data baru...`);
            }
        } else {
            countSkippedExists++;
        }
      }

      addLog(`Selesai!`);
      addLog(`Total Berhasil Dimasukkan: ${countSuccess}`);
      addLog(`Dilewati (Sebelum 13 Juni 2026): ${countSkippedDate}`);
      addLog(`Dilewati (Sudah ada di database): ${countSkippedExists}`);

    } catch (e) {
      addLog(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-emerald-900">Migrasi Data Pemesanan (>= 13 Juni 2026)</h1>
      <p className="mb-6 text-slate-600">Tekan tombol di bawah ini untuk menarik data dari Google Sheet dan menyimpannya otomatis ke database sistem secara aman.</p>
      
      <button 
        onClick={handleMigrate}
        disabled={loading}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mb-8 disabled:opacity-50"
      >
        {loading ? 'Sedang Memproses...' : 'Mulai Migrasi Data'}
      </button>

      <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl h-64 overflow-auto font-mono text-xs">
        {log.map((l, i) => (
            <div key={i}>{l}</div>
        ))}
        {log.length === 0 && <span className="opacity-50">Menunggu perintah...</span>}
      </div>
    </div>
  );
}
