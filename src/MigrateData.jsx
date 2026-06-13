import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default function MigrateData() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const parseIndoDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Normalize delimiters to slash
    let normalized = dateStr.replace(/-/g, '/').replace(/ /g, '/');
    const parts = normalized.split('/').filter(p => p);
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    
    let month = parseInt(mStr, 10);
    if (isNaN(month)) {
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
    }

    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return { day, month, year };
  };

  const parseRow = (str) => {
    // Deteksi pemisah: jika ada tab (dari paste Google Sheet), gunakan tab. Jika tidak, gunakan koma.
    const delimiter = str.includes('\t') ? '\t' : ',';
    let result = [];
    let inQuotes = false;
    let current = '';
    for(let i=0; i<str.length; i++) {
        let char = str[i];
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === delimiter && !inQuotes) { result.push(current); current = ''; }
        else { current += char; }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, ''));
  };

  const processCsvLines = async (lines) => {
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
        
        // Cek >= Tahun 2025
        const isAfterTarget = year >= 2025;
        
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
      addLog(`Dilewati (Sebelum 2025 atau Format Kosong): ${countSkippedDate}`);
      addLog(`Dilewati (Sudah ada di database): ${countSkippedExists}`);

  };

  const [manualText, setManualText] = useState('');

  const handleManualMigrate = async () => {
      setLoading(true);
      setLog(['Mulai proses migrasi manual...']);
      try {
         const lines = manualText.split('\n').map(l => l.trim()).filter(l => l);
         if (lines.length === 0) {
             addLog('Teks kosong.');
             setLoading(false);
             return;
         }
         // Jika baris pertama bukan header, anggap semuanya data dan tambahkan dummy header
         if (!lines[0].toLowerCase().includes('id_sewa') && !lines[0].toLowerCase().includes('tanggal')) {
             lines.unshift('header_dummy');
         }
         await processCsvLines(lines);
      } catch (e) {
          addLog(`Error: ${e.message}`);
      }
      setLoading(false);
  };

  const handleMigrate = async () => {
    setLoading(true);
    setLog(['Mulai proses migrasi... Membaca Google Sheet via Proxy...']);
    
    try {
      const targetUrl = 'https://docs.google.com/spreadsheets/d/1vp2CK15g_ZCSBF29JB_w9kSg8DAZGLTu9Xbgt0jwBfU/export?format=csv&gid=0';
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
      
      if (!res.ok) throw new Error('Gagal mengunduh CSV dari Google Sheet via Proxy');
      
      const csvText = await res.text();
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
      addLog(`Berhasil mengunduh ${lines.length} baris data.`);
      
      await processCsvLines(lines);

    } catch (e) {
      addLog(`Error Auto: ${e.message}`);
      addLog(`Silakan gunakan opsi Paste Manual di bawah jika gagal otomatis.`);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-8 w-full bg-white rounded-3xl shadow-lg border border-emerald-100">
      <h2 className="text-2xl font-black mb-2 text-emerald-950">Migrasi Data Pemesanan</h2>
      <p className="mb-6 text-emerald-700/80 font-medium">Sistem akan otomatis menyeleksi dan memasukkan pesanan yang tanggal sewanya <span className="font-bold text-rose-600">mulai dari tahun 2025</span> dan setelahnya.</p>
      
      <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 border-r border-emerald-50 pr-0 md:pr-8">
              <h3 className="font-bold text-emerald-900 mb-3">Opsi 1: Tarik Otomatis (Auto)</h3>
              <p className="text-xs text-slate-500 mb-4">Akan mengunduh data langsung dari tautan Google Sheet yang telah disetel. Pastikan koneksi lancar.</p>
              <button 
                onClick={handleMigrate}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Sedang Memproses...' : 'Tarik Otomatis dari Sheet Utama'}
              </button>
          </div>

          <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-3">Opsi 2: Paste Manual Teks CSV</h3>
              <p className="text-xs text-slate-500 mb-2">Jika otomatis gagal, Anda bisa mem-blok (copy) sel-sel data di Google Sheet mulai dari tahun 2025 ke bawah, lalu paste di kotak ini:</p>
              <textarea 
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  placeholder="Paste isi excel / google sheet disini..."
                  className="w-full h-24 p-3 text-xs border border-amber-200 rounded-lg focus:ring-amber-500 mb-3 outline-none"
              />
              <button 
                onClick={handleManualMigrate}
                disabled={loading || manualText.trim().length === 0}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                Proses Teks Manual
              </button>
          </div>
      </div>

      <div className="bg-slate-950 text-emerald-400 p-5 rounded-2xl h-64 overflow-auto font-mono text-xs mt-8 shadow-inner">
        <div className="font-bold text-emerald-600 mb-2">--- LOG PROSES MIGRASI ---</div>
        {log.map((l, i) => (
            <div key={i} className="mb-1 border-b border-slate-800/50 pb-1">{l}</div>
        ))}
        {log.length === 0 && <span className="opacity-40 italic">Klik tombol di atas untuk memulai...</span>}
      </div>
    </div>
  );
}
