import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Printer, Search, Building, CheckCircle2, ChevronLeft, Download, Calendar, CalendarDays, X, RotateCcw } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { openKwitansiPrintWindow, downloadKwitansiExcel, generateKwitansiExcelBlob } from './utils/kwitansiHelper';

const normalizeDateString = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'object') {
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      const parsed = dateVal.toDate();
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (dateVal instanceof Date) {
      const y = dateVal.getFullYear();
      const m = String(dateVal.getMonth() + 1).padStart(2, '0');
      const d = String(dateVal.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (dateVal.seconds !== undefined) {
      const parsed = new Date(dateVal.seconds * 1000);
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  if (typeof dateVal !== 'string') return '';
  const s = dateVal.trim();
  
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s;
};

const formatTanggalIndo = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const norm = normalizeDateString(dateStr);
    if (!norm || !/^\d{4}-\d{2}-\d{2}$/.test(norm)) return dateStr;
    const [year, month, day] = norm.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch(e) {
    return dateStr;
  }
};

const getPromoDate = (item) => {
    if (item.selectedDates && Array.isArray(item.selectedDates) && item.selectedDates.length > 0) {
        const first = item.selectedDates[0];
        return typeof first === 'object' && first !== null ? first.date : first;
    }
    return item.tanggalPromo || null;
};

const getItemDates = (item, isPromo) => {
  if (!isPromo) {
    const d = normalizeDateString(item.tanggal_sewa);
    return d ? [d] : [];
  }
  const dates = [];
  if (item.selectedDates && Array.isArray(item.selectedDates)) {
    item.selectedDates.forEach(sd => {
      const raw = typeof sd === 'object' && sd !== null ? sd.date : sd;
      const norm = normalizeDateString(raw);
      if (norm && !dates.includes(norm)) dates.push(norm);
    });
  }
  const primary = normalizeDateString(getPromoDate(item));
  if (primary && !dates.includes(primary)) dates.push(primary);
  return dates;
};

const isItemOnDate = (item, targetDate, isPromo) => {
  if (!targetDate) return true;
  const dates = getItemDates(item, isPromo);
  return dates.includes(targetDate);
};

export default function CetakKwitansi({ onNavigate, initialSewaList = null }) {
  const [source, setSource] = useState('sewa'); // 'sewa' or 'promo'
  const [dataList, setDataList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedVisitDate, setSelectedVisitDate] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Print & Google Drive state
  const [isGenerating, setIsGenerating] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const CLIENT_ID = '905355425334-tbtvuvufgvnom6vnlb5d0rka00ih03if.apps.googleusercontent.com';

  // Fetch Data (Optimized with in-memory prop fallback to prevent redundant network queries)
  useEffect(() => {
    if (source === 'sewa' && initialSewaList && initialSewaList.length > 0) {
      let items = [...initialSewaList];
      items.sort((a, b) => new Date(b.tanggal_sewa || 0) - new Date(a.tanggal_sewa || 0));
      setDataList(items);
      setFilteredData(items);
      setSelectedItem(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const targetCollection = source === 'sewa' ? 'sewaList' : 'promoList';
        const snapshot = await getDocs(collection(db, targetCollection));
        let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter: urutkan saja dari yang terbaru
        items.sort((a, b) => {
           const dateA = source === 'sewa' ? a.tanggal_sewa : getPromoDate(a);
           const dateB = source === 'sewa' ? b.tanggal_sewa : getPromoDate(b);
           return new Date(dateB || 0) - new Date(dateA || 0); // Descending
        });
        
        setDataList(items);
        setFilteredData(items);
        setSelectedItem(null);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
      }
      setIsLoading(false);
    };
    fetchData();

    // Inisialisasi Google API Client
    if (window.gapi) {
        window.gapi.load('client', () => {});
    }
  }, [source, initialSewaList]);

  const requestGoogleToken = () => {
      return new Promise((resolve, reject) => {
          if (googleAccessToken) {
              resolve(googleAccessToken);
              return;
          }
          if (!window.google) {
              reject(new Error("Google Script belum dimuat. Silakan muat ulang halaman."));
              return;
          }
          const client = window.google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/drive.file',
              callback: (response) => {
                  if (response.error) {
                      reject(response.error);
                  } else {
                      setGoogleAccessToken(response.access_token);
                      resolve(response.access_token);
                  }
              },
          });
          client.requestAccessToken();
      });
  };

  const uploadToGoogleDrive = async (blob, fileName, recordId, targetCollection) => {
      try {
          const token = await requestGoogleToken();
          
          const metadata = {
              name: fileName,
              mimeType: 'application/vnd.google-apps.spreadsheet', // Convert to Google Sheets
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', blob);

          const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: new Headers({ 'Authorization': 'Bearer ' + token }),
              body: form,
          });

          if (!response.ok) {
              throw new Error("Gagal mengunggah ke Google Drive");
          }
          const result = await response.json();
          const fileId = result.id;
          
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
              method: 'POST',
              headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  role: 'writer',
                  type: 'anyone'
              })
          });

          const docUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
          
          if (recordId && targetCollection) {
             await updateDoc(doc(db, targetCollection, recordId), {
                 kwitansiDriveUrl: docUrl
             });
          }

          return docUrl;
      } catch (error) {
          console.error("Drive Error:", error);
          throw error;
      }
  };

  // Available dates with count for quick filter chips
  const availableDatesWithCount = useMemo(() => {
    const counts = {};
    const isPromo = source === 'promo';
    dataList.forEach(item => {
      const dates = getItemDates(item, isPromo);
      dates.forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    return Object.keys(counts).sort((a, b) => new Date(b) - new Date(a)).map(d => ({
      date: d,
      count: counts[d],
      label: formatTanggalIndo(d)
    }));
  }, [dataList, source]);

  // Search & calendar visit date filter
  useEffect(() => {
    let result = dataList;

    // Filter berdasarkan tanggal kunjungan dari kalender (jika dipilih)
    if (selectedVisitDate) {
      result = result.filter(item => isItemOnDate(item, selectedVisitDate, source === 'promo'));
    }

    // Filter pencarian teks
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(item => {
        if (source === 'sewa') {
          return (item.nama_penyewa || '').toLowerCase().includes(lower) || 
                 (item.id_sewa || '').toLowerCase().includes(lower) ||
                 (item.lokasi_sewa || '').toLowerCase().includes(lower);
        }
        if (source === 'promo') {
          return (item.namaPerusahaan || '').toLowerCase().includes(lower) || 
                 (item.namaProduk || '').toLowerCase().includes(lower);
        }
        return false;
      });
    }

    setFilteredData(result);
  }, [search, selectedVisitDate, dataList, source]);

  // Kelompokkan data berdasarkan tanggal untuk sidebar list
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      let rawDate = source === 'sewa' ? item.tanggal_sewa : getPromoDate(item);
      if (!rawDate) rawDate = 'Tanpa Tanggal';
      
      let displayDate = rawDate;
      const norm = normalizeDateString(rawDate);
      if (norm && /^\d{4}-\d{2}-\d{2}$/.test(norm)) {
        displayDate = formatTanggalIndo(norm);
      }
      
      if (!groups[displayDate]) groups[displayDate] = [];
      groups[displayDate].push(item);
    });
    return groups;
  }, [filteredData, source]);

  const handlePrintDirect = () => {
    if (!selectedItem) {
      alert("Harap pilih data terlebih dahulu!");
      return;
    }
    
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const input = window.prompt("Tanggal Kwitansi (Otomatis Hari Ini).\nJika butuh tanggal mundur, masukkan format YYYY-MM-DD:", todayStr);
    let printDateObj = new Date();
    if (input === null) return;
    if (input.trim()) {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) printDateObj = parsed;
    }

    if (source === 'promo') {
      const nominalNumeric = selectedItem.jumlahTransferNumeric || parseInt(String(selectedItem.jumlahTransfer).replace(/\D/g, ''), 10) || 0;
      openKwitansiPrintWindow({
        type: 'promo',
        namaPenyewa: selectedItem.namaPerusahaan || '',
        nominal: nominalNumeric,
        namaProduk: selectedItem.namaProduk || '-',
        jumlahHari: selectedItem.jumlahHari || 1,
        tanggalPelaksanaan: getPromoDate(selectedItem),
        transferChannel: 'Bank DKI',
        noRef: selectedItem.noRef || selectedItem.id || '',
        printDate: printDateObj
      });
    } else {
      openKwitansiPrintWindow({
        type: 'sewa',
        namaPenyewa: `${selectedItem.nama_penyewa || ''}${selectedItem.instansi_penyewa ? ' / ' + selectedItem.instansi_penyewa : ''}`,
        nominal: selectedItem.total_biaya || 0,
        kegiatan: selectedItem.kegiatan || 'Sewa Fasilitas',
        lokasi: selectedItem.lokasi_sewa || '-',
        tanggalPelaksanaan: selectedItem.tanggal_sewa,
        transferChannel: 'Bank DKI',
        noRef: selectedItem.id_sewa || selectedItem.id || '',
        printDate: printDateObj
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedItem) {
      alert("Harap pilih data terlebih dahulu!");
      return;
    }
    try {
      await downloadKwitansiExcel({
        type: source,
        item: selectedItem,
        channelTransfer: 'Bank DKI',
        printDate: new Date()
      });
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh template Excel: " + err.message);
    }
  };

  const handleCreateSheet = async () => {
    if (!selectedItem) {
      alert("Harap pilih data terlebih dahulu!");
      return;
    }

    setIsGenerating(true);
    try {
      const namaInstansi = source === 'sewa' ? selectedItem.nama_penyewa : selectedItem.namaPerusahaan;
      const fileNameStr = source === 'sewa' ? 'rombongan' : 'promo';

      const channelTransfer = window.prompt("Masukkan metode/channel transfer (contoh: Bank DKI, BCA, GoPay, ShopeePay):", "Bank DKI");
      if (channelTransfer === null) {
          setIsGenerating(false);
          return;
      }

      const blob = await generateKwitansiExcelBlob({
        type: source,
        item: selectedItem,
        channelTransfer: channelTransfer || 'Bank DKI',
        printDate: new Date()
      });

      const docName = `Kwitansi ${fileNameStr.charAt(0).toUpperCase() + fileNameStr.slice(1)} - ${namaInstansi} - ${source === 'sewa' ? selectedItem.id_sewa : (getPromoDate(selectedItem) || 'TanpaTanggal')}`;
      const targetCollection = source === 'sewa' ? 'sewaList' : 'promoList';
      
      const docUrl = await uploadToGoogleDrive(blob, docName, selectedItem.id, targetCollection);

      const docRef = doc(db, targetCollection, selectedItem.id);
      await updateDoc(docRef, {
        isKwitansiPrinted: true,
        tanggalCetakKwitansi: new Date().toISOString()
      });
      
      setFilteredData(prev => prev.map(item => item.id === selectedItem.id ? { ...item, isKwitansiPrinted: true, kwitansiDriveUrl: docUrl } : item));
      setDataList(prev => prev.map(item => item.id === selectedItem.id ? { ...item, isKwitansiPrinted: true, kwitansiDriveUrl: docUrl } : item));
      setSelectedItem(prev => ({...prev, isKwitansiPrinted: true, kwitansiDriveUrl: docUrl}));

      window.open(docUrl, '_blank');

    } catch (err) {
      console.error(err);
      alert("Gagal membuat/mengunggah dokumen. " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-colors shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="text-amber-500" size={32} />
            Cetak Kwitansi
          </h2>
          <p className="text-slate-500 font-medium mt-1">Buat format kwitansi (Rombongan/Promo) dan buka di Google Spreadsheet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolom Kiri: Pemilihan Sumber Data */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Building size={18}/> Pilih Data Reservasi</h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button 
                onClick={() => setSource('sewa')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${source === 'sewa' ? 'bg-amber-50 border-amber-600 text-amber-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
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

            {/* Kalender Pilihan Tanggal Kunjungan */}
            <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shadow-amber-600/20">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[11px] text-amber-950 uppercase tracking-wide">
                      Filter Tanggal Kunjungan
                    </h4>
                    <p className="text-[11px] font-bold text-amber-800">
                      {selectedVisitDate ? formatTanggalIndo(selectedVisitDate) : 'Semua Tanggal'}
                    </p>
                  </div>
                </div>
                {selectedVisitDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedVisitDate('')}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-white hover:bg-amber-100/60 border border-amber-300 px-2.5 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Tampilkan semua tanggal"
                  >
                    <X size={11} /> Reset
                  </button>
                )}
              </div>

              {/* Input Kalender & Quick Button Hari Ini */}
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedVisitDate}
                  onChange={(e) => setSelectedVisitDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    setSelectedVisitDate(tStr);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-amber-600/20 whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  Hari Ini
                </button>
              </div>

              {/* Quick Date Chips (Tanggal Tersedia yang ada Datanya) */}
              {availableDatesWithCount.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-amber-200/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9.5px] font-extrabold text-amber-900 uppercase tracking-wider">
                      Tanggal Tersedia ({availableDatesWithCount.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                    {availableDatesWithCount.slice(0, 16).map((item) => {
                      const isSelected = selectedVisitDate === item.date;
                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => setSelectedVisitDate(isSelected ? '' : item.date)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-700 text-white border-amber-700 shadow-xs' 
                              : 'bg-white text-amber-950 border-amber-200/80 hover:bg-amber-100/60'
                          }`}
                        >
                          <CalendarDays size={10} className={isSelected ? 'text-white' : 'text-amber-600'} />
                          <span>{item.date}</span>
                          <span className={`text-[9px] px-1 py-0.1 rounded-full font-black ${isSelected ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-800'}`}>
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Cari nama instansi/ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-600 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="h-[380px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-10 text-slate-400 font-medium">Memuat data...</div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-semibold text-sm">
                    {selectedVisitDate 
                      ? `Tidak ada data kunjungan pada ${formatTanggalIndo(selectedVisitDate)}` 
                      : 'Tidak ada data ditemukan'}
                  </p>
                  {selectedVisitDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedVisitDate('')}
                      className="mt-3 px-3.5 py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw size={12} /> Tampilkan Semua Tanggal
                    </button>
                  )}
                </div>
              ) : (
                Object.keys(groupedData).map((dateKey) => (
                  <div key={dateKey} className="mb-4">
                    <div className="sticky top-0 bg-[#f8faf9] z-10 py-1.5 mb-2 backdrop-blur-sm">
                      <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-wider">{dateKey}</h4>
                    </div>
                    <div className="space-y-3">
                      {groupedData[dateKey].map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedItem?.id === item.id ? 'bg-amber-600 border-amber-600 shadow-md shadow-amber-600/20' : 'bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50/50'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`font-extrabold text-sm ${selectedItem?.id === item.id ? 'text-white' : 'text-slate-800'}`}>
                              {source === 'sewa' ? item.nama_penyewa : item.namaPerusahaan}
                            </p>
                            {item.kwitansiDriveUrl && (
                              <span title="Spreadsheet Dibuat" className={`flex-shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedItem?.id === item.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                <CheckCircle2 size={10} />
                                SIAP
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-medium ${selectedItem?.id === item.id ? 'text-amber-100' : 'text-slate-500'}`}>
                            {source === 'sewa' ? `Status: ${item.status_pembayaran || '-'}` : `Produk: ${item.namaProduk || '-'}`}
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

        {/* Kolom Kanan: Detail & Print */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-bl-full -z-10"></div>
              
              <h3 className="font-black text-xl text-amber-950 mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                Informasi Kwitansi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nama Instansi/Rombongan</label>
                  <p className="font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    {source === 'sewa' ? selectedItem.nama_penyewa : selectedItem.namaPerusahaan}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Total Biaya</label>
                  <p className="font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    {source === 'sewa' 
                        ? (selectedItem.total_biaya !== undefined ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedItem.total_biaya) : 'Rp -') 
                        : '-'}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  {selectedItem.kwitansiDriveUrl && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} /> Spreadsheet Tersedia
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handlePrintDirect}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 text-sm transition-all active:scale-95"
                    title="Cetak kwitansi resmi langsung sesuai format Excel beserta logo Ragunan"
                  >
                    <Printer size={16} />
                    Cetak Kwitansi (Print / PDF)
                  </button>

                  <button 
                    onClick={handleDownloadExcel}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center gap-2 text-sm transition-all active:scale-95"
                    title="Unduh file template Excel (.xlsx) yang sudah terisi otomatis"
                  >
                    <Download size={16} />
                    Unduh Excel (.xlsx)
                  </button>

                  {selectedItem.kwitansiDriveUrl && (
                    <button 
                      onClick={() => window.open(selectedItem.kwitansiDriveUrl, '_blank')}
                      className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 flex items-center gap-2 text-sm transition-all"
                    >
                      <FileText size={16} />
                      Buka Spreadsheet
                    </button>
                  )}

                  <button 
                    onClick={() => handleCreateSheet()}
                    disabled={isGenerating}
                    className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold rounded-xl flex items-center gap-2 text-sm transition-all disabled:opacity-50"
                  >
                    <FileText size={16} />
                    {isGenerating ? "Memproses..." : (selectedItem.kwitansiDriveUrl ? "Perbarui Sheet" : "Upload ke Google Drive")}
                  </button>
                </div>
              </div>
              
              <div className="mt-8 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                      💡 <strong>Format Resmi TMR:</strong> Kwitansi dicetak menggunakan tata letak resmi sesuai file Excel template di folder public lengkap dengan <strong>Logo Miring Ragunan</strong>, rincian terbilang, dan referensi transaksi.
                  </p>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="w-24 h-24 bg-amber-50 text-amber-300 rounded-full flex items-center justify-center mb-6">
                <Printer size={48} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Pilih Data Untuk Kwitansi</h4>
              <p className="text-slate-500 max-w-sm">Silakan pilih data reservasi rombongan atau promo dari daftar di sebelah kiri untuk membuat spreadsheet kwitansi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
