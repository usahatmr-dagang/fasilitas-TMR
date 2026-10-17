import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Printer, Search, Building, Users, Car, CheckCircle2, ChevronLeft, Clock, X, Loader2, Calendar, CalendarDays } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc } from 'firebase/firestore';

// PizZip and Docxtemplater for docx generation
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

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

const formatMultiTanggal = (dates) => {
    if (!dates || dates.length === 0) return '-';
    
    // Sort array strings so they are ordered by date
    const dateStrs = dates.map(d => typeof d === 'object' && d !== null ? d.date : d).sort();
    const dateObjs = dateStrs.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
    if (dateObjs.length === 0) return '-';

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const grouped = {};
    dateObjs.forEach(d => {
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();
        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][month]) grouped[year][month] = [];
        if (!grouped[year][month].includes(day)) {
            grouped[year][month].push(day);
        }
    });

    const resultParts = [];
    const years = Object.keys(grouped).sort();
    
    years.forEach((year) => {
        const months = Object.keys(grouped[year]).sort((a, b) => Number(a) - Number(b));
        const yearPart = [];
        
        months.forEach((month, monthIndex) => {
            const days = grouped[year][month];
            const daysStr = days.join(',');
            const monthName = monthNames[month];
            
            if (years.length === 1) {
                yearPart.push(`${daysStr} ${monthName}`);
            } else {
                if (monthIndex === months.length - 1) {
                   yearPart.push(`${daysStr} ${monthName} ${year}`);
                } else {
                   yearPart.push(`${daysStr} ${monthName}`);
                }
            }
        });
        
        if (years.length === 1) {
            resultParts.push(yearPart.join(', ') + ` ${year}`);
        } else {
            resultParts.push(yearPart.join(', '));
        }
    });

    return resultParts.join(', ');
};

export default function SuratDispensasi({ onNavigate, initialSewaList = null }) {
  const [source, setSource] = useState('sewa'); // 'sewa' or 'promo'
  const [dataList, setDataList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedVisitDate, setSelectedVisitDate] = useState('');
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

  // Print & Google Drive state
  const [isGenerating, setIsGenerating] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const CLIENT_ID = '905355425334-tbtvuvufgvnom6vnlb5d0rka00ih03if.apps.googleusercontent.com';

  // Fetch Data (Optimized with in-memory prop fallback to prevent redundant network queries)
  useEffect(() => {
    if (source === 'sewa' && initialSewaList && initialSewaList.length > 0) {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let items = initialSewaList.map(item => ({
        ...item,
        normalizedDate: normalizeDateString(item.tanggal_sewa)
      })).filter(item => !!item.normalizedDate);

      items.sort((a, b) => (a.normalizedDate || '').localeCompare(b.normalizedDate || ''));
      setDataList(items);

      const upcomingItem = items.find(i => i.normalizedDate >= todayStr);
      if (upcomingItem) {
        setSelectedVisitDate(upcomingItem.normalizedDate);
      } else if (items.length > 0) {
        setSelectedVisitDate(items[0].normalizedDate);
      } else {
        setSelectedVisitDate(todayStr);
      }

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
        
        // Get today string in YYYY-MM-DD (local timezone safe)
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Normalize item dates
        items = items.map(item => {
           const raw = source === 'sewa' ? item.tanggal_sewa : getPromoDate(item);
           const norm = normalizeDateString(raw);
           return {
              ...item,
              normalizedDate: norm
           };
        }).filter(item => !!item.normalizedDate);

        // Sort chronologically ascending
        items.sort((a, b) => (a.normalizedDate || '').localeCompare(b.normalizedDate || ''));

        setDataList(items);

        // Default calendar visit date: first upcoming date that has data
        const upcomingItem = items.find(i => i.normalizedDate >= todayStr);
        if (upcomingItem) {
           setSelectedVisitDate(upcomingItem.normalizedDate);
        } else if (items.length > 0) {
           setSelectedVisitDate(items[0].normalizedDate);
        } else {
           setSelectedVisitDate(todayStr);
        }

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
              mimeType: 'application/vnd.google-apps.document',
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

          const docUrl = `https://docs.google.com/document/d/${fileId}/edit`;
          
          // Optionally update the doc to store the URL if needed, but not strictly required
          if (recordId && targetCollection) {
             await updateDoc(doc(db, targetCollection, recordId), {
                 dispensasiDriveUrl: docUrl
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
    dataList.forEach(item => {
      const d = item.normalizedDate;
      if (d) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return Object.keys(counts).sort().map(d => ({
      date: d,
      count: counts[d],
      label: formatTanggalIndo(d)
    }));
  }, [dataList]);

  // Search & calendar visit date filter
  useEffect(() => {
    let result = dataList;

    // Filter berdasarkan tanggal kunjungan dari kalender (jika dipilih)
    if (selectedVisitDate) {
      result = result.filter(item => item.normalizedDate === selectedVisitDate);
    }

    // Filter pencarian teks
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(item => {
        if (source === 'sewa') {
          return (item.nama_penyewa || '').toLowerCase().includes(lower) || 
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

  // Pre-fill data when item selected
  useEffect(() => {
    if (selectedItem) {
      if (source === 'sewa') {
        setKeperluan(`Loading Barang ke ${selectedItem.lokasi_sewa || ''}`);
        
        const singleDate = selectedItem.normalizedDate || selectedItem.tanggal_sewa;
        if (singleDate) {
          setTglKunjungan(formatTanggalIndo(singleDate));
        } else {
          setTglKunjungan('');
        }
        
      } else {
        setKeperluan(`Loading Barang Promo (${selectedItem.namaProduk || ''})`);
        
        if (selectedItem.selectedDates && Array.isArray(selectedItem.selectedDates) && selectedItem.selectedDates.length > 0) {
          setTglKunjungan(formatMultiTanggal(selectedItem.selectedDates));
        } else {
          const singlePDate = selectedItem.normalizedDate || selectedItem.tanggalPromo;
          if (singlePDate) {
            setTglKunjungan(formatTanggalIndo(singlePDate));
          } else {
            setTglKunjungan('');
          }
        }
      }
    }
  }, [selectedItem, source]);

  // Kelompokkan data berdasarkan tanggal untuk sidebar list
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      const displayDate = item.normalizedDate ? formatTanggalIndo(item.normalizedDate) : 'Tanpa Tanggal';
      if (!groups[displayDate]) groups[displayDate] = [];
      groups[displayDate].push(item);
    });
    return groups;
  }, [filteredData]);

  const handlePrint = async (forceUpdate = false) => {
    if (!selectedItem || !tglKunjungan || !nopol) {
      alert("Harap lengkapi Tanggal Kunjungan dan Plat Nomor (NOPOL)!");
      return;
    }

    setIsGenerating(true);
    try {
      const dateObj = new Date();
      
      let formatNomor = selectedItem.nomorSuratDispensasi;
      if (!formatNomor || forceUpdate === false) {
          const currentYear = dateObj.getFullYear();
          const padZero = (num) => num.toString().padStart(2, '0');
          const yyyyMmDd = `${currentYear}-${padZero(dateObj.getMonth()+1)}-${padZero(dateObj.getDate())}`;
          const kode = source === 'promo' ? 'P' : 'R';
          
          // Get sequential counter starting from 437
          const counterRef = doc(db, 'counters', 'dispensasi');
          const counterSnap = await getDoc(counterRef);
          
          let nextNum = 437; // if no document exists, start at 437
          if (counterSnap.exists()) {
              const data = counterSnap.data();
              if (data.year === currentYear) {
                  nextNum = (data.currentNumber || 436) + 1;
              } else if (data.year && data.year !== currentYear) {
                  nextNum = 1; // Reset for new year
              } else {
                  // Transition phase for existing data without year
                  nextNum = (data.currentNumber || 436) + 1;
              }
          }
          await setDoc(counterRef, { currentNumber: nextNum, year: currentYear }, { merge: true });
          
          const seqStr = String(nextNum).padStart(4, '0'); 
          formatNomor = `${yyyyMmDd}/${kode}/${seqStr}`;
      }
      
      const namaInstansi = source === 'sewa' ? selectedItem.nama_penyewa : selectedItem.namaPerusahaan;
      
      const response = await fetch('/dispensasi.docx');
      if (!response.ok) throw new Error("Template dispensasi.docx tidak ditemukan");
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const docTemplater = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '<<', end: '>>' }
      });

      const formatTgl = (tgl) => {
          if (!tgl) return '-';
          return formatTanggalIndo(tgl);
      };

      docTemplater.render({
        nomor: formatNomor,
        Nomor: formatNomor,
        NOMOR: formatNomor,
        nomorSurat: formatNomor,
        namaRombongan: namaInstansi || '-',
        tanggalKunjungan: formatTgl(tglKunjungan),
        TanggalKunjungan: formatTgl(tglKunjungan),
        keperluan: keperluan,
        nopol: nopol,
        jmlKendaraan: jmlKendaraan,
        jmlPersonel: jmlPersonel,
        jamLoading: jamLoading,
        tanggalHariIni: dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      });

      const docxBlob = docTemplater.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
      });

      const fileName = `Surat Dispensasi - ${namaInstansi} - ${formatNomor.replace(/\//g, '_')}`;
      const targetCollection = source === 'sewa' ? 'sewaList' : 'promoList';
      
      const docUrl = await uploadToGoogleDrive(docxBlob, fileName, selectedItem.id, targetCollection);

      const docRef = doc(db, targetCollection, selectedItem.id);
      await updateDoc(docRef, {
        isDispensasiPrinted: true,
        nomorSuratDispensasi: formatNomor,
        tanggalCetakDispensasi: new Date().toISOString()
      });
      
      await addDoc(collection(db, 'historyDispensasi'), {
        nomorSurat: formatNomor,
        idRombongan: selectedItem.id,
        namaRombongan: namaInstansi,
        tanggalKunjungan: tglKunjungan,
        nopol: nopol,
        keperluan: keperluan,
        jmlKendaraan: jmlKendaraan,
        jmlPersonel: jmlPersonel,
        jamLoading: jamLoading,
        tanggalCetak: new Date().toISOString(),
        sumber: source,
        dispensasiDriveUrl: docUrl
      });

      setFilteredData(prev => prev.map(item => item.id === selectedItem.id ? { ...item, isDispensasiPrinted: true, nomorSuratDispensasi: formatNomor, dispensasiDriveUrl: docUrl } : item));
      setDataList(prev => prev.map(item => item.id === selectedItem.id ? { ...item, isDispensasiPrinted: true, nomorSuratDispensasi: formatNomor, dispensasiDriveUrl: docUrl } : item));
      setSelectedItem(prev => ({...prev, isDispensasiPrinted: true, nomorSuratDispensasi: formatNomor, dispensasiDriveUrl: docUrl}));

      window.open(docUrl, '_blank');

    } catch (err) {
      console.error(err);
      alert("Gagal membuat/mengunggah dokumen. Pastikan template 'dispensasi.docx' ada di public dan format tag benar.");
    } finally {
      setIsGenerating(false);
    }
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

  const handleReprintHistory = async (hist, forceGenerate = false) => {
    if (hist.dispensasiDriveUrl && !forceGenerate) {
      window.open(hist.dispensasiDriveUrl, '_blank');
      return;
    }
    
    // Jika belum punya url drive (data lama) generate ulang
    setIsHistoryLoading(true);
    try {
      const dateObj = new Date(hist.tanggalCetak || Date.now());
      
      const response = await fetch('/dispensasi.docx');
      if (!response.ok) throw new Error("Template dispensasi.docx tidak ditemukan");
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const docTemplater = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '<<', end: '>>' }
      });

      const formatTgl = (tgl) => {
          if (!tgl) return '-';
          return formatTanggalIndo(tgl);
      };

      docTemplater.render({
        nomor: hist.nomorSurat,
        Nomor: hist.nomorSurat,
        NOMOR: hist.nomorSurat,
        nomorSurat: hist.nomorSurat,
        namaRombongan: hist.namaRombongan || '-',
        tanggalKunjungan: formatTgl(hist.tanggalKunjungan),
        TanggalKunjungan: formatTgl(hist.tanggalKunjungan),
        keperluan: hist.keperluan,
        nopol: hist.nopol,
        jmlKendaraan: hist.jmlKendaraan || '-',
        jmlPersonel: hist.jmlPersonel || '-',
        jamLoading: hist.jamLoading || '-',
        tanggalHariIni: dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      });

      const docxBlob = docTemplater.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
      });

      const fileName = `Surat Dispensasi - ${hist.namaRombongan} - ${hist.nomorSurat.replace(/\//g, '_')}`;
      const docUrl = await uploadToGoogleDrive(docxBlob, fileName, hist.id, 'historyDispensasi');

      // Update state
      setHistoryData(prev => prev.map(h => h.id === hist.id ? { ...h, dispensasiDriveUrl: docUrl } : h));

      window.open(docUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert("Gagal membuat/mengunggah dokumen ulang.");
    } finally {
      setIsHistoryLoading(false);
    }
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
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="text-emerald-500" size={32} />
            Cetak Surat Dispensasi
          </h2>
          <p className="text-slate-500 font-medium mt-1">Buat format surat dispensasi loading barang otomatis (langsung PDF).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolom Kiri: Pemilihan Sumber Data */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Building size={18}/> Pilih Sumber Data</h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

            {/* Kalender Pilihan Tanggal Kunjungan */}
            <div className="mb-5 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                      Pilihan Kalender Kunjungan
                    </h4>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      {selectedVisitDate ? formatTanggalIndo(selectedVisitDate) : 'Semua Tanggal'}
                    </p>
                  </div>
                </div>
                {selectedVisitDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedVisitDate('')}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/50 border border-emerald-300 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                    title="Tampilkan semua data rombongan"
                  >
                    Tampilkan Semua
                  </button>
                )}
              </div>

              {/* Input Kalender & Quick Button Hari Ini */}
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedVisitDate}
                  onChange={(e) => setSelectedVisitDate(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    setSelectedVisitDate(tStr);
                  }}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 whitespace-nowrap"
                >
                  Hari Ini
                </button>
              </div>

              {/* Quick Date Chips (Tanggal Tersedia yang ada Datanya) */}
              {availableDatesWithCount.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">
                      Tanggal Rombongan Tersedia ({availableDatesWithCount.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                    {availableDatesWithCount.map((item) => {
                      const isSelected = selectedVisitDate === item.date;
                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => setSelectedVisitDate(item.date)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-700/30' 
                              : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                          }`}
                        >
                          <CalendarDays size={13} className={isSelected ? 'text-white' : 'text-emerald-600'} />
                          <span>{item.date}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
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
                  <CalendarDays className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-600 font-bold text-sm">Tidak ada rombongan ditemukan</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {selectedVisitDate 
                      ? `Tidak ada data pada tanggal ${formatTanggalIndo(selectedVisitDate)}` 
                      : 'Coba ubah kata kunci pencarian'}
                  </p>
                  {selectedVisitDate && availableDatesWithCount.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedVisitDate(availableDatesWithCount[0].date)}
                      className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Buka jadwal terdekat ({availableDatesWithCount[0].date})
                    </button>
                  )}
                </div>
              ) : (
                Object.keys(groupedData).map((dateKey) => (
                  <div key={dateKey} className="mb-4">
                    <div className="sticky top-0 bg-[#f8faf9] z-10 py-1.5 mb-2 backdrop-blur-sm flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">{dateKey}</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {groupedData[dateKey].length} Rombongan
                      </span>
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
                <div className="flex gap-2">
                  {selectedItem.isDispensasiPrinted && (
                    <button 
                      onClick={() => window.open(selectedItem.dispensasiDriveUrl, '_blank')}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-all"
                    >
                      <FileText size={20} />
                      Buka Doc
                    </button>
                  )}
                  <button 
                    onClick={() => handlePrint(selectedItem.isDispensasiPrinted)}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Printer size={20} />
                    {isGenerating ? "Memproses..." : (selectedItem.isDispensasiPrinted ? "Perbarui Format" : "Cetak PDF")}
                  </button>
                </div>
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
    </div>
  );
}
