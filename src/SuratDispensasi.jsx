import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Printer, Search, Building, Users, Car, CheckCircle2, ChevronLeft, Clock, X } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc } from 'firebase/firestore';

export default function SuratDispensasi({ onNavigate }) {
  const [source, setSource] = useState('sewa'); // 'sewa' or 'promo'
  const [dataList, setDataList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Additional form state
  const [jmlKendaraan, setJmlKendaraan] = useState('1 Mobil');
  const [nopol, setNopol] = useState('');
  const [jmlPersonel, setJmlPersonel] = useState('2 Dewasa');
  const [keperluan, setKeperluan] = useState('');
  const [jamLoading, setJamLoading] = useState('06.00 s/d 07.30 WIB');
  const [tglKunjungan, setTglKunjungan] = useState('');

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const targetCollection = source === 'sewa' ? 'sewaList' : 'promoList';
        const snapshot = await getDocs(collection(db, targetCollection));
        let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get today string in YYYY-MM-DD (local timezone safe)
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Filter out past dates (keep today and future)
        items = items.filter(item => {
           const itemDate = source === 'sewa' ? item.tanggal_sewa : item.tanggalPromo;
           if (!itemDate) return false;
           return itemDate >= todayStr;
        });
        
        // Sort by date ascending (closest to today first)
        items.sort((a, b) => {
           const dateA = source === 'sewa' ? a.tanggal_sewa : a.tanggalPromo;
           const dateB = source === 'sewa' ? b.tanggal_sewa : b.tanggalPromo;
           return new Date(dateA || 0) - new Date(dateB || 0);
        });
        
        setDataList(items);
        setFilteredData(items);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
      setIsLoading(false);
    };
    fetchData();
    setSelectedItem(null);
  }, [source]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(dataList);
    } else {
      const lower = search.toLowerCase();
      setFilteredData(dataList.filter(item => {
        if (source === 'sewa') return (item.nama_penyewa || '').toLowerCase().includes(lower) || (item.lokasi_sewa || '').toLowerCase().includes(lower);
        if (source === 'promo') return (item.namaPerusahaan || '').toLowerCase().includes(lower) || (item.namaProduk || '').toLowerCase().includes(lower);
        return false;
      }));
    }
  }, [search, dataList, source]);

  // Pre-fill data when item selected
  useEffect(() => {
    if (selectedItem) {
      if (source === 'sewa') {
        setKeperluan(`Loading Barang ke ${selectedItem.lokasi_sewa || ''}`);
        setTglKunjungan(selectedItem.tanggal_sewa || '');
      } else {
        setKeperluan(`Loading Barang Promo (${selectedItem.namaProduk || ''})`);
        setTglKunjungan(selectedItem.tanggalPromo || '');
      }
    }
  }, [selectedItem, source]);

  // Kelompokkan data berdasarkan tanggal untuk sidebar list
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      let rawDate = source === 'sewa' ? item.tanggal_sewa : item.tanggalPromo;
      if (!rawDate) rawDate = 'Tanpa Tanggal';
      
      let displayDate = rawDate;
      if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
      
      if (!groups[displayDate]) groups[displayDate] = [];
      groups[displayDate].push(item);
    });
    return groups;
  }, [filteredData, source]);

  const handlePrint = async () => {
    if (!selectedItem || !tglKunjungan || !nopol) {
      alert("Harap lengkapi Tanggal Kunjungan dan Plat Nomor (NOPOL)!");
      return;
    }

    const dateObj = new Date();
    const currentYear = dateObj.getFullYear();
    
    // Format Nomor
    const padZero = (num) => num.toString().padStart(2, '0');
    const yyyyMmDd = `${currentYear}-${padZero(dateObj.getMonth()+1)}-${padZero(dateObj.getDate())}`;
    const kode = source === 'promo' ? 'P' : 'R';
    
    let formatNomor = "";
    // Gunakan nomor surat yang sudah ada jika pernah dicetak
    if (selectedItem.isDispensasiPrinted && selectedItem.nomorSuratDispensasi) {
      formatNomor = selectedItem.nomorSuratDispensasi;
    } else {
      // Penomoran Acak Unik (4 digit) + Timestamp
      const randomCounter = Math.floor(1000 + Math.random() * 9000); 
      formatNomor = `${yyyyMmDd}/${kode}/${randomCounter}`;
    }

    // 2. Format HTML untuk Print
    const namaInstansi = source === 'sewa' ? selectedItem.nama_penyewa : selectedItem.namaPerusahaan;
    
    const printHtml = `
    <html>
      <head>
        <title>Cetak Surat Dispensasi - ${namaInstansi}</title>
        <style>
          @page { margin: 20mm; size: A4 portrait; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
          .kop-surat { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 30px; position: relative; }
          .kop-surat h3, .kop-surat h2, .kop-surat h1 { margin: 0; font-weight: bold; }
          .kop-surat h3 { font-size: 14pt; font-weight: normal; }
          .kop-surat h2 { font-size: 16pt; }
          .kop-surat h1 { font-size: 18pt; letter-spacing: 1px; }
          .kop-surat p { margin: 5px 0 0 0; font-size: 10pt; }
          .title-surat { text-align: center; margin-bottom: 30px; }
          .title-surat h3 { font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 0 0 5px 0; }
          .title-surat p { margin: 0; font-size: 12pt; }
          .content { margin: 0 20px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .info-table td { padding: 5px; vertical-align: top; }
          .info-table td:first-child { width: 30%; }
          .info-table td:nth-child(2) { width: 2%; }
          .ket-list { padding-left: 20px; margin-top: 10px; }
          .ket-list li { margin-bottom: 10px; text-align: justify; }
          .ttd-box { float: right; width: 350px; text-align: center; margin-top: 40px; }
          .ttd-box p { margin: 2px 0; }
          .ttd-space { height: 80px; }
          .footer { clear: both; margin-top: 30px; font-size: 11pt; text-align: justify; }
        </style>
      </head>
      <body>
        <div class="kop-surat">
          <h3>PEMERINTAH PROVINSI DAERAH KHUSUS IBU KOTA JAKARTA</h3>
          <h2>DINAS PERTAMANAN DAN HUTAN KOTA</h2>
          <h1>UNIT PENGELOLA TAMAN MARGASATWA RAGUNAN</h1>
          <p>Jalan Harsono RM. No. 1 Ragunan, Telp (021) 7820015 fax. (021) 7805280</p>
          <p>JAKARTA</p>
          <p style="text-align: right; font-weight: bold;">Kode Pos : 12550</p>
        </div>

        <div class="title-surat">
          <h3>DISPENSASI</h3>
          <p>NOMOR : ${formatNomor}</p>
        </div>

        <div class="content">
          <p>Kepala Unit Pengelola Taman Margasatwa Ragunan Provinsi DKI Jakarta memberikan ijin kepada :</p>
          
          <table class="info-table">
            <tr>
              <td>Nama Rombongan</td>
              <td>:</td>
              <td><strong>${namaInstansi || '-'}</strong></td>
            </tr>
            <tr>
              <td>Tanggal Kunjungan</td>
              <td>:</td>
              <td><strong>${tglKunjungan}</strong></td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>:</td>
              <td><strong>${keperluan}</strong></td>
            </tr>
            <tr>
              <td>Nomor Kendaraan</td>
              <td>:</td>
              <td><strong>${jmlKendaraan} (${nopol}) - ${jmlPersonel}</strong></td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <strong>Ketentuan :</strong>
            <ol class="ket-list">
              <li>Setelah selesai menurunkan barang, kendaraan kembali ke tempat parkir TMR dan tidak diperkenankan parkir ditempat acara ataupun berkeliling didalam kawasan TMR.</li>
              <li>Setiap pengantar barang wajib membayar tarif masuk berikut kendaraannya.</li>
              <li>Jadwal loading dari hari selasa s/d Minggu, ${jamLoading}.</li>
            </ol>
          </div>

          <p class="footer">Demikian Dispensasi ini diberikan untuk dipergunakan sebagaimana mestinya.</p>
          
          <div class="ttd-box">
            <p>Jakarta, ${dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <br/>
            <p>Kepala Unit Pengelola</p>
            <p>Taman Margasatwa Ragunan</p>
            <p>Dinas Pertamanan dan Hutan Kota</p>
            <p>Provinsi DKI Jakarta</p>
            <div class="ttd-space"></div>
            <p>(_________________________)</p>
          </div>
        </div>
      </body>
    </html>
    `;

    // 3. Cetak menggunakan Iframe tersembunyi (Tidak Buka Tab Baru)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    // Tunggu render selesai baru panggil print
    setTimeout(async () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Simpan riwayat dan update status cetak ke database di background
      try {
        const targetCollection = source === 'sewa' ? 'sewaList' : 'promoList';
        const docRef = doc(db, targetCollection, selectedItem.id);
        
        // Update status dokumen utama
        await updateDoc(docRef, {
          isDispensasiPrinted: true,
          nomorSuratDispensasi: formatNomor,
          tanggalCetakDispensasi: new Date().toISOString()
        });
        
        // Simpan ke riwayat
        await addDoc(collection(db, 'historyDispensasi'), {
          nomorSurat: formatNomor,
          idRombongan: selectedItem.id,
          namaRombongan: namaInstansi,
          tanggalKunjungan: tglKunjungan,
          nopol: nopol,
          tanggalCetak: new Date().toISOString(),
          sumber: source
        });

        // Update local state untuk memunculkan badge secara instan
        setFilteredData(prev => prev.map(item => item.id === selectedItem.id ? { ...item, isDispensasiPrinted: true, nomorSuratDispensasi: formatNomor } : item));
        setDataList(prev => prev.map(item => item.id === selectedItem.id ? { ...item, isDispensasiPrinted: true, nomorSuratDispensasi: formatNomor } : item));
        setSelectedItem(prev => ({...prev, isDispensasiPrinted: true, nomorSuratDispensasi: formatNomor}));

      } catch (err) {
        console.warn("Gagal menyimpan riwayat/status (Mungkin karena limit kuota Firebase).", err);
      }

      // Hapus iframe setelah popup print ditutup
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 500);
  };

  // Fungsi untuk membuka dan mengambil riwayat
  const handleOpenHistory = async () => {
    setShowHistory(true);
    setIsHistoryLoading(true);
    try {
      const snap = await getDocs(collection(db, 'historyDispensasi'));
      const histItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Urutkan dari yang terbaru
      histItems.sort((a, b) => new Date(b.tanggalCetak || 0) - new Date(a.tanggalCetak || 0));
      setHistoryData(histItems);
    } catch (err) {
      console.warn("Error fetching history:", err);
    }
    setIsHistoryLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-emerald-950 tracking-tight flex items-center gap-3">
            <FileText className="text-emerald-600" size={32} />
            Cetak Surat Dispensasi
          </h1>
          <p className="text-slate-500 font-medium mt-1">Buat format surat dispensasi loading barang otomatis (langsung PDF).</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button 
            onClick={handleOpenHistory}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Clock size={18} />
            Lihat Riwayat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolom Kiri: Pemilihan Sumber Data */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Building size={18}/> Pilih Sumber Data</h3>
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => setSource('sewa')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${source === 'sewa' ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                Penyewa (Rombongan)
              </button>
              <button 
                onClick={() => setSource('promo')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${source === 'promo' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                Data Promo
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Cari nama instansi/rombongan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-10 text-slate-400 font-medium">Memuat data...</div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-semibold text-sm">Tidak ada data ditemukan</p>
                </div>
              ) : (
                Object.keys(groupedData).map((dateKey) => (
                  <div key={dateKey} className="mb-4">
                    <div className="sticky top-0 bg-[#f8faf9] z-10 py-1.5 mb-2 backdrop-blur-sm">
                      <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">{dateKey}</h4>
                    </div>
                    <div className="space-y-3">
                      {groupedData[dateKey].map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedItem?.id === item.id ? 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/20' : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`font-extrabold text-sm ${selectedItem?.id === item.id ? 'text-white' : 'text-slate-800'}`}>
                              {source === 'sewa' ? item.nama_penyewa : item.namaPerusahaan}
                            </p>
                            {item.isDispensasiPrinted && (
                              <span title="Sudah Dicetak" className={`flex-shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedItem?.id === item.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                <CheckCircle2 size={10} />
                                DICETAK
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-medium ${selectedItem?.id === item.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {source === 'sewa' ? `Fasilitas: ${item.lokasi_sewa || '-'}` : `Produk: ${item.namaProduk || '-'}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Detail Input & Print */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-bl-full -z-10"></div>
              
              <h3 className="font-black text-xl text-emerald-950 mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                Lengkapi Data Surat
                <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider font-bold">Preview Input</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nama Instansi/Rombongan</label>
                  <p className="font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    {source === 'sewa' ? selectedItem.nama_penyewa : selectedItem.namaPerusahaan}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Tanggal Kunjungan</label>
                  <input 
                    type="text" 
                    value={tglKunjungan}
                    onChange={(e) => setTglKunjungan(e.target.value)}
                    placeholder="Contoh: 8 Agustus 2026"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Keperluan</label>
                  <input 
                    type="text" 
                    value={keperluan}
                    onChange={(e) => setKeperluan(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Car size={16}/> Informasi Kendaraan & Personel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Kendaraan</label>
                    <input 
                      type="text" 
                      value={jmlKendaraan}
                      onChange={(e) => setJmlKendaraan(e.target.value)}
                      placeholder="Misal: 1 Mobil"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Daftar Plat Nomor (NOPOL)</label>
                    <input 
                      type="text" 
                      value={nopol}
                      onChange={(e) => setNopol(e.target.value)}
                      placeholder="Contoh: B 1234 ABC, B 9999 XYZ"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Personel</label>
                    <input 
                      type="text" 
                      value={jmlPersonel}
                      onChange={(e) => setJmlPersonel(e.target.value)}
                      placeholder="Misal: 2 Dewasa"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Jam Loading</label>
                    <input 
                      type="text" 
                      value={jamLoading}
                      onChange={(e) => setJamLoading(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {selectedItem.isDispensasiPrinted && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} /> Dokumen Pernah Dicetak
                    </span>
                  )}
                </div>
                <button 
                  onClick={handlePrint}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                >
                  <Printer size={20} />
                  {selectedItem.isDispensasiPrinted ? 'Cetak Ulang PDF' : 'Cetak PDF'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mb-6">
                <Printer size={48} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Pilih Data Untuk Dicetak</h4>
              <p className="text-slate-500 max-w-sm">Silakan pilih instansi/rombongan dari daftar di sebelah kiri untuk mulai mengisi format surat dispensasi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal History */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Clock className="text-emerald-600" />
                Riwayat Cetak Dispensasi
              </h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {isHistoryLoading ? (
                <div className="text-center py-12 text-slate-500 font-medium">Memuat Riwayat...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Belum ada riwayat cetak surat.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.map(hist => (
                    <div key={hist.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-200 transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{hist.nomorSurat}</span>
                          <span className="text-xs font-semibold text-slate-400">
                            {new Date(hist.tanggalCetak).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-base">{hist.namaRombongan}</h4>
                        <p className="text-xs text-slate-500 mt-1">Kunjungan: <strong>{hist.tanggalKunjungan}</strong> | Nopol: <strong>{hist.nopol}</strong></p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-black tracking-wider text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">
                          {hist.sumber === 'sewa' ? 'Sewa/Rombongan' : 'Promo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
