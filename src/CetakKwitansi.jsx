import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Printer, Search, Building, CheckCircle2, ChevronLeft } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import PizZip from 'pizzip';

const getPromoDate = (item) => {
    if (item.selectedDates && Array.isArray(item.selectedDates) && item.selectedDates.length > 0) {
        const first = item.selectedDates[0];
        return typeof first === 'object' && first !== null ? first.date : first;
    }
    return item.tanggalPromo || null;
};

export default function CetakKwitansi({ onNavigate }) {
  const [source, setSource] = useState('sewa'); // 'sewa' or 'promo'
  const [dataList, setDataList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Print & Google Drive state
  const [isGenerating, setIsGenerating] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const CLIENT_ID = '905355425334-tbtvuvufgvnom6vnlb5d0rka00ih03if.apps.googleusercontent.com';

  // Fetch Data
  useEffect(() => {
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
  }, [source]);

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

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(dataList);
    } else {
      const lower = search.toLowerCase();
      setFilteredData(dataList.filter(item => {
        if (source === 'sewa') return (item.nama_penyewa || '').toLowerCase().includes(lower) || (item.id_sewa || '').toLowerCase().includes(lower);
        if (source === 'promo') return (item.namaPerusahaan || '').toLowerCase().includes(lower) || (item.namaProduk || '').toLowerCase().includes(lower);
        return false;
      }));
    }
  }, [search, dataList, source]);

  // Kelompokkan data berdasarkan tanggal untuk sidebar list
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      let rawDate = source === 'sewa' ? item.tanggal_sewa : getPromoDate(item);
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

  const handleCreateSheet = async () => {
    if (!selectedItem) {
      alert("Harap pilih data terlebih dahulu!");
      return;
    }

    setIsGenerating(true);
    try {
      const namaInstansi = source === 'sewa' ? selectedItem.nama_penyewa : selectedItem.namaPerusahaan;
      const fileNameStr = source === 'sewa' ? 'rombongan' : 'promo';
      
      // Fetch blank template from public
      const response = await fetch(`/kwitansi ${fileNameStr}.xlsx`);
      if (!response.ok) throw new Error(`Template kwitansi ${fileNameStr}.xlsx tidak ditemukan di folder public`);
      const arrayBuffer = await response.arrayBuffer();

      const channelTransfer = window.prompt("Masukkan metode/channel transfer (contoh: Bank DKI, BCA, GoPay, ShopeePay):", "Bank DKI");
      if (channelTransfer === null) {
          setIsGenerating(false);
          return;
      }

      const terbilang = (angka) => {
          angka = Math.abs(parseInt(angka, 10));
          if (isNaN(angka)) return "";
          var kata = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
          if (angka < 12) return kata[angka];
          if (angka < 20) return terbilang(angka - 10) + " Belas";
          if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
          if (angka < 200) return "Seratus " + terbilang(angka - 100);
          if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
          if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
          if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
          if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
          if (angka < 1000000000000) return terbilang(Math.floor(angka / 1000000000)) + " Milyar " + terbilang(angka % 1000000000);
          return "";
      };

      const formatRupiahStr = (angka) => new Intl.NumberFormat('id-ID').format(angka);
      
      const escapeXml = (unsafe) => {
          if (!unsafe) return "";
          return String(unsafe).replace(/[<>&'"]/g, function (c) {
              switch (c) {
                  case '<': return '&lt;';
                  case '>': return '&gt;';
                  case '&': return '&amp;';
                  case '\'': return '&apos;';
                  case '"': return '&quot;';
              }
          });
      };

      const today = new Date();
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      
      let replacements = {};
      if (source === 'promo') {
          const nominalNumeric = selectedItem.jumlahTransferNumeric || parseInt(String(selectedItem.jumlahTransfer).replace(/\D/g, ''), 10) || 0;
          replacements = {
              '<<Nama PT>>': selectedItem.namaPerusahaan || '',
              '<<Terbilang>>': terbilang(nominalNumeric) + ' Rupiah',
              '<<nama produk>>': selectedItem.namaProduk || '',
              '<<Jumlah hari>>': selectedItem.jumlahHari || '',
              '<<tanggal promo>>': selectedItem.tanggalPromo || '',
              '<<Transfer>>': channelTransfer,
              '<<reff>>': `KWT-TMR-${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`,
              '<<tanggal>>': String(today.getDate()),
              '<<bulan>>': monthNames[today.getMonth()],
              '<<tahun>>': String(today.getFullYear()),
              '<<Jml Transfer>>': formatRupiahStr(nominalNumeric)
          };
      } else {
          const nominalNumeric = selectedItem.total_biaya || 0;
          replacements = {
              '<<Nama Penyewa>>': selectedItem.nama_penyewa || '',
              '<<Nama PT>>': selectedItem.nama_penyewa || '', 
              '<<Terbilang>>': terbilang(nominalNumeric) + ' Rupiah',
              '<<Lokasi Sewa>>': selectedItem.lokasi_sewa || '',
              '<<Kegiatan>>': selectedItem.kegiatan || 'Sewa Fasilitas',
              '<<Tanggal Sewa>>': selectedItem.tanggal_sewa || '',
              '<<Transfer>>': channelTransfer,
              '<<reff>>': selectedItem.id_sewa || '',
              '<<tanggal>>': String(today.getDate()),
              '<<bulan>>': monthNames[today.getMonth()],
              '<<tahun>>': String(today.getFullYear()),
              '<<Jml Transfer>>': formatRupiahStr(nominalNumeric)
          };
      }

      const zip = new PizZip(arrayBuffer);
      Object.keys(zip.files).forEach(filename => {
          if (filename.endsWith('.xml')) {
              let content = zip.files[filename].asText();
              let changed = false;
              for (const [key, value] of Object.entries(replacements)) {
                  const escapedKey = escapeXml(key);
                  const valStr = escapeXml(value);
                  if (content.includes(escapedKey)) {
                      content = content.split(escapedKey).join(valStr);
                      changed = true;
                  }
                  if (content.includes(key)) {
                      content = content.split(key).join(valStr);
                      changed = true;
                  }
              }
              if (changed) {
                  zip.file(filename, content);
              }
          }
      });

      const blob = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

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

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Cari nama instansi/ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-600 outline-none"
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

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {selectedItem.kwitansiDriveUrl && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} /> Spreadsheet Tersedia
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedItem.kwitansiDriveUrl && (
                    <button 
                      onClick={() => window.open(selectedItem.kwitansiDriveUrl, '_blank')}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-all"
                    >
                      <FileText size={20} />
                      Buka Spreadsheet
                    </button>
                  )}
                  <button 
                    onClick={() => handleCreateSheet()}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Printer size={20} />
                    {isGenerating ? "Memproses..." : (selectedItem.kwitansiDriveUrl ? "Buat Sheet Baru" : "Buat Spreadsheet & Cetak")}
                  </button>
                </div>
              </div>
              
              <div className="mt-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium leading-relaxed">
                      💡 <strong>Info:</strong> Fitur ini akan menggunakan file template Excel yang ada di folder public (<em>kwitansi {source === 'sewa' ? 'rombongan' : 'promo'}.xlsx</em>), 
                      lalu mengunggahnya ke Google Drive Anda sebagai Google Spreadsheet kosong. Anda dapat mengisinya secara manual di Spreadsheet sebelum mencetak.
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
