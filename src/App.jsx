import React, { useState, useMemo, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';

// --- DATA LOKASI ---
const defaultDataLokasi = [
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
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const formatTanggalPendek = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
  const tgl = String(date.getDate()).padStart(2, '0');
  const bln = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
  return `${hari}, ${tgl} - ${bln}-${date.getFullYear()}`;
};

const formatRupiah = (angka) => {
    if (angka === undefined || angka === null || isNaN(angka)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};


export default function App() {
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
  const [masterLokasi, setMasterLokasi] = useState(defaultDataLokasi);
const [newMasterLokasiNama, setNewMasterLokasiNama] = useState('');
const [newMasterLokasiTipe, setNewMasterLokasiTipe] = useState('pendopo');
const [activeTab, setActiveTab] = useState('reservasi');
const [toast, setToast] = useState(null); 

  const [picList, setPicList] = useState(['Tari', 'Rizmy', 'Alan', 'Isna', 'Erna', 'Suhendra', 'Putri']);
  const [newPic, setNewPic] = useState('');
  const [blockData, setBlockData] = useState({ tanggal: getTodayString(), lokasi: 'Semua Lokasi' });

  const [sewaList, setSewaList] = useState(initialDataSewa);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [filterTipe, setFilterTipe] = useState('semua');
  const [filterDateSewa, setFilterDateSewa] = useState('');
  const [filterDatePembayaran, setFilterDatePembayaran] = useState('');
  
  const [pembayaranViewMode, setPembayaranViewMode] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date()); 
  
  const [bookingLokasi, setBookingLokasi] = useState(null);
  const [formData, setFormData] = useState({
    namaRombongan: '', picRombongan: '', noWa: '', picKantor: '', keterangan: '', statusPembayaran: 'Belum Transfer', listrikTambahan: false, luasLahan: 50
  });

  const [selectedRecord, setSelectedRecord] = useState(null); 
  const [detailMode, setDetailMode] = useState('view'); 
  const [editFormData, setEditFormData] = useState({});
  const [rescheduleData, setRescheduleData] = useState({ tanggal: '', lokasi: '' });

  const [portalSearchId, setPortalSearchId] = useState('');
  const [portalBooking, setPortalBooking] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadListrikFile, setUploadListrikFile] = useState(null); 
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [tanggalUploadPortal, setTanggalUploadPortal] = useState(getTodayString());

  const showToast = (msg, type = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 4000);
  };

  const fasilitasHarian = useMemo(() => {
    const sewaHariIni = sewaList.filter(sewa => sewa.tanggal_sewa === selectedDate);
    let filteredLokasi = masterLokasi;
    if (filterTipe !== 'semua') filteredLokasi = masterLokasi.filter(lokasi => lokasi.tipe === filterTipe);
    return filteredLokasi.map(lokasi => {
      const booking = sewaHariIni.find(sewa => sewa.lokasi_sewa === lokasi.nama);
      return { ...lokasi, status: booking ? 'Disewa' : 'Tersedia', bookingInfo: booking || null };
    });
  }, [selectedDate, filterTipe, sewaList]);

  const availableLokasiForReschedule = useMemo(() => {
    if (!rescheduleData.tanggal || !selectedRecord) return [];
    const sewaHariItu = sewaList.filter(s => s.tanggal_sewa === rescheduleData.tanggal && s.id_sewa !== selectedRecord.id_sewa && s.status_pembayaran !== 'Ditutup');
    return masterLokasi.filter(l => !sewaHariItu.find(s => s.lokasi_sewa === l.nama));
  }, [rescheduleData.tanggal, sewaList, selectedRecord, masterLokasi]);

  const groupedSewa = useMemo(() => {
    const todayStr = getTodayString();
    let dataYangDitampilkan = sewaList.filter(sewa => sewa.status_pembayaran !== 'Ditutup');
    if (filterDateSewa !== '') dataYangDitampilkan = dataYangDitampilkan.filter(sewa => sewa.tanggal_sewa === filterDateSewa);
    else dataYangDitampilkan = dataYangDitampilkan.filter(sewa => sewa.tanggal_sewa >= todayStr);
    
    const groups = dataYangDitampilkan.reduce((acc, curr) => {
      if (!acc[curr.tanggal_sewa]) acc[curr.tanggal_sewa] = [];
      acc[curr.tanggal_sewa].push(curr);
      return acc;
    }, {});
    return Object.keys(groups).sort((a, b) => new Date(a) - new Date(b)).map(date => ({ date, data: groups[date] }));
  }, [sewaList, filterDateSewa]);

  const groupedPembayaran = useMemo(() => {
    let dataBayar = sewaList.filter(sewa => sewa.bukti_transfer || sewa.status_pembayaran === 'Sudah Transfer' || sewa.status_pembayaran === 'Menunggu Verifikasi');
    if (filterDatePembayaran !== '') dataBayar = dataBayar.filter(sewa => (sewa.tanggal_transfer || sewa.tanggal_sewa) === filterDatePembayaran);
    
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

    const msg = `Terima kasih telah melakukan pemesanan fasilitas di Taman Margasatwa Ragunan.

ID Sewa: *${selectedRecord.id_sewa}*
Nama Penyewa: ${selectedRecord.nama_penyewa} ${selectedRecord.pic_rombongan !== '-' && selectedRecord.pic_rombongan !== selectedRecord.nama_penyewa ? `(${selectedRecord.pic_rombongan})` : ''}
Lokasi Sewa: ${selectedRecord.lokasi_sewa}${luasText}
Tanggal Sewa: ${formatTanggalPendek(selectedRecord.tanggal_sewa)}${rincianBiayaText}

Silahkan transfer ke:
Bank: >>Bank DKI<<, Cabang Pondok Labu
No. Rek: 40142700918
Atas Nama: TM Ragunan Penerimaan BLUD

Setelah transfer, silakan kirim bukti pembayaran melalui link khusus pengunjung.

Terima kasih.`;

    const rawPhone = String(selectedRecord.no_hp_penyewa || '');
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
    if (!rescheduleData.lokasi) {
        showToast('Pilih lokasi yang tersedia terlebih dahulu!', 'error');
        return;
    }
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

  // --- HANDLER FITUR CETAK PENANDA LOKASI (F4 LANDSCAPE) ---
  const handlePrintPenanda = () => {
    if (!selectedRecord) return;
    
    const tglStr = formatTanggalPendek(selectedRecord.tanggal_sewa);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Penanda Lokasi</title>
          <style>
            @page { 
              size: 330mm 215mm; 
              margin: 0; 
            }
            body { 
              font-family: 'Arial', sans-serif; 
              background-color: #ffffff; 
              margin: 0; 
              padding: 0; 
              width: 330mm;
              height: 215mm;
              overflow: hidden; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .print-container {
              width: 100%;
              height: 100%;
              padding: 10mm 15mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              border: 15px solid #059669; 
              background-color: #f0fdf4; 
            }
            .header {
              text-align: center;
              border-bottom: 4px solid #059669;
              padding-bottom: 5mm;
              margin-bottom: 5mm;
              flex-shrink: 0;
            }
            .header h1 { 
              font-size: 38px; 
              color: #064e3b; 
              margin: 0; 
              font-weight: 900; 
              letter-spacing: 2px; 
            }
            .header h2 { 
              font-size: 24px; 
              color: #059669; 
              margin: 5px 0 0 0; 
              letter-spacing: 5px; 
            }
            .content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              overflow: hidden;
            }
            .date-badge {
              background-color: #059669;
              color: white;
              padding: 10px 40px;
              border-radius: 50px;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 15px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              flex-shrink: 0;
            }
            .lokasi-label { 
              font-size: 20px; 
              color: #047857; 
              font-weight: bold; 
              margin-bottom: 5px; 
              text-transform: uppercase; 
              letter-spacing: 2px; 
              flex-shrink: 0;
            }
            .lokasi-value { 
              font-size: 40px; 
              color: #b45309; 
              font-weight: 900; 
              margin: 0 0 20px 0; 
              background: #fffbeb; 
              padding: 10px 30px; 
              border-radius: 20px; 
              border: 4px dashed #f59e0b; 
              flex-shrink: 0;
            }
            .rombongan-label { 
              font-size: 24px; 
              color: #064e3b; 
              font-weight: bold; 
              margin-bottom: 5px; 
              flex-shrink: 0;
            }
            .rombongan-value { 
              font-size: 75px; 
              color: #064e3b; 
              font-weight: 900; 
              line-height: 1.1; 
              margin: 0 0 15px 0; 
              text-transform: uppercase; 
              text-shadow: 2px 2px 0px rgba(0,0,0,0.05); 
              word-wrap: break-word; 
              max-width: 100%; 
              display: -webkit-box;
              -webkit-line-clamp: 2; 
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .pic-container { 
              margin-top: 10px; 
              font-size: 24px; 
              font-weight: bold; 
              color: #065f46; 
              border-top: 3px solid #059669; 
              padding-top: 15px; 
              width: 80%; 
              flex-shrink: 0;
            }
            .footer {
              text-align: center;
              margin-top: auto;
              padding-top: 10px;
              font-size: 14px;
              color: #064e3b;
              font-weight: bold;
              flex-shrink: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>TAMAN MARGASATWA RAGUNAN</h1>
              <h2>RESERVASI FASILITAS</h2>
            </div>
            <div class="content">
              <div class="date-badge">${tglStr}</div>
              
              <div class="lokasi-label">LOKASI PENYEWAAN</div>
              <div class="lokasi-value">${selectedRecord.lokasi_sewa}</div>
              
              <div class="rombongan-label">DISIAPKAN UNTUK ROMBONGAN:</div>
              <div class="rombongan-value">${selectedRecord.nama_penyewa}</div>
              
              <div class="pic-container">
                PIC Rombongan: <span style="color: #b45309;">${selectedRecord.pic_rombongan || '-'}</span>
              </div>
            </div>
            <div class="footer">
              Sistem Informasi Manajemen Fasilitas Taman Margasatwa Ragunan
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // --- HANDLER FITUR CETAK BUKTI TRANSFER (F4 PORTRAIT) ---
  const handlePrintBukti = () => {
    if (!selectedRecord || !selectedRecord.bukti_transfer) return;
    
    const tglSewaStr = formatTanggalPendek(selectedRecord.tanggal_sewa);
    const tglTransferStr = formatTanggalPendek(selectedRecord.tanggal_transfer) || '-';
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Bukti Transfer - ${selectedRecord.id_sewa}</title>
          <style>
            @page { 
              size: 215mm 330mm; 
              margin: 0; 
            }
            body { 
              font-family: 'Arial', sans-serif; 
              background-color: #ffffff; 
              margin: 0; 
              padding: 0; 
              width: 215mm;
              height: 330mm;
              overflow: hidden; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .print-container {
              width: 100%;
              height: 100%;
              padding: 15mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              border: 10px solid #059669; 
              background-color: #f0fdf4; 
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #059669;
              padding-bottom: 5mm;
              margin-bottom: 5mm;
              flex-shrink: 0;
            }
            .header h1 { 
              font-size: 24px; 
              color: #064e3b; 
              margin: 0; 
              font-weight: 900; 
              letter-spacing: 1px; 
            }
            .header h2 { 
              font-size: 16px; 
              color: #059669; 
              margin: 5px 0 0 0; 
              letter-spacing: 2px; 
            }
            .details {
              font-size: 12pt;
              color: #064e3b;
              margin-bottom: 10mm;
              line-height: 1.5;
              flex-shrink: 0;
            }
            .details table {
              width: 100%;
              border-collapse: collapse;
            }
            .details td {
              padding: 4px 0;
              vertical-align: top;
            }
            .details td:first-child {
              font-weight: bold;
              width: 150px;
            }
            .image-container {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              border: 2px dashed #059669;
              padding: 5mm;
              background-color: #ffffff;
              overflow: hidden;
            }
            .image-container img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .footer {
              text-align: center;
              margin-top: 5mm;
              font-size: 10pt;
              color: #064e3b;
              font-weight: bold;
              flex-shrink: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>TAMAN MARGASATWA RAGUNAN</h1>
              <h2>BUKTI PEMBAYARAN RESERVASI LOKASI</h2>
            </div>
            
            <div class="details">
              <table>
                <tr><td>ID Transaksi</td><td>: <b>${selectedRecord.id_sewa}</b></td></tr>
                <tr><td>Nama Penyewa</td><td>: ${selectedRecord.nama_penyewa}</td></tr>
                <tr><td>Lokasi Sewa</td><td>: ${selectedRecord.lokasi_sewa}</td></tr>
                <tr><td>Tanggal Sewa</td><td>: ${tglSewaStr}</td></tr>
                <tr><td>Tanggal Transfer</td><td>: ${tglTransferStr}</td></tr>
              </table>
            </div>

            <div class="image-container">
              <img src="${selectedRecord.bukti_transfer}" alt="Bukti Transfer" />
            </div>

            <div class="footer">
              Sistem Informasi Manajemen Fasilitas Taman Margasatwa Ragunan
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 800); 
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

  const handlePrintKwitansi = (record) => {
    const printWindow = window.open('', '', 'width=950,height=600');
    
    const terbilang = (angka) => {
      var bilne=["","Satu","Dua","Tiga","Empat","Lima","Enam","Tujuh","Delapan","Sembilan","Sepuluh","Sebelas"];
      if(angka < 12) return bilne[angka];
      if(angka < 20) return terbilang(angka-10)+" Belas";
      if(angka < 100) return terbilang(Math.floor(angka/10))+" Puluh "+terbilang(angka%10);
      if(angka < 200) return "Seratus "+terbilang(angka-100);
      if(angka < 1000) return terbilang(Math.floor(angka/100))+" Ratus "+terbilang(angka%100);
      if(angka < 2000) return "Seribu "+terbilang(angka-1000);
      if(angka < 1000000) return terbilang(Math.floor(angka/1000))+" Ribu "+terbilang(angka%1000);
      if(angka < 1000000000) return terbilang(Math.floor(angka/1000000))+" Juta "+terbilang(angka%1000000);
      if(angka < 1000000000000) return terbilang(Math.floor(angka/1000000000))+" Milyar "+terbilang(angka%1000000000);
      return "";
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const total_bayar = record.total_biaya;
    const terbilang_teks = terbilang(total_bayar).trim() + " Rupiah";
    const tanggal_sewa_teks = new Date(record.tanggal_sewa).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const tanggal_bayar_teks = record.tanggal_transfer ? new Date(record.tanggal_transfer).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const peruntukan = record.kegiatan || "Kegiatan / Acara";
    
    const htmlContent = `
      <html>
        <head>
          <title>Kwitansi Pembayaran - ${record.id_sewa}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; margin:0; }
            .kwitansi-container { width: 100%; max-width: 950px; margin: 0 auto; border: 1px solid #000; display: flex; position: relative; border-radius: 10px; overflow: hidden; }
            .left-sidebar { width: 130px; border-right: 1px solid #000; padding: 20px 10px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; text-align: center; }
            .content { flex: 1; padding: 25px 40px; position: relative; background-image: repeating-linear-gradient(transparent, transparent 29px, #d1d5db 30px); background-size: 100% 30px; line-height: 30px; }
            .row { display: flex; margin-bottom: 0; }
            .label { width: 180px; font-style: italic; font-weight: bold; font-size: 14px; }
            .value { flex: 1; font-weight: bold; font-style: italic; font-size: 14px; }
            .bottom-section { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .amount { font-size: 20px; font-weight: bold; font-style: italic; border-top: 2px solid #000; border-bottom: 4px double #000; padding: 2px 30px; display: inline-block; background-color: #fff; margin-left: 20px;}
            .signature { text-align: center; font-weight: bold; font-style: italic; background-color: #fff; padding: 0 10px; line-height: 1.5;}
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; font-size: 120px; font-weight: bold; pointer-events: none; text-align: center; color: #000; }
          </style>
        </head>
        <body onload="setTimeout(() => window.print(), 500);">
          <div class="kwitansi-container">
            <div class="left-sidebar">
              <div style="font-size:9px; font-weight:bold; margin-bottom:10px;">PEMERINTAH PROVINSI<br/>DAERAH KHUSUS IBUKOTA<br/>JAKARTA</div>
              <div style="font-size:12px; font-weight:bold; margin-bottom:20px;">TAMAN MARGASATWA<br/>RAGUNAN<br/><span style="font-size:10px;">ZOOLOGICAL PARK</span></div>
              <div style="border: 1px solid #000; padding: 5px; font-size: 10px; font-weight: bold; transform: rotate(-90deg); margin-top: 90px; width: 150px; letter-spacing:2px;">
                 RAGUNAN ZOOLOGICAL PARK
              </div>
            </div>
            <div class="content">
              <div class="watermark">RAGUNAN</div>
              <div class="row">
                <div class="label">Sudah terima dari</div>
                <div class="value">: ${record.nama_penyewa} ${record.instansi_penyewa ? '/ ' + record.instansi_penyewa : ''}</div>
              </div>
              <div class="row">
                <div class="label">Terbilang</div>
                <div class="value">: <span style="background-color: #fff; padding:0 5px;">${terbilang_teks}</span></div>
              </div>
              <div class="row" style="margin-top: 0;">
                <div class="label">Untuk pembayaran</div>
                <div class="value">: Pembayaran sewa lokasi ${record.lokasi_sewa} untuk kegiatan ${peruntukan}</div>
              </div>
              <div class="row">
                <div class="label"></div>
                <div class="value">&nbsp;&nbsp;pada tanggal ${tanggal_sewa_teks}</div>
              </div>
              <div class="row">
                <div class="label"></div>
                <div class="value">&nbsp;&nbsp;di UP Taman Margasatwa Ragunan melalui transfer.</div>
              </div>
              <div class="row">
                <div class="label"></div>
                <div class="value">&nbsp;&nbsp;No. Ref Transaksi: ${record.id_sewa}</div>
              </div>
              
              <div class="bottom-section">
                <div class="amount">
                  ${formatRupiah(total_bayar)},00
                </div>
                <div class="signature">
                  Jakarta, ${tanggal_bayar_teks}<br/>
                  <br/><br/><br/><br/>
                  ( ........................................... )
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
      const updatedBooking = { ...portalBooking, bukti_transfer_listrik: uploadListrikFile, tanggal_transfer_listrik: tanggalUploadPortal };
      setSewaList(prev => prev.map(s => s.id_sewa === portalBooking.id_sewa ? updatedBooking : s));
      setPortalBooking(updatedBooking); 
      setUploadListrikFile(null);
      showToast('Bukti pembayaran LISTRIK berhasil dikirim!');
  };

  // --- MODALS RENDER ---
  const renderDetailModal = () => {
    if (!selectedRecord) return null;

    const locInfo = masterLokasi.find(l => l.nama === selectedRecord.lokasi_sewa);
    const isLapangan = locInfo?.tipe === 'lapangan' || selectedRecord.lokasi_sewa.includes('LAP');
    const viewBiayaLokasi = getBiayaLokasi(selectedRecord.lokasi_sewa, selectedRecord.luas_lahan);
    const viewBiayaListrik = selectedRecord.listrik_tambahan ? 100000 : 0;
    const viewTotalBiaya = selectedRecord.total_biaya !== undefined ? selectedRecord.total_biaya : (viewBiayaLokasi + viewBiayaListrik);

    if (selectedRecord.status_pembayaran === 'Ditutup') {
        return (
          <div className="fixed inset-0 bg-[#022c22]/60 backdrop-blur-sm z-[50] flex justify-end transition-all" onClick={() => setSelectedRecord(null)}>
            <div className="w-full max-w-md bg-slate-50 h-full shadow-[-10px_0_50px_rgba(2,44,34,0.15)] flex flex-col animate-slide-in-right p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end mb-6">
                    <button type="button" onClick={() => setSelectedRecord(null)} className="p-2.5 bg-slate-200/60 hover:bg-slate-200 text-slate-600 rounded-full transition-all duration-200">
                        <X size={20}/>
                    </button>
                </div>
                <div className="bg-white rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex-1 flex flex-col justify-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Lokasi Ditutup</h3>
                    <p className="text-sm font-bold text-emerald-800 mb-1">{selectedRecord.lokasi_sewa}</p>
                    <p className="text-xs font-semibold text-slate-400 mb-8">{formatTanggalIndo(selectedRecord.tanggal_sewa)}</p>
                    <div className="bg-slate-50 p-4 rounded-2xl text-xs font-semibold text-slate-600 border border-slate-100/85 mb-8">Keterangan: {selectedRecord.keterangan || '-'}</div>
                    <button type="button" onClick={() => { setSewaList(sewaList.filter(s => s.id_sewa !== selectedRecord.id_sewa)); setSelectedRecord(null); showToast('Lokasi berhasil dibuka kembali!'); }} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3)] hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-200">
                        Buka Kembali Fasilitas Ini
                    </button>
                </div>
            </div>
          </div>
        );
    }

    return (
      <div className="fixed inset-0 bg-[#022c22]/60 backdrop-blur-sm z-[50] flex justify-end transition-all" onClick={() => setSelectedRecord(null)}>
        <div className="w-full max-w-md bg-slate-50 h-full shadow-[-10px_0_50px_rgba(2,44,34,0.15)] flex flex-col animate-slide-in-right border-l border-emerald-100/10" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-5 border-b border-emerald-800/10 flex items-center justify-between bg-gradient-to-r from-[#022c22] via-[#043e30] to-[#01140f] text-white shadow-md">
            <div>
              <h3 className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                  {detailMode === 'view' ? 'Detail Sewa' : detailMode === 'edit' ? 'Edit Data Pengunjung' : 'Reschedule Jadwal'}
              </h3>
              <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mt-0.5">Manajemen Fasilitas TMR</p>
            </div>
            <button type="button" onClick={() => setSelectedRecord(null)} className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"><X size={18} /></button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto pb-28 relative z-10 space-y-5 hide-scrollbar">
             <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/40 rounded-bl-full -z-10 opacity-70"></div>
               <p className="text-[10px] uppercase font-extrabold tracking-widest text-amber-600 mb-1">ID Transaksi</p>
               <p className="font-black text-emerald-950 text-2xl tracking-tight">{selectedRecord.id_sewa}</p>
             </div>

             {detailMode === 'view' && (
                  <>
                      <div className="grid grid-cols-4 gap-2">
                         <button type="button" onClick={handleKirimWA} className="flex flex-col items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-800 p-3 rounded-2xl text-[10px] font-bold border border-emerald-500/20 transition-all duration-200 shadow-sm text-center leading-tight hover:-translate-y-0.5">
                             <Send size={16} className="mb-1.5" /> Kirim WA
                         </button>
                         <button type="button" onClick={() => setDetailMode('edit')} className="flex flex-col items-center justify-center bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-800 p-3 rounded-2xl text-[10px] font-bold border border-amber-500/20 transition-all duration-200 shadow-sm text-center leading-tight hover:-translate-y-0.5">
                             <Edit size={16} className="mb-1.5" /> Edit Data
                         </button>
                         <button type="button" onClick={() => setDetailMode('reschedule')} className="flex flex-col items-center justify-center bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-800 p-3 rounded-2xl text-[10px] font-bold border border-blue-500/20 transition-all duration-200 shadow-sm text-center leading-tight hover:-translate-y-0.5">
                             <CalendarDays size={16} className="mb-1.5" /> Pindah
                         </button>
                         <button type="button" onClick={handlePrintPenanda} className="flex flex-col items-center justify-center bg-teal-500/10 hover:bg-teal-500 hover:text-white text-teal-800 p-3 rounded-2xl text-[10px] font-bold border border-teal-500/20 transition-all duration-200 shadow-sm text-center leading-tight hover:-translate-y-0.5">
                             <Printer size={16} className="mb-1.5" /> Tag Tanda
                         </button>
                      </div>

                      <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-slate-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Lokasi</p><p className="font-bold text-emerald-950 text-sm">{selectedRecord.lokasi_sewa}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Tanggal Sewa</p><p className="font-bold text-emerald-950 text-sm">{formatTanggalPendek(selectedRecord.tanggal_sewa)}</p></div>
                        </div>
                        {isLapangan && (
                            <>
                              <hr className="border-slate-100" />
                              <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Luas Lahan Dipakai</p><p className="font-bold text-emerald-950 text-sm">{selectedRecord.luas_lahan} m²</p></div>
                            </>
                        )}
                        <hr className="border-slate-100" />
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Nama Rombongan</p><p className="font-bold text-emerald-950 text-sm">{selectedRecord.nama_penyewa || '-'}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">PIC Rombongan</p><p className="font-bold text-emerald-950 text-sm">{selectedRecord.pic_rombongan || '-'}</p></div>
                        </div>
                        <hr className="border-slate-100" />
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">No. HP / WA</p><p className="font-bold text-emerald-950 text-sm">{selectedRecord.no_hp_penyewa || '-'}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">PIC Kantor</p><p className="font-bold text-emerald-950 text-sm">{selectedRecord.pic_kantor || '-'}</p></div>
                        </div>
                        <hr className="border-slate-100" />
                        <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Keterangan Tambahan</p><p className="font-medium text-slate-600 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">{selectedRecord.keterangan || '-'}</p></div>
                        <hr className="border-slate-100" />
                        
                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Biaya Lokasi</p><p className="font-bold text-emerald-950 text-xs">{formatRupiah(viewBiayaLokasi)}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Status Listrik</p><p className="font-bold text-emerald-950 text-xs flex items-center">{selectedRecord.listrik_tambahan ? <><Zap size={12} className="text-amber-500 mr-1"/> Aktif (+Rp 100rb)</> : <><X size={14} strokeWidth={3} className="text-rose-500 mr-1"/> Tidak Ada</>}</p></div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100 rounded-2xl p-4 mt-2 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Total Biaya</span>
                            <span className="font-black text-emerald-700 text-lg">{formatRupiah(viewTotalBiaya)}</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-slate-100 flex items-center justify-between hover:border-amber-200 transition-colors duration-250">
                         <div>
                             <p className="text-xs font-bold text-emerald-950 flex items-center"><Zap size={14} className="text-amber-500 mr-1.5"/> Set Listrik Tambahan</p>
                             <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">Buka izin portal upload listrik</p>
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
                             <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                         </label>
                      </div>

                      {selectedRecord.listrik_tambahan && (selectedRecord.status_pembayaran === 'Lunas' || selectedRecord.status_pembayaran === 'Sudah Transfer') && (
                          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-amber-200 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-bl-full -z-10"></div>
                              <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-3">
                                  <div>
                                     <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Akses Portal Listrik</p>
                                     <p className="text-[9px] text-amber-600/70 mt-0.5 font-bold">{selectedRecord.akses_upload_listrik ? 'Terbuka untuk pengunjung.' : 'Ditutup.'}</p>
                                  </div>
                                  <label className={`flex items-center cursor-pointer px-3 py-1.5 rounded-xl border transition-all duration-200 ${selectedRecord.akses_upload_listrik ? 'bg-amber-100 border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                      <span className={`text-[10px] font-bold mr-2 ${selectedRecord.akses_upload_listrik ? 'text-amber-800' : 'text-slate-500'}`}>{selectedRecord.akses_upload_listrik ? 'Aktif' : 'Non-Aktif'}</span>
                                      <input type="checkbox" checked={selectedRecord.akses_upload_listrik || false} onChange={(e) => { const updated = {...selectedRecord, akses_upload_listrik: e.target.checked}; setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updated : s)); setSelectedRecord(updated); }} className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer" />
                                  </label>
                              </div>

                              {selectedRecord.bukti_transfer_listrik ? (
                                  <div>
                                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 flex w-max items-center mb-2"><CheckCircle2 size={12} className="mr-1"/> Struk Listrik Tersedia</span>
                                      {selectedRecord.tanggal_transfer_listrik && <p className="text-[10px] text-amber-800 font-bold mb-2 tracking-wide">Tgl Transfer: {formatTanggalIndo(selectedRecord.tanggal_transfer_listrik)}</p>}
                                      <img src={selectedRecord.bukti_transfer_listrik} alt="Struk Listrik" className="w-full rounded-2xl border border-slate-200 mt-1 mb-3 object-contain max-h-48 bg-slate-50" />
                                      <button type="button" onClick={() => { const updated = {...selectedRecord, bukti_transfer_listrik: null}; setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? updated : s)); setSelectedRecord(updated); }} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 rounded-xl transition-all duration-200 text-xs">Hapus Struk Listrik</button>
                                  </div>
                              ) : (
                                  <div className="text-center mt-2">
                                      <label className="w-full border-2 border-dashed border-amber-200 bg-white text-amber-700 font-bold py-4 rounded-2xl hover:bg-amber-50/50 transition-all duration-200 text-xs flex flex-col items-center justify-center cursor-pointer block">
                                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadListrikChange} />
                                          <UploadCloud size={20} className="mb-1.5 text-amber-500" />
                                          Admin: Upload Bukti Listrik
                                      </label>
                                  </div>
                              )}
                          </div>
                      )}

                      <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-slate-100">
                         <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Status & Verifikasi Pembayaran Lokasi</p>
                         <div className="mb-4">
                            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold ${getStatusBadgeClass(selectedRecord.status_pembayaran)}`}>{selectedRecord.status_pembayaran}</span>
                         </div>
                         {selectedRecord.status_pembayaran === 'Menunggu Verifikasi' && selectedRecord.bukti_transfer && (
                             <button type="button" onClick={() => {
                                 setSewaList(prev => prev.map(s => s.id_sewa === selectedRecord.id_sewa ? { ...s, status_pembayaran: 'Sudah Transfer' } : s));
                                 setSelectedRecord({...selectedRecord, status_pembayaran: 'Sudah Transfer'});
                                 showToast('Pembayaran berhasil diverifikasi!');
                             }} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 mb-3 flex justify-center items-center"><CheckCircle2 size={16} className="mr-2"/> Verifikasi Valid</button>
                         )}
                         {selectedRecord.bukti_transfer && (
                             <div className="mt-2 space-y-3">
                                 <img src={selectedRecord.bukti_transfer} alt="Struk Utama" className="w-full rounded-2xl border border-slate-200 object-contain max-h-56 bg-slate-50" />
                                 <div className={`grid ${selectedRecord.status_pembayaran === 'Lunas' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                     <button type="button" onClick={handlePrintBukti} className="w-full bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-all duration-200 shadow-sm flex flex-col justify-center items-center text-[10px] border border-slate-200 text-center leading-tight h-14">
                                         <Printer size={16} className="mb-1 text-slate-500"/> Cetak Bukti Transfer
                                     </button>
                                     {selectedRecord.status_pembayaran === 'Lunas' && (
                                         <button type="button" onClick={() => handlePrintKwitansi(selectedRecord)} className="w-full bg-indigo-50 text-indigo-700 font-bold py-2.5 rounded-xl hover:bg-indigo-100 transition-all duration-200 shadow-sm flex flex-col justify-center items-center text-[10px] border border-indigo-200 text-center leading-tight h-14">
                                             <Printer size={16} className="mb-1 text-indigo-500"/> Cetak Kwitansi
                                         </button>
                                     )}
                                 </div>
                             </div>
                         )}
                      </div>

                      {selectedRecord.history_reschedule && selectedRecord.history_reschedule.length > 0 && (
                         <div className="bg-slate-100/50 border border-slate-200/60 rounded-3xl p-5">
                             <h4 className="text-xs font-black text-slate-700 flex items-center mb-4 uppercase tracking-wider"><History size={14} className="mr-1.5 text-slate-500"/> Riwayat Reschedule</h4>
                             <div className="space-y-4">
                                 {selectedRecord.history_reschedule.map((hist, i) => (
                                     <div key={i} className="relative pl-4 border-l-2 border-slate-300 text-[10px]">
                                         <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-slate-100"></div>
                                         <p className="font-bold text-slate-800 mb-0.5">{hist.waktu}</p>
                                         <p className="text-slate-600">Pindah dari: <b>{formatTanggalIndo(hist.dari_tanggal)} ({hist.dari_lokasi})</b></p>
                                         <p className="text-slate-600">Ke: <b>{formatTanggalIndo(hist.ke_tanggal)} ({hist.ke_lokasi})</b></p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                      )}
                  </>
              )}

              {detailMode === 'edit' && (
                  <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-amber-200/60 space-y-4">
                      <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 flex items-center text-amber-800 text-xs font-bold mb-2"><Edit size={14} className="mr-2"/> Mode Edit Data</div>
                      {isLapangan && (
                          <div>
                             <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">Luas Lahan Aktual (m²)</label>
                             <input required type="number" min="50" value={editFormData.luas_lahan || 50} onChange={e => setEditFormData({...editFormData, luas_lahan: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white" />
                             <p className="text-[10px] font-bold text-emerald-700 mt-1">Estimasi biaya sewa: {formatRupiah(Math.max(editFormData.luas_lahan || 50, 50) * 2000)}</p>
                          </div>
                      )}
                      <div><label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">Nama Rombongan</label><input required type="text" value={editFormData.nama_penyewa || ''} onChange={e => setEditFormData({...editFormData, nama_penyewa: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white" /></div>
                      <div className="grid grid-cols-2 gap-3">
                         <div><label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">PIC Rombongan</label><input required type="text" value={editFormData.pic_rombongan || ''} onChange={e => setEditFormData({...editFormData, pic_rombongan: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white" /></div>
                         <div><label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">No WhatsApp</label><input required type="text" value={editFormData.no_hp_penyewa || ''} onChange={e => setEditFormData({...editFormData, no_hp_penyewa: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white" /></div>
                      </div>
                      <div>
                         <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">PIC Kantor TMR</label>
                         <select required value={editFormData.pic_kantor || ''} onChange={e => setEditFormData({...editFormData, pic_kantor: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_1rem_center] bg-[length:1.25em_1.25em] bg-no-repeat pr-10">
                             {picList.map((pic, idx) => <option key={idx} value={pic}>{pic}</option>)}
                         </select>
                      </div>
                      <div><label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1">Keterangan</label><textarea value={editFormData.keterangan || ''} onChange={e => setEditFormData({...editFormData, keterangan: e.target.value})} rows="3" className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white" /></div>
                      <div className="flex space-x-2 pt-4 border-t border-slate-100">
                          <button type="button" onClick={() => handleOpenDetail(selectedRecord)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-200">Batal</button>
                          <button type="submit" className="flex-1 px-4 py-3 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-2xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transition-all duration-200">Simpan Perubahan</button>
                      </div>
                  </form>
              )}

              {detailMode === 'reschedule' && (
                  <form onSubmit={handleSaveReschedule} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(4,120,87,0.03)] border border-blue-200/60 space-y-4">
                      <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 flex items-center text-blue-800 text-xs font-bold mb-2"><CalendarDays size={14} className="mr-2"/> Mode Reschedule</div>
                      <div className="bg-slate-100 border border-slate-200/50 p-4 rounded-2xl text-[11px] font-semibold text-slate-700 mb-4">Jadwal saat ini: <br/><span className="text-emerald-900 font-extrabold">{formatTanggalIndo(selectedRecord.tanggal_sewa)}</span> di <span className="text-emerald-900 font-extrabold">{selectedRecord.lokasi_sewa}</span></div>
                      <div>
                          <label className="block text-xs font-black text-blue-900 mb-1.5 uppercase tracking-wider">Pilih Tanggal Baru</label>
                          <input type="date" required min={getTodayString()} value={rescheduleData.tanggal} onChange={e => {
                              const newDate = e.target.value;
                              const sewaHariItu = sewaList.filter(s => s.tanggal_sewa === newDate && s.id_sewa !== selectedRecord.id_sewa && s.status_pembayaran !== 'Ditutup');
                              const isCurrentLocationAvailable = !sewaHariItu.find(s => s.lokasi_sewa === selectedRecord.lokasi_sewa);
                              setRescheduleData(prev => ({...prev, tanggal: newDate, lokasi: isCurrentLocationAvailable ? selectedRecord.lokasi_sewa : ''}));
                          }} className="relative w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-semibold text-emerald-950 bg-white cursor-pointer custom-date-picker" />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-blue-900 mb-2 uppercase tracking-wider">Pilih Lokasi yang Tersedia</label>
                          {!rescheduleData.tanggal ? (
                              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center text-xs text-slate-500 font-bold">Pilih Tanggal Terlebih Dahulu</div>
                          ) : availableLokasiForReschedule.length === 0 ? (
                              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center text-xs text-rose-600 font-bold">Tidak ada lokasi kosong di tanggal ini.</div>
                          ) : (
                              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                                  {availableLokasiForReschedule.map(l => (
                                      <button 
                                          key={l.id} 
                                          type="button"
                                          onClick={() => setRescheduleData(prev => ({...prev, lokasi: l.nama}))}
                                          className={`p-3 rounded-2xl text-xs font-extrabold text-left border transition-all duration-200 w-full flex items-center justify-between ${rescheduleData.lokasi === l.nama ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-100/50' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/20 hover:shadow-sm'}`}
                                      >
                                          <span className="truncate pr-2">{l.nama}</span>
                                          {rescheduleData.lokasi === l.nama && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-emerald-pulse shrink-0"></span>}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                      <div className="flex space-x-2 pt-4 border-t border-blue-50">
                          <button type="button" onClick={() => handleOpenDetail(selectedRecord)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-200">Batal</button>
                          <button type="submit" className="flex-1 px-4 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all duration-200">Simpan Pindah</button>
                      </div>
                  </form>
              )}
          </div>
        </div>
      </div>
    );
  };

  const handleAddMasterLokasi = (e) => {
    e.preventDefault();
    if (!newMasterLokasiNama.trim()) return;
    const nameUpper = newMasterLokasiNama.toUpperCase();
    if (masterLokasi.find(l => l.nama === nameUpper)) {
      setToast({ show: true, msg: 'Nama Lokasi sudah ada!', type: 'error' });
      return;
    }
    const newLok = {
      id: Date.now(),
      nama: nameUpper,
      tipe: newMasterLokasiTipe
    };
    setMasterLokasi([...masterLokasi, newLok]);
    setNewMasterLokasiNama('');
    setToast({ show: true, msg: 'Lokasi fasilitas baru berhasil ditambahkan!', type: 'success' });
  };

  const handleDeleteMasterLokasi = (id) => {
    setMasterLokasi(masterLokasi.filter(l => l.id !== id));
    setToast({ show: true, msg: 'Lokasi fasilitas berhasil dihapus.', type: 'success' });
  };

  const renderMasterData = () => {
    return (
      <div className="max-w-5xl mx-auto pb-32 lg:pb-12 pt-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(4,120,87,0.03)] border border-slate-100 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tight mb-8 flex items-center">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl mr-3">
              <Settings size={22} className="stroke-[2.5]" />
            </div>
            <span>Pengaturan Master Data</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* PIC Data */}
            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden flex flex-col min-h-[350px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-bl-full -z-10"></div>
              <h3 className="font-black text-emerald-950 mb-5 flex items-center text-sm uppercase tracking-wider">
                <Users size={16} className="mr-2 text-emerald-600"/> Daftar Nama PIC TMR
              </h3>
              <form onSubmit={handleAddPic} className="flex gap-2.5 mb-5 shrink-0">
                <input 
                  type="text" 
                  required 
                  value={newPic} 
                  onChange={e => setNewPic(e.target.value)} 
                  placeholder="Masukkan nama PIC baru..." 
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none shadow-sm placeholder:text-slate-400" 
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-md shadow-emerald-900/10 transition-all active:scale-[0.98] shrink-0">Tambah</button>
              </form>
              <div className="flex-1 overflow-y-auto max-h-52 pr-1 hide-scrollbar">
                <div className="flex flex-wrap gap-2.5">
                  {picList.map((pic, idx) => (
                    <div key={idx} className="bg-white pl-3.5 pr-2.5 py-2 rounded-xl border border-slate-200/80 text-xs font-extrabold text-emerald-950 flex items-center shadow-sm hover:border-emerald-300 transition-colors group">
                      <span>{pic}</span>
                      <button 
                        type="button" 
                        onClick={() => setPicList(picList.filter(p => p !== pic))} 
                        className="ml-2.5 p-1 bg-slate-50 group-hover:bg-rose-50 text-slate-400 group-hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <X size={12} strokeWidth={3}/>
                      </button>
                    </div>
                  ))}
                  {picList.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center py-8 text-slate-400">
                      <Users size={28} className="opacity-30 mb-2"/>
                      <span className="text-xs font-semibold">Belum ada data PIC terdaftar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Block Lokasi */}
            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden flex flex-col min-h-[350px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/20 rounded-bl-full -z-10"></div>
              <h3 className="font-black text-emerald-950 mb-5 flex items-center text-sm uppercase tracking-wider">
                <Lock size={16} className="mr-2 text-rose-600"/> Tutup Lokasi (Maintenance)
              </h3>
              <form onSubmit={handleBlockLokasi} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5">Pilih Tanggal Tutup</label>
                    <input 
                      type="date" 
                      required 
                      value={blockData.tanggal} 
                      onChange={e => setBlockData({...blockData, tanggal: e.target.value})} 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-450 outline-none shadow-sm cursor-pointer custom-date-picker" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5">Pilih Fasilitas</label>
                    <select 
                      value={blockData.lokasi} 
                      onChange={e => setBlockData({...blockData, lokasi: e.target.value})} 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-450 outline-none shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_1rem_center] bg-[length:1.25em_1.25em] bg-no-repeat pr-10"
                    >
                      <option value="Semua Lokasi" className="font-extrabold text-rose-600">⚠ TUTUP SEMUA LOKASI ⚠</option>
                      {masterLokasi.map(l => <option key={l.id} value={l.nama}>{l.nama}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-3.5 rounded-2xl font-black text-xs shadow-md shadow-rose-900/10 transition-all active:scale-[0.98] flex justify-center items-center mt-4">
                  <Lock size={14} className="mr-2"/> Eksekusi Penutupan
                </button>
              </form>
            </div>
          </div>

          {/* Manage Lokasi Fasilitas */}
          <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/20 rounded-bl-full -z-10"></div>
            <h3 className="font-black text-emerald-950 mb-5 flex items-center text-sm uppercase tracking-wider">
              <MapPin size={16} className="mr-2 text-blue-600"/> Daftar Lokasi Fasilitas
            </h3>
            <form onSubmit={handleAddMasterLokasi} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input 
                type="text" 
                required 
                value={newMasterLokasiNama} 
                onChange={e => setNewMasterLokasiNama(e.target.value)} 
                placeholder="Tulis nama fasilitas baru (contoh: PENDOPO TSA 5)..." 
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none shadow-sm placeholder:text-slate-400" 
              />
              <select 
                value={newMasterLokasiTipe} 
                onChange={e => setNewMasterLokasiTipe(e.target.value)} 
                className="w-full sm:w-1/3 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_1rem_center] bg-[length:1.25em_1.25em] bg-no-repeat pr-10"
              >
                <option value="pendopo">Pendopo / Ruangan</option>
                <option value="lapangan">Lapangan Terbuka</option>
              </select>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-md shadow-blue-900/10 transition-all active:scale-[0.98] whitespace-nowrap">Tambah Fasilitas</button>
            </form>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {masterLokasi.map((lokasi) => {
                const isLapangan = lokasi.tipe === 'lapangan';
                const Icon = isLapangan ? TreePine : Tent;
                return (
                  <div key={lokasi.id} className="bg-white p-3 rounded-2xl border border-slate-100 text-xs font-bold text-emerald-950 flex justify-between items-center shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${isLapangan ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50/70 text-amber-600'}`}>
                        <Icon size={14} className="stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-[11px] font-black tracking-tight" title={lokasi.nama}>{lokasi.nama}</span>
                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{lokasi.tipe}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteMasterLokasi(lokasi.id)} 
                      className="text-slate-300 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
              {masterLokasi.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                  <MapPin size={32} className="opacity-30 mb-2"/>
                  <span className="text-xs font-semibold">Belum ada lokasi fasilitas terdaftar</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F4F7F4] font-sans selection:bg-amber-200 selection:text-emerald-900">
      
      {/* NOTIFIKASI TOAST MELAYANG */}
      {toast && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[99999] animate-fade-in-down w-[90%] max-w-sm">
            <div className={`flex items-center px-4 py-3.5 rounded-2xl shadow-xl border ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-800 border-emerald-700 text-white'}`}>
               {toast.type === 'error' ? <AlertCircle size={20} className="mr-3 text-rose-600 shrink-0"/> : <CheckCircle2 size={20} className="mr-3 text-emerald-400 shrink-0"/>}
               <span className="font-bold text-sm leading-tight flex-1">{toast.msg}</span>
               <button type="button" onClick={() => setToast(null)} className={`ml-3 p-1 rounded-full transition-colors ${toast.type === 'error' ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : 'text-emerald-400 hover:bg-emerald-700 hover:text-white'}`}>
                 <X size={16}/>
               </button>
            </div>
          </div>
      )}

      {/* Form Reservasi Baru */}
      {bookingLokasi && (
        <div className="fixed inset-0 bg-[#022c22]/60 backdrop-blur-sm z-[50] flex justify-center items-end sm:items-center p-0 sm:p-4 pb-14 sm:pb-0 animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_-8px_40px_-4px_rgba(4,120,87,0.18)] sm:shadow-[0_25px_50px_-12px_rgba(4,120,87,0.15)] w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[calc(94vh-3.5rem)] sm:max-h-[92vh] border border-emerald-100/50 transition-all duration-300 animate-slide-up-sheet sm:animate-none">
                <div className="px-6 py-5 border-b border-emerald-800/10 flex items-center justify-between bg-gradient-to-r from-[#022c22] via-[#043e30] to-[#01140f] text-white shadow-md">
                    <div>
                        <h3 className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">Formulir Reservasi</h3>
                        <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase mt-0.5">{bookingLokasi.nama} • {formatTanggalIndo(selectedDate)}</p>
                    </div>
                    <button type="button" onClick={() => setBookingLokasi(null)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 hover:scale-105"><X size={18} /></button>
                </div>
                {/* Scrollable form fields */}
                <div className="overflow-y-auto flex-1 hide-scrollbar bg-slate-50/50">
                <form id="booking-form" onSubmit={handleSubmitBooking} className="p-4 sm:p-6 space-y-4 relative z-10">
                    
                    {/* KHUSUS LAPANGAN: Input Luas Lahan */}
                    {bookingLokasi.tipe === 'lapangan' && (
                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 opacity-[0.04] text-emerald-850"><TreePine size={96}/></div>
                            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2">Luas Lahan (Minimal 50 m²)</label>
                            <div className="flex items-center space-x-3">
                                <input required type="number" min="50" value={formData.luasLahan} onChange={(e)=>setFormData({...formData, luasLahan: e.target.value})} className="w-28 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none text-base bg-white font-extrabold text-center shadow-inner" />
                                <span className="font-bold text-emerald-800 text-sm">m² × Rp 2.000 / m²</span>
                            </div>
                        </div>
                    )}

                    {/* Ringkasan Biaya Realtime */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(4,120,87,0.02)] space-y-3">
                        <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                            <span>Tarif Sewa Lokasi:</span>
                            <span className="font-extrabold text-emerald-950">{formatRupiah(getBiayaLokasi(bookingLokasi.nama, bookingLokasi.tipe === 'lapangan' ? formData.luasLahan : null))}</span>
                        </div>
                        {formData.listrikTambahan && (
                            <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                                <span className="flex items-center"><Zap size={14} className="mr-1 text-amber-500" /> Listrik Tambahan:</span>
                                <span className="font-extrabold text-amber-600">{formatRupiah(100000)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-100">
                            <span className="font-extrabold text-emerald-950 uppercase tracking-wider">Total Tagihan:</span>
                            <span className="font-black text-emerald-700 text-xl">{formatRupiah(getBiayaLokasi(bookingLokasi.nama, bookingLokasi.tipe === 'lapangan' ? formData.luasLahan : null) + (formData.listrikTambahan ? 100000 : 0))}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Nama Rombongan / Instansi</label>
                        <input required type="text" value={formData.namaRombongan} onChange={(e)=>setFormData({...formData, namaRombongan: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" placeholder="Tuliskan nama rombongan..." />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">PIC Rombongan</label>
                            <input required type="text" value={formData.picRombongan} onChange={(e)=>setFormData({...formData, picRombongan: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" placeholder="Nama tamu" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">No. WhatsApp</label>
                            <input required type="tel" value={formData.noWa} onChange={(e)=>setFormData({...formData, noWa: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" placeholder="08..." />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Tanggal</label>
                            <input type="text" value={formatTanggalPendek(selectedDate)} disabled className="w-full px-4 py-3 border border-slate-200 bg-slate-100 text-slate-500 text-sm font-extrabold rounded-2xl cursor-not-allowed shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">PIC Kantor (TMR)</label>
                            <select required value={formData.picKantor} onChange={(e)=>setFormData({...formData, picKantor: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_1rem_center] bg-[length:1.25em_1.25em] bg-no-repeat pr-10">
                                <option value="" disabled>Pilih Nama PIC...</option>
                                {picList.map((pic, idx) => <option key={idx} value={pic}>{pic}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className={`border rounded-3xl p-4 shadow-sm transition-all duration-300 cursor-pointer ${formData.listrikTambahan ? 'border-amber-300 bg-amber-50/20' : 'border-slate-100 bg-white hover:border-emerald-100'}`}>
                        <label className="flex items-center cursor-pointer select-none">
                            <input type="checkbox" checked={formData.listrikTambahan} onChange={(e)=>setFormData({...formData, listrikTambahan: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-350 focus:ring-amber-500 cursor-pointer" />
                            <span className="ml-3 text-sm font-extrabold text-emerald-950 flex items-center"><Zap size={16} className="text-amber-500 mr-1.5"/> Gunakan Listrik Tambahan (+Rp 100rb)</span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-2">Status Pendaftaran Awal</label>
                        <div className="flex space-x-3">
                            <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl border cursor-pointer transition-all duration-250 ${formData.statusPembayaran === 'Sudah Transfer' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 shadow-sm ring-2 ring-emerald-100/50' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'}`}>
                                <input type="radio" name="statusPembayaran" value="Sudah Transfer" checked={formData.statusPembayaran === 'Sudah Transfer'} onChange={(e)=>setFormData({...formData, statusPembayaran: e.target.value})} className="hidden" />
                                <CheckCircle2 size={20} className={`mb-1.5 ${formData.statusPembayaran === 'Sudah Transfer' ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <span className="text-xs font-extrabold">Lunas di Awal</span>
                            </label>
                            <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl border cursor-pointer transition-all duration-250 ${formData.statusPembayaran === 'Belum Transfer' ? 'border-rose-450 bg-rose-50/40 text-rose-950 shadow-sm ring-2 ring-rose-100/50' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'}`}>
                                <input type="radio" name="statusPembayaran" value="Belum Transfer" checked={formData.statusPembayaran === 'Belum Transfer'} onChange={(e)=>setFormData({...formData, statusPembayaran: e.target.value})} className="hidden" />
                                <AlertCircle size={20} className={`mb-1.5 ${formData.statusPembayaran === 'Belum Transfer' ? 'text-rose-550' : 'text-slate-300'}`} />
                                <span className="text-xs font-extrabold">Belum Transfer</span>
                            </label>
                        </div>
                    </div>
                </form>
                </div>{/* end scrollable wrapper */}

                {/* Sticky action footer — always visible, never behind bottom nav */}
                <div
                  className="shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 pt-4 flex space-x-3"
                  style={{ paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom, 0px)))' }}
                >
                    <button
                      type="button"
                      form="booking-form"
                      onClick={() => setBookingLokasi(null)}
                      className="w-1/3 py-4 sm:py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-200 active:scale-95"
                    >Batal</button>
                    <button
                      type="submit"
                      form="booking-form"
                      className="w-2/3 py-4 sm:py-3.5 text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-2xl shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_25px_-4px_rgba(16,185,129,0.4)] transition-all duration-200 flex justify-center items-center active:scale-95"
                    ><Save size={18} className="mr-2"/> Simpan Reservasi</button>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex inset-y-0 left-0 z-30 w-[280px] bg-gradient-to-b from-[#022c22] via-[#041e17] to-[#01140f] border-r border-emerald-800/20 flex-col shadow-2xl relative overflow-hidden">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="px-6 py-9 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl mb-5 flex items-center justify-center shadow-[0_4px_20px_rgba(245,158,11,0.25)] border border-amber-300/30 relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-3">
            <div className="absolute inset-0 bg-white/15 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Leaf className="text-white drop-shadow-md" size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-teal-300 tracking-tight">TMR System</h1>
          <p className="text-[9px] font-extrabold text-emerald-400/60 mt-1 tracking-[0.25em] uppercase">Fasilitas Ragunan</p>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5 relative z-10 overflow-y-auto hide-scrollbar">
          {[
            { id: 'reservasi', label: 'Reservasi Lokasi', icon: LayoutDashboard },
            { id: 'sewa', label: 'Data Pengunjung', icon: Users },
            { id: 'pembayaran', label: 'Keuangan', icon: CreditCard },
            { id: 'master', label: 'Master Data', icon: Settings },
            { id: 'portal', label: 'Portal Bukti', icon: Wallet }
          ].map(item => (
            <button 
              type="button" 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 group relative overflow-hidden ${ 
                activeTab === item.id 
                  ? 'text-white shadow-[0_4px_20px_rgba(4,120,87,0.25)] translate-x-1 border border-emerald-500/20' 
                  : 'text-emerald-300/60 hover:text-white hover:translate-x-1' 
              }`}
            >
              {activeTab === item.id && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 backdrop-blur-md rounded-2xl"></div>}
              {activeTab !== item.id && <div className="absolute inset-0 bg-white/0 group-hover:bg-emerald-950/40 transition-all duration-300 rounded-2xl"></div>}
              <div className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-white/15' : 'bg-emerald-950/50 group-hover:bg-white/10'}`}>
                <item.icon size={18} className={`transition-all duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-amber-400 drop-shadow-md' : 'text-emerald-400'}`} />
              </div>
              <span className="relative z-10 tracking-wide text-xs">{item.label}</span>
              {activeTab === item.id && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)] z-10"></div>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        <header className="bg-emerald-950/95 backdrop-blur-md px-5 py-3.5 flex items-center justify-between z-[45] lg:hidden sticky top-0 border-b border-emerald-900/30 shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-md"><Leaf className="text-white" size={16} strokeWidth={2.5} /></div>
            <span className="font-extrabold text-white text-base tracking-tight">TMR System</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 pb-20 relative z-10 bg-[#f8faf9]">
            {activeTab === 'reservasi' && (
              <div className="max-w-[90rem] mx-auto pb-32 lg:pb-12">
                <div className="sticky top-0 z-[40] bg-[#f8faf9]/80 backdrop-blur-md pt-4 pb-3 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 border-b border-emerald-100/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                           <CalendarDays size={18} className="text-emerald-600" />
                           <h2 className="text-lg md:text-xl font-bold text-emerald-950 tracking-tight">
                                Reservasi: <span className="text-emerald-800 font-extrabold">{formatTanggalPendek(selectedDate)}</span>
                           </h2>
                        </div>
                        <div className="flex items-center space-x-3 w-full md:w-72">
                          <div className="h-2 flex-1 bg-emerald-100/55 rounded-full overflow-hidden flex border border-emerald-100/20">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${persentaseSewa}%` }}></div>
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-800 whitespace-nowrap bg-emerald-100/70 px-2 py-0.5 rounded-full">{persentaseSewa}% Terisi</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-row items-center gap-2.5 w-full md:w-auto overflow-x-auto hide-scrollbar relative z-[60]">
                        <div className="flex bg-emerald-100/30 p-1 rounded-xl shrink-0 border border-emerald-100/50 relative z-[60] backdrop-blur-sm">
                          {['semua', 'pendopo', 'lapangan'].map(t => (
                            <button 
                              type="button" 
                              key={t} 
                              onClick={() => setFilterTipe(t)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold capitalize transition-all relative z-[60] pointer-events-auto cursor-pointer ${ 
                                filterTipe === t 
                                  ? 'bg-white text-emerald-950 shadow-sm' 
                                  : 'text-emerald-700/60 hover:text-emerald-950' 
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="relative flex items-center justify-center bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200/65 shadow-sm shrink-0 hover:ring-4 ring-emerald-500/10 hover:border-emerald-400 transition-all cursor-pointer z-[60] pointer-events-auto">
                          <Calendar className="text-emerald-600 mr-1.5" size={14} />
                          <span className="text-xs font-bold text-emerald-950 mr-1">Pilih Tanggal</span>
                          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[60] custom-date-picker pointer-events-auto" />
                        </div>
                      </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-3.5 relative z-10">
                  {fasilitasHarian.map(fasilitas => {
                    const { icon: IconComponent, color, bg } = getIconData(fasilitas.tipe);
                    const isTersedia = fasilitas.status === 'Tersedia';
                    const isDitutup = fasilitas.bookingInfo?.status_pembayaran === 'Ditutup';
                    const isLunas = fasilitas.bookingInfo?.status_pembayaran === 'Sudah Transfer' || fasilitas.bookingInfo?.status_pembayaran === 'Sudah Lunas';
                    const isMenungguVerifikasi = fasilitas.bookingInfo?.status_pembayaran === 'Menunggu Verifikasi';
                    const hasBuktiListrik = fasilitas.bookingInfo?.bukti_transfer_listrik !== null && fasilitas.bookingInfo?.bukti_transfer_listrik !== undefined;
                    
                    return (
                      <div 
                        key={fasilitas.id} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (fasilitas.status === 'Tersedia') setBookingLokasi(fasilitas);
                            else if (fasilitas.bookingInfo) handleOpenDetail(fasilitas.bookingInfo);
                        }}
                        className={`group relative rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[112px] sm:min-h-[115px] overflow-hidden cursor-pointer transition-all duration-300 border bg-white active:scale-[0.97] ${ 
                          isTersedia 
                            ? 'border-slate-100/80 hover:border-emerald-500/50 hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.15)] hover:-translate-y-0.5' 
                            : isDitutup 
                              ? 'bg-slate-50/80 border-slate-200 opacity-60' 
                              : 'border-rose-100 hover:border-rose-400/50 hover:shadow-[0_12px_24px_-8px_rgba(239,68,68,0.15)] hover:-translate-y-0.5' 
                        }`}
                      >
                        {/* Decorative background gradients */}
                        {isTersedia && <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>}
                        {!isTersedia && !isDitutup && <div className="absolute top-0 right-0 w-12 h-12 bg-rose-50/50 rounded-bl-full -z-10 pointer-events-none"></div>}
                        
                        {!isTersedia && !isDitutup && isLunas && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm z-20 flex items-center pointer-events-none tracking-wide">
                                <CheckCircle2 size={8} className="mr-0.5"/> LUNAS
                            </div>
                        )}
                        
                        {!isTersedia && !isDitutup && isMenungguVerifikasi && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm z-20 flex items-center animate-pulse pointer-events-none tracking-wide">
                                <AlertCircle size={8} className="mr-0.5 animate-bounce"/> VERIFIKASI
                            </div>
                        )}

                        {!isTersedia && !isDitutup && hasBuktiListrik && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[7px] font-black px-2 py-0.5 rounded-br-lg shadow-sm z-20 flex items-center pointer-events-none tracking-wide">
                                <Zap size={8} className="mr-0.5"/> LISTRIK
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-2 pointer-events-none">
                          <div className={`p-1.5 sm:p-2 rounded-xl shadow-sm transition-all duration-300 ${ 
                            isTersedia 
                              ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' 
                              : isDitutup 
                                ? 'bg-slate-200 text-slate-500' 
                                : 'bg-rose-50 text-rose-500' 
                          }`}>
                            <IconComponent size={15} strokeWidth={2.5} />
                          </div>
                          
                          {/* Status dot — static only for available (no ping to save resources) */}
                          <div className="flex items-center justify-center w-4 h-4">
                            {!isDitutup && (
                              <span className={`inline-flex rounded-full ${
                                isTersedia
                                  ? 'w-2.5 h-2.5 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                                  : 'w-2 h-2 bg-rose-500 animate-ping opacity-75'
                              }`}></span>
                            )}
                            {isDitutup && <span className="inline-flex rounded-full w-2 h-2 bg-slate-300"></span>}
                          </div>
                        </div>

                        <div className="mt-auto mb-1 pointer-events-none">
                          <h4 className={`font-bold text-[11px] leading-tight line-clamp-2 transition-colors duration-300 ${ 
                            isTersedia 
                              ? 'text-emerald-950 group-hover:text-emerald-900' 
                              : isDitutup 
                                ? 'text-slate-500' 
                                : 'text-rose-950' 
                          }`}>{fasilitas.nama}</h4>
                        </div>

                        <div className="pointer-events-none w-full">
                          {isTersedia ? (
                              <span className="text-[8.5px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center group-hover:text-emerald-700 transition-colors">
                                Pesan <ChevronRight size={9} className="ml-0.5 transform group-hover:translate-x-0.5 transition-transform" />
                              </span>
                          ) : isDitutup ? (
                              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center"><Lock size={8} className="mr-0.5"/> Maintenance</span>
                          ) : (
                              <div className="bg-rose-50/40 border border-rose-100/50 rounded-xl p-1.5 mt-0.5 w-full overflow-hidden">
                                  <span className="text-[8.5px] font-extrabold text-rose-900 block truncate">{fasilitas.bookingInfo?.nama_penyewa}</span>
                                  <span className="text-[8px] font-medium text-rose-600/80 block truncate">PIC: {fasilitas.bookingInfo?.pic_rombongan}</span>
                              </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'sewa' && (
              <div className="space-y-6 max-w-6xl mx-auto pb-32 lg:pb-12 pt-6">
                <div className="sticky top-0 z-[40] bg-[#f8faf9]/95 backdrop-blur-md pt-4 pb-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 border-b border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tight">Database Pengunjung</h2>
                      <p className="text-xs font-medium text-emerald-700 mt-1">Kelola dan pantau seluruh jadwal penggunaan fasilitas aktif di TMR.</p>
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto relative z-[60] shrink-0">
                      <div className="relative flex items-center bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex-1 sm:flex-none hover:ring-4 ring-emerald-500/10 hover:border-emerald-400 transition-all cursor-pointer pointer-events-auto">
                          <Calendar className="text-emerald-600 mr-2" size={16} />
                          <span className="text-emerald-950 font-bold text-xs w-full text-left whitespace-nowrap">{filterDateSewa ? formatTanggalPendek(filterDateSewa) : 'Semua Jadwal Ke Depan'}</span>
                          <input type="date" value={filterDateSewa} onChange={(e) => setFilterDateSewa(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[60] custom-date-picker pointer-events-auto" />
                      </div>
                      {filterDateSewa && (
                        <button 
                          type="button" 
                          onClick={() => setFilterDateSewa('')} 
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 p-2.5 rounded-2xl transition-all shadow-sm pointer-events-auto active:scale-95" 
                          title="Tampilkan Semua Jadwal"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      )}
                  </div>
                </div>

                {groupedSewa.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(4,120,87,0.015)]">
                      <Users size={48} className="text-emerald-800/20 mb-4 stroke-[1.5]" />
                      <p className="font-extrabold text-sm text-emerald-950">{filterDateSewa ? `Tidak ada jadwal di ${formatTanggalIndo(filterDateSewa)}` : 'Belum ada riwayat data pengunjung.'}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Silakan tambahkan reservasi baru di tab Reservasi Lokasi.</p>
                    </div>
                ) : (
                    groupedSewa.map(group => (
                        <div key={group.date} className="mb-8 rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgba(4,120,87,0.02)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-950 text-white px-5 py-4 border-b border-emerald-900 gap-2.5">
                              <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-white/10 text-amber-400 rounded-xl shrink-0">
                                  <Calendar size={16} className="stroke-[2.5]" />
                                </div>
                                <div>
                                  <h3 className="font-black text-sm tracking-wide">{formatTanggalIndo(group.date)}</h3>
                                  <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest mt-0.5">Jadwal Penggunaan Fasilitas</p>
                                </div>
                              </div>
                              <span className="bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs px-3.5 py-1 rounded-full font-black w-max shadow-inner text-center shrink-0">
                                {group.data.length} Reservasi
                              </span>
                            </div>
                            <div className="bg-white overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                  <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                                    <tr>
                                      <th className="px-6 py-4">ID Transaksi</th>
                                      <th className="px-6 py-4">Fasilitas & Lokasi</th>
                                      <th className="px-6 py-4">Penyewa / Rombongan</th>
                                      <th className="px-6 py-4">PIC Tamu</th>
                                      <th className="px-6 py-4">Status Bayar</th>
                                      <th className="px-6 py-4">Diinput Pada</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-xs">
                                    {group.data.map((item, idx) => {
                                      const locInfo = masterLokasi.find(l => l.nama === item.lokasi_sewa);
                                      const isLapangan = locInfo?.tipe === 'lapangan' || item.lokasi_sewa.includes('LAP');
                                      const Icon = isLapangan ? TreePine : Tent;
                                      return (
                                        <tr 
                                          key={idx} 
                                          onClick={() => handleOpenDetail(item)} 
                                          className="hover:bg-slate-50/70 cursor-pointer transition-colors group/row"
                                        >
                                          <td className="px-6 py-4.5 font-black text-emerald-950 group-hover/row:text-emerald-700 transition-colors">{item.id_sewa}</td>
                                          <td className="px-6 py-4.5">
                                            <div className="flex items-center space-x-2.5">
                                              <div className={`p-1.5 rounded-lg shrink-0 ${isLapangan ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                <Icon size={12} className="stroke-[2.5]" />
                                              </div>
                                              <div>
                                                <span className="font-extrabold text-emerald-950 text-xs">{item.lokasi_sewa}</span>
                                                {item.luas_lahan && <span className="text-[10px] text-slate-400 font-semibold ml-1">({item.luas_lahan} m²)</span>}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4.5 text-slate-700 font-bold text-xs">{item.nama_penyewa}</td>
                                          <td className="px-6 py-4.5 text-slate-500 font-semibold">{item.pic_rombongan || '-'}</td>
                                          <td className="px-6 py-4.5">
                                            <div className="flex items-center">
                                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm flex items-center ${getStatusBadgeClass(item.status_pembayaran)}`}>
                                                {item.status_pembayaran === 'Sudah Transfer' && <CheckCircle2 size={10} className="mr-1 text-emerald-600" />}
                                                {item.status_pembayaran === 'Menunggu Verifikasi' && <AlertCircle size={10} className="mr-1 text-blue-600 animate-pulse" />}
                                                {item.status_pembayaran === 'Belum Transfer' && <AlertCircle size={10} className="mr-1 text-rose-600" />}
                                                {item.status_pembayaran}
                                              </span>
                                              {item.listrik_tambahan && (
                                                <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-black text-[9px] border border-amber-200/50 shadow-sm">
                                                  <Zap size={9} className="mr-0.5 text-amber-500 fill-amber-500" /> Listrik
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4.5 text-slate-400 font-medium">{item.tanggal_booking || '-'}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                        </div>
                    ))
                )}
              </div>
            )}

            {activeTab === 'pembayaran' && (
              <div className="space-y-6 max-w-[90rem] mx-auto pb-32 lg:pb-12 animate-slide-in-right">
                <div className="sticky top-0 z-[40] bg-slate-50/80 backdrop-blur-lg pt-4 sm:pt-5 lg:pt-8 pb-4 mb-4 -mx-4 px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8 border-b border-emerald-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tight">Verifikasi & Mutasi Bank</h2>
                      <p className="text-xs font-semibold text-emerald-600/80 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        Dikelompokkan berdasarkan <b className="font-extrabold uppercase text-amber-600">Tanggal Transfer Rekening</b>
                      </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
                      <div className="flex bg-emerald-950/5 p-1 rounded-xl w-full sm:w-auto border border-emerald-900/10">
                         <button onClick={() => setPembayaranViewMode('list')} className={`flex items-center justify-center flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${ pembayaranViewMode === 'list' ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/5 font-extrabold' : 'text-emerald-850/70 hover:text-emerald-950 hover:bg-emerald-900/5' }`}><List size={14} className="mr-1.5" /> Daftar</button>
                         <button onClick={() => setPembayaranViewMode('calendar')} className={`flex items-center justify-center flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${ pembayaranViewMode === 'calendar' ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/5 font-extrabold' : 'text-emerald-850/70 hover:text-emerald-950 hover:bg-emerald-900/5' }`}><LayoutGrid size={14} className="mr-1.5" /> Kalender</button>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="relative flex items-center bg-white px-4 py-2.5 rounded-xl border border-emerald-900/10 shadow-sm hover:shadow hover:border-emerald-300 transition-all cursor-pointer">
                              <Wallet className="text-amber-500 mr-2" size={16} />
                              <span className="text-emerald-950 font-bold text-sm w-full text-left whitespace-nowrap">{filterDatePembayaran ? formatTanggalPendek(filterDatePembayaran) : 'Semua Mutasi'}</span>
                              <input type="date" value={filterDatePembayaran} onChange={(e) => setFilterDatePembayaran(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 custom-date-picker" />
                          </div>
                          {filterDatePembayaran && <button onClick={() => setFilterDatePembayaran('')} className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2.5 rounded-xl transition-colors border border-rose-100 shadow-sm"><X size={20} /></button>}
                      </div>
                  </div>
                </div>

                {pembayaranViewMode === 'list' && (
                    <>
                    {groupedPembayaran.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-emerald-950/30 bg-white rounded-3xl border border-emerald-900/5 shadow-sm"><CreditCard size={48} className="mb-4 text-emerald-950/20" /><p className="font-extrabold text-sm text-emerald-950/50">Belum ada data transfer yang masuk.</p></div>
                    ) : (
                        groupedPembayaran.map(group => {
                            const totalNominalGroup = group.data.reduce((sum, item) => sum + (item.total_biaya || 0), 0);

                            return (
                            <div key={group.date} className="mb-10 relative pl-4 sm:pl-0">
                                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/30 to-emerald-500/5 -z-10"></div>
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-emerald-900/10 shadow-sm flex items-center justify-center z-10 glow-emerald-pulse">
                                        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl flex items-center justify-center shadow-md"><Wallet size={16} className="stroke-[2.5]"/></div>
                                    </div>
                                    <div className="ml-4 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h3 className="font-black text-emerald-950 text-base md:text-lg tracking-wide">{formatTanggalIndo(group.date)}</h3>
                                            <p className="text-xs font-semibold text-emerald-700/80 mt-0.5">Total Mutasi Masuk: <span className="text-amber-600 font-extrabold text-sm">{formatRupiah(totalNominalGroup)}</span></p>
                                        </div>
                                        <span className="bg-emerald-950/5 border border-emerald-900/10 text-emerald-900 text-xs px-3.5 py-1.5 rounded-full font-bold w-max shadow-sm text-center shrink-0">
                                            {group.data.length} Transaksi
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="ml-2 sm:ml-12">
                                    <div className="bg-white rounded-3xl border border-emerald-900/5 overflow-hidden shadow-md shadow-emerald-950/[0.02]">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                          <thead className="bg-emerald-950/5 border-b border-emerald-900/10 text-emerald-900 uppercase text-[10px] font-extrabold tracking-widest">
                                            <tr>
                                              <th className="px-6 py-4">ID Transaksi</th>
                                              <th className="px-6 py-4">Penyewa (Lokasi)</th>
                                              <th className="px-6 py-4">Rincian Nominal</th>
                                              <th className="px-6 py-4">Status Verifikasi</th>
                                              <th className="px-6 py-4 text-center">Aksi</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-emerald-900/5 text-xs">
                                            {group.data.map((item, idx) => (
                                              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-200 group/row">
                                                <td className="px-6 py-4.5 font-black text-emerald-950 group-hover/row:text-emerald-700 transition-colors">{item.id_sewa}</td>
                                                <td className="px-6 py-4.5">
                                                    <p className="font-extrabold text-emerald-950 text-sm">{item.nama_penyewa}</p>
                                                    <p className="text-[10px] text-emerald-600/80 font-bold tracking-wide mt-0.5 flex items-center gap-1">
                                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                      {item.lokasi_sewa}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4.5">
                                                    <p className="font-black text-emerald-800 text-sm">{formatRupiah(item.total_biaya)}</p>
                                                    {item.listrik_tambahan && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/50 font-extrabold text-[9px] mt-1 shadow-sm">
                                                          <Zap size={8} className="mr-0.5 text-amber-500 fill-amber-500" /> +Listrik
                                                      </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4.5">
                                                    <div className="flex items-center">
                                                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm flex items-center ${getStatusBadgeClass(item.status_pembayaran)}`}>
                                                          {item.status_pembayaran === 'Sudah Transfer' && <CheckCircle2 size={10} className="mr-1 text-emerald-600" />}
                                                          {item.status_pembayaran === 'Menunggu Verifikasi' && <AlertCircle size={10} className="mr-1 text-blue-600 animate-pulse" />}
                                                          {item.status_pembayaran === 'Belum Transfer' && <AlertCircle size={10} className="mr-1 text-rose-600" />}
                                                          {item.status_pembayaran}
                                                      </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4.5 text-center">
                                                    <button onClick={() => handleOpenDetail(item)} className="mx-auto bg-white border border-emerald-900/15 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 hover:border-emerald-500/35 px-3.5 py-2 rounded-xl text-[10px] font-extrabold shadow-sm transition-all duration-200 flex items-center gap-1.5">
                                                        <FileText size={12} className="text-emerald-600"/> Cek Struk / Validasi
                                                    </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                </div>
                            </div>
                        )})
                    )}
                    </>
                )}

                {pembayaranViewMode === 'calendar' && (
                    <div className="bg-white rounded-3xl border border-emerald-900/5 p-5 md:p-8 shadow-xl shadow-emerald-950/[0.02] overflow-hidden">
                        <div className="flex justify-between items-center mb-6 bg-slate-50 p-3 rounded-2xl border border-emerald-900/5">
                            <button onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))} className="p-2 bg-white hover:bg-emerald-50 text-emerald-850 hover:text-emerald-950 border border-emerald-900/10 rounded-xl transition-all active:scale-95 shadow-sm"><ChevronLeft size={18}/></button>
                            <h3 className="text-xs md:text-sm font-black text-emerald-950 uppercase tracking-widest">{namaBulanKalender} {calendarYear}</h3>
                            <button onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))} className="p-2 bg-white hover:bg-emerald-50 text-emerald-850 hover:text-emerald-950 border border-emerald-900/10 rounded-xl transition-all active:scale-95 shadow-sm"><ChevronRight size={18}/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-7 gap-px bg-emerald-900/10 border border-emerald-900/10 rounded-2xl overflow-hidden shadow-inner">
                                    {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
                                        <div key={d} className="bg-emerald-950/5 py-3.5 text-center text-[10px] font-extrabold text-emerald-900 uppercase tracking-widest border-b border-emerald-900/10">{d}</div>
                                    ))}
                                    {blanks.map((_, i) => <div key={`b-${i}`} className="bg-slate-50/50 min-h-[140px] p-2"></div>)}
                                    {calendarDays.map(d => {
                                        const dayData = getTransferDataForDate(d);
                                        const total = dayData.reduce((sum, item) => sum + (item.total_biaya || 0), 0);
                                        const isToday = getTodayString() === `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                        
                                        return (
                                            <div key={d} className={`bg-white min-h-[140px] p-3 flex flex-col hover:bg-slate-50/50 transition-colors relative ${isToday ? 'z-10 ring-2 ring-amber-400 shadow-md shadow-amber-400/20' : 'border-t border-l border-emerald-900/5'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-all ${dayData.length > 0 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400'}`}>{d}</span>
                                                    {dayData.length > 0 && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide border border-amber-200/40">{dayData.length} Mutasi</span>}
                                                </div>
                                                {dayData.length > 0 && (
                                                    <div className="flex-1 flex flex-col">
                                                        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/10 text-center mb-2">
                                                            <p className="text-[8px] text-emerald-700 font-extrabold uppercase tracking-widest">Total Mutasi</p>
                                                            <p className="text-xs font-black text-emerald-950 mt-0.5">{formatRupiah(total)}</p>
                                                        </div>
                                                        <div className="space-y-1 overflow-y-auto max-h-[85px] hide-scrollbar pr-0.5">
                                                            {dayData.map((item, idx) => (
                                                                <div key={idx} className="text-[9px] bg-slate-50 border border-emerald-900/5 hover:border-emerald-500/30 p-1.5 rounded-lg cursor-pointer hover:bg-emerald-50/40 transition-colors" onClick={() => handleOpenDetail(item)}>
                                                                    <div className="font-bold text-emerald-950 line-clamp-1">{item.nama_penyewa}</div>
                                                                    <div className="text-amber-600 font-extrabold mt-0.5">{formatRupiah(item.total_biaya)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}

            {activeTab === 'master' && renderMasterData()}

            {activeTab === 'portal' && (
              <div className="max-w-3xl mx-auto pb-32 lg:pb-12 pt-4 animate-slide-in-right">
                 <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 rounded-3xl p-8 text-center text-white mb-8 shadow-xl relative overflow-hidden border border-emerald-800/30">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-bl-full -z-0 opacity-15"></div>
                     <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500 rounded-tr-full -z-0 opacity-10 blur-xl"></div>
                     <div className="inline-flex p-3 rounded-2xl bg-emerald-800/50 text-amber-400 mb-4 border border-emerald-700/30 shadow-inner relative z-10 animate-bounce"><UploadCloud size={32} /></div>
                     <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 relative z-10">Unggah Bukti Transfer</h2>
                     <p className="text-emerald-200/80 text-xs md:text-sm font-medium relative z-10 max-w-md mx-auto">Verifikasi pembayaran secara instan menggunakan AI OCR. Silakan cari kode reservasi Anda di bawah.</p>
                 </div>
                 <div className="bg-white rounded-3xl shadow-md shadow-emerald-950/[0.01] border border-emerald-900/5 p-6 md:p-8">
                     <form onSubmit={handlePortalSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
                          <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/50" size={18} />
                            <input type="text" required value={portalSearchId} onChange={e => setPortalSearchId(e.target.value)} placeholder="Masukkan Kode Reservasi (Contoh: TMR-52967)" className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 outline-none text-emerald-950 font-bold bg-slate-50 transition-all focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-400/80" />
                          </div>
                          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-8 py-3.5 sm:py-0 rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 hover:shadow-lg flex items-center justify-center gap-2">Cari Data</button>
                     </form>
                     
                     {portalBooking && (
                         <div className="border-t border-emerald-900/10 pt-6 animate-slide-in-right">
                             
                             <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-emerald-900/5">
                                 <h3 className="font-extrabold text-emerald-950 text-sm mb-4 border-b border-emerald-900/10 pb-2.5 flex items-center justify-between">
                                    <span>Data Reservasi Ditemukan</span>
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md border border-amber-200/50">{portalBooking.id_sewa}</span>
                                 </h3>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                     <div><span className="block text-[10px] font-extrabold uppercase text-emerald-700/50 tracking-wider">Lokasi Fasilitas</span><span className="font-extrabold text-emerald-950 text-sm mt-0.5 block">{portalBooking.lokasi_sewa}</span></div>
                                     <div><span className="block text-[10px] font-extrabold uppercase text-emerald-700/50 tracking-wider">Tanggal Reservasi</span><span className="font-extrabold text-emerald-950 text-sm mt-0.5 block">{formatTanggalIndo(portalBooking.tanggal_sewa)}</span></div>
                                     <div><span className="block text-[10px] font-extrabold uppercase text-emerald-700/50 tracking-wider">Nama Rombongan / Penyewa</span><span className="font-extrabold text-emerald-950 text-sm mt-0.5 block">{portalBooking.nama_penyewa}</span></div>
                                     <div>
                                        <span className="block text-[10px] font-extrabold uppercase text-emerald-700/50 tracking-wider">Status Pembayaran</span>
                                        <span className={`inline-flex mt-1 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm ${getStatusBadgeClass(portalBooking.status_pembayaran)}`}>{portalBooking.status_pembayaran}</span>
                                     </div>
                                 </div>
                             </div>

                             {/* INPUT TANGGAL UPLOAD / TRANSFER */}
                             {((portalBooking.status_pembayaran !== 'Sudah Transfer' && portalBooking.status_pembayaran !== 'Menunggu Verifikasi') || (portalBooking.listrik_tambahan && portalBooking.akses_upload_listrik && !portalBooking.bukti_transfer_listrik)) && (
                                 <div className="mb-6 bg-white rounded-2xl p-5 border border-emerald-900/5 shadow-sm hover:border-emerald-300 transition-all duration-200">
                                     <label className="block text-[10px] font-black text-emerald-900 mb-2 uppercase tracking-wider">Pilih Tanggal Transfer Sesuai Struk</label>
                                     <input 
                                         type="date" 
                                         max={getTodayString()}
                                         value={tanggalUploadPortal} 
                                         onChange={(e) => {
                                             if(e.target.value > getTodayString()) {
                                                 showToast("Tanggal upload tidak boleh melebihi hari ini!", 'error');
                                                 setTanggalUploadPortal(getTodayString());
                                             } else {
                                                 setTanggalUploadPortal(e.target.value);
                                             }
                                         }} 
                                         className="relative w-full px-4 py-3 rounded-xl border border-emerald-900/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-emerald-950 font-bold bg-slate-50 cursor-pointer custom-date-picker" 
                                     />
                                     <p className="text-[10px] text-slate-500 font-semibold mt-2.5 flex items-center gap-1">*Pilih tanggal sesuai struk bukti transfer Anda. Pengisian maksimal adalah tanggal hari ini.</p>
                                 </div>
                             )}

                             {/* SEKSI 1: UPLOAD BUKTI LOKASI UTAMA */}
                             <div className="mb-6">
                                 <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider mb-3">Bukti Pembayaran Lokasi Utama</h4>
                                 {(portalBooking.status_pembayaran === 'Sudah Transfer' || portalBooking.status_pembayaran === 'Lunas') ? (
                                     <div className="text-center py-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-slide-in-right">
                                         <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-3" />
                                         <p className="font-extrabold text-emerald-950 text-sm mb-1">Pembayaran Lokasi Utama Lunas & Tervalidasi.</p>
                                         <p className="text-xs text-slate-500 font-medium">Data mutasi transfer telah dicocokkan oleh sistem.</p>
                                         {portalBooking.status_pembayaran === 'Lunas' && (
                                             <button type="button" onClick={() => handlePrintKwitansi(portalBooking)} className="mt-4 inline-flex items-center bg-white border border-emerald-900/15 hover:border-emerald-600 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors shadow-sm active:scale-95">
                                                 <Printer size={16} className="mr-2 text-emerald-600"/> Cetak Kwitansi Resmi
                                             </button>
                                         )}
                                     </div>
                                 ) : portalBooking.status_pembayaran === 'Menunggu Verifikasi' ? (
                                     <div className="text-center py-8 bg-blue-500/5 rounded-2xl border border-blue-500/10"><AlertCircle size={36} className="mx-auto text-blue-600 mb-3 animate-pulse" /><p className="font-extrabold text-blue-950 text-sm">Bukti Lokasi Sedang Diverifikasi Admin.</p><p className="text-xs text-slate-500 font-medium mt-1">Sistem sedang mencocokkan mutasi bank.</p></div>
                                 ) : (
                                     <div className="space-y-4">
                                         {!uploadFile && !isScanning && (
                                            <label className="block w-full border-2 border-dashed border-emerald-900/15 rounded-2xl p-8 text-center cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-400 transition-all duration-200 group">
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                <UploadCloud size={32} className="mx-auto text-emerald-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
                                                <p className="font-extrabold text-emerald-900 text-xs">Klik di sini untuk mengunggah foto struk lokasi</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-1">Format file JPG, PNG, atau JPEG</p>
                                            </label>
                                         )}
                                         {isScanning && (
                                            <div className="relative border border-dashed border-blue-200 bg-blue-50/30 rounded-2xl p-8 text-center overflow-hidden h-[180px] flex flex-col items-center justify-center">
                                                <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-md shadow-blue-500/50 animate-scan-line"></div>
                                                <ScanLine size={32} className="text-blue-600 mb-3 animate-pulse" />
                                                <p className="font-extrabold text-blue-900 text-sm animate-pulse">Memindai struk dengan AI Gemini...</p>
                                                <p className="text-xs text-slate-400 font-medium mt-1">Membaca nominal, tanggal, dan mencocokkan mutasi bank</p>
                                            </div>
                                         )}
                                         {scanError && <div className="bg-rose-50 text-rose-800 p-4 rounded-xl flex items-center text-xs font-bold border border-rose-200/50"><AlertCircle size={16} className="mr-2 shrink-0 text-rose-600" /> {scanError}</div>}
                                         {uploadFile && !isScanning && ocrResult && (
                                             <div className="bg-white border border-emerald-900/10 rounded-2xl p-5 shadow-sm animate-slide-in-right">
                                                 <div className="flex flex-col md:flex-row gap-6 mb-4">
                                                     <img src={uploadFile} alt="Preview" className="w-full md:w-32 h-32 rounded-xl border border-slate-200 object-cover bg-slate-50" />
                                                     <div className="flex-1 grid grid-cols-2 gap-4 text-xs self-center">
                                                         <div><span className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Tgl Diakui</span><span className="font-extrabold text-slate-900 text-sm block mt-0.5">{formatTanggalIndo(tanggalUploadPortal)}</span></div>
                                                         <div><span className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Nominal Pembayaran</span><span className="font-extrabold text-emerald-800 text-sm block mt-0.5">{formatRupiah(portalBooking.total_biaya)}</span></div>
                                                     </div>
                                                 </div>
                                                 <button onClick={handleKirimBukti} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2">Kirim Bukti Pembayaran Lokasi</button>
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>

                             {/* SEKSI 2: UPLOAD BUKTI LISTRIK */}
                             {portalBooking.listrik_tambahan && portalBooking.akses_upload_listrik && (portalBooking.status_pembayaran === 'Lunas' || portalBooking.status_pembayaran === 'Sudah Transfer') && (
                                 <div className="border-t border-amber-200 pt-6 mt-6 bg-amber-500/[0.03] -mx-6 px-6 pb-6 rounded-b-3xl border-b border-amber-100">
                                     <h4 className="font-black text-amber-900 text-sm mb-1 flex items-center"><Zap size={18} className="mr-2 text-amber-500" /> Tagihan Listrik Tambahan (+Rp 100.000)</h4>
                                     <p className="text-[11px] text-amber-800 mb-5 font-semibold">Admin telah mengaktifkan pemakaian listrik untuk acara Anda. Silakan unggah bukti transfer tambahan di bawah ini.</p>
                                     {portalBooking.bukti_transfer_listrik ? (
                                         <div className="text-center py-6 bg-white rounded-2xl border border-amber-200/50 shadow-sm">
                                             <CheckCircle2 size={36} className="mx-auto text-amber-500 mb-2" />
                                             <p className="font-extrabold text-amber-900 text-xs">Bukti Pembayaran Listrik Anda Sudah Diterima Admin.</p>
                                             {portalBooking.tanggal_transfer_listrik && <p className="text-[10px] text-amber-700 font-bold mt-2">Tgl Transfer: {formatTanggalIndo(portalBooking.tanggal_transfer_listrik)}</p>}
                                         </div>
                                     ) : (
                                         <div className="space-y-4">
                                             {!uploadListrikFile && (
                                                 <label className="block w-full border border-dashed border-amber-900/20 rounded-2xl p-6 text-center cursor-pointer hover:bg-amber-100/50 hover:border-amber-400 transition-all duration-200 bg-white">
                                                     <input type="file" accept="image/*" className="hidden" onChange={handleFileListrikChangePortal} />
                                                     <UploadCloud size={24} className="mx-auto text-amber-500 mb-2" />
                                                     <p className="font-extrabold text-amber-800 text-xs">Klik di sini untuk mengunggah struk listrik</p>
                                                     <p className="text-[10px] text-slate-400 font-medium mt-1">Format file JPG, PNG, atau JPEG</p>
                                                 </label>
                                             )}
                                             {uploadListrikFile && (
                                                  <div className="bg-white border border-amber-200/50 rounded-2xl p-4 shadow-sm animate-slide-in-right">
                                                      <img src={uploadListrikFile} alt="Preview Listrik" className="w-full h-40 object-contain rounded-lg border border-amber-100 bg-slate-50 mb-4" />
                                                      <button onClick={handleKirimBuktiListrik} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center"><Send size={16} className="mr-2"/> Kirim Bukti Listrik Tambahan</button>
                                                  </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             )}
                          </div>
                      )}
                  </div>
               </div>
             )}
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-emerald-100/80 flex justify-between px-1 pb-safe z-[55] shadow-[0_-8px_30px_rgba(4,120,87,0.07)]">
          {[
            { id: 'reservasi', label: 'Reservasi', icon: LayoutDashboard },
            { id: 'sewa', label: 'Tamu', icon: Users },
            { id: 'pembayaran', label: 'Keuangan', icon: CreditCard },
            { id: 'master', label: 'Master', icon: Settings },
            { id: 'portal', label: 'Upload', icon: UploadCloud }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center flex-1 pt-2.5 pb-1.5 relative min-h-[56px] sm:min-h-[64px] active:opacity-75 transition-opacity`}>
              {activeTab === item.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-full"></div>}
              <div className={`p-2 sm:p-2.5 rounded-2xl mb-0.5 transition-all duration-200 ${activeTab === item.id ? 'bg-emerald-50 shadow-sm' : ''}`}>
                <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 1.75} className={activeTab === item.id ? 'text-emerald-700' : 'text-slate-400'} />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-bold transition-colors leading-none ${activeTab === item.id ? 'text-emerald-800' : 'text-slate-400'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {selectedRecord && renderDetailModal()}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } } 
        @keyframes fade-in-down { 0% { opacity: 0; transform: translate(-50%, -20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-in-right { animation: slide-in-right 0.25s ease-out both; } 
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.2s ease-out both; }
        .pb-safe { padding-bottom: calc(0.5rem + env(safe-area-inset-bottom)); } 
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-date-picker::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; padding: 0; margin: 0; }
      `}} />
    </div>
  );
}
