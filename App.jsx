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
  Printer,
  Menu,
  LogOut
} from 'lucide-react';

// --- CONSTANTS & DATA ---
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [printMode, setPrintMode] = useState(null);

  // State Master
  const [masterLokasi, setMasterLokasi] = useState(initialDataLokasi);
  const [picList, setPicList] = useState(['Tari', 'Rizmy', 'Alan', 'Isna', 'Erna', 'Suhendra', 'Putri']);
  const [newPic, setNewPic] = useState('');
  const [blockData, setBlockData] = useState({ tanggal: getTodayString(), lokasi: 'Semua Lokasi' });

  // State Lokasi Baru
  const [newLokasiNama, setNewLokasiNama] = useState('');
  const [newLokasiTipe, setNewLokasiTipe] = useState('pendopo');

  // State Sewa
  const [sewaList, setSewaList] = useState(initialDataSewa);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [filterTipe, setFilterTipe] = useState('semua');
  const [filterDateSewa, setFilterDateSewa] = useState('');
  const [filterDatePembayaran, setFilterDatePembayaran] = useState('');
  
  // State Pembayaran
  const [pembayaranViewMode, setPembayaranViewMode] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // State Booking
  const [bookingLokasi, setBookingLokasi] = useState(null);
  const [formData, setFormData] = useState({
    namaRombongan: '', picRombongan: '', noWa: '', picKantor: '', keterangan: '', statusPembayaran: 'Belum Transfer', listrikTambahan: false, luasLahan: 50
  });

  // State Detail
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailMode, setDetailMode] = useState('view');
  const [editFormData, setEditFormData] = useState({});
  const [rescheduleData, setRescheduleData] = useState({ tanggal: '', lokasi: '' });

  // State Portal
  const [portalSearchId, setPortalSearchId] = useState('');
  const [portalBooking, setPortalBooking] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadListrikFile, setUploadListrikFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [tanggalUploadPortal, setTanggalUploadPortal] = useState(getTodayString());

  useEffect(() => {
    if (printMode) {
      const timer = setTimeout(() => {
        window.print();
        setPrintMode(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printMode]);

  const showToast = (msg, type = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
  };

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

  // Computed properties
  const fasilitasHarian = useMemo(() => {
    const sewaHariIni = sewaList.filter(sewa => sewa.tanggal_sewa === selectedDate);
    let filteredLokasi = masterLokasi;
    if (filterTipe !== 'semua') filteredLokasi = masterLokasi.filter(lokasi => lokasi.tipe === filterTipe);
    return filteredLokasi.map(lokasi => {
      const booking = sewaHariIni.find(sewa => sewa.lokasi_sewa === lokasi.nama);
      return { ...lokasi, status: booking ? 'Disewa' : 'Tersedia', bookingInfo: booking || null };
    });
  }, [selectedDate, filterTipe, sewaList, masterLokasi]);

  const availableLokasiForReschedule = useMemo(() => {
    if (!rescheduleData.tanggal || !selectedRecord) return [];
    const sewaHariItu = sewaList.filter(s => s.tanggal_sewa === rescheduleData.tanggal && s.id_sewa !== selectedRecord.id_sewa && s.status_pembayaran !== 'Ditutup');
    return masterLokasi.filter(l => !sewaHariItu.find(s => s.lokasi_sewa === l.nama));
  }, [rescheduleData.tanggal, sewaList, selectedRecord, masterLokasi]);

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

  const getIconData = (tipe) => {
    switch(tipe) {
      case 'pendopo': return { icon: Tent, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
      case 'lapangan': return { icon: TreePine, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
      default: return { icon: MapPin, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    }
  };
  
  const getStatusBadgeClass = (status) => {
      const s = status || 'Belum Transfer';
      if (s === 'Sudah' || s === 'Sudah Lunas' || s === 'Sudah Transfer') return 'bg-green-100 text-green-700 border border-green-300';
      if (s === 'Menunggu Verifikasi') return 'bg-blue-100 text-blue-700 border border-blue-300';
      if (s === 'Menunggu Transfer') return 'bg-yellow-100 text-yellow-700 border border-yellow-300'; 
      if (s === 'Ditutup') return 'bg-gray-200 text-gray-700 border border-gray-300';
      return 'bg-red-100 text-red-700 border border-red-300';
  };

  // Handlers
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
    showToast('✓ Reservasi berhasil ditambahkan!');
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

    const msg = `Terima kasih telah melakukan pemesanan fasilitas di Taman Margasatwa Ragunan.\n\nID Sewa: *${selectedRecord.id_sewa}*\nNama Penyewa: ${selectedRecord.nama_penyewa}\nLokasi: ${selectedRecord.lokasi_sewa}${luasText}${rincianBiayaText}\n\nSilakan transfer ke:\nBank DKI - Pondok Labu\nNo. Rek: 40142700918\nA/N: TM Ragunan Penerimaan BLUD`;

    const rawPhone = String(selectedRecord.no_hp_penyewa || '');
    let phone = rawPhone.replace(/\D/g, ''); 
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
    showToast('✓ Data pengunjung diperbarui!');
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
    showToast('✓ Jadwal berhasil dipindahkan!');
  };

  const handlePrintPenanda = () => {
    if (!selectedRecord) return;
    setPrintMode('penanda');
  };

  const handlePrintBukti = () => {
    if (!selectedRecord || !selectedRecord.bukti_transfer) return;
    setPrintMode('bukti');
  };

  const handleAddLokasi = (e) => {
      e.preventDefault();
      const namaUpper = newLokasiNama.trim().toUpperCase();
      if (namaUpper !== '' && !masterLokasi.find(l => l.nama === namaUpper)) {
          const newId = masterLokasi.length > 0 ? Math.max(...masterLokasi.map(l => l.id)) + 1 : 1;
          setMasterLokasi([...masterLokasi, { id: newId, nama: namaUpper, tipe: newLokasiTipe }]);
          setNewLokasiNama('');
          showToast('✓ Lokasi baru ditambahkan.');
      } else {
          showToast('Nama lokasi sudah ada atau kosong!', 'error');
      }
  };

  const handleDeleteLokasi = (id) => {
      setMasterLokasi(masterLokasi.filter(l => l.id !== id));
      showToast('✓ Lokasi dihapus.');
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
          showToast('✓ Struk listrik ditambahkan!');
      };
      reader.readAsDataURL(file);
  };

  const handleAddPic = (e) => {
      e.preventDefault();
      if(newPic.trim() !== '' && !picList.includes(newPic)) {
          setPicList([...picList, newPic]);
          setNewPic('');
          showToast('✓ PIC ditambahkan.');
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
      showToast(`✓ ${filteredBlocks.length} lokasi ditutup untuk maintenance.`);
  };

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
      reader.onloadend = () => {
          setUploadFile(reader.result);
          setOcrResult({ tanggal: getTodayString(), jam: '00:00', nominal: 0 });
      };
      reader.readAsDataURL(file);
  };

  const handleKirimBukti = () => {
      const updatedBooking = { ...portalBooking, status_pembayaran: 'Menunggu Verifikasi', bukti_transfer: uploadFile, ocr_data: ocrResult, tanggal_transfer: tanggalUploadPortal };
      setSewaList(prev => prev.map(s => s.id_sewa === portalBooking.id_sewa ? updatedBooking : s));
      setPortalBooking(updatedBooking); 
      setUploadFile(null);
      setOcrResult(null);
      showToast('✓ Bukti pembayaran dikirim!');
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
      showToast('✓ Bukti listrik dikirim!');
  };

  // Render functions
  const renderDetailModal = () => {
    if (!selectedRecord) return null;

    const locInfo = masterLokasi.find(l => l.nama === selectedRecord.lokasi_sewa);
    const isLapangan = locInfo?.tipe === 'lapangan' || selectedRecord.lokasi_sewa.includes('LAP');
    const viewBiayaLokasi = getBiayaLokasi(selectedRecord.lokasi_sewa, selectedRecord.luas_lahan);
    const viewBiayaListrik = selectedRecord.listrik_tambahan ? 100000 : 0;
    const viewTotalBiaya = selectedRecord.total_biaya !== undefined ? selectedRecord.total_biaya : (viewBiayaLokasi + viewBiayaListrik);

    if (selectedRecord.status_pembayaran === 'Ditutup') {
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end transition-all" onClick={() => setSelectedRecord(null)}>
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end mb-4"><button type="button" onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button></div>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <Lock size={56} className="text-gray-400 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Lokasi Ditutup</h3>
                    <p className="text-gray-600 mb-1">{selectedRecord.lokasi_sewa}</p>
                    <p className="text-sm text-gray-500 mb-6">{formatTanggalIndo(selectedRecord.tanggal_sewa)}</p>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 border border-gray-200 mb-6">Keterangan: {selectedRecord.keterangan || '-'}</div>
                    <button type="button" onClick={() => { setSewaList(sewaList.filter(s => s.id_sewa !== selectedRecord.id_sewa)); setSelectedRecord(null); showToast('✓ Lokasi dibuka kembali!'); }} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">
                        Buka Kembali Fasilitas
                    </button>
                </div>
            </div>
          </div>
        );
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end transition-all" onClick={() => setSelectedRecord(null)}>
        <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
            <h3 className="font-bold text-lg">
                {detailMode === 'view' ? 'Detail Sewa' : detailMode === 'edit' ? 'Edit Data' : 'Reschedule'}
            </h3>
            <button type="button" onClick={() => setSelectedRecord(null)} className="p-1.5 hover:bg-green-800 rounded-full transition-colors"><X size={18} /></button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
             <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
               <p className="text-xs uppercase font-bold tracking-widest text-yellow-700 mb-1">ID Transaksi</p>
               <p className="font-bold text-gray-900 text-lg">{selectedRecord.id_sewa}</p>
             </div>

             {detailMode === 'view' && (
                 <>
                     <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={handleKirimWA} className="flex flex-col items-center justify-center bg-green-100 text-green-700 p-3 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors"><Send size={16} className="mb-1" /> Kirim WA</button>
                        <button type="button" onClick={() => setDetailMode('edit')} className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 p-3 rounded-lg text-xs font-bold hover:bg-blue-200"><Edit size={16} className="mb-1" /> Edit</button>
                        <button type="button" onClick={() => setDetailMode('reschedule')} className="flex flex-col items-center justify-center bg-purple-100 text-purple-700 p-3 rounded-lg text-xs font-bold hover:bg-purple-200"><CalendarDays size={16} className="mb-1" /> Jadwal</button>
                        <button type="button" onClick={handlePrintPenanda} className="flex flex-col items-center justify-center bg-gray-100 text-gray-700 p-3 rounded-lg text-xs font-bold hover:bg-gray-200"><Printer size={16} className="mb-1" /> Cetak</button>
                     </div>

                     <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                       <div className="grid grid-cols-2 gap-3">
                           <div><p className="text-xs text-gray-600 font-bold mb-1">LOKASI</p><p className="font-bold text-gray-900">{selectedRecord.lokasi_sewa}</p></div>
                           <div><p className="text-xs text-gray-600 font-bold mb-1">TANGGAL</p><p className="font-bold text-gray-900 text-sm">{formatTanggalPendek(selectedRecord.tanggal_sewa)}</p></div>
                       </div>
                       {isLapangan && (
                           <>
                             <hr className="border-gray-100" />
                             <div><p className="text-xs text-gray-600 font-bold mb-1">LUAS LAHAN</p><p className="font-bold text-gray-900">{selectedRecord.luas_lahan} m²</p></div>
                           </>
                       )}
                       <hr className="border-gray-100" />
                       <div className="grid grid-cols-2 gap-3">
                           <div><p className="text-xs text-gray-600 font-bold mb-1">ROMBONGAN</p><p className="font-bold text-gray-900 text-sm">{selectedRecord.nama_penyewa || '-'}</p></div>
                           <div><p className="text-xs text-gray-600 font-bold mb-1">PIC</p><p className="font-bold text-gray-900 text-sm">{selectedRecord.pic_rombongan || '-'}</p></div>
                       </div>
                       <hr className="border-gray-100" />
                       <div className="grid grid-cols-2 gap-3">
                           <div><p className="text-xs text-gray-600 font-bold mb-1">NO. WA</p><p className="font-bold text-gray-900 text-sm">{selectedRecord.no_hp_penyewa || '-'}</p></div>
                           <div><p className="text-xs text-gray-600 font-bold mb-1">PIC KANTOR</p><p className="font-bold text-gray-900 text-sm">{selectedRecord.pic_kantor || '-'}</p></div>
                       </div>
                       <hr className="border-gray-100" />
                       <div><p className="text-xs text-gray-600 font-bold mb-1">KETERANGAN</p><p className="font-medium text-gray-700 text-sm">{selectedRecord.keterangan || '-'}</p></div>
                       <hr className="border-gray-100" />
                       
                       <div className="grid grid-cols-2 gap-3 pt-2">
                           <div><p className="text-xs text-gray-600 font-bold mb-1">BIAYA LOKASI</p><p className="font-bold text-gray-900 text-sm">{formatRupiah(viewBiayaLokasi)}</p></div>
                           <div><p className="text-xs text-gray-600 font-bold mb-1">LISTRIK</p><p className="font-bold text-gray-900 text-sm flex items-center">{selectedRecord.listrik_tambahan ? <><Zap size={12} className="text-yellow-500 mr-1"/> +Rp 100rb</> : 'Mati'}</p></div>
                       </div>
                       <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center mt-2">
                           <span className="text-xs font-bold text-green-800">TOTAL BIAYA</span>
                           <span className="font-bold text-green-700 text-lg">{formatRupiah(viewTotalBiaya)}</span>
                       </div>
                     </div>

                     <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-900 flex items-center"><Zap size={14} className="text-yellow-500 mr-2"/> Set Listrik</p>
                            <p className="text-xs text-gray-600 mt-1">Aktifkan upload listrik</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={selectedRecord.listrik_tambahan || false}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const biayaLok = getBiayaLokasi(selectedRecord.lokasi_sewa, selectedRecord.luas_lahan);
                                    const biayaLis = isChecked ? 100000 : 0;
                                    const updatedRecord = { ...selectedRecord, listrik_tambahan: isChecked, akses_upload_listrik: isChecked, total_biaya: biayaLok + biayaLis };
                                    setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updatedRecord : s));
                                    setSelectedRecord(updatedRecord);
                                }} 
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                        </label>
                     </div>

                     {selectedRecord.listrik_tambahan && (
                         <div className="bg-white rounded-lg p-4 border border-yellow-200">
                             <div className="flex items-center justify-between mb-3 border-b border-yellow-100 pb-3">
                                 <div>
                                    <p className="text-xs text-yellow-800 font-bold">AKSES PORTAL LISTRIK</p>
                                    <p className="text-xs text-yellow-600 mt-1">{selectedRecord.akses_upload_listrik ? 'Aktif' : 'Non-Aktif'}</p>
                                 </div>
                                 <label className={`flex items-center cursor-pointer px-3 py-1.5 rounded-lg border transition-colors ${selectedRecord.akses_upload_listrik ? 'bg-yellow-100 border-yellow-300' : 'bg-gray-100 border-gray-200'}`}>
                                     <span className={`text-xs font-bold mr-2 ${selectedRecord.akses_upload_listrik ? 'text-yellow-800' : 'text-gray-500'}`}>{selectedRecord.akses_upload_listrik ? 'ON' : 'OFF'}</span>
                                     <input type="checkbox" checked={selectedRecord.akses_upload_listrik || false} onChange={(e) => { const updated = {...selectedRecord, akses_upload_listrik: e.target.checked}; setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updated : s)); setSelectedRecord(updated); }} className="w-4 h-4 text-yellow-600 rounded" />
                                 </label>
                             </div>

                             {selectedRecord.bukti_transfer_listrik ? (
                                 <div>
                                     <span className="px-3 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-700 flex w-max items-center mb-2"><CheckCircle2 size={12} className="mr-1"/> Struk Ada</span>
                                     <img src={selectedRecord.bukti_transfer_listrik} alt="Struk" className="w-full rounded-lg border border-gray-200 mt-1 mb-3 max-h-32 object-cover" />
                                     <button type="button" onClick={() => { const updated = {...selectedRecord, bukti_transfer_listrik: null}; setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updated : s)); setSelectedRecord(updated); }} className="w-full bg-red-50 text-red-600 font-bold py-2 rounded-lg hover:bg-red-100 transition-colors text-xs">Hapus</button>
                                 </div>
                             ) : (
                                 <div className="text-center">
                                     <label className="w-full border-2 border-dashed border-yellow-200 bg-white text-yellow-700 font-bold py-4 rounded-lg hover:bg-yellow-50 transition-colors text-xs flex flex-col items-center justify-center cursor-pointer block">
                                         <input type="file" accept="image/*" className="hidden" onChange={handleUploadListrikChange} />
                                         <UploadCloud size={20} className="mb-1" />
                                         Upload Struk Listrik
                                     </label>
                                 </div>
                             )}
                         </div>
                     )}

                     <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 font-bold mb-3">STATUS PEMBAYARAN</p>
                        <div className="mb-4">
                           <span className={`px-3 py-1.5 rounded-md text-xs font-bold ${getStatusBadgeClass(selectedRecord.status_pembayaran)}`}>{selectedRecord.status_pembayaran}</span>
                        </div>
                        {selectedRecord.status_pembayaran === 'Menunggu Verifikasi' && selectedRecord.bukti_transfer && (
                            <button type="button" onClick={() => {
                                setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? { ...s, status_pembayaran: 'Sudah Transfer' } : s));
                                setSelectedRecord({...selectedRecord, status_pembayaran: 'Sudah Transfer'});
                                showToast('✓ Pembayaran diverifikasi!');
                            }} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 mb-3 flex justify-center items-center text-sm"><CheckCircle2 size={16} className="mr-2"/> Verifikasi</button>
                        )}
                        {selectedRecord.bukti_transfer && (
                            <div className="mt-2 space-y-2">
                                <img src={selectedRecord.bukti_transfer} alt="Struk" className="w-full rounded-lg border border-gray-200 max-h-40 object-cover" />
                                <button type="button" onClick={handlePrintBukti} className="w-full bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs border border-gray-200 flex justify-center items-center">
                                    <Printer size={14} className="mr-2"/> Cetak Bukti
                                </button>
                            </div>
                        )}
                     </div>
                 </>
             )}

             {detailMode === 'edit' && (
                 <form onSubmit={handleSaveEdit} className="space-y-4">
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center text-blue-800 text-xs font-bold"><Edit size={14} className="mr-2"/> Mode Edit</div>
                     {isLapangan && (
                         <div>
                            <label className="block text-xs font-bold text-gray-900 mb-2">Luas Lahan (m²)</label>
                            <input required type="number" min="50" value={editFormData.luas_lahan || 50} onChange={e => setEditFormData({...editFormData, luas_lahan: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                         </div>
                     )}
                     <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2">Nama Rombongan</label>
                        <input required type="text" value={editFormData.nama_penyewa || ''} onChange={e => setEditFormData({...editFormData, nama_penyewa: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2">PIC Rombongan</label>
                          <input required type="text" value={editFormData.pic_rombongan || ''} onChange={e => setEditFormData({...editFormData, pic_rombongan: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2">No WhatsApp</label>
                          <input required type="text" value={editFormData.no_hp_penyewa || ''} onChange={e => setEditFormData({...editFormData, no_hp_penyewa: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2">PIC Kantor TMR</label>
                        <select required value={editFormData.pic_kantor || ''} onChange={e => setEditFormData({...editFormData, pic_kantor: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                            {picList.map((pic, idx) => <option key={idx} value={pic}>{pic}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2">Keterangan</label>
                        <textarea value={editFormData.keterangan || ''} onChange={e => setEditFormData({...editFormData, keterangan: e.target.value})} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                     </div>
                     <div className="flex space-x-2 pt-4 border-t border-gray-100">
                         <button type="button" onClick={() => handleOpenDetail(selectedRecord)} className="flex-1 px-3 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Batal</button>
                         <button type="submit" className="flex-1 px-3 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
                     </div>
                 </form>
             )}

             {detailMode === 'reschedule' && (
                 <form onSubmit={handleSaveReschedule} className="space-y-4">
                     <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 flex items-center text-purple-800 text-xs font-bold"><CalendarDays size={14} className="mr-2"/> Mode Reschedule</div>
                     <div className="bg-gray-50 border border-gray-300 p-3 rounded-lg text-xs text-gray-700">Jadwal saat ini: <br/><b>{formatTanggalIndo(selectedRecord.tanggal_sewa)}</b> di <b>{selectedRecord.lokasi_sewa}</b></div>
                     <div>
                         <label className="block text-xs font-bold text-gray-900 mb-2">Pilih Tanggal Baru</label>
                         <input type="date" required min={getTodayString()} value={rescheduleData.tanggal} onChange={e => setRescheduleData({...rescheduleData, tanggal: e.target.value, lokasi: ''})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer" />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-gray-900 mb-2">Pilih Lokasi Kosong</label>
                         <select required value={rescheduleData.lokasi} onChange={e => setRescheduleData({...rescheduleData, lokasi: e.target.value})} disabled={!rescheduleData.tanggal} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100">
                             <option value="" disabled>{rescheduleData.tanggal ? 'Pilih Lokasi' : 'Pilih Tanggal Dulu'}</option>
                             {availableLokasiForReschedule.map(l => <option key={l.id} value={l.nama}>{l.nama}</option>)}
                         </select>
                         {rescheduleData.tanggal && availableLokasiForReschedule.length === 0 && <p className="text-xs text-red-600 mt-1">Tidak ada lokasi kosong.</p>}
                     </div>
                     <div className="flex space-x-2 pt-4 border-t border-gray-100">
                         <button type="button" onClick={() => handleOpenDetail(selectedRecord)} className="flex-1 px-3 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg">Batal</button>
                         <button type="submit" className="flex-1 px-3 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700">Pindah</button>
                     </div>
                 </form>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderMasterData = () => (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-4 pb-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-gray-200">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Master Data & Pengaturan</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Master PIC Kantor */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-1 flex items-center text-lg"><Users className="mr-2 text-blue-600" size={22}/> Master PIC</h3>
             <p className="text-xs text-gray-600 mb-5">Daftar petugas internal TMR.</p>
             
             <form onSubmit={handleAddPic} className="flex gap-2 mb-6">
                 <input type="text" required value={newPic} onChange={e => setNewPic(e.target.value)} placeholder="Nama PIC..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none font-medium" />
                 <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Tambah</button>
             </form>
             <div className="space-y-2 max-h-80 overflow-y-auto">
                 {picList.map((pic, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300">
                         <span className="font-bold text-gray-900 text-sm">{pic}</span>
                         <button type="button" onClick={() => setPicList(picList.filter(p => p !== pic))} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded transition-colors"><X size={16}/></button>
                     </div>
                 ))}
             </div>
          </div>

          {/* Master Lokasi */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-1 flex items-center text-lg"><MapPin className="mr-2 text-green-600" size={22}/> Master Lokasi</h3>
             <p className="text-xs text-gray-600 mb-5">Kelola daftar fasilitas/lokasi sewa.</p>
             
             <form onSubmit={handleAddLokasi} className="flex flex-col gap-2 mb-6">
                 <input type="text" required value={newLokasiNama} onChange={e => setNewLokasiNama(e.target.value)} placeholder="Nama Lokasi..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none font-medium uppercase" />
                 <div className="flex gap-2">
                     <select value={newLokasiTipe} onChange={e => setNewLokasiTipe(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none font-medium bg-white">
                         <option value="pendopo">Pendopo</option>
                         <option value="lapangan">Lapangan</option>
                     </select>
                     <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700">Tambah</button>
                 </div>
             </form>
             <div className="space-y-2 max-h-80 overflow-y-auto">
                 {masterLokasi.map((lok) => (
                     <div key={lok.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300">
                         <div>
                             <span className="font-bold text-gray-900 text-sm block mb-0.5">{lok.nama}</span>
                             <span className="text-xs font-bold text-green-600 uppercase">{lok.tipe}</span>
                         </div>
                         <button type="button" onClick={() => handleDeleteLokasi(lok.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded transition-colors"><X size={16}/></button>
                     </div>
                 ))}
             </div>
          </div>

          {/* Blokir Lokasi */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-1 flex items-center text-lg"><Lock className="mr-2 text-red-600" size={22}/> Blokir Lokasi</h3>
             <p className="text-xs text-gray-600 mb-6">Tutup jadwal untuk Maintenance.</p>
             
             <form onSubmit={handleBlockLokasi} className="space-y-4">
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-gray-900 mb-2">Tanggal Penutupan</label>
                         <input type="date" required min={getTodayString()} value={blockData.tanggal} onChange={e => setBlockData({...blockData, tanggal: e.target.value})} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-bold cursor-pointer" />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-gray-900 mb-2">Pilih Lokasi</label>
                         <select value={blockData.lokasi} onChange={e => setBlockData({...blockData, lokasi: e.target.value})} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-bold">
                             <option value="Semua Lokasi">Semua Lokasi (Tutup Total)</option>
                             {masterLokasi.map(l => <option key={l.id} value={l.nama}>{l.nama}</option>)}
                         </select>
                     </div>
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
                    <Lock size={18} className="mr-2" /> Tutup Lokasi
                 </button>
             </form>
          </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans selection:bg-yellow-200 selection:text-gray-900">
      
      {printMode && (
          <div className="fixed inset-0 z-[9999] bg-white">
             <style>{`
                @media print {
                   body * { visibility: hidden; }
                   .print-overlay-wrapper, .print-overlay-wrapper * { visibility: visible; }
                   .print-overlay-wrapper { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; }
                   ${printMode === 'penanda' ? '@page { size: 297mm 210mm; margin: 0; }' : '@page { size: 210mm 297mm; margin: 0; }'}
                }
             `}</style>
             
             {printMode === 'penanda' && selectedRecord && (
                 <div className="w-[297mm] h-[210mm] p-10 box-border border-12 border-green-600 bg-green-50 flex flex-col justify-center items-center text-center mx-auto my-0 relative overflow-hidden">
                    <div className="border-b-4 border-green-600 pb-5 mb-5 w-full flex-shrink-0 text-center">
                        <h1 className="text-4xl text-green-900 m-0 font-bold tracking-tight">TAMAN MARGASATWA RAGUNAN</h1>
                        <h2 className="text-2xl text-green-600 m-5 tracking-widest">RESERVASI FASILITAS</h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center w-full">
                        <div className="bg-green-600 text-white py-2 px-8 rounded-full text-2xl font-bold mb-4 shadow-lg">{formatTanggalPendek(selectedRecord.tanggal_sewa)}</div>
                        <div className="text-lg text-green-700 font-bold mb-2 uppercase">LOKASI PENYEWAAN</div>
                        <div className="text-5xl text-yellow-600 font-bold m-5 bg-yellow-100 p-3 rounded-2xl border-4 border-dashed border-yellow-500">{selectedRecord.lokasi_sewa}</div>
                        <div className="text-2xl text-green-900 font-bold mb-2">DISIAPKAN UNTUK ROMBONGAN:</div>
                        <div className="text-6xl text-green-900 font-bold leading-tight m-4 uppercase break-words max-w-full">{selectedRecord.nama_penyewa}</div>
                        <div className="mt-3 text-2xl font-bold text-green-700 border-t-2 border-green-600 pt-4 w-4/5">PIC Rombongan: <span className="text-yellow-600">{selectedRecord.pic_rombongan || '-'}</span></div>
                    </div>
                    <div className="text-center mt-auto pt-2 text-sm text-green-900 font-bold w-full">Sistem Informasi Manajemen Fasilitas</div>
                 </div>
             )}

             {printMode === 'bukti' && selectedRecord && (
                 <div className="w-[210mm] h-[297mm] p-12 box-border border-10 border-green-600 bg-green-50 flex flex-col mx-auto my-0 relative overflow-hidden">
                    <div className="text-center border-b-4 border-green-600 pb-5 mb-5 flex-shrink-0">
                        <h1 className="text-2xl text-green-900 m-0 font-bold">TAMAN MARGASATWA RAGUNAN</h1>
                        <h2 className="text-lg text-green-600 m-2 tracking-wider">BUKTI PEMBAYARAN RESERVASI LOKASI</h2>
                    </div>
                    <div className="text-sm color-green-900 mb-8 leading-relaxed flex-shrink-0">
                        <table className="w-full">
                            <tbody>
                                <tr><td className="p-2 align-top font-bold w-40">ID Transaksi</td><td className="p-2 align-top">: <b>{selectedRecord.id_sewa}</b></td></tr>
                                <tr><td className="p-2 align-top font-bold">Nama Penyewa</td><td className="p-2 align-top">: {selectedRecord.nama_penyewa}</td></tr>
                                <tr><td className="p-2 align-top font-bold">Lokasi Sewa</td><td className="p-2 align-top">: {selectedRecord.lokasi_sewa}</td></tr>
                                <tr><td className="p-2 align-top font-bold">Tanggal Sewa</td><td className="p-2 align-top">: {formatTanggalPendek(selectedRecord.tanggal_sewa)}</td></tr>
                                <tr><td className="p-2 align-top font-bold">Tanggal Transfer</td><td className="p-2 align-top">: {formatTanggalPendek(selectedRecord.tanggal_transfer) || '-'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex-1 flex justify-center items-center border-2 border-dashed border-green-600 p-5 bg-white overflow-hidden">
                        <img src={selectedRecord.bukti_transfer} alt="Bukti" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="text-center mt-5 text-sm text-green-900 font-bold w-full flex-shrink-0">Sistem Informasi Manajemen Fasilitas</div>
                 </div>
             )}
          </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all animate-slide-in ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 flex-col shadow-xl`}>
        <div className="px-6 py-8 border-b border-gray-700">
          <div className="w-12 h-12 bg-green-500 rounded-lg mb-4 flex items-center justify-center shadow-lg">
             <Leaf className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">TMR System</h1>
          <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Taman Margasatwa Ragunan</p>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-2">
          {[
            { id: 'reservasi', label: 'Reservasi Lokasi', icon: LayoutDashboard },
            { id: 'sewa', label: 'Data Pengunjung', icon: Users },
            { id: 'pembayaran', label: 'Keuangan', icon: CreditCard },
            { id: 'master', label: 'Master Data', icon: Settings },
            { id: 'portal', label: 'Portal Unggah', icon: UploadCloud }
          ].map(item => (
            <button type="button" key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'bg-green-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <item.icon size={20} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <button type="button" className="w-full flex items-center justify-center space-x-2 text-gray-300 hover:text-white py-2 transition-colors">
            <LogOut size={18} /> <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-4 flex items-center justify-between z-40 lg:hidden sticky top-0 shadow-lg">
          <div className="flex items-center space-x-3">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-700 rounded-lg text-white"><Menu size={20} /></button>
            <span className="font-bold text-white text-lg">TMR System</span>
          </div>
          <Leaf className="text-green-500" size={20} />
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
            {activeTab === 'reservasi' && (
              <div className="max-w-7xl mx-auto pb-8">
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-4 pb-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            Reservasi: {formatTanggalPendek(selectedDate)}
                        </h2>
                        <div className="flex items-center space-x-3 w-full sm:w-80">
                          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 transition-all" style={{ width: `${persentaseSewa}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700">{persentaseSewa}% Penuh</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                          {['semua', 'pendopo', 'lapangan'].map(t => (
                            <button type="button" key={t} onClick={() => setFilterTipe(t)} className={`px-3 py-2 rounded-md text-xs font-bold capitalize transition-all ${filterTipe === t ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600'}`}>{t}</button>
                          ))}
                        </div>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white shadow-sm cursor-pointer" />
                      </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {fasilitasHarian.map(fasilitas => {
                    const { icon: IconComponent, color, bg } = getIconData(fasilitas.tipe);
                    const isTersedia = fasilitas.status === 'Tersedia';
                    const isDitutup = fasilitas.bookingInfo?.status_pembayaran === 'Ditutup';
                    const isLunas = fasilitas.bookingInfo?.status_pembayaran === 'Sudah Transfer';
                    
                    return (
                      <div 
                        key={fasilitas.id} 
                        onClick={() => { 
                            if (isTersedia) setBookingLokasi(fasilitas);
                            else if (fasilitas.bookingInfo) handleOpenDetail(fasilitas.bookingInfo);
                        }}
                        className={`group relative rounded-xl p-3 transition-all duration-300 border-2 flex flex-col justify-between min-h-24 overflow-hidden cursor-pointer ${
                          isTersedia ? 'bg-white border-gray-300 hover:border-green-400 hover:shadow-md' : isDitutup ? 'bg-gray-100 border-gray-300 opacity-70' : 'bg-red-50 border-red-300 hover:border-red-400'
                        }`}
                      >
                        {isLunas && <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold flex items-center"><CheckCircle2 size={12} className="mr-1"/> LUNAS</div>}
                        
                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-2 rounded-lg shadow-sm ${bg}`}><IconComponent size={14} className={color} /></div>
                          <div className={`w-3 h-3 rounded-full shadow-sm ${isTersedia ? 'bg-green-400' : isDitutup ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                        </div>
                        <h4 className={`font-bold text-xs leading-tight line-clamp-2 mb-2 ${isTersedia ? 'text-gray-900' : isDitutup ? 'text-gray-600' : 'text-gray-800'}`}>{fasilitas.nama}</h4>
                        <div>
                          {isTersedia ? <span className="text-xs font-bold text-green-600 uppercase">Pesan →</span> : isDitutup ? <span className="text-xs font-bold text-gray-500">Maintenance</span> : <span className="text-xs font-bold text-red-700 truncate">{fasilitas.bookingInfo?.nama_penyewa}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'sewa' && (
              <div className="space-y-6 max-w-7xl mx-auto pb-8">
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-4 pb-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Data Pengunjung Aktif</h2>
                      <p className="text-xs text-gray-600 mt-2">Dikelompokkan berdasarkan tanggal reservasi</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input type="date" value={filterDateSewa} onChange={(e) => setFilterDateSewa(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white" />
                      {filterDateSewa && <button type="button" onClick={() => setFilterDateSewa('')} className="bg-red-100 hover:bg-red-200 text-red-700 p-2.5 rounded-lg"><X size={20} /></button>}
                  </div>
                </div>
                {groupedSewa.length === 0 ? (
                    <div className="flex justify-center py-12"><p className="font-bold text-gray-500">Tidak ada data pengunjung.</p></div>
                ) : (
                    groupedSewa.map(group => (
                        <div key={group.date}>
                            <div className="bg-green-700 text-white px-4 py-3 rounded-t-lg font-bold flex items-center justify-between"><Calendar size={16} className="mr-2" /> {formatTanggalIndo(group.date)} <span className="bg-green-600 px-3 py-1 rounded-full text-xs">{group.data.length} Booking</span></div>
                            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-sm overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr className="text-xs font-bold text-gray-700 uppercase"><th className="px-4 py-3">ID</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Pembayaran</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {group.data.map((item, idx) => (
                                    <tr key={idx} onClick={() => handleOpenDetail(item)} className="hover:bg-gray-50 cursor-pointer">
                                      <td className="px-4 py-3 font-bold text-gray-900">{item.id_sewa}</td>
                                      <td className="px-4 py-3 text-gray-800 font-medium">{item.lokasi_sewa}</td>
                                      <td className="px-4 py-3 text-gray-700">{item.nama_penyewa}</td>
                                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadgeClass(item.status_pembayaran)}`}>{item.status_pembayaran}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                        </div>
                    ))
                )}
              </div>
            )}

            {activeTab === 'pembayaran' && (
              <div className="space-y-6 max-w-7xl mx-auto pb-8">
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-4 pb-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Verifikasi Pembayaran</h2>
                      <p className="text-xs text-gray-600 mt-2">Dikelompokkan berdasarkan tanggal transfer</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                         <button type="button" onClick={() => setPembayaranViewMode('list')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${pembayaranViewMode === 'list' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600'}`}><List size={16} className="inline mr-1" /> Daftar</button>
                         <button type="button" onClick={() => setPembayaranViewMode('calendar')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${pembayaranViewMode === 'calendar' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600'}`}><LayoutGrid size={16} className="inline mr-1" /> Kalender</button>
                      </div>
                  </div>
                </div>

                {pembayaranViewMode === 'list' && (
                    <>
                    {groupedPembayaran.length === 0 ? (
                        <div className="flex justify-center py-12"><p className="font-bold text-gray-500">Tidak ada data pembayaran.</p></div>
                    ) : (
                        groupedPembayaran.map(group => {
                            const totalNominalGroup = group.data.reduce((sum, item) => sum + (item.total_biaya || 0), 0);
                            return (
                            <div key={group.date} className="mb-6">
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 px-4 py-3 mb-3 rounded-r-lg">
                                    <h3 className="font-bold text-gray-900">{formatTanggalIndo(group.date)}</h3>
                                    <p className="text-xs text-gray-600 mt-1">Total Masuk: <span className="font-bold text-green-700">{formatRupiah(totalNominalGroup)}</span></p>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b"><tr className="text-xs font-bold text-gray-700 uppercase"><th className="px-4 py-3">ID</th><th className="px-4 py-3">Penyewa</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Status</th></tr></thead>
                                    <tbody className="divide-y">
                                      {group.data.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenDetail(item)}>
                                          <td className="px-4 py-3 font-bold text-gray-900">{item.id_sewa}</td>
                                          <td className="px-4 py-3 text-gray-800">{item.nama_penyewa}</td>
                                          <td className="px-4 py-3 font-bold text-green-700">{formatRupiah(item.total_biaya)}</td>
                                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadgeClass(item.status_pembayaran)}`}>{item.status_pembayaran}</span></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                            </div>
                        )})
                    )}
                    </>
                )}
              </div>
            )}

            {activeTab === 'master' && renderMasterData()}
            
            {activeTab === 'portal' && (
              <div className="max-w-3xl mx-auto pb-8">
                 <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-center text-white mb-8 shadow-lg">
                     <UploadCloud size={48} className="mx-auto mb-4" />
                     <h2 className="text-3xl font-bold mb-2">Unggah Bukti Transfer</h2>
                     <p className="text-green-100">Cari kode reservasi dan upload bukti pembayaran Anda</p>
                 </div>
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <form onSubmit={handlePortalSearch} className="flex gap-3 mb-8">
                         <input type="text" required value={portalSearchId} onChange={e => setPortalSearchId(e.target.value)} placeholder="Contoh: TMR-52967" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 outline-none text-gray-900 font-bold bg-gray-50" />
                         <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">Cari</button>
                     </form>
                     
                     {portalBooking && (
                         <div className="border-t border-gray-200 pt-8">
                             <div className="bg-green-50 rounded-lg p-5 mb-8 border border-green-200">
                                 <h3 className="font-bold text-gray-900 mb-4 border-b border-green-200 pb-3">Data Reservasi</h3>
                                 <div className="grid grid-cols-2 gap-4 text-sm">
                                     <div><span className="block text-xs font-bold text-gray-600 mb-1">LOKASI</span><span className="font-bold text-gray-900">{portalBooking.lokasi_sewa}</span></div>
                                     <div><span className="block text-xs font-bold text-gray-600 mb-1">TANGGAL</span><span className="font-bold text-gray-900">{formatTanggalIndo(portalBooking.tanggal_sewa)}</span></div>
                                     <div><span className="block text-xs font-bold text-gray-600 mb-1">NAMA</span><span className="font-bold text-gray-900">{portalBooking.nama_penyewa}</span></div>
                                     <div><span className="block text-xs font-bold text-gray-600 mb-1">STATUS</span><span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold ${getStatusBadgeClass(portalBooking.status_pembayaran)}`}>{portalBooking.status_pembayaran}</span></div>
                                 </div>
                             </div>

                             {(portalBooking.status_pembayaran !== 'Sudah Transfer' && portalBooking.status_pembayaran !== 'Menunggu Verifikasi') && (
                                 <div className="mb-8 bg-white rounded-lg p-4 border border-gray-200">
                                     <label className="block text-xs font-bold text-gray-900 mb-3">Tanggal Transfer</label>
                                     <input 
                                         type="date" 
                                         max={getTodayString()}
                                         value={tanggalUploadPortal} 
                                         onChange={(e) => {
                                             if(e.target.value > getTodayString()) {
                                                 showToast("Tanggal tidak boleh melebihi hari ini!", 'error');
                                             } else {
                                                 setTanggalUploadPortal(e.target.value);
                                             }
                                         }} 
                                         className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 outline-none text-gray-900 font-bold bg-gray-50 cursor-pointer" 
                                     />
                                 </div>
                             )}

                             <div className="space-y-6">
                                 <div>
                                     <h4 className="font-bold text-gray-900 text-sm mb-4">Bukti Pembayaran Lokasi</h4>
                                     {portalBooking.status_pembayaran === 'Sudah Transfer' ? (
                                         <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200"><CheckCircle2 size={40} className="mx-auto text-green-500 mb-2" /><p className="font-bold text-green-900">Pembayaran Tervalidasi</p></div>
                                     ) : portalBooking.status_pembayaran === 'Menunggu Verifikasi' ? (
                                         <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200"><AlertCircle size={40} className="mx-auto text-blue-500 mb-2 animate-pulse" /><p className="font-bold text-blue-900">Sedang Diverifikasi</p></div>
                                     ) : (
                                         <div className="space-y-4">
                                             {!uploadFile && (
                                                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                    <UploadCloud size={32} className="mx-auto text-gray-400 mb-3" />
                                                    <p className="font-bold text-gray-800">Klik untuk upload bukti pembayaran</p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, atau PDF</p>
                                                </label>
                                             )}
                                             {uploadFile && (
                                                 <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                     <img src={uploadFile} alt="Preview" className="w-full rounded-lg mb-4 max-h-64 object-cover" />
                                                     <button type="button" onClick={handleKirimBukti} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">Kirim Bukti Pembayaran</button>
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
              </div>
            )}
        </div>

        {bookingLokasi && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-green-700 text-white">
                    <div>
                        <h3 className="font-bold text-lg">Formulir Reservasi</h3>
                        <p className="text-xs text-green-100 mt-1">{bookingLokasi.nama} • {formatTanggalPendek(selectedDate)}</p>
                    </div>
                    <button type="button" onClick={() => setBookingLokasi(null)} className="p-2 hover:bg-green-600 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitBooking} className="p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50">
                    
                    {bookingLokasi.tipe === 'lapangan' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <label className="block text-xs font-bold text-gray-900 mb-2">Luas Lahan (minimal 50 m²)</label>
                            <div className="flex items-center">
                                <input required type="number" min="50" value={formData.luasLahan} onChange={(e)=>setFormData({...formData, luasLahan: e.target.value})} className="w-24 px-3 py-2.5 rounded-lg border border-green-300 focus:border-green-500 outline-none text-base font-bold text-center" />
                                <span className="ml-3 font-bold text-gray-700">m² × Rp 2.000</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center text-xs text-gray-700 font-medium mb-1">
                            <span>Tarif Sewa:</span>
                            <span className="font-bold">{formatRupiah(getBiayaLokasi(bookingLokasi.nama, bookingLokasi.tipe === 'lapangan' ? formData.luasLahan : null))}</span>
                        </div>
                        {formData.listrikTambahan && (
                            <div className="flex justify-between items-center text-xs text-gray-700 font-medium mb-1">
                                <span className="flex items-center"><Zap size={12} className="mr-1 text-yellow-500" /> Listrik:</span>
                                <span className="font-bold">{formatRupiah(100000)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-green-100 mt-1">
                            <span className="font-bold text-gray-900">Total:</span>
                            <span className="font-bold text-green-700 text-lg">{formatRupiah(getBiayaLokasi(bookingLokasi.nama, bookingLokasi.tipe === 'lapangan' ? formData.luasLahan : null) + (formData.listrikTambahan ? 100000 : 0))}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2">Nama Rombongan</label>
                        <input required type="text" value={formData.namaRombongan} onChange={(e)=>setFormData({...formData, namaRombongan: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 outline-none text-sm font-bold" placeholder="Tuliskan nama..." />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-900 mb-2">PIC Rombongan</label>
                            <input required type="text" value={formData.picRombongan} onChange={(e)=>setFormData({...formData, picRombongan: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 outline-none text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-900 mb-2">No. WhatsApp</label>
                            <input required type="tel" value={formData.noWa} onChange={(e)=>setFormData({...formData, noWa: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 outline-none text-sm font-bold" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2">PIC Kantor (TMR)</label>
                        <select required value={formData.picKantor} onChange={(e)=>setFormData({...formData, picKantor: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 outline-none text-sm font-bold bg-white">
                            <option value="" disabled>Pilih PIC...</option>
                            {picList.map((pic, idx) => <option key={idx} value={pic}>{pic}</option>)}
                        </select>
                    </div>
                    
                    <div className="bg-white border border-gray-300 rounded-lg p-3">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.listrikTambahan} onChange={(e)=>setFormData({...formData, listrikTambahan: e.target.checked})} className="w-5 h-5 text-yellow-500 rounded border-gray-300" />
                            <span className="ml-3 text-sm font-bold text-gray-900 flex items-center"><Zap size={16} className="text-yellow-500 mr-1.5"/> Gunakan Listrik Tambahan</span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-900 mb-2">Status Pembayaran</label>
                        <div className="flex space-x-3">
                            <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer bg-white px-3 py-3 rounded-lg border-2 transition-colors ${formData.statusPembayaran === 'Sudah Transfer' ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                                <input type="radio" name="status" value="Sudah Transfer" checked={formData.statusPembayaran === 'Sudah Transfer'} onChange={(e)=>setFormData({...formData, statusPembayaran: e.target.value})} className="hidden" />
                                <span className="text-xs font-bold">Lunas Sekarang</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer bg-white px-3 py-3 rounded-lg border-2 transition-colors ${formData.statusPembayaran === 'Belum Transfer' ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
                                <input type="radio" name="status" value="Belum Transfer" checked={formData.statusPembayaran === 'Belum Transfer'} onChange={(e)=>setFormData({...formData, statusPembayaran: e.target.value})} className="hidden" />
                                <span className="text-xs font-bold">Belum Transfer</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex space-x-3 sticky bottom-0 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                        <button type="button" onClick={() => setBookingLokasi(null)} className="w-1/3 py-2.5 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
                        <button type="submit" className="w-2/3 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 flex justify-center items-center"><Save size={16} className="mr-2"/> Simpan Reservasi</button>
                    </div>
                </form>
            </div>
        </div>
      )}

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between px-2 py-safe z-40 shadow-2xl">
          {[
            { id: 'reservasi', label: 'Reservasi', icon: LayoutDashboard },
            { id: 'sewa', label: 'Tamu', icon: Users },
            { id: 'pembayaran', label: 'Keuangan', icon: CreditCard },
            { id: 'master', label: 'Master', icon: Settings },
            { id: 'portal', label: 'Upload', icon: UploadCloud }
          ].map(item => (
            <button type="button" key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center flex-1 py-3 transition-colors ${activeTab === item.id ? 'text-green-700 bg-green-50' : 'text-gray-600'}`}>
              <item.icon size={20} />
              <span className="text-xs font-bold mt-0.5">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
