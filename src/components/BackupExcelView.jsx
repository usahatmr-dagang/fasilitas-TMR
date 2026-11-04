import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  DownloadCloud, 
  CheckCircle2, 
  Filter, 
  FileCheck,
  Loader2
} from 'lucide-react';
import { downloadBackupExcel, formatTanggalLengkap } from '../utils/backupExcelHelper';

export default function BackupExcelView({ sewaList = [], showToast = () => {} }) {
  // Pilihan periode: 'mendatang' (hari ini ke depan), 'semua', 'kustom'
  const [periodeMode, setPeriodeMode] = useState('mendatang');
  
  // Tanggal hari ini YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper normalisasi tanggal
  const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) {
        const y = p[2].length === 4 ? p[2] : p[0];
        const m = p[1].padStart(2, '0');
        const d = (p[2].length === 4 ? p[0] : p[2]).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    const mYmd = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (mYmd) {
      return `${mYmd[1]}-${String(mYmd[2]).padStart(2, '0')}-${String(mYmd[3]).padStart(2, '0')}`;
    }
    return s;
  };

  // Filter records berdasarkan pilihan
  const filteredRecords = useMemo(() => {
    return sewaList.filter(item => {
      const tgl = normalizeDate(item.tanggal_sewa);
      if (!tgl) return false;

      // Filter periode
      if (periodeMode === 'mendatang') {
        if (tgl < todayStr) return false;
      } else if (periodeMode === 'kustom') {
        if (customStartDate && tgl < customStartDate) return false;
        if (customEndDate && tgl > customEndDate) return false;
      }

      // Filter status
      if (statusFilter !== 'semua') {
        const itemStatus = (item.status_pembayaran || '').toLowerCase();
        if (statusFilter === 'lunas' && !itemStatus.includes('lunas') && !itemStatus.includes('sudah transfer')) return false;
        if (statusFilter === 'belum' && !itemStatus.includes('belum') && !itemStatus.includes('menunggu')) return false;
        if (statusFilter === 'ditutup' && !itemStatus.includes('ditutup')) return false;
      }

      return true;
    }).sort((a, b) => {
      const tA = normalizeDate(a.tanggal_sewa);
      const tB = normalizeDate(b.tanggal_sewa);
      return tA.localeCompare(tB) || (a.lokasi_sewa || '').localeCompare(b.lokasi_sewa || '');
    });
  }, [sewaList, periodeMode, customStartDate, customEndDate, statusFilter, todayStr]);

  // Statistik data
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const lunas = filteredRecords.filter(r => (r.status_pembayaran || '').toLowerCase().includes('lunas') || (r.status_pembayaran || '').toLowerCase().includes('sudah transfer')).length;
    const belum = filteredRecords.filter(r => (r.status_pembayaran || '').toLowerCase().includes('belum') || (r.status_pembayaran || '').toLowerCase().includes('menunggu')).length;
    const ditutup = filteredRecords.filter(r => (r.status_pembayaran || '').toLowerCase().includes('ditutup')).length;
    const totalOmset = filteredRecords.reduce((sum, r) => sum + (Number(r.total_biaya) || 0), 0);
    return { total, lunas, belum, ditutup, totalOmset };
  }, [filteredRecords]);

  // Handle Download Excel
  const handleDownload = async () => {
    if (filteredRecords.length === 0) {
      showToast('Tidak ada data pada periode yang dipilih.', 'error');
      return;
    }
    setIsDownloading(true);
    try {
      const label = periodeMode === 'mendatang' 
        ? `Mulai ${todayStr} ke Depan` 
        : (periodeMode === 'semua' ? 'Semua Riwayat' : `${customStartDate} s/d ${customEndDate || 'Sekarang'}`);

      await downloadBackupExcel(filteredRecords, {
        periodeLabel: label,
        filename: `Backup_Sewa_TMR_${periodeMode === 'mendatang' ? todayStr + '_kedepan' : (periodeMode === 'semua' ? 'Semua_Data' : customStartDate)}.xlsx`
      });
      showToast(`Berhasil mengunduh backup ${filteredRecords.length} data penyewaan.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file Excel: ' + err.message, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 lg:pb-12 pt-4">
      {/* Header Utama */}
      <div className="bg-gradient-to-r from-[#022c22] via-[#043e30] to-[#011a14] rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden mb-8 border border-emerald-700/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-3 border border-emerald-400/20">
              <FileSpreadsheet size={13} className="text-amber-400" />
              <span>Menu Cadangan Data (Backup)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Backup Data ke Excel (.xlsx)</h1>
            <p className="text-xs md:text-sm text-emerald-200/80 mt-1.5 max-w-2xl leading-relaxed">
              Unduh seluruh data reservasi penyewaan fasilitas ke format Microsoft Excel resmi lengkap dengan rekap biaya dan status pembayaran.
            </p>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || filteredRecords.length === 0}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-7 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-950/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
              <span>{isDownloading ? 'Membuat File Excel...' : `Unduh Backup Excel (${filteredRecords.length} Data)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Konfigurasi Filter & Ringkasan */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
        <h2 className="text-sm font-black uppercase tracking-wider text-emerald-950 mb-5 flex items-center">
          <Filter size={16} className="mr-2 text-emerald-600" />
          <span>Pilih Rentang Data yang Akan Di-Backup</span>
        </h2>

        {/* Tab Pilihan Periode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-slate-100/80 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setPeriodeMode('mendatang')}
            className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex flex-col items-center cursor-pointer ${
              periodeMode === 'mendatang'
                ? 'bg-white text-emerald-950 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-emerald-950'
            }`}
          >
            <span>Mulai Hari Ini ke Depan</span>
            <span className="text-[9px] font-semibold text-emerald-600 mt-0.5">(Rekomendasi Operasional)</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodeMode('semua')}
            className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex flex-col items-center cursor-pointer ${
              periodeMode === 'semua'
                ? 'bg-white text-emerald-950 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-emerald-950'
            }`}
          >
            <span>Semua Riwayat Data</span>
            <span className="text-[9px] font-semibold text-slate-400 mt-0.5">(Seluruh Database)</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodeMode('kustom')}
            className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex flex-col items-center cursor-pointer ${
              periodeMode === 'kustom'
                ? 'bg-white text-emerald-950 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-emerald-950'
            }`}
          >
            <span>Pilih Rentang Tanggal</span>
            <span className="text-[9px] font-semibold text-slate-400 mt-0.5">(Dari Tanggal Tertentu)</span>
          </button>
        </div>

        {/* Input Kustom Tanggal (jika mode kustom) */}
        {periodeMode === 'kustom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mb-6 animate-fade-in">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5">
                Dari Tanggal Sewa:
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-emerald-950 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5">
                Sampai Tanggal Sewa (Opsional - kosongkan untuk s/d akhir):
              </label>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-emerald-950 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Filter Status Pembayaran */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-2">
          <span className="text-xs font-bold text-slate-600">Filter Status Pembayaran:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'semua', label: 'Semua Status' },
              { id: 'lunas', label: 'Sudah Lunas' },
              { id: 'belum', label: 'Belum Lunas' },
              { id: 'ditutup', label: 'Ditutup (Maintenance)' }
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ringkasan Angka / Stat Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Terpilih</span>
            <span className="text-xl font-black text-emerald-950 mt-1 block">{stats.total} Data</span>
          </div>
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Sudah Transfer</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{stats.lunas}</span>
          </div>
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Belum / Menunggu</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{stats.belum}</span>
          </div>
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total Omset</span>
            <span className="text-sm font-black text-blue-700 mt-2 block truncate">Rp {stats.totalOmset.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Preview Tabel Data Terpilih (10 Teratas) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-emerald-950 flex items-center">
              <FileCheck size={16} className="mr-2 text-emerald-600" />
              <span>Pratinjau Data yang Akan Di-Backup ({filteredRecords.length} Data)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Menampilkan 10 baris pertama data yang akan dimasukkan ke dalam file Excel.
            </p>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 self-start sm:self-auto">
            {periodeMode === 'mendatang' ? `Mulai ${todayStr} ke Depan` : (periodeMode === 'semua' ? 'Semua Data' : 'Rentang Kustom')}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3">Tanggal Sewa</th>
                <th className="py-3 px-3">Fasilitas</th>
                <th className="py-3 px-3">Nama Penyewa / Instansi</th>
                <th className="py-3 px-3">Kontak / PIC</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.slice(0, 10).map((item, idx) => {
                const isDitutup = item.status_pembayaran === 'Ditutup' || item.nama_penyewa?.includes('DITUTUP');
                const isLunas = (item.status_pembayaran || '').toLowerCase().includes('lunas') || (item.status_pembayaran || '').toLowerCase().includes('sudah transfer');
                return (
                  <tr key={item.docId || idx} className={`hover:bg-slate-50/80 transition-colors ${isDitutup ? 'bg-slate-50/50 opacity-70' : ''}`}>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-emerald-950 block">{item.tanggal_sewa}</span>
                      <span className="text-[10px] text-slate-400">{formatTanggalLengkap(item.tanggal_sewa)}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-900">{item.lokasi_sewa || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{item.nama_penyewa || '-'}</span>
                      {item.instansi_penyewa && (
                        <span className="text-[10px] text-slate-400 block">{item.instansi_penyewa}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-semibold text-slate-700 block">{item.no_hp_penyewa || '-'}</span>
                      <span className="text-[10px] text-slate-400 block">PIC: {item.pic_rombongan || '-'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isDitutup
                          ? 'bg-rose-100 text-rose-700'
                          : isLunas
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status_pembayaran || 'Belum Transfer'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      Rp {(Number(item.total_biaya) || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet size={32} className="opacity-30 mx-auto mb-2" />
                    <span className="text-xs font-semibold">Tidak ada data penyewaan pada periode ini</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 10 && (
          <p className="text-center text-[11px] font-bold text-slate-400 mt-4">
            ... dan {filteredRecords.length - 10} data lainnya akan disertakan dalam file Excel saat diunduh.
          </p>
        )}
      </div>
    </div>
  );
}
