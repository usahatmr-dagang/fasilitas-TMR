import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Send,
  Copy,
  FileText,
  Plus,
  Search,
  Clock,
  Sparkles,
  LogOut,
  RefreshCw,
  Eye
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

export const DAFTAR_KEGIATAN_NON_TEMPAT = [
  'Film Cerita',
  'Film Iklan',
  'Program Televisi',
  'Pre-Wedding',
  'Fasilitas Gedung Informasi',
  'Pemutaran Film Satwa',
  'Pemandu Wisata Berbahasa Indonesia',
  'Pemandu Wisata Berbahasa Inggris',
  'Paket Wisata Edukasi dengan Bus'
];

export default function PenagihanKegiatanView({
  sewaList = [],
  selectedDate,
  setSelectedDate,
  handleOpenDetail,
  showToast,
  formatRupiah,
  formatTanggalIndo,
  formatTanggalPendek,
  getTodayString
}) {
  const [jenisKegiatan, setJenisKegiatan] = useState('');
  const [kegiatanLainnya, setKegiatanLainnya] = useState('');
  const [biayaManual, setBiayaManual] = useState('');
  const [tanggalKegiatan, setTanggalKegiatan] = useState(selectedDate || getTodayString());
  const [namaRombongan, setNamaRombongan] = useState('');
  const [picRombongan, setPicRombongan] = useState('');
  const [noWa, setNoWa] = useState('');
  const [catatan, setCatatan] = useState('');
  const [statusPembayaran, setStatusPembayaran] = useState('Belum Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTanggalList, setFilterTanggalList] = useState('');

  const nominalNumeric = useMemo(() => {
    const cleaned = String(biayaManual).replace(/\D/g, '');
    return parseInt(cleaned, 10) || 0;
  }, [biayaManual]);

  const namaKegiatanFinal = useMemo(() => {
    if (jenisKegiatan === '__lainnya__') {
      return kegiatanLainnya.trim();
    }
    return jenisKegiatan.trim();
  }, [jenisKegiatan, kegiatanLainnya]);

  const handleBiayaChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setBiayaManual('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(rawDigits, 10));
    setBiayaManual(formatted);
  };

  const kirimWAPesanKegiatan = (record) => {
    if (!record) return;
    const totalBayar = Number(record.total_biaya) || 0;
    const namaKeg = record.kegiatan || record.lokasi_sewa || '-';
    const docIdTarget = record.docId || record.id;

    const msg = `Terima kasih telah melakukan pendaftaran kegiatan di Taman Margasatwa Ragunan.

ID Transaksi: *${record.id_sewa}*
Nama Penyewa / Instansi: ${record.nama_penyewa} ${record.pic_rombongan && record.pic_rombongan !== '-' && record.pic_rombongan !== record.nama_penyewa ? `(${record.pic_rombongan})` : ''}
Jenis Kegiatan: *${namaKeg}*
Tanggal Kegiatan: ${formatTanggalPendek(record.tanggal_sewa)}
Jumlah yang harus dibayar: *${formatRupiah(totalBayar)}*
${record.batas_pembayaran ? `\nHarap lakukan pembayaran maksimal pada *${formatTanggalIndo(record.batas_pembayaran)}*. Lewat dari batas waktu tersebut, link upload akan tertutup otomatis.` : ''}
Silahkan lihat detail nomor rekening dan kirim bukti pembayaran melalui link berikut ini:
https://${window.location.host}/upload/${docIdTarget}

Terima kasih.`;

    const rawPhone = String(record.no_hp_penyewa || '');
    let phone = rawPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitKegiatan = async (e) => {
    e.preventDefault();
    if (!namaKegiatanFinal) {
      showToast('Silakan pilih atau tulis jenis kegiatan terlebih dahulu!', 'error');
      return;
    }
    if (nominalNumeric <= 0) {
      showToast('Silakan masukkan besaran biaya penagihan yang valid!', 'error');
      return;
    }
    if (!tanggalKegiatan) {
      showToast('Silakan pilih tanggal pelaksanaan kegiatan!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentDateTime = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const generatedId = `TMR-${Math.floor(10000 + Math.random() * 90000)}`;
      const isLunas = statusPembayaran === 'Sudah Transfer';

      const batasDate = new Date();
      batasDate.setDate(batasDate.getDate() + 3);
      const batasPembayaranStr = `${batasDate.getFullYear()}-${String(batasDate.getMonth() + 1).padStart(2, '0')}-${String(batasDate.getDate()).padStart(2, '0')}`;

      const newKegiatanBooking = {
        id_sewa: generatedId,
        kategori_sewa: 'kegiatan',
        kegiatan: namaKegiatanFinal,
        tanggal_sewa: tanggalKegiatan,
        lokasi_sewa: namaKegiatanFinal,
        detail_lokasi: [
          {
            nama: namaKegiatanFinal,
            luas: null,
            biaya: nominalNumeric
          }
        ],
        is_gazebo_package: false,
        nama_penyewa: namaRombongan.trim() || '-',
        pic_rombongan: picRombongan.trim() || '-',
        no_hp_penyewa: noWa.trim() || '-',
        pic_kantor: '-',
        keterangan: catatan.trim() || `Kegiatan: ${namaKegiatanFinal}`,
        catatan: catatan.trim() || '-',
        status_pembayaran: statusPembayaran || 'Belum Transfer',
        listrik_tambahan: false,
        akses_upload_listrik: false,
        luas_lahan: null,
        total_biaya: nominalNumeric,
        tanggal_booking: currentDateTime,
        batas_pembayaran: batasPembayaranStr,
        tanggal_transfer: isLunas ? getTodayString() : null,
        bukti_transfer: null,
        bukti_transfer_listrik: null,
        ocr_data: null,
        history_reschedule: []
      };

      const docRef = await addDoc(collection(db, 'sewaList'), newKegiatanBooking);
      newKegiatanBooking.docId = docRef.id;
      newKegiatanBooking.id = docRef.id;

      // Sinkronkan tanggal kegiatan agar selectedDate di Reservasi Lokasi ikut terarah jika diinginkan
      if (setSelectedDate && tanggalKegiatan) {
        setSelectedDate(tanggalKegiatan);
      }

      // Reset form
      setJenisKegiatan('');
      setKegiatanLainnya('');
      setBiayaManual('');
      setNamaRombongan('');
      setPicRombongan('');
      setNoWa('');
      setCatatan('');
      setStatusPembayaran('Belum Transfer');

      showToast('Penagihan kegiatan berhasil dibuat!');
      if (handleOpenDetail) {
        handleOpenDetail(newKegiatanBooking);
      }
    } catch (error) {
      console.error('Error creating kegiatan billing:', error);
      showToast('Gagal menyimpan penagihan kegiatan!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daftarTagihanKegiatan = useMemo(() => {
    return sewaList
      .filter((item) => item.kategori_sewa === 'kegiatan')
      .filter((item) => {
        if (filterTanggalList && item.tanggal_sewa !== filterTanggalList) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (item.nama_penyewa || '').toLowerCase().includes(q) ||
          (item.lokasi_sewa || '').toLowerCase().includes(q) ||
          (item.kegiatan || '').toLowerCase().includes(q) ||
          (item.id_sewa || '').toLowerCase().includes(q) ||
          (item.pic_rombongan || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.tanggal_sewa || 0) - new Date(a.tanggal_sewa || 0));
  }, [sewaList, filterTanggalList, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto pb-32 lg:pb-12 pt-4 animate-slide-in-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden border border-emerald-800/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500 rounded-bl-full opacity-15 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500 rounded-tr-full opacity-10 blur-xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-800/60 text-amber-400 border border-emerald-700/40 shadow-inner shrink-0">
              <Wallet size={30} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 mb-1.5">
                <Sparkles size={11} /> Penagihan Non-Tempat
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                Penagihan Kegiatan Lainnya
              </h2>
              <p className="text-emerald-200/80 text-xs sm:text-sm font-medium mt-1 max-w-2xl">
                Buat tagihan resmi untuk kegiatan di luar penyewaan tempat (Shooting, Pre-Wedding, Pemandu Wisata, Paket Wisata Edukasi Bus, dll) lengkap dengan link portal upload & batas transfer 3 hari.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* KOLOM KIRI: FORMULIR PENAGIHAN KEGIATAN */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(4,120,87,0.04)] border border-emerald-100/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-emerald-800/10 flex items-center justify-between bg-gradient-to-r from-[#022c22] via-[#043e30] to-[#01140f] text-white">
              <div>
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Formulir Penagihan Kegiatan
                </h3>
                <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase mt-0.5">
                  Batas Waktu Transfer Otomatis 3 Hari
                </p>
              </div>
              <div className="p-2 bg-white/10 rounded-xl text-emerald-300">
                <Plus size={18} />
              </div>
            </div>

            <form onSubmit={handleSubmitKegiatan} className="p-5 sm:p-6 space-y-4 bg-slate-50/40">
              {/* 1. Pilih Jenis Kegiatan */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                    Pilih Jenis Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={jenisKegiatan}
                    onChange={(e) => setJenisKegiatan(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-bold text-emerald-950 bg-white shadow-xs cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Item Kegiatan --</option>
                    {DAFTAR_KEGIATAN_NON_TEMPAT.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                    <option value="__lainnya__">➕ Lainnya (Tulis Nama Kegiatan Manual...)</option>
                  </select>
                </div>

                {jenisKegiatan === '__lainnya__' && (
                  <div className="pt-1 animate-fade-in">
                    <label className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5">
                      Tulis Nama Kegiatan Tambahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={kegiatanLainnya}
                      onChange={(e) => setKegiatanLainnya(e.target.value)}
                      placeholder="Contoh: Dokumentasi Drone / Kegiatan Khusus..."
                      className="w-full px-4 py-3 border-2 border-amber-400 bg-amber-50/20 rounded-2xl text-sm focus:ring-4 focus:ring-amber-500/20 focus:border-amber-600 outline-none font-bold text-emerald-950 shadow-xs placeholder:text-slate-400 placeholder:font-normal"
                      autoFocus
                    />
                  </div>
                )}

                {/* Input Biaya Manual */}
                <div className="pt-1">
                  <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                    Besaran Biaya / Nominal Tagihan (Diisi Manual) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-black text-emerald-800 text-sm select-none">
                      Rp
                    </span>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      value={biayaManual}
                      onChange={handleBiayaChange}
                      placeholder="Contoh: 500.000"
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-black text-emerald-950 bg-white shadow-xs placeholder:text-slate-300 placeholder:font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Ringkasan Biaya Realtime */}
              <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-xs space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Jenis Kegiatan:</span>
                  <span className="font-extrabold text-emerald-950 text-right max-w-[60%] truncate">
                    {namaKegiatanFinal || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2.5 border-t border-slate-100">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider">
                    Total Tagihan:
                  </span>
                  <span className="font-black text-emerald-700 text-xl">
                    {formatRupiah(nominalNumeric)}
                  </span>
                </div>
              </div>

              {/* Nama Rombongan / Instansi */}
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Nama Rombongan / Instansi / Penyewa <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={namaRombongan}
                  onChange={(e) => setNamaRombongan(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-xs placeholder:text-slate-400"
                  placeholder="Tuliskan nama rombongan / instansi / pemohon..."
                />
              </div>

              {/* PIC Rombongan & No WA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                    PIC Rombongan / Pemohon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={picRombongan}
                    onChange={(e) => setPicRombongan(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-xs placeholder:text-slate-400"
                    placeholder="Nama penanggung jawab"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                    No. WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-xs placeholder:text-slate-400"
                    placeholder="08..."
                  />
                </div>
              </div>

              {/* Tanggal Kegiatan (Tanpa PIC Kantor sesuai permintaan) */}
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Tanggal Pelaksanaan Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={tanggalKegiatan}
                  onChange={(e) => setTanggalKegiatan(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-white text-emerald-950 text-sm font-extrabold rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none shadow-xs cursor-pointer custom-date-picker"
                />
                {tanggalKegiatan && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1">
                    Jadwal: {formatTanggalIndo(tanggalKegiatan)} (Otomatis tampil di bawah menu Reservasi Lokasi pada tanggal ini)
                  </p>
                )}
              </div>

              {/* Catatan / Keterangan Tambahan */}
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                  Catatan / Keterangan Kegiatan
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-xs placeholder:text-slate-400"
                  rows="2"
                  placeholder="Catatan tambahan terkait kegiatan (opsional)..."
                />
              </div>

              {/* Status Pendaftaran Awal */}
              <div className="pt-1">
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-2">
                  Status Pendaftaran Awal
                </label>
                <div className="flex space-x-3">
                  <label
                    className={`flex-1 flex flex-col items-center justify-center p-3.5 rounded-3xl border cursor-pointer transition-all duration-200 ${
                      statusPembayaran === 'Sudah Transfer'
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 shadow-xs ring-2 ring-emerald-100/50'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusPembayaranKegiatan"
                      value="Sudah Transfer"
                      checked={statusPembayaran === 'Sudah Transfer'}
                      onChange={(e) => setStatusPembayaran(e.target.value)}
                      className="hidden"
                    />
                    <CheckCircle2
                      size={20}
                      className={`mb-1 ${statusPembayaran === 'Sudah Transfer' ? 'text-emerald-600' : 'text-slate-300'}`}
                    />
                    <span className="text-xs font-extrabold">Lunas di Awal</span>
                  </label>

                  <label
                    className={`flex-1 flex flex-col items-center justify-center p-3.5 rounded-3xl border cursor-pointer transition-all duration-200 ${
                      statusPembayaran === 'Belum Transfer'
                        ? 'border-rose-400 bg-rose-50/40 text-rose-950 shadow-xs ring-2 ring-rose-100/50'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusPembayaranKegiatan"
                      value="Belum Transfer"
                      checked={statusPembayaran === 'Belum Transfer'}
                      onChange={(e) => setStatusPembayaran(e.target.value)}
                      className="hidden"
                    />
                    <AlertCircle
                      size={20}
                      className={`mb-1 ${statusPembayaran === 'Belum Transfer' ? 'text-rose-500' : 'text-slate-300'}`}
                    />
                    <span className="text-xs font-extrabold">Belum Transfer (Batas 3 Hari)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  <span>{isSubmitting ? 'Menyimpan Tagihan...' : 'Simpan & Buat Penagihan Kegiatan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR PENAGIHAN KEGIATAN YANG SUDAH DIBUAT */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(4,120,87,0.04)] border border-slate-100 p-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-emerald-950 text-base flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" />
                  <span>Daftar Tagihan Kegiatan</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold">
                    {daftarTagihanKegiatan.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Klik Kirim WA untuk mengirimkan link portal pembayaran ke pengunjung.
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama penyewa, kegiatan, atau ID..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={filterTanggalList}
                  onChange={(e) => setFilterTanggalList(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                />
                {filterTanggalList && (
                  <button
                    type="button"
                    onClick={() => setFilterTanggalList('')}
                    className="px-2.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* List Kegiatan */}
            <div className="flex-1 overflow-y-auto max-h-[560px] space-y-3 pr-1 custom-scrollbar">
              {daftarTagihanKegiatan.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <Wallet size={36} className="opacity-30 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Belum ada penagihan kegiatan di luar tempat</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                    Gunakan formulir di samping untuk membuat penagihan kegiatan baru.
                  </p>
                </div>
              ) : (
                daftarTagihanKegiatan.map((item) => {
                  const isLunas =
                    item.status_pembayaran === 'Sudah Transfer' ||
                    item.status_pembayaran === 'Lunas' ||
                    item.status_pembayaran === 'Sudah Lunas';
                  const isVerifikasi = item.status_pembayaran === 'Menunggu Verifikasi';
                  const docIdTarget = item.docId || item.id;

                  return (
                    <div
                      key={docIdTarget}
                      onClick={() => handleOpenDetail && handleOpenDetail(item)}
                      className="group bg-white hover:bg-emerald-50/30 border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-4 transition-all shadow-xs cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              {item.id_sewa}
                            </span>
                            <span className="text-xs font-black text-amber-800 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                              {item.kegiatan || item.lokasi_sewa}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-emerald-950 text-sm mt-1.5">
                            {item.nama_penyewa}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            PIC: {item.pic_rombongan || '-'} • WA: {item.no_hp_penyewa || '-'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-black text-emerald-800 text-sm">
                            {formatRupiah(item.total_biaya)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${
                              isLunas
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isVerifikasi
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isLunas ? 'LUNAS' : isVerifikasi ? 'MENUNGGU VERIFIKASI' : 'BELUM BAYAR'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-3 text-slate-600 font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-emerald-600" />
                            {formatTanggalPendek(item.tanggal_sewa)}
                          </span>
                          {!isLunas && item.batas_pembayaran && (
                            <span className="flex items-center gap-1 text-rose-600">
                              <Clock size={12} />
                              Batas: {formatTanggalPendek(item.batas_pembayaran)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => kirimWAPesanKegiatan(item)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                            title="Kirim Tagihan ke WhatsApp Pengunjung"
                          >
                            <Send size={11} /> Kirim WA
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = `https://${window.location.host}/upload/${docIdTarget}`;
                              navigator.clipboard.writeText(url);
                              showToast('Link Portal Pembayaran berhasil disalin!');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                            title="Salin Link Portal Upload"
                          >
                            <Copy size={11} /> Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail && handleOpenDetail(item)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye size={11} /> Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Utilitas Admin */}
            <div className="flex gap-2 w-full mt-6 justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Sinkronkan ulang tabel publik? Ini akan menyalin semua tanggal jadwal penyewaan tempat ke publicSewaList.')) return;
                  try {
                    let count = 0;
                    for (const sewa of sewaList) {
                      if (sewa.tanggal_sewa && sewa.lokasi_sewa && sewa.docId && sewa.kategori_sewa !== 'kegiatan') {
                        await setDoc(doc(db, 'publicSewaList', sewa.docId), {
                          tanggal_sewa: sewa.tanggal_sewa,
                          lokasi_sewa: sewa.lokasi_sewa
                        });
                        count++;
                      }
                    }
                    alert(`Berhasil mensinkronkan ${count} jadwal ke kalender publik!`);
                  } catch (e) {
                    console.error(e);
                    alert('Gagal sinkronisasi data.');
                  }
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} /> Sync Kalender Publik
              </button>
              <button
                type="button"
                onClick={() => auth.signOut()}
                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors font-bold flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
