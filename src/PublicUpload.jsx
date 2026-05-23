import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import { db, storage } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function PublicUpload() {
  const [docId, setDocId] = useState('');
  const [bookingData, setBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [uploadFile, setUploadFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Parse URL on load
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'upload') {
      const idFromUrl = pathParts[2];
      if (idFromUrl) {
        setDocId(idFromUrl);
        fetchBookingData(idFromUrl);
      }
    }
  }, []);

  const fetchBookingData = async (id) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const docRef = doc(db, 'sewaList', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status_pembayaran === 'Lunas' || data.status_pembayaran === 'Sudah Transfer') {
          setErrorMsg('Transaksi ini sudah lunas atau sudah memiliki bukti transfer yang valid.');
          setBookingData(null);
        } else {
          setBookingData({ id: docSnap.id, ...data });
        }
      } else {
        setErrorMsg('Data transaksi tidak ditemukan. Pastikan link yang Anda buka benar.');
        setBookingData(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengambil data. Pastikan Anda menggunakan link yang valid dari admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!docId.trim()) {
      setErrorMsg('Masukkan Token Link terlebih dahulu.');
      return;
    }
    fetchBookingData(docId.trim());
  };

  const handleFileChange = (e) => {
    setErrorMsg('');
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file terlalu besar. Maksimal 5 MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Format file tidak didukung. Harap upload gambar (JPG/PNG) atau PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setUploadFile(file); // Store the actual File object
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !bookingData) return;

    setIsLoading(true);
    setLoadingText('Mempersiapkan file...');
    setErrorMsg('');
    
    try {
      // Create a unique file name to avoid overwriting
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `bukti_transfer/${bookingData.id}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);

      const metadata = {
        contentType: uploadFile.type
      };
      
      setLoadingText('Mengunggah file ke server (1/2)...');
      
      // Setup timeout to prevent infinite hang (e.g., due to CORS or Adblocker)
      const uploadPromise = uploadBytes(storageRef, uploadFile, metadata);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Koneksi terputus. Pastikan Anda tidak menggunakan Adblocker, atau coba gunakan mode Incognito / browser lain.")), 15000);
      });
      
      // Race between upload and timeout
      await Promise.race([uploadPromise, timeoutPromise]);
      
      setLoadingText('Menyimpan data transaksi (2/2)...');
      const downloadURL = await getDownloadURL(storageRef);

      const todayStr = new Date().toISOString().split('T')[0];

      // Update Firestore
      const docRef = doc(db, 'sewaList', bookingData.id);
      await updateDoc(docRef, {
        status_pembayaran: 'Menunggu Verifikasi',
        bukti_transfer: downloadURL,
        tanggal_transfer: todayStr
      });

      setSuccessMsg('Bukti transfer berhasil di-upload! Mohon tunggu verifikasi dari Admin.');
      setBookingData(null);
      setFilePreview(null);
      setUploadFile(null);
    } catch (err) {
      console.error("Upload error: ", err);
      setErrorMsg(`Terjadi kesalahan: ${err.message || err.code || 'Gagal terhubung ke server'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    if (angka === undefined || angka === null || isNaN(angka)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  if (successMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-emerald-950 mb-2 tracking-tight">Upload Berhasil!</h2>
          <p className="text-slate-600 mb-8">{successMsg}</p>
          <button onClick={() => window.location.reload()} className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-700 transition-colors shadow-md">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-200/40 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-600 rounded-2xl text-white mb-4 shadow-lg shadow-emerald-600/30">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Portal Bukti Pembayaran</h1>
          <p className="text-slate-500 font-medium text-sm">Taman Margasatwa Ragunan - Layanan Publik Aman</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden backdrop-blur-sm">
          {!bookingData && !isLoading && (
            <div className="p-8 text-center">
              <p className="text-slate-600 mb-6 text-sm">
                Harap gunakan <strong>Link Upload</strong> yang dikirimkan melalui pesan WhatsApp Anda untuk mengunggah bukti pembayaran secara otomatis.
              </p>
              
              <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-xs text-slate-400 font-bold uppercase absolute">ATAU MASUKKAN TOKEN</span>
              </div>

              <form onSubmit={handleManualSearch} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Token Rahasia (dari URL)" 
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono"
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all shadow-md">
                  <Search size={20} />
                </button>
              </form>
            </div>
          )}

          {isLoading && (
             <div className="p-12 flex flex-col items-center justify-center">
               <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
               <p className="text-emerald-800 font-bold animate-pulse">{loadingText}</p>
             </div>
          )}

          {errorMsg && !isLoading && (
            <div className="p-6 m-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-rose-800 font-bold mb-1">Terjadi Kesalahan</h4>
                <p className="text-rose-600 text-sm">{errorMsg}</p>
                <button onClick={() => { setErrorMsg(''); setDocId(''); }} className="mt-3 text-xs font-bold text-rose-700 underline hover:text-rose-800">Coba Lagi</button>
              </div>
            </div>
          )}

          {bookingData && !isLoading && (
            <div className="p-8">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">ID Transaksi</p>
                    <p className="font-black text-emerald-950 text-xl">{bookingData.id_sewa}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Total Tagihan</p>
                    <p className="font-black text-emerald-800 text-xl">{formatRupiah(bookingData.total_biaya)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-emerald-200/50 pt-4 mt-2">
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Nama Penyewa</p>
                    <p className="font-bold text-slate-800">{bookingData.nama_penyewa}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Lokasi Sewa</p>
                    <p className="font-bold text-slate-800">{bookingData.lokasi_sewa}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <p className="text-sm font-bold text-slate-700 mb-2">Pilih File Bukti Pembayaran</p>
                  
                  {!filePreview ? (
                    <label className="w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-500 hover:text-emerald-600 transition-colors py-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer group">
                      <input type="file" accept="image/jpeg, image/png, application/pdf" className="hidden" onChange={handleFileChange} />
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <span className="font-bold">Klik untuk memilih file</span>
                      <span className="text-xs mt-1 font-medium opacity-70">Maks. 5MB (JPG, PNG, PDF)</span>
                    </label>
                  ) : (
                    <div className="relative">
                      {uploadFile?.type?.startsWith('image/') ? (
                        <img src={filePreview} alt="Preview" className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                      ) : (
                        <div className="w-full h-48 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500">
                           <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                           <p className="font-bold text-slate-700">{uploadFile.name}</p>
                           <p className="text-xs mt-1">Dokumen PDF Terpilih</p>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => { setFilePreview(null); setUploadFile(null); }}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-rose-50 transition-colors"
                      >
                        Ganti File
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={!filePreview || isLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                >
                  Kirim Bukti Pembayaran
                </button>
              </form>
            </div>
          )}
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          &copy; {new Date().getFullYear()} Sistem Informasi Taman Margasatwa Ragunan.<br/>Data Anda dilindungi oleh enkripsi end-to-end.
        </p>
      </div>
    </div>
  );
}
