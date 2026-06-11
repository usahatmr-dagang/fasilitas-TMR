import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, ChevronRight, Store, ArrowLeft, Loader2, Calendar, FileText, Banknote, MapPin, AlertCircle } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function PublicPromoForm() {
  const [formData, setFormData] = useState({
    namaPerusahaan: '',
    namaPenandaTangan: '',
    noHp: '',
    namaProduk: '',
    jumlahHari: '',
    jumlahTitik: '1',
    jumlahBanner: '0',
    tanggalTransfer: '',
    transferMelalui: '',
    noReferensi: ''
  });
  
  const [tarif, setTarif] = useState({ hargaTitik: 1000000, hargaBanner: 100000 });
  const [selectedDates, setSelectedDates] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTarif = async () => {
      try {
        const docRef = doc(db, 'masterTarif', 'promo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTarif(docSnap.data());
        }
      } catch (err) {
        console.error("Gagal mengambil tarif:", err);
      }
    };
    fetchTarif();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'jumlahHari') {
      const val = parseInt(value) || 0;
      setSelectedDates(prev => {
        let newDates = [...prev];
        const targetLength = val > 20 ? 0 : val;
        if (targetLength > newDates.length) {
          for (let i = newDates.length; i < targetLength; i++) {
             newDates.push({ date: '', titik: formData.jumlahTitik || '1', banner: formData.jumlahBanner || '0' });
          }
        } else if (targetLength < newDates.length) {
          newDates = newDates.slice(0, targetLength);
        }
        return newDates;
      });
    } else if (name === 'jumlahTitik') {
      setSelectedDates(prev => prev.map(d => ({ ...d, titik: value || '1' })));
    } else if (name === 'jumlahBanner') {
      setSelectedDates(prev => prev.map(d => ({ ...d, banner: value || '0' })));
    }
  };

  const handleDateDetailChange = (index, field, value) => {
    const newDates = [...selectedDates];
    newDates[index][field] = value;
    setSelectedDates(newDates);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const formatTanggalPromo = (datesArr) => {
    const validItems = datesArr.filter(d => (typeof d === 'object' ? d.date : d));
    if (validItems.length === 0) return '-';
    
    const items = validItems.map(d => typeof d === 'object' ? d : { date: d, titik: formData.jumlahTitik, banner: formData.jumlahBanner });
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    const allTitikSame = items.every(item => item.titik === items[0].titik);

    const formatDatesGroup = (dateStrings) => {
       const byMonthYear = {};
       dateStrings.forEach(dStr => {
           const [y, m, d] = dStr.split('-');
           const my = `${monthNames[parseInt(m)-1]} ${y}`;
           if (!byMonthYear[my]) byMonthYear[my] = [];
           byMonthYear[my].push(parseInt(d));
       });

       const monthParts = [];
       for (const [my, days] of Object.entries(byMonthYear)) {
           if (days.length === 1) {
               monthParts.push(`${days[0]} ${my}`);
           } else if (days.length === 2) {
               monthParts.push(`${days[0]} dan ${days[1]} ${my}`);
           } else {
               const last = days.pop();
               monthParts.push(`${days.join(', ')} dan ${last} ${my}`);
           }
       }
       
       if (monthParts.length === 1) return monthParts[0];
       if (monthParts.length === 2) return `${monthParts[0]} dan ${monthParts[1]}`;
       const lastPart = monthParts.pop();
       return `${monthParts.join(', ')} dan ${lastPart}`;
    };

    if (allTitikSame) {
       const titikVal = items[0].titik || 1;
       const dateStrings = items.map(item => item.date);
       return `${titikVal} titik untuk tanggal ${formatDatesGroup(dateStrings)}`;
    } else {
       const groups = {};
       items.forEach(item => {
          const t = item.titik || 1;
          if (!groups[t]) groups[t] = [];
          groups[t].push(item.date);
       });
       
       const parts = [];
       for (const [t, dateList] of Object.entries(groups)) {
          parts.push(`${t} titik di tanggal ${formatDatesGroup(dateList)}`);
       }
       
       if (parts.length === 1) return parts[0];
       if (parts.length === 2) return `${parts[0]}, dan ${parts[1]}`;
       const last = parts.pop();
       return `${parts.join(', ')}, dan ${last}`;
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Hanya file gambar (JPG/PNG) yang diperbolehkan.');
        return;
      }
      
      try {
        const compressedBase64 = await compressImage(selectedFile);
        
        if (compressedBase64.length > 800000) {
            setError('Ukuran gambar terlalu besar dan tidak bisa dikompres lebih lanjut. Silakan gunakan gambar dengan resolusi lebih kecil.');
            return;
        }

        setFile(selectedFile);
        setPreviewUrl(compressedBase64);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Gagal memproses gambar.');
      }
    }
  };

  const hariInt = parseInt(formData.jumlahHari) || 0;
  const titikInt = parseInt(formData.jumlahTitik) || 0;
  const bannerInt = parseInt(formData.jumlahBanner) || 0;
  
  let totalBiayaTitik = 0;
  let totalBiayaBanner = 0;

  if (hariInt > 20) {
    totalBiayaTitik = hariInt * titikInt * tarif.hargaTitik;
    totalBiayaBanner = hariInt * bannerInt * tarif.hargaBanner;
  } else {
    selectedDates.forEach(item => {
      totalBiayaTitik += (parseInt(item.titik) || 0) * tarif.hargaTitik;
      totalBiayaBanner += (parseInt(item.banner) || 0) * tarif.hargaBanner;
    });
  }
  
  const grandTotal = totalBiayaTitik + totalBiayaBanner;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Bukti transfer wajib diupload!');
      return;
    }
    
    const hasEmptyDates = selectedDates.some(d => !(typeof d === 'object' ? d.date : d));
    if (hariInt <= 20 && hasEmptyDates) {
      setError('Mohon lengkapi semua isian tanggal promo.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const generatedTanggalPromoText = hariInt > 20 ? "tanggal ditentukan kemudian" : formatTanggalPromo(selectedDates);

      // Save Data to Firestore directly with Base64 image
      const newPromo = {
        ...formData,
        jumlahTransferNumeric: grandTotal,
        jumlahTransfer: formatRupiah(grandTotal).replace('Rp', '').trim(), 
        tanggalPromo: generatedTanggalPromoText,
        selectedDates: selectedDates.filter(d => (typeof d === 'object' ? d.date : d)), 
        buktiTransferUrl: previewUrl, // Base64 string directly inside Firestore
        status: 'Menunggu Verifikasi',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'promoList'), newPromo);
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat mengirim data: ' + (err.message || err.toString()));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F4F7F4] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-emerald-100 flex flex-col items-center text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={50} />
          </div>
          <h1 className="text-3xl font-black text-emerald-950 mb-4">Pengajuan Berhasil!</h1>
          <p className="text-emerald-800/80 mb-8 leading-relaxed">
            Terima kasih, data promo Anda telah kami terima. Tim kami akan segera melakukan verifikasi dan memproses Surat Perjanjian Kerja Sama.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
          >
            Kembali ke Beranda <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F4] py-12 px-4 sm:px-6 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-emerald-700 rounded-b-[40px] -z-10 shadow-lg shadow-emerald-900/20"></div>
      
      <div className="max-w-3xl mx-auto">
        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-emerald-50 hover:text-white mb-6 transition-colors font-semibold">
          <ArrowLeft size={18} /> Kembali
        </button>
        
        <div className="bg-white rounded-[32px] shadow-2xl border border-emerald-50 overflow-hidden mb-12">
          <div className="bg-emerald-50/50 p-8 border-b border-emerald-100 flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <Store size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-950">Formulir Promo TMR</h1>
              <p className="text-emerald-700/70 text-sm font-medium mt-1">Isi formulir pengajuan kegiatan promosi/selling/sampling di area Ragunan.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm font-semibold flex items-center gap-3">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {/* Bagian 1: Data Perusahaan */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                <FileText size={20} className="text-emerald-500"/> Data Perusahaan & PIC
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Perusahaan / CV <span className="text-rose-500">*</span></label>
                  <input required type="text" name="namaPerusahaan" value={formData.namaPerusahaan} onChange={handleChange} placeholder="Contoh: PT. Dirgantara Indonesia" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Penanda Tangan <span className="text-rose-500">*</span></label>
                  <input required type="text" name="namaPenandaTangan" value={formData.namaPenandaTangan} onChange={handleChange} placeholder="Nama lengkap penanggung jawab" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nomor HP/WhatsApp <span className="text-rose-500">*</span></label>
                  <input required type="tel" name="noHp" value={formData.noHp} onChange={handleChange} placeholder="Contoh: 08123456789" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Produk <span className="text-rose-500">*</span></label>
                  <input required type="text" name="namaProduk" value={formData.namaProduk} onChange={handleChange} placeholder="Produk yang dipromosikan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Bagian 2: Detail Promo */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-500"/> Detail Kegiatan & Tanggal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah Hari <span className="text-rose-500">*</span></label>
                  <input required type="number" min="1" name="jumlahHari" value={formData.jumlahHari} onChange={handleChange} placeholder="Contoh: 3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah Titik Lokasi <span className="text-rose-500">*</span></label>
                  <input required type="number" min="1" name="jumlahTitik" value={formData.jumlahTitik} onChange={handleChange} placeholder="Contoh: 1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah Banner <span className="text-rose-500">*</span></label>
                  <input required type="number" min="0" name="jumlahBanner" value={formData.jumlahBanner} onChange={handleChange} placeholder="Contoh: 0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
              </div>

              {hariInt > 0 && (
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-500" /> Pilih Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                  </label>
                  
                  {hariInt > 20 ? (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-sm font-bold flex items-start gap-3">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" /> 
                      <p>Untuk penyewaan promo lebih dari 20 hari, penentuan tanggal pelaksanaan tidak perlu dipilih sekarang dan akan ditentukan kemudian. Silakan hubungi Admin untuk konfirmasi persetujuan lebih lanjut.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDates.map((item, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 items-end shadow-sm">
                          <div className="w-full md:w-1/2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hari ke-{index + 1} (Tanggal)</label>
                            <input 
                              required 
                              type="date" 
                              value={item.date} 
                              onChange={(e) => handleDateDetailChange(index, 'date', e.target.value)} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                            />
                          </div>
                          <div className="w-full md:w-1/4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jml Titik</label>
                            <input 
                              required 
                              type="number" 
                              min="1" 
                              value={item.titik} 
                              onChange={(e) => handleDateDetailChange(index, 'titik', e.target.value)} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                            />
                          </div>
                          <div className="w-full md:w-1/4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jml Banner</label>
                            <input 
                              required 
                              type="number" 
                              min="0" 
                              value={item.banner} 
                              onChange={(e) => handleDateDetailChange(index, 'banner', e.target.value)} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bagian 3: Pembayaran */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                <Banknote size={20} className="text-emerald-500"/> Informasi Pembayaran
              </h3>
              
              {/* Rincian Biaya (Auto-Calculate) */}
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-inner">
                <h4 className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">Rincian Biaya Otomatis</h4>
                <div className="space-y-3 text-sm font-semibold text-emerald-800">
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span>Biaya Titik Lokasi ({hariInt > 20 ? `${hariInt} Hari × ${titikInt} Titik` : 'Berdasarkan rincian per hari'}) × {formatRupiah(tarif.hargaTitik)}</span>
                    <span>{formatRupiah(totalBiayaTitik)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-200/50">
                    <span>Biaya Banner ({hariInt > 20 ? `${hariInt} Hari × ${bannerInt} Banner` : 'Berdasarkan rincian per hari'}) × {formatRupiah(tarif.hargaBanner)}</span>
                    <span>{formatRupiah(totalBiayaBanner)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-lg font-black text-emerald-950">
                    <span>Total Nominal Transfer</span>
                    <span>{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Transfer <span className="text-rose-500">*</span></label>
                  <input required type="date" name="tanggalTransfer" value={formData.tanggalTransfer} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Transfer Melalui Bank/E-Wallet <span className="text-rose-500">*</span></label>
                  <input required type="text" name="transferMelalui" value={formData.transferMelalui} onChange={handleChange} placeholder="Contoh: Bank DKI, BCA, Gopay" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">No. Referensi Transfer <span className="text-rose-500">*</span></label>
                  <input required type="text" name="noReferensi" value={formData.noReferensi} onChange={handleChange} placeholder="Masukkan nomor referensi" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti Transfer <span className="text-rose-500">*</span></label>
                <div className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center relative ${file ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50'}`}>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  
                  {!file ? (
                    <div className="pointer-events-none flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 mb-3">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-emerald-700 font-bold text-sm">Klik atau seret foto ke sini</p>
                      <p className="text-slate-500 text-xs mt-1">Mendukung Image (JPG/PNG) - Otomatis Dikompres</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-3 text-left">
                        {previewUrl ? (
                          <div className="w-12 h-12 rounded-lg bg-cover bg-center shadow-sm" style={{backgroundImage: `url(${previewUrl})`}}></div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <FileText size={24} />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-xs font-semibold text-emerald-600">File Terpilih</p>
                        </div>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); setPreviewUrl(null); }} className="text-rose-500 text-sm font-bold pointer-events-auto hover:underline z-10 relative">Ganti</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-emerald-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-600/20 hover:shadow-emerald-600/40'}`}
              >
                {isSubmitting ? (
                  <><Loader2 size={20} className="animate-spin" /> Sedang Mengirim...</>
                ) : (
                  <><CheckCircle2 size={20} /> Kirim Pengajuan Promo</>
                )}
              </button>
              <p className="text-center text-xs font-semibold text-slate-400 mt-4">
                Dengan menekan tombol di atas, Anda menyetujui seluruh syarat dan ketentuan yang berlaku.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
