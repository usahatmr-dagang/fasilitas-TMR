import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  Calendar, 
  X,
  Tent,
  TreePine,
  Leaf,
  MapPin,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  Wallet,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Settings,
  Edit,
  CalendarDays,
  Send,
  History,
  Lock,
  Save,
  Zap,
  CreditCard,
  FileText,
  LayoutGrid,
  List,
  Printer
} from 'lucide-react';

// --- DATA LOKASI INITIAL ---
const initialDataLokasi = [
  { id: 1, nama: 'PENDOPO TSA 1', tipe: 'pendopo' },
  { id: 2, nama: 'PENDOPO TSA 2', tipe: 'pendopo' },
  { id: 3, nama: 'PENDOPO TSA 3', tipe: 'pendopo' },
  { id: 4, nama: 'PENDOPO TSA 4', tipe: 'pendopo' },
  { id: 5, nama: 'GAZEBO', tipe: 'pendopo' },
  { id: 6, nama: 'TERAS INFORMASI', tipe: 'pendopo' }, 
  { id: 7, nama: 'AULA SERBAGUNA', tipe: 'pendopo' }, 
  { id: 8, nama: 'LAP ATM 1', tipe: 'lapangan' },
  { id: 9, nama: 'LAP ATM 2', tipe: 'lapangan' },
  { id: 10, nama: 'LAP ATM 3', tipe: 'lapangan' },
  { id: 11, nama: 'LAP ATM 4', tipe: 'lapangan' },
  { id: 12, nama: 'LAP SEBRANG TSA 1', tipe: 'lapangan' },
  { id: 13, nama: 'LAP SEBRANG TSA 2', tipe: 'lapangan' },
  { id: 14, nama: 'LAP SEBRANG TSA (PEL)', tipe: 'lapangan' }, 
  { id: 15, nama: 'LAP BERINGIN', tipe: 'lapangan' },
  { id: 16, nama: 'LAP TIMUR INF 1', tipe: 'lapangan' },
  { id: 17, nama: 'LAP TIMUR INF 2', tipe: 'lapangan' },
  { id: 18, nama: 'LAP TSIK 1', tipe: 'lapangan' },
  { id: 19, nama: 'LAP TSIK 2', tipe: 'lapangan' },
  { id: 20, nama: 'LAP TSIK 3', tipe: 'lapangan' },
  { id: 21, nama: 'LAP TSIK 4', tipe: 'lapangan' },
  { id: 22, nama: 'LAP TL 1', tipe: 'lapangan' },
  { id: 23, nama: 'LAP TL 2', tipe: 'lapangan' },
  { id: 24, nama: 'LAP TL 3', tipe: 'lapangan' },
  { id: 25, nama: 'LAP TL 4', tipe: 'lapangan' },
  { id: 26, nama: 'LAP TL 5', tipe: 'lapangan' },
  { id: 27, nama: 'LAP GAJAH TIMUR 1', tipe: 'lapangan' },
  { id: 28, nama: 'LAP GAJAH TIMUR 2', tipe: 'lapangan' },
  { id: 29, nama: 'LAP ALTERNATIF 1', tipe: 'lapangan' },
  { id: 30, nama: 'LAP ALTERNATIF 2', tipe: 'lapangan' },
  { id: 31, nama: 'LAP ALTERNATIF 3', tipe: 'lapangan' },
  { id: 32, nama: 'LAP ALTERNATIF 4', tipe: 'lapangan' },
];

const initialDataSewa = [
  { id_sewa: 'TMR-52967', tanggal_sewa: '2025-06-01', lokasi_sewa: 'PENDOPO TSA 1', nama_penyewa: 'PATRA IMPO', pic_rombongan: 'PATRA IMPO', no_hp_penyewa: '082152000262', pic_kantor: '-', keterangan: '', status_pembayaran: 'Belum Transfer', tanggal_booking: '16/04/2025, 08:30:00', tanggal_transfer: null, bukti_transfer: null, bukti_transfer_listrik: null, ocr_data: null, history_reschedule: [], listrik_tambahan: false, akses_upload_listrik: false, luas_lahan: null, total_biaya: 500000 },
  { id_sewa: 'TMR-51403', tanggal_sewa: '2025-06-01', lokasi_sewa: 'PENDOPO TSA 2', nama_penyewa: 'IBU TARI', pic_rombongan: 'IBU TARI', no_hp_penyewa: '087887154285', pic_kantor: '-', keterangan: '', status_pembayaran: 'Belum Transfer', tanggal_booking: '23/04/2025, 09:15:00', tanggal_transfer: null, bukti_transfer: null, bukti_transfer_listrik: null, ocr_data: null, history_reschedule: [], listrik_tambahan: false, akses_upload_listrik: false, luas_lahan: null, total_biaya: 250000 },
  { id_sewa: 'TMR-57113', tanggal_sewa: '2025-06-01', lokasi_sewa: 'GAZEBO', nama_penyewa: 'H. NASIR ALL BASE', pic_rombongan: 'H. NASIR', no_hp_penyewa: '085775767028', pic_kantor: 'RIZMY', keterangan: 'Simulasi Listrik Aktif', status_pembayaran: 'Sudah Transfer', tanggal_booking: '12/04/2025, 13:00:00', tanggal_transfer: '2025-05-15', bukti_transfer: 'dummy', bukti_transfer_listrik: null, ocr_data: null, history_reschedule: [], listrik_tambahan: true, akses_upload_listrik: true, luas_lahan: null, total_biaya: 350000 },
  { id_sewa: 'TMR-14906', tanggal_sewa: '2026-06-07', lokasi_sewa: 'LAP TIMUR INF 1', nama_penyewa: 'SDIT At Taqwa 02 bekasi', pic_rombongan: 'Panitia Sekolah', no_hp_penyewa: '08568598510', pic_kantor: 'ISNA', keterangan: 'Luas Lahan: 50m', status_pembayaran: 'Sudah Transfer', tanggal_booking: '14/05/2026, 10:00:00', tanggal_transfer: '2026-05-14', bukti_transfer: 'dummy', bukti_transfer_listrik: null, ocr_data: null, history_reschedule: [], listrik_tambahan: false, akses_upload_listrik: false, luas_lahan: 50, total_biaya: 100000 },
  { id_sewa: 'TMR-88214', tanggal_sewa: '2025-06-01', lokasi_sewa: 'LAP ATM 1', nama_penyewa: 'Bapak Rudi', pic_rombongan: '-', no_hp_penyewa: '081299384756', pic_kantor: 'Alan', keterangan: 'Sewa area luas', status_pembayaran: 'Menunggu Verifikasi', tanggal_booking: '10/05/2025, 10:00:00', tanggal_transfer: '2025-05-15', bukti_transfer: 'dummy', bukti_transfer_listrik: null, ocr_data: null, history_reschedule: [], listrik_tambahan: false, akses_upload_listrik: false, luas_lahan: 150, total_biaya: 300000 },
];

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTanggalIndo = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if(!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch (e) {
    return dateStr;
  }
};

const formatTanggalPendek = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if(!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
    const tgl = String(date.getDate()).padStart(2, '0');
    const bln = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
    return `${hari}, ${tgl} - ${bln}-${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const formatRupiah = (angka) => {
    if (angka === undefined || angka === null || isNaN(angka)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default function App() {
  const [activeTab, setActiveTab] = useState('reservasi');
  
  // Custom Toast Notification State
  const [toast, setToast] = useState(null); 
  const [printMode, setPrintMode] = useState(null); // State untuk cetak aman: null | 'penanda' | 'bukti'

  // State Master Dinamis
  const [masterLokasi, setMasterLokasi] = useState(initialDataLokasi);
  const [picList, setPicList] = useState(['Tari', 'Rizmy', 'Alan', 'Isna', 'Erna', 'Suhendra', 'Putri']);
  const [newPic, setNewPic] = useState('');
  const [blockData, setBlockData] = useState({ tanggal: getTodayString(), lokasi: 'Semua Lokasi' });

  // Input State Tambah Lokasi
  const [newLokasiNama, setNewLokasiNama] = useState('');
  const [newLokasiTipe, setNewLokasiTipe] = useState('pendopo');

  // State Sewa Utama
  const [sewaList, setSewaList] = useState(initialDataSewa);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [filterTipe, setFilterTipe] = useState('semua');
  const [filterDateSewa, setFilterDateSewa] = useState('');
  const [filterDatePembayaran, setFilterDatePembayaran] = useState('');
  
  // State Keuangan/Pembayaran
  const [pembayaranViewMode, setPembayaranViewMode] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date()); 
  
  // State Form Booking
  const [bookingLokasi, setBookingLokasi] = useState(null);
  const [formData, setFormData] = useState({
    namaRombongan: '', picRombongan: '', noWa: '', picKantor: '', keterangan: '', statusPembayaran: 'Belum Transfer', listrikTambahan: false, luasLahan: 50
  });

  // State Detail & Modals
  const [selectedRecord, setSelectedRecord] = useState(null); 
  const [detailMode, setDetailMode] = useState('view'); 
  const [editFormData, setEditFormData] = useState({});
  const [rescheduleData, setRescheduleData] = useState({ tanggal: '', lokasi: '' });

  // State Portal Pengunjung
  const [portalSearchId, setPortalSearchId] = useState('');
  const [portalBooking, setPortalBooking] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadListrikFile, setUploadListrikFile] = useState(null); 
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [tanggalUploadPortal, setTanggalUploadPortal] = useState(getTodayString());

  // Efek Hook untuk memicu dialog print otomatis dengan aman
  useEffect(() => {
    if (printMode) {
      const timer = setTimeout(() => {
        window.print();
        setPrintMode(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printMode]);

  // --- HELPER TOAST NOTIFICATION ---
  const showToast = (msg, type = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 4000);
  };

  // --- HELPER HARGA DINAMIS ---
  const getBiayaLokasi = (namaLokasi, luasLahan = 50) => {
      if (!namaLokasi) return 0;
      if (namaLokasi === 'PENDOPO TSA 1') return 500000;
      if (['PENDOPO TSA 2', 'PENDOPO TSA 3', 'PENDOPO TSA 4', 'TERAS INFORMASI', 'GAZEBO'].includes(namaLokasi)) return 250000;
      if (namaLokasi === 'AULA SERBAGUNA') return 2000000;
      
      const isLapanganData = masterLokasi.find(l => l.nama === namaLokasi)?.tipe === 'lapangan';
      if (isLapanganData || namaLokasi.startsWith('LAP ')) {
          const luasValid = Math.max(Number(luasLahan) || 50, 50);
          return luasValid * 2000;
      }
      return 0; 
  };

  // --- LOGIC KETERSEDIAAN ---
  const fasilitasHarian = useMemo(() => {
    const sewaHariIni = sewaList.filter(sewa => sewa.tanggal_sewa === selectedDate);
    let filteredLokasi = masterLokasi;
    if (filterTipe !== 'semua') filteredLokasi = masterLokasi.filter(lokasi => lokasi.tipe === filterTipe);
    return filteredLokasi.map(lokasi => {
      const booking = sewaHariIni.find(sewa => sewa.lokasi_sewa === lokasi.nama);
      return { ...lokasi, status: booking ? 'Disewa' : 'Tersedia', bookingInfo: booking || null };
    });
  }, [selectedDate, filterTipe, sewaList, masterLokasi]);

  // LOGIC RESCHEDULE (Cari lokasi kosong)
  const availableLokasiForReschedule = useMemo(() => {
    if (!rescheduleData.tanggal || !selectedRecord) return [];
    const sewaHariItu = sewaList.filter(s => s.tanggal_sewa === rescheduleData.tanggal && s.id_sewa !== selectedRecord.id_sewa && s.status_pembayaran !== 'Ditutup');
    return masterLokasi.filter(l => !sewaHariItu.find(s => s.lokasi_sewa === l.nama));
  }, [rescheduleData.tanggal, sewaList, selectedRecord, masterLokasi]);

  // LOGIC DATA SEWA
  const groupedSewa = useMemo(() => {
    const todayStr = getTodayString();
    let dataYangDitampilkan = sewaList.filter(sewa => sewa.status_pembayaran !== 'Ditutup');

    if (filterDateSewa !== '') {
        dataYangDitampilkan = dataYangDitampilkan.filter(sewa => sewa.tanggal_sewa === filterDateSewa);
    } else {
        dataYangDitampilkan = dataYangDitampilkan.filter(sewa => sewa.tanggal_sewa >= todayStr);
    }
    
    const groups = dataYangDitampilkan.reduce((acc, curr) => {
      if (!acc[curr.tanggal_sewa]) acc[curr.tanggal_sewa] = [];
      acc[curr.tanggal_sewa].push(curr);
      return acc;
    }, {});
    return Object.keys(groups).sort((a, b) => new Date(a) - new Date(b)).map(date => ({ date, data: groups[date] }));
  }, [sewaList, filterDateSewa]);

  // LOGIC PEMBAYARAN
  const groupedPembayaran = useMemo(() => {
    let dataBayar = sewaList.filter(sewa => sewa.bukti_transfer || sewa.status_pembayaran === 'Sudah Transfer' || sewa.status_pembayaran === 'Menunggu Verifikasi');
    
    if (filterDatePembayaran !== '') {
        dataBayar = dataBayar.filter(sewa => (sewa.tanggal_transfer || sewa.tanggal_sewa) === filterDatePembayaran);
    }

    const groups = dataBayar.reduce((acc, curr) => {
      const date = curr.tanggal_transfer || curr.tanggal_sewa; 
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});
    return Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({ date, data: groups[date] }));
  }, [sewaList, filterDatePembayaran]);

  // LOGIC KALENDER PEMBAYARAN
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const namaBulanKalender = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(calendarMonth);
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const firstDay = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const blanks = Array(firstDay).fill(null);
  const calendarDays = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const getTransferDataForDate = (day) => {
      const dateStr = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const group = groupedPembayaran.find(g => g.date === dateStr);
      return group ? group.data : [];
  };

  const totalFasilitas = masterLokasi.length;
  const jumlahDisewa = sewaList.filter(sewa => sewa.tanggal_sewa === selectedDate && sewa.status_pembayaran !== 'Ditutup').length;
  const persentaseSewa = Math.round((jumlahDisewa / totalFasilitas) * 100);

  // --- UI HELPERS ---
  const getIconData = (tipe) => {
    switch(tipe) {
      case 'pendopo': return { icon: Tent, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' };
      case 'lapangan': return { icon: TreePine, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
      default: return { icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
    }
  };
  
  const getStatusBadgeClass = (status) => {
      const s = status || 'Belum Transfer';
      if (s === 'Sudah' || s === 'Sudah Lunas' || s === 'Sudah Transfer') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      if (s === 'Menunggu Verifikasi') return 'bg-blue-100 text-blue-700 border border-blue-200';
      if (s === 'Menunggu Transfer') return 'bg-amber-100 text-amber-700 border border-amber-200'; 
      if (s === 'Ditutup') return 'bg-slate-200 text-slate-700 border border-slate-300';
      return 'bg-rose-100 text-rose-700 border border-rose-200';
  };

  // --- HANDLERS UTAMA ---
  const handleOpenDetail = (record) => {
      if (!record) return;
      setSelectedRecord(record);
      setDetailMode('view');
      setEditFormData({...record});
      setRescheduleData({ tanggal: record.tanggal_sewa, lokasi: record.lokasi_sewa });
  };

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    const currentDateTime = new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const generatedId = `TMR-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const isLapangan = bookingLokasi.tipe === 'lapangan';
    const luas_lahan_val = isLapangan ? Math.max(Number(formData.luasLahan), 50) : null;
    
    const biayaLokasi = getBiayaLokasi(bookingLokasi.nama, luas_lahan_val);
    const biayaListrik = formData.listrikTambahan ? 100000 : 0;
    const totalBiaya = biayaLokasi + biayaListrik;
    const isLunas = formData.statusPembayaran === 'Sudah Transfer';

    const newBooking = {
      id_sewa: generatedId,
      tanggal_sewa: selectedDate, 
      lokasi_sewa: bookingLokasi.nama,
      nama_penyewa: formData.namaRombongan || '-',
      pic_rombongan: formData.picRombongan || '-',
      no_hp_penyewa: formData.noWa || '-',
      pic_kantor: formData.picKantor || '-',
      keterangan: formData.keterangan || '-',
      status_pembayaran: formData.statusPembayaran || 'Belum Transfer',
      listrik_tambahan: formData.listrikTambahan || false,
      akses_upload_listrik: formData.listrikTambahan ? true : false, 
      luas_lahan: luas_lahan_val,
      total_biaya: totalBiaya,
      tanggal_booking: currentDateTime,
      tanggal_transfer: isLunas ? getTodayString() : null,
      bukti_transfer: null, 
      bukti_transfer_listrik: null, 
      ocr_data: null, 
      history_reschedule: []
    };

    setSewaList(prev => [...prev, newBooking]);
    setBookingLokasi(null);
    setFormData({ namaRombongan: '', picRombongan: '', noWa: '', picKantor: '', keterangan: '', statusPembayaran: 'Belum Transfer', listrikTambahan: false, luasLahan: 50 });
    
    handleOpenDetail(newBooking);
    showToast('Reservasi baru berhasil ditambahkan!');
  };

  const handleKirimWA = () => {
    if (!selectedRecord) return;
    const biayaLokasi = getBiayaLokasi(selectedRecord.lokasi_sewa, selectedRecord.luas_lahan);
    const biayaListrik = selectedRecord.listrik_tambahan ? 100000 : 0;
    const totalBayar = selectedRecord.total_biaya !== undefined ? selectedRecord.total_biaya : (biayaLokasi + biayaListrik);

    const isLapangan = masterLokasi.find(l => l.nama === selectedRecord.lokasi_sewa)?.tipe === 'lapangan';
    const luasText = isLapangan ? `\nLuas Lahan: ${selectedRecord.luas_lahan} m²` : '';

    const rincianBiayaText = selectedRecord.listrik_tambahan 
        ? `\nTarif Sewa Lokasi: ${formatRupiah(biayaLokasi)}\nTambahan Listrik: ${formatRupiah(biayaListrik)}\nJumlah yang harus dibayar: *${formatRupiah(totalBayar)}*`
        : `\nJumlah yang harus dibayar: *${formatRupiah(totalBayar)}*`;

    const msg = `Terima kasih telah melakukan pemesanan fasilitas di Taman Margasatwa Ragunan.\n\nID Sewa: *${selectedRecord.id_sewa}*\nNama Penyewa: ${selectedRecord.nama_penyewa} ${selectedRecord.pic_rombongan !== '-' && selectedRecord.pic_rombongan !== selectedRecord.nama_penyewa ? `(${selectedRecord.pic_rombongan})` : ''}\nLokasi Sewa: ${selectedRecord.lokasi_sewa}${luasText}\nTanggal Sewa: ${formatTanggalPendek(selectedRecord.tanggal_sewa)}${rincianBiayaText}\n\nSilahkan transfer ke:\nBank: >>Bank DKI<<, Cabang Pondok Labu\nNo. Rek: 40142700918\nAtas Nama: TM Ragunan Penerimaan BLUD\n\nSetelah transfer, silakan kirim bukti pembayaran melalui link khusus pengunjung.\n\nTerima kasih.`;

    const rawPhone = String(selectedRecord.no_hp_penyewa || '');
    let phone = rawPhone.replace(/\D/g, ''); 
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const biayaLokasi = getBiayaLokasi(selectedRecord.lokasi_sewa, editFormData.luas_lahan);
    const biayaListrik = editFormData.listrik_tambahan ? 100000 : 0;
    
    const updatedRecord = { 
        ...selectedRecord, 
        ...editFormData,
        akses_upload_listrik: editFormData.listrik_tambahan ? true : false,
        total_biaya: biayaLokasi + biayaListrik 
    };

    setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updatedRecord : s));
    setSelectedRecord(updatedRecord);
    setDetailMode('view');
    showToast('Data pengunjung berhasil diperbarui!');
  };

  const handleSaveReschedule = (e) => {
    e.preventDefault();
    const now = new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const historyItem = { dari_tanggal: selectedRecord.tanggal_sewa, dari_lokasi: selectedRecord.lokasi_sewa, ke_tanggal: rescheduleData.tanggal, ke_lokasi: rescheduleData.lokasi, waktu: now };
    const newHistory = [...(selectedRecord.history_reschedule || []), historyItem];
    
    const locInfo = masterLokasi.find(l => l.nama === rescheduleData.lokasi);
    const isLapanganReschedule = locInfo?.tipe === 'lapangan' || rescheduleData.lokasi.includes('LAP');
    const luas_lahan_reschedule = isLapanganReschedule ? Math.max(Number(selectedRecord.luas_lahan || 50), 50) : null;
    
    const biayaLokasiBaru = getBiayaLokasi(rescheduleData.lokasi, luas_lahan_reschedule);
    const biayaListrik = selectedRecord.listrik_tambahan ? 100000 : 0;

    const updatedRecord = { 
        ...selectedRecord, 
        tanggal_sewa: rescheduleData.tanggal, 
        lokasi_sewa: rescheduleData.lokasi, 
        luas_lahan: luas_lahan_reschedule,
        total_biaya: biayaLokasiBaru + biayaListrik,
        history_reschedule: newHistory 
    };
    
    setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updatedRecord : s));
    setSelectedRecord(updatedRecord);
    setDetailMode('view');
    showToast('Jadwal berhasil dipindahkan!', 'success');
  };

  // --- HANDLER FITUR CETAK ---
  const handlePrintPenanda = () => {
    if (!selectedRecord) return;
    setPrintMode('penanda');
  };

  const handlePrintBukti = () => {
    if (!selectedRecord || !selectedRecord.bukti_transfer) return;
    setPrintMode('bukti');
  };

  // --- HANDLER MASTER DATA & UPLOAD ---
  const handleAddLokasi = (e) => {
      e.preventDefault();
      const namaUpper = newLokasiNama.trim().toUpperCase();
      if (namaUpper !== '' && !masterLokasi.find(l => l.nama === namaUpper)) {
          const newId = masterLokasi.length > 0 ? Math.max(...masterLokasi.map(l => l.id)) + 1 : 1;
          setMasterLokasi([...masterLokasi, { id: newId, nama: namaUpper, tipe: newLokasiTipe }]);
          setNewLokasiNama('');
          showToast('Lokasi baru berhasil ditambahkan.');
      } else {
          showToast('Nama lokasi sudah ada atau kosong!', 'error');
      }
  };

  const handleDeleteLokasi = (id) => {
      setMasterLokasi(masterLokasi.filter(l => l.id !== id));
      showToast('Lokasi berhasil dihapus.');
  };

  const handleUploadListrikChange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          const updatedRecord = { 
              ...selectedRecord, 
              bukti_transfer_listrik: reader.result,
              tanggal_transfer: selectedRecord.tanggal_transfer || getTodayString() 
          };
          setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updatedRecord : s));
          setSelectedRecord(updatedRecord);
          showToast('Struk listrik berhasil ditambahkan!');
      };
      reader.readAsDataURL(file);
  };

  const handleAddPic = (e) => {
      e.preventDefault();
      if(newPic.trim() !== '' && !picList.includes(newPic)) {
          setPicList([...picList, newPic]);
          setNewPic('');
          showToast('PIC baru berhasil ditambahkan.');
      }
  };

  const handleBlockLokasi = (e) => {
      e.preventDefault();
      const currentDateTime = new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const lokasiTarget = blockData.lokasi === 'Semua Lokasi' ? masterLokasi.map(l => l.nama) : [blockData.lokasi];
      
      const newBlocks = lokasiTarget.map((lokName, i) => ({
          id_sewa: `BLK-${Math.floor(1000 + Math.random() * 9000)}-${i}`,
          tanggal_sewa: blockData.tanggal, lokasi_sewa: lokName, nama_penyewa: 'DITUTUP (MAINTENANCE)', pic_rombongan: '-', no_hp_penyewa: '-', pic_kantor: '-',
          keterangan: 'Diblokir dari sistem pengaturan admin', status_pembayaran: 'Ditutup', tanggal_booking: currentDateTime,
          bukti_transfer: null, bukti_transfer_listrik: null, ocr_data: null, history_reschedule: [], listrik_tambahan: false, akses_upload_listrik: false, total_biaya: 0
      }));

      const existingBookings = sewaList.filter(s => s.tanggal_sewa === blockData.tanggal);
      const filteredBlocks = newBlocks.filter(b => !existingBookings.find(ex => ex.lokasi_sewa === b.lokasi_sewa));

      setSewaList([...sewaList, ...filteredBlocks]);
      showToast(`Berhasil menutup ${filteredBlocks.length} lokasi pada tanggal ${formatTanggalPendek(blockData.tanggal)}.`);
  };

  const extractPaymentInfo = async (base64Data, mimeType) => {
    setIsScanning(true); setScanError('');
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const b64Str = base64Data.split(',')[1];
    const prompt = `Ekstrak data dari struk pembayaran ini. Kembalikan HANYA format JSON murni dengan kunci: { "tanggal": "YYYY-MM-DD", "jam": "HH:MM", "nominal": angka_tanpa_titik }. Contoh: {"tanggal":"2023-10-25","jam":"14:30","nominal":150000}. Jika tidak ditemukan, tebak sewajarnya.`;

    try {
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [ { text: prompt }, { inlineData: { mimeType, data: b64Str } } ] }],
                generationConfig: { responseMimeType: "application/json" }
            }) 
        });
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        setIsScanning(false);
        return JSON.parse(text);
    } catch (err) {
        setIsScanning(false);
        setScanError('Gagal memindai struk. AI tidak dapat mendeteksi, silakan atur tanggal manual.');
        return null;
    }
  };

  // --- HANDLERS PORTAL PENGUNJUNG ---
  const handlePortalSearch = (e) => {
      e.preventDefault();
      const found = sewaList.find(s => s.id_sewa.toLowerCase() === portalSearchId.toLowerCase());
      if(found) {
          setPortalBooking(found);
          setUploadFile(null); 
          setUploadListrikFile(null); 
          setOcrResult(null);
          setScanError('');
          setTanggalUploadPortal(getTodayString()); 
      } else {
          showToast('Kode Reservasi tidak ditemukan!', 'error');
          setPortalBooking(null);
      }
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
          setUploadFile(reader.result);
          
          const extracted = await extractPaymentInfo(reader.result, file.type);
          if (extracted && extracted.tanggal) {
              setOcrResult(extracted);
              const today = getTodayString();
              
              if (/^\d{4}-\d{2}-\d{2}$/.test(extracted.tanggal)) {
                  if (extracted.tanggal > today) {
                      setTanggalUploadPortal(today);
                      showToast("Tanggal di struk melewati hari ini. Otomatis disesuaikan ke hari ini.", 'error');
                  } else {
                      setTanggalUploadPortal(extracted.tanggal);
                      showToast("Tanggal dari struk berhasil dideteksi otomatis!");
                  }
              } else {
                  setTanggalUploadPortal(today);
              }
          } else {
              setOcrResult({ tanggal: getTodayString(), jam: '00:00', nominal: 0 });
          }
      };
      reader.readAsDataURL(file);
  };

  const handleKirimBukti = () => {
      const updatedBooking = { ...portalBooking, status_pembayaran: 'Menunggu Verifikasi', bukti_transfer: uploadFile, ocr_data: ocrResult, tanggal_transfer: tanggalUploadPortal };
      setSewaList(prev => prev.map(s => s.id_sewa === portalBooking.id_sewa ? updatedBooking : s));
      setPortalBooking(updatedBooking); 
      setUploadFile(null);
      setOcrResult(null);
      showToast('Bukti pembayaran LOKASI berhasil dikirim!');
  };

  const handleFileListrikChangePortal = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          setUploadListrikFile(reader.result);
      };
      reader.readAsDataURL(file);
  };

  const handleKirimBuktiListrik = () => {
      const updatedBooking = { ...portalBooking, bukti_transfer_listrik: uploadListrikFile, tanggal_transfer: tanggalUploadPortal };
      setSewaList(prev => prev.map(s => s.id_sewa === portalBooking.id_sewa ? updatedBooking : s));
      setPortalBooking(updatedBooking); 
      setUploadListrikFile(null);
      showToast('Bukti pembayaran LISTRIK berhasil dikirim!');
  };

  // --- RENDER MASTER DATA ---
  const renderMasterData = () => (
    <div className="space-y-6 max-w-[90rem] mx-auto pb-32 lg:pb-12">
      <div className="sticky top-0 z-40 bg-[#F4F7F4]/95 backdrop-blur-md pt-4 sm:pt-5 lg:pt-8 pb-4 mb-6 -mx-4 px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8 border-b border-emerald-100">
        <h2 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tight">Master Data & Pengaturan</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Master PIC Kantor */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
             <h3 className="font-bold text-emerald-900 mb-1 flex items-center text-lg"><Users className="mr-2 text-amber-500" si
