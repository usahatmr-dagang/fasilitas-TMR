import React, { useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

export default function SyncPembayaran() {
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
      setLogs(prev => [...prev, msg]);
  };

  const parseRow = (line) => {
    if (line.includes('\t')) {
        return line.split('\t').map(c => c.trim());
    }
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
  };

  const processData = async () => {
    if (!manualText.trim()) {
        addLog("Teks data kosong!");
        return;
    }

    setIsProcessing(true);
    setLogs([]);
    addLog("Memulai Sinkronisasi Pembayaran...");

    try {
      // 1. Parse pasted data
      const lines = manualText.split('\n').filter(l => l.trim() !== '');
      if (lines.length === 0) throw new Error("Data tidak valid");
      
      const header = parseRow(lines[0]);
      addLog(`Membaca ${lines.length - 1} baris data pembayaran...`);

      const dataRows = lines.slice(1);
      const paidIds = new Set();
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = parseRow(dataRows[i]);
        // Asumsi Kolom 0 adalah id_sewa
        const idSewa = row[0];
        if (idSewa && idSewa.startsWith('TMR')) {
            // Hilangkan spasi berlebih
            const cleanId = idSewa.replace(/\s+/g, '');
            paidIds.add(cleanId);
        }
      }

      addLog(`Ditemukan ${paidIds.size} ID Sewa unik yang sudah bayar di Excel.`);

      // 2. Fetch all data from Firestore
      addLog("Mengambil data dari database...");
      const querySnapshot = await getDocs(collection(db, 'sewaList'));
      
      const batch = writeBatch(db);
      let countUpdatedSudah = 0;
      let countUpdatedBelum = 0;
      let batchCount = 0;

      querySnapshot.forEach((document) => {
          const data = document.data();
          const docId = data.id_sewa;
          
          if (!docId) return;

          const docRef = doc(db, 'sewaList', document.id);
          const cleanDocId = docId.replace(/\s+/g, '');

          if (paidIds.has(cleanDocId)) {
              if (data.status_pembayaran !== 'Sudah Transfer') {
                  batch.update(docRef, { status_pembayaran: 'Sudah Transfer' });
                  countUpdatedSudah++;
                  batchCount++;
              }
          } else {
              if (data.status_pembayaran !== 'Belum Transfer') {
                  batch.update(docRef, { status_pembayaran: 'Belum Transfer' });
                  countUpdatedBelum++;
                  batchCount++;
              }
          }
      });

      if (batchCount > 0) {
          addLog(`Memproses update ${batchCount} data ke database...`);
          await batch.commit();
      }

      addLog(`Selesai!`);
      addLog(`Berhasil diubah ke Sudah Transfer: ${countUpdatedSudah}`);
      addLog(`Berhasil diubah ke Belum Transfer: ${countUpdatedBelum}`);

    } catch (err) {
      addLog(`Terjadi kesalahan: ${err.message}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full bg-white rounded-3xl shadow-lg border border-emerald-100">
      <h2 className="text-2xl font-black mb-2 text-emerald-950">Sinkronisasi Keuangan / Pembayaran</h2>
      <p className="mb-6 text-emerald-700/80 font-medium">Sistem akan menyesuaikan status "Sudah Bayar" dan "Belum Bayar" berdasarkan data dari Sheet Bukti Pembayaran.</p>
      
      <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 border-r border-emerald-50 pr-0 md:pr-8">
              <h3 className="font-bold text-amber-900 mb-3">Logs Sinkronisasi</h3>
              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl h-64 overflow-y-auto whitespace-pre-wrap">
                  {logs.length === 0 ? <span className="opacity-50">Menunggu aksi...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
          </div>

          <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-3">Paste Teks Bukti Pembayaran</h3>
              <p className="text-xs text-slate-500 mb-2">Blok (copy) semua data di Google Sheet Bukti Pembayaran Anda, lalu paste di kotak ini:</p>
              <textarea 
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  className="w-full h-48 border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  placeholder="ID Sewa \t Tanggal \t Nama Penyewa \t ... dsb"
              />
              <button 
                  onClick={processData}
                  disabled={isProcessing}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-emerald-500/20"
              >
                  {isProcessing ? 'Memproses...' : 'Proses Teks & Update Status'}
              </button>
          </div>
      </div>
    </div>
  );
}
