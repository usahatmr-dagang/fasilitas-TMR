import React, { useState, useMemo } from 'react';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
  ArrowRight, RefreshCw, Database, ChevronLeft, Search, Filter, 
  Clock, Check, X, ShieldAlert, Sparkles, Layers, ArrowUpDown, ChevronDown, RotateCcw
} from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import ExcelJS from 'exceljs/dist/exceljs.min.js';

export default function MigrateData({ onNavigate }) {
  // Mode Selection: 'full' (2 sheets) vs 'payment_only' (1 sheet rekap sudah bayar)
  const [migrationMode, setMigrationMode] = useState('full');

  // Step 1: Upload, Step 2: Mapping & Preview, Step 3: Result
  const [activeStep, setActiveStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  
  // Sheet selections
  const [selectedPenyewaSheet, setSelectedPenyewaSheet] = useState('');
  const [selectedBayarSheet, setSelectedBayarSheet] = useState('');

  // Column headers
  const [penyewaHeaders, setPenyewaHeaders] = useState([]);
  const [bayarHeaders, setBayarHeaders] = useState([]);

  // Column mappings
  const [penyewaColMap, setPenyewaColMap] = useState({
    idSewa: '',
    tanggalSewa: '',
    lokasiSewa: '',
    namaPenyewa: '',
    noHp: '',
    keterangan: '',
    pic: '',
    luasLahan: '',
    biaya: ''
  });

  const [bayarColMap, setBayarColMap] = useState({
    idSewa: '',
    tanggalBayar: '',
    nominal: '',
    namaPengirim: '',
    keterangan: ''
  });

  // Mode 1: Reconciled Preview Data
  const [reconciledData, setReconciledData] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'paid', 'unpaid'
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyYear2025, setOnlyYear2025] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);

  // Mode 2: Payment Only Data
  const [paymentOnlyData, setPaymentOnlyData] = useState([]);
  const [filterPaymentTab, setFilterPaymentTab] = useState('all'); // 'all', 'ready', 'already_paid', 'not_found'

  // Execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`]);

  // Clean cell value
  const getCellValue = (cell) => {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'object') {
      if (cell instanceof Date) return cell;
      const val = cell.value !== undefined ? cell.value : cell;
      if (val instanceof Date) return val;
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null) {
        if (val.result !== undefined) return val.result instanceof Date ? val.result : String(val.result).trim();
        if (val.text !== undefined) return String(val.text).trim();
        if (Array.isArray(val.richText)) {
          return val.richText.map(t => t.text || '').join('').trim();
        }
      }
      if (typeof val === 'string') return val.trim();
      if (cell.text !== undefined && typeof cell.text === 'string') return cell.text.trim();
      return '';
    }
    return String(cell).trim();
  };

  // Safe Date Parser
  const parseIndoOrExcelDate = (val) => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return { ymd: `${y}-${m}-${d}`, year: y, month: val.getMonth() + 1, day: val.getDate() };
    }
    if (typeof val === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const jsDate = new Date(excelEpoch.getTime() + val * 86400000);
      if (!isNaN(jsDate.getTime())) {
        const y = jsDate.getUTCFullYear();
        const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const d = String(jsDate.getUTCDate()).padStart(2, '0');
        return { ymd: `${y}-${m}-${d}`, year: y, month: jsDate.getUTCMonth() + 1, day: jsDate.getUTCDate() };
      }
    }
    const str = String(val).trim();
    if (!str) return null;

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const y = parseInt(str.substring(0, 4), 10);
      const m = parseInt(str.substring(5, 7), 10);
      const d = parseInt(str.substring(8, 10), 10);
      return { ymd: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, year: y, month: m, day: d };
    }

    const parsedJs = new Date(str);
    if (!isNaN(parsedJs.getTime()) && (str.includes('GMT') || str.includes('T') || str.length > 18)) {
      const y = parsedJs.getFullYear();
      const m = String(parsedJs.getMonth() + 1).padStart(2, '0');
      const d = String(parsedJs.getDate()).padStart(2, '0');
      return { ymd: `${y}-${m}-${d}`, year: y, month: parsedJs.getMonth() + 1, day: parsedJs.getDate() };
    }

    let normalized = str.replace(/-/g, '/').replace(/ /g, '/');
    const parts = normalized.split('/').filter(p => p);
    if (parts.length >= 3) {
      let day = parseInt(parts[0], 10);
      let mStr = parts[1].toLowerCase();
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      
      let month = parseInt(mStr, 10);
      if (isNaN(month)) {
        if (mStr.includes('jan')) month = 1;
        else if (mStr.includes('feb')) month = 2;
        else if (mStr.includes('mar')) month = 3;
        else if (mStr.includes('apr')) month = 4;
        else if (mStr.includes('mei') || mStr.includes('may')) month = 5;
        else if (mStr.includes('jun')) month = 6;
        else if (mStr.includes('jul')) month = 7;
        else if (mStr.includes('agu') || mStr.includes('aug')) month = 8;
        else if (mStr.includes('sep')) month = 9;
        else if (mStr.includes('okt') || mStr.includes('oct')) month = 10;
        else if (mStr.includes('nov')) month = 11;
        else if (mStr.includes('des') || mStr.includes('dec')) month = 12;
      }
      if (day && month && year && !isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return { ymd: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, year, month, day };
      }
    }
    return null;
  };

  const formatTanggalIndo = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const parsed = parseIndoOrExcelDate(dateVal);
      if (parsed) {
        const d = new Date(parsed.year, parsed.month - 1, parsed.day);
        return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
      }
      return String(dateVal);
    } catch (e) {
      return String(dateVal);
    }
  };

  const cleanKey = (str) => {
    return String(str || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  // Helper auto-match header
  const findBestHeaderMatch = (headers, keywords) => {
    const lowerHeaders = headers.map(h => String(h || '').toLowerCase().trim());
    for (const kw of keywords) {
      const idx = lowerHeaders.findIndex(h => h.includes(kw));
      if (idx !== -1) return headers[idx];
    }
    return '';
  };

  // Handle Excel File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileName(file.name);
      addLog(`Membaca file: ${file.name}...`);
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const sheets = wb.worksheets.map(ws => ws.name);
      setWorkbook(wb);
      setSheetNames(sheets);
      addLog(`File berhasil dibaca. Terdapat ${sheets.length} sheet: ${sheets.join(', ')}`);

      // Auto detect sheets
      let autoPenyewa = sheets.find(s => /penyewa|sewa|booking|pesanan|reservasi/i.test(s)) || sheets[0] || '';
      let autoBayar = sheets.find(s => /bayar|lunas|transfer|rekap|pembayaran/i.test(s)) || sheets[0] || '';

      if (migrationMode === 'payment_only') {
        setSelectedBayarSheet(autoBayar);
        loadSheetHeaders(wb, '', autoBayar);
      } else {
        setSelectedPenyewaSheet(autoPenyewa);
        setSelectedBayarSheet(autoBayar !== autoPenyewa ? autoBayar : (sheets[1] || ''));
        loadSheetHeaders(wb, autoPenyewa, autoBayar !== autoPenyewa ? autoBayar : (sheets[1] || ''));
      }

      setActiveStep(2);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel: ' + err.message);
    }
  };

  const loadSheetHeaders = (wb, pSheetName, bSheetName) => {
    let pHeaders = [];
    let bHeaders = [];

    if (pSheetName) {
      const wsP = wb.getWorksheet(pSheetName);
      if (wsP && wsP.rowCount > 0) {
        const row1 = wsP.getRow(1);
        pHeaders = row1.values.slice(1).map(v => getCellValue(v)).filter(v => v !== '');
        setPenyewaHeaders(pHeaders);

        setPenyewaColMap({
          idSewa: findBestHeaderMatch(pHeaders, ['id_sewa', 'id sewa', 'id', 'kode', 'no. sewa', 'no sewa']),
          tanggalSewa: findBestHeaderMatch(pHeaders, ['tanggal_sewa', 'tanggal sewa', 'tgl sewa', 'tgl', 'tanggal', 'kunjungan']),
          lokasiSewa: findBestHeaderMatch(pHeaders, ['lokasi_sewa', 'lokasi', 'tempat', 'fasilitas', 'area']),
          namaPenyewa: findBestHeaderMatch(pHeaders, ['nama_penyewa', 'nama penyewa', 'nama', 'instansi', 'penyewa', 'rombongan']),
          noHp: findBestHeaderMatch(pHeaders, ['no.hp', 'no hp', 'hp', 'telepon', 'telp', 'wa']),
          keterangan: findBestHeaderMatch(pHeaders, ['keterangan', 'ket', 'keperluan', 'catatan']),
          pic: findBestHeaderMatch(pHeaders, ['pic', 'petugas', 'admin', 'operator']),
          luasLahan: findBestHeaderMatch(pHeaders, ['luas', 'lahan', 'm2']),
          biaya: findBestHeaderMatch(pHeaders, ['biaya', 'total', 'tarif', 'harga'])
        });
      }
    }

    if (bSheetName) {
      const wsB = wb.getWorksheet(bSheetName);
      if (wsB && wsB.rowCount > 0) {
        const row1 = wsB.getRow(1);
        bHeaders = row1.values.slice(1).map(v => getCellValue(v)).filter(v => v !== '');
        setBayarHeaders(bHeaders);

        setBayarColMap({
          idSewa: findBestHeaderMatch(bHeaders, ['id_sewa', 'id sewa', 'id', 'ref', 'no ref', 'kode', 'booking', 'nomor']),
          tanggalBayar: findBestHeaderMatch(bHeaders, ['tanggal', 'tgl', 'transfer', 'bayar', 'tgl transfer']),
          nominal: findBestHeaderMatch(bHeaders, ['nominal', 'jumlah', 'total', 'biaya', 'rp', 'bayar', 'uang']),
          namaPengirim: findBestHeaderMatch(bHeaders, ['nama', 'pengirim', 'penyewa', 'atas nama', 'nama penyewa']),
          keterangan: findBestHeaderMatch(bHeaders, ['keterangan', 'ket', 'bank', 'channel'])
        });
      }
    }
  };

  // Perform Analysis & Smart Matching for Mode 1 (Full 2 Sheets)
  const analyzeAndReconcile = () => {
    if (!workbook || !selectedPenyewaSheet) {
      alert('Pilih sheet data penyewa terlebih dahulu!');
      return;
    }

    addLog('Memulai rekonsiliasi data 2 sheet...');
    const wsP = workbook.getWorksheet(selectedPenyewaSheet);
    const wsB = selectedBayarSheet ? workbook.getWorksheet(selectedBayarSheet) : null;

    const paidMapById = new Map();
    const paidMapByNameDate = new Map();

    if (wsB) {
      const bRow1 = wsB.getRow(1).values.slice(1).map(v => getCellValue(v));
      const idIdx = bRow1.indexOf(bayarColMap.idSewa) + 1;
      const tglIdx = bRow1.indexOf(bayarColMap.tanggalBayar) + 1;
      const nomIdx = bRow1.indexOf(bayarColMap.nominal) + 1;
      const namaIdx = bRow1.indexOf(bayarColMap.namaPengirim) + 1;

      wsB.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const rawId = idIdx > 0 ? getCellValue(row.getCell(idIdx)) : '';
        const rawTgl = tglIdx > 0 ? getCellValue(row.getCell(tglIdx)) : '';
        const rawNom = nomIdx > 0 ? getCellValue(row.getCell(nomIdx)) : '';
        const rawNama = namaIdx > 0 ? getCellValue(row.getCell(namaIdx)) : '';

        const cleanIdVal = cleanKey(rawId);
        const parsedTgl = parseIndoOrExcelDate(rawTgl);
        const nomNumeric = parseInt(String(rawNom).replace(/\D/g, ''), 10) || 0;

        const paymentInfo = {
          rawId,
          tanggalTransfer: parsedTgl ? parsedTgl.ymd : (String(rawTgl) || null),
          nominal: nomNumeric,
          namaPengirim: rawNama
        };

        if (cleanIdVal) {
          paidMapById.set(cleanIdVal, paymentInfo);
        }
        if (rawNama && parsedTgl) {
          const nameDateKey = `${cleanKey(rawNama)}_${parsedTgl.ymd}`;
          paidMapByNameDate.set(nameDateKey, paymentInfo);
        }
      });
      addLog(`Sheet Pembayaran berhasil dipetakan: ${paidMapById.size} data pembayaran teridentifikasi.`);
    }

    // Process Sheet Penyewa
    const pRow1 = wsP.getRow(1).values.slice(1).map(v => getCellValue(v));
    const pIdIdx = pRow1.indexOf(penyewaColMap.idSewa) + 1;
    const pTglIdx = pRow1.indexOf(penyewaColMap.tanggalSewa) + 1;
    const pLokIdx = pRow1.indexOf(penyewaColMap.lokasiSewa) + 1;
    const pNamaIdx = pRow1.indexOf(penyewaColMap.namaPenyewa) + 1;
    const pHpIdx = pRow1.indexOf(penyewaColMap.noHp) + 1;
    const pKetIdx = pRow1.indexOf(penyewaColMap.keterangan) + 1;
    const pPicIdx = pRow1.indexOf(penyewaColMap.pic) + 1;
    const pLuasIdx = pRow1.indexOf(penyewaColMap.luasLahan) + 1;
    const pBiayaIdx = pRow1.indexOf(penyewaColMap.biaya) + 1;

    const list = [];
    let countPaid = 0;
    let countUnpaid = 0;

    wsP.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rawId = pIdIdx > 0 ? getCellValue(row.getCell(pIdIdx)) : '';
      const rawTgl = pTglIdx > 0 ? getCellValue(row.getCell(pTglIdx)) : '';
      const lokasi = pLokIdx > 0 ? getCellValue(row.getCell(pLokIdx)) : '';
      const nama = pNamaIdx > 0 ? getCellValue(row.getCell(pNamaIdx)) : '';
      const hp = pHpIdx > 0 ? getCellValue(row.getCell(pHpIdx)) : '-';
      const ket = pKetIdx > 0 ? getCellValue(row.getCell(pKetIdx)) : '';
      const pic = pPicIdx > 0 ? getCellValue(row.getCell(pPicIdx)) : '';
      const luasStr = pLuasIdx > 0 ? getCellValue(row.getCell(pLuasIdx)) : '';
      const biayaStr = pBiayaIdx > 0 ? getCellValue(row.getCell(pBiayaIdx)) : '';

      if (!nama && !lokasi && !rawTgl) return;

      const parsedTgl = parseIndoOrExcelDate(rawTgl);
      let formattedDate = '';
      let year = 2025;
      if (parsedTgl) {
        formattedDate = parsedTgl.ymd;
        year = parsedTgl.year;
      } else if (rawTgl) {
        const fallbackD = new Date(rawTgl);
        if (!isNaN(fallbackD.getTime())) {
          const y = fallbackD.getFullYear();
          const m = String(fallbackD.getMonth() + 1).padStart(2, '0');
          const d = String(fallbackD.getDate()).padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
          year = y;
        } else {
          formattedDate = String(rawTgl).trim();
        }
      }

      // Hitung Biaya Dasar
      const isLapangan = String(lokasi).toLowerCase().includes('lap');
      const luas = isLapangan ? (parseInt(luasStr, 10) || 50) : null;
      let calculatedBiaya = 250000;
      if (lokasi === 'PENDOPO TSA 1') calculatedBiaya = 500000;
      else if (lokasi === 'AULA SERBAGUNA') calculatedBiaya = 2000000;
      else if (isLapangan) calculatedBiaya = (luas || 50) * 2000;

      const userBiaya = parseInt(String(biayaStr).replace(/\D/g, ''), 10);
      const finalBiaya = (!isNaN(userBiaya) && userBiaya > 0) ? userBiaya : calculatedBiaya;

      // Matching check
      const cleanIdVal = cleanKey(rawId);
      const nameDateKey = parsedTgl ? `${cleanKey(nama)}_${parsedTgl.ymd}` : '';
      
      let match = null;
      let matchMethod = '';

      if (cleanIdVal && paidMapById.has(cleanIdVal)) {
        match = paidMapById.get(cleanIdVal);
        matchMethod = 'ID Sewa';
      } else if (nameDateKey && paidMapByNameDate.has(nameDateKey)) {
        match = paidMapByNameDate.get(nameDateKey);
        matchMethod = 'Nama & Tanggal';
      }

      const isPaid = !!match;
      if (isPaid) countPaid++;
      else countUnpaid++;

      const finalId = rawId || `TMR-${Math.floor(Math.random() * 90000) + 10000}`;

      list.push({
        id_sewa: finalId,
        tanggal_sewa: formattedDate,
        year: year,
        lokasi_sewa: lokasi || 'Lokasi Sewa',
        nama_penyewa: nama || 'Penyewa',
        pic_rombongan: nama || 'Penyewa',
        no_hp_penyewa: hp || '-',
        pic_kantor: pic || '',
        keterangan: ket || '',
        status_pembayaran: isPaid ? 'Sudah Transfer' : 'Belum Transfer',
        tanggal_booking: new Date().toLocaleString('id-ID'),
        tanggal_transfer: match?.tanggalTransfer || (isPaid ? formattedDate : null),
        bukti_transfer: isPaid ? 'migrasi_data_spreadsheet' : null,
        bukti_transfer_listrik: null,
        ocr_data: null,
        history_reschedule: [],
        listrik_tambahan: String(ket).toLowerCase().includes('listrik') || String(ket).toLowerCase().includes('tenda'),
        akses_upload_listrik: false,
        luas_lahan: luas,
        total_biaya: match?.nominal && match.nominal > 0 ? match.nominal : finalBiaya,
        isPaid,
        matchMethod,
        rowNumber
      });
    });

    setReconciledData(list);
    addLog(`Rekonsiliasi Selesai! Total ${list.length} data: ${countPaid} Sudah Bayar (Lunas), ${countUnpaid} Belum Bayar.`);
  };

  // Perform Analysis for Mode 2 (Payment Only against Database)
  const analyzePaymentOnlyAgainstDB = async () => {
    if (!workbook || !selectedBayarSheet) {
      alert('Pilih sheet data pembayaran terlebih dahulu!');
      return;
    }
    const wsB = workbook.getWorksheet(selectedBayarSheet);
    if (!wsB) {
      alert('Sheet pembayaran tidak ditemukan!');
      return;
    }

    const bRow1 = wsB.getRow(1).values.slice(1).map(v => getCellValue(v));
    const idIdx = bRow1.indexOf(bayarColMap.idSewa) + 1;
    const tglIdx = bRow1.indexOf(bayarColMap.tanggalBayar) + 1;
    const nomIdx = bRow1.indexOf(bayarColMap.nominal) + 1;
    const namaIdx = bRow1.indexOf(bayarColMap.namaPengirim) + 1;

    if (idIdx <= 0) {
      alert('Mohon pilih kolom ID Sewa / No. Booking terlebih dahulu!');
      return;
    }

    setIsProcessing(true);
    addLog('Mengambil data sewaList dari database Firebase untuk pencocokan ID Sewa...');

    try {
      const snap = await getDocs(collection(db, 'sewaList'));
      const dbMapById = new Map();
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.id_sewa) {
          dbMapById.set(cleanKey(data.id_sewa), { docId: d.id, ...data });
        }
      });
      addLog(`Terkoneksi ke database. Memeriksa kecocokan ID Sewa dengan ${snap.size} data di sistem...`);

      const results = [];
      wsB.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rawId = idIdx > 0 ? getCellValue(row.getCell(idIdx)) : '';
        const rawTgl = tglIdx > 0 ? getCellValue(row.getCell(tglIdx)) : '';
        const rawNom = nomIdx > 0 ? getCellValue(row.getCell(nomIdx)) : '';
        const rawNama = namaIdx > 0 ? getCellValue(row.getCell(namaIdx)) : '';

        if (!rawId && !rawNama && !rawNom) return;

        const cleanId = cleanKey(rawId);
        const parsedTgl = parseIndoOrExcelDate(rawTgl);
        const nomNumeric = parseInt(String(rawNom).replace(/\D/g, ''), 10) || 0;

        const dbMatch = cleanId ? dbMapById.get(cleanId) : null;

        if (dbMatch) {
          const isAlreadyPaid = ['Sudah Transfer', 'Lunas', 'Sudah Lunas'].includes(dbMatch.status_pembayaran);
          results.push({
            status: isAlreadyPaid ? 'already_paid' : 'ready_update',
            id_sewa: rawId || dbMatch.id_sewa,
            docId: dbMatch.docId,
            nama_penyewa: dbMatch.nama_penyewa,
            tanggal_sewa: dbMatch.tanggal_sewa,
            lokasi_sewa: dbMatch.lokasi_sewa,
            status_lama: dbMatch.status_pembayaran || 'Belum Transfer',
            status_baru: 'Sudah Transfer',
            nominal_excel: nomNumeric > 0 ? nomNumeric : (dbMatch.total_biaya || 0),
            tanggal_bayar_excel: parsedTgl ? parsedTgl.ymd : (String(rawTgl) || ''),
            nama_pengirim_excel: rawNama
          });
        } else {
          results.push({
            status: 'not_found',
            id_sewa: rawId || '-',
            docId: null,
            nama_penyewa: rawNama || '-',
            tanggal_sewa: parsedTgl ? parsedTgl.ymd : (String(rawTgl) || '-'),
            lokasi_sewa: '-',
            status_lama: 'Tidak Ada di DB',
            status_baru: '-',
            nominal_excel: nomNumeric,
            tanggal_bayar_excel: parsedTgl ? parsedTgl.ymd : (String(rawTgl) || ''),
            nama_pengirim_excel: rawNama
          });
        }
      });

      setPaymentOnlyData(results);
      const readyCount = results.filter(r => r.status === 'ready_update').length;
      const alreadyCount = results.filter(r => r.status === 'already_paid').length;
      const notFoundCount = results.filter(r => r.status === 'not_found').length;

      addLog(`Pencocokan selesai: Total ${results.length} data. Siap diupdate: ${readyCount}, Sudah lunas: ${alreadyCount}, Tidak ditemukan: ${notFoundCount}`);
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message}`);
      alert(`Gagal mencocokkan data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered preview data for Mode 1
  const filteredPreview = useMemo(() => {
    return reconciledData.filter(item => {
      if (onlyYear2025 && item.year < 2025) return false;
      if (filterTab === 'paid' && !item.isPaid) return false;
      if (filterTab === 'unpaid' && item.isPaid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mNama = (item.nama_penyewa || '').toLowerCase().includes(q);
        const mId = (item.id_sewa || '').toLowerCase().includes(q);
        const mLok = (item.lokasi_sewa || '').toLowerCase().includes(q);
        if (!mNama && !mId && !mLok) return false;
      }
      return true;
    });
  }, [reconciledData, filterTab, searchQuery, onlyYear2025]);

  const stats = useMemo(() => {
    const targetData = onlyYear2025 ? reconciledData.filter(d => d.year >= 2025) : reconciledData;
    const paid = targetData.filter(d => d.isPaid).length;
    const unpaid = targetData.filter(d => !d.isPaid).length;
    return {
      total: targetData.length,
      paid,
      unpaid
    };
  }, [reconciledData, onlyYear2025]);

  // Filtered preview data for Mode 2
  const filteredPaymentPreview = useMemo(() => {
    return paymentOnlyData.filter(item => {
      if (filterPaymentTab === 'ready' && item.status !== 'ready_update') return false;
      if (filterPaymentTab === 'already_paid' && item.status !== 'already_paid') return false;
      if (filterPaymentTab === 'not_found' && item.status !== 'not_found') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mNama = (item.nama_penyewa || '').toLowerCase().includes(q);
        const mId = (item.id_sewa || '').toLowerCase().includes(q);
        const mLok = (item.lokasi_sewa || '').toLowerCase().includes(q);
        if (!mNama && !mId && !mLok) return false;
      }
      return true;
    });
  }, [paymentOnlyData, filterPaymentTab, searchQuery]);

  const paymentStats = useMemo(() => {
    return {
      total: paymentOnlyData.length,
      ready: paymentOnlyData.filter(r => r.status === 'ready_update').length,
      alreadyPaid: paymentOnlyData.filter(r => r.status === 'already_paid').length,
      notFound: paymentOnlyData.filter(r => r.status === 'not_found').length
    };
  }, [paymentOnlyData]);

  // Execution: Update Payment Only to Firestore
  const handleExecutePaymentUpdate = async () => {
    const readyItems = paymentOnlyData.filter(r => r.status === 'ready_update');
    if (readyItems.length === 0) {
      alert('Tidak ada data yang perlu diupdate (semua sudah berstatus bayar atau tidak ditemukan di database).');
      return;
    }

    if (!window.confirm(`Konfirmasi Update Pembayaran:\nSebanyak ${readyItems.length} data penyewa di database akan diubah statusnya menjadi "Sudah Transfer". Lanjutkan?`)) return;

    setIsProcessing(true);
    setProgress(0);
    addLog(`Memulai pembaruan ${readyItems.length} data pembayaran di database...`);

    let updatedCount = 0;
    try {
      const BATCH_SIZE = 150;
      for (let i = 0; i < readyItems.length; i += BATCH_SIZE) {
        const chunk = readyItems.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          const sewaRef = doc(db, 'sewaList', item.docId);
          const updatePayload = {
            status_pembayaran: 'Sudah Transfer'
          };
          if (item.tanggal_bayar_excel) updatePayload.tanggal_transfer = item.tanggal_bayar_excel;
          if (item.nominal_excel > 0) updatePayload.total_biaya = item.nominal_excel;
          batch.update(sewaRef, updatePayload);

          const pubRef = doc(db, 'publicSewaList', item.docId);
          const pubPayload = {
            status_pembayaran: 'Sudah Transfer'
          };
          if (item.tanggal_bayar_excel) pubPayload.tanggal_transfer = item.tanggal_bayar_excel;
          batch.update(pubRef, pubPayload);
        });

        await batch.commit();
        updatedCount += chunk.length;
        const pct = Math.round((updatedCount / readyItems.length) * 100);
        setProgress(pct);
        addLog(`Progres update: ${updatedCount}/${readyItems.length} (${pct}%)`);
        await new Promise(r => setTimeout(r, 60));
      }

      addLog(`UPDATE PEMBAYARAN SELESAI! ${updatedCount} data berhasil diubah menjadi Sudah Transfer.`);
      alert(`Berhasil memperbarui ${updatedCount} data penyewa menjadi Sudah Transfer!`);
      
      setPaymentOnlyData(prev => prev.map(r => r.status === 'ready_update' ? { ...r, status: 'already_paid', status_lama: 'Sudah Transfer' } : r));
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message}`);
      alert(`Terjadi kesalahan saat update pembayaran: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset all existing rentals in DB to 'Belum Transfer'
  const handleResetAllToUnpaid = async () => {
    const confirmation = window.prompt(
      '⚠️ PERINGATAN RESET STATUS PEMBAYARAN:\\n\\n' +
      'Tindakan ini akan mengubah SEMUA status pembayaran data sewa (kecuali yang Dibatalkan / Ditutup) menjadi "Belum Transfer" di database sistem.\\n\\n' +
      'Gunakan ini jika ingin memulai ulang agar hanya data dari Excel pembayaran Anda yang berstatus Lunas / Sudah Transfer.\\n\\n' +
      'Ketik "RESET" untuk mengonfirmasi:'
    );

    if (confirmation !== 'RESET') {
      if (confirmation !== null) alert('Reset dibatalkan. Konfirmasi tidak sesuai.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    addLog('Memulai reset status pembayaran semua data sewa menjadi "Belum Transfer"...');

    try {
      const snap = await getDocs(collection(db, 'sewaList'));
      const docsToReset = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.status_pembayaran !== 'Batal' && data.status_pembayaran !== 'Ditutup') {
          if (data.status_pembayaran !== 'Belum Transfer') {
            docsToReset.push({ id: d.id, id_sewa: data.id_sewa });
          }
        }
      });

      if (docsToReset.length === 0) {
        addLog('Semua data sewa saat ini sudah berstatus "Belum Transfer". Tidak ada yang perlu direset.');
        alert('Semua data sewa di database saat ini sudah berstatus "Belum Transfer".');
        setIsProcessing(false);
        return;
      }

      addLog(`Ditemukan ${docsToReset.length} data yang akan direset ke 'Belum Transfer'. Menulis ke database...`);
      const BATCH_SIZE = 150;
      for (let i = 0; i < docsToReset.length; i += BATCH_SIZE) {
        const chunk = docsToReset.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          batch.update(doc(db, 'sewaList', item.id), {
            status_pembayaran: 'Belum Transfer',
            tanggal_transfer: null,
            bukti_transfer: null
          });
          batch.update(doc(db, 'publicSewaList', item.id), {
            status_pembayaran: 'Belum Transfer',
            tanggal_transfer: null
          });
        });

        await batch.commit();
        const currentProcessed = Math.min(i + BATCH_SIZE, docsToReset.length);
        const pct = Math.round((currentProcessed / docsToReset.length) * 100);
        setProgress(pct);
        addLog(`Progress reset: ${currentProcessed}/${docsToReset.length} (${pct}%)`);
        await new Promise(r => setTimeout(r, 60));
      }

      addLog(`RESET SELESAI! ${docsToReset.length} data kini berstatus 'Belum Transfer'.`);
      alert(`Berhasil mereset ${docsToReset.length} data sewa menjadi "Belum Transfer"! Silakan lanjutkan pencocokan dengan Excel pembayaran.`);
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message}`);
      alert(`Gagal mereset data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fix existing dates in database
  const handleFixExistingDatesInDB = async () => {
    if (!window.confirm("Fitur ini akan merapikan format tanggal (GMT/Panjang) pada data sewaList yang sudah ada di database menjadi format standar YYYY-MM-DD. Lanjutkan?")) return;
    setIsProcessing(true);
    addLog("Merapikan format tanggal pada data yang ada di database...");
    try {
      const snap = await getDocs(collection(db, 'sewaList'));
      let fixedCount = 0;
      for (const d of snap.docs) {
        const data = d.data();
        const rawDate = data.tanggal_sewa;
        if (typeof rawDate === 'string' && (rawDate.includes('GMT') || rawDate.length > 15)) {
          const parsed = parseIndoOrExcelDate(rawDate);
          if (parsed && parsed.ymd) {
            await setDoc(doc(db, 'sewaList', d.id), { tanggal_sewa: parsed.ymd }, { merge: true });
            fixedCount++;
          }
        }
      }
      addLog(`Selesai! Berhasil merapikan ${fixedCount} data tanggal di database.`);
      alert(`Berhasil merapikan ${fixedCount} data tanggal di database!`);
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execution: Full Migration (Mode 1)
  const handleExecuteMigration = async () => {
    const dataToMigrate = onlyYear2025 ? reconciledData.filter(d => d.year >= 2025) : reconciledData;
    if (dataToMigrate.length === 0) {
      alert('Tidak ada data untuk dimigrasikan!');
      return;
    }

    const confirmMsg = `Konfirmasi Migrasi Data:\n- Total data yang akan diproses: ${dataToMigrate.length}\n- Sudah Bayar: ${stats.paid}\n- Belum Bayar: ${stats.unpaid}\n\nLanjutkan migrasi ke database?`;
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    setProgress(0);
    addLog(`Memulai persiapan migrasi ${dataToMigrate.length} data...`);

    let countAdded = 0;
    let countUpdated = 0;
    let countSkipped = 0;

    try {
      addLog(`Mengambil snapshot data sewaList dari Firebase untuk verifikasi duplikat...`);
      const existingSnap = await getDocs(collection(db, 'sewaList'));
      const existingById = new Map();
      const existingByKey = new Map();

      existingSnap.docs.forEach(docSnap => {
        const d = docSnap.data();
        const docId = docSnap.id;
        if (d.id_sewa) {
          existingById.set(cleanKey(d.id_sewa), docId);
        }
        const normDate = parseIndoOrExcelDate(d.tanggal_sewa)?.ymd || String(d.tanggal_sewa || '').trim();
        const key = `${normDate}_${cleanKey(d.lokasi_sewa)}_${cleanKey(d.nama_penyewa)}`;
        existingByKey.set(key, docId);
      });
      addLog(`Database terhubung: Ditemukan ${existingSnap.size} data di database. Melanjutkan migrasi...`);

      for (let i = 0; i < dataToMigrate.length; i++) {
        const item = dataToMigrate[i];

        const cleanId = cleanKey(item.id_sewa);
        const compositeKey = `${item.tanggal_sewa}_${cleanKey(item.lokasi_sewa)}_${cleanKey(item.nama_penyewa)}`;
        const existingDocId = (cleanId && existingById.get(cleanId)) || existingByKey.get(compositeKey);

        const docPayload = {
          id_sewa: item.id_sewa,
          tanggal_sewa: item.tanggal_sewa,
          lokasi_sewa: item.lokasi_sewa,
          nama_penyewa: item.nama_penyewa,
          pic_rombongan: item.pic_rombongan,
          no_hp_penyewa: item.no_hp_penyewa,
          pic_kantor: item.pic_kantor,
          keterangan: item.keterangan,
          status_pembayaran: item.status_pembayaran,
          tanggal_booking: item.tanggal_booking,
          tanggal_transfer: item.tanggal_transfer,
          bukti_transfer: item.bukti_transfer,
          bukti_transfer_listrik: item.bukti_transfer_listrik,
          ocr_data: item.ocr_data,
          history_reschedule: item.history_reschedule,
          listrik_tambahan: item.listrik_tambahan,
          akses_upload_listrik: item.akses_upload_listrik,
          luas_lahan: item.luas_lahan,
          total_biaya: item.total_biaya,
          migratedAt: new Date().toISOString()
        };

        if (existingDocId) {
          if (skipExisting) {
            countSkipped++;
          } else {
            const targetRef = doc(db, 'sewaList', existingDocId);
            await setDoc(targetRef, {
              status_pembayaran: item.status_pembayaran,
              tanggal_transfer: item.tanggal_transfer,
              total_biaya: item.total_biaya,
              tanggal_sewa: item.tanggal_sewa
            }, { merge: true });

            await setDoc(doc(db, 'publicSewaList', existingDocId), {
              tanggal_sewa: item.tanggal_sewa,
              lokasi_sewa: item.lokasi_sewa,
              status_pembayaran: item.status_pembayaran
            }, { merge: true });

            countUpdated++;
          }
        } else {
          const newDocRef = doc(collection(db, 'sewaList'));
          await setDoc(newDocRef, docPayload);

          await setDoc(doc(db, 'publicSewaList', newDocRef.id), {
            tanggal_sewa: item.tanggal_sewa,
            lokasi_sewa: item.lokasi_sewa,
            status_pembayaran: item.status_pembayaran
          });

          if (cleanId) existingById.set(cleanId, newDocRef.id);
          existingByKey.set(compositeKey, newDocRef.id);
          countAdded++;
        }

        const pct = Math.round(((i + 1) / dataToMigrate.length) * 100);
        setProgress(pct);

        if ((i + 1) % 50 === 0 || i === dataToMigrate.length - 1) {
          addLog(`Progres: ${i + 1}/${dataToMigrate.length} data (${pct}%)`);
          await new Promise(r => setTimeout(r, 10));
        }
      }

      addLog(`MIGRASI SELESAI DENGAN SUKSES!`);
      addLog(`- Data Baru Ditambahkan: ${countAdded}`);
      addLog(`- Data Diperbarui: ${countUpdated}`);
      addLog(`- Data Dilewati (Sudah ada di database): ${countSkipped}`);

      alert(`Migrasi Berhasil Selesai!\n- Data Baru Ditambahkan: ${countAdded}\n- Data Diperbarui: ${countUpdated}\n- Data Dilewati: ${countSkipped}`);
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message}`);
      alert(`Terjadi kesalahan saat migrasi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm active:scale-95"
            title="Kembali ke Dashboard"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Database size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                Migrasi & Sinkronisasi Data Spreadsheet
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Impor data penyewa baru atau perbarui status pembayaran dari file Excel (.xlsx).
            </p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
          <span className={`px-2.5 py-1 rounded-xl ${activeStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1. Upload</span>
          <ArrowRight size={14} className="text-slate-300" />
          <span className={`px-2.5 py-1 rounded-xl ${activeStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2. Pemetaan & Analisis</span>
          <ArrowRight size={14} className="text-slate-300" />
          <span className={`px-2.5 py-1 rounded-xl ${(reconciledData.length > 0 || paymentOnlyData.length > 0) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3. Selesai</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-6 max-w-2xl">
        <button
          type="button"
          onClick={() => {
            setMigrationMode('full');
            if (workbook) loadSheetHeaders(workbook, selectedPenyewaSheet, selectedBayarSheet);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            migrationMode === 'full' 
              ? 'bg-emerald-800 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers size={16} />
          Mode 1: Migrasi Lengkap (2 Sheet: Penyewa & Bayar)
        </button>
        <button
          type="button"
          onClick={() => {
            setMigrationMode('payment_only');
            if (workbook) {
              const bSheet = selectedBayarSheet || sheetNames[0] || '';
              setSelectedBayarSheet(bSheet);
              loadSheetHeaders(workbook, '', bSheet);
            }
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            migrationMode === 'payment_only' 
              ? 'bg-emerald-800 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={16} />
          Mode 2: Update Sudah Bayar Saja (1 Sheet: Cek ID Sewa)
        </button>
      </div>

      {/* STEP 1: UPLOAD EXCEL FILE */}
      {activeStep === 1 && (
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl shadow-slate-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <FileSpreadsheet size={44} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {migrationMode === 'full' 
              ? 'Upload File Spreadsheet (2 Sheet)' 
              : 'Upload File Rekap yang Sudah Bayar (1 Sheet)'}
          </h2>
          <p className="text-slate-500 max-w-lg mb-8 text-sm leading-relaxed">
            {migrationMode === 'full' 
              ? 'Pilih file Excel yang memiliki Sheet Data Penyewa dan Sheet Data yang Sudah Bayar. Sistem akan membaca kedua sheet dan melakukan rekonsiliasi otomatis.' 
              : 'Pilih file Excel yang berisi daftar pembayaran / orang yang sudah bayar. Sistem akan membaca ID Sewa dan langsung mencocokkannya ke database untuk mengubah statusnya menjadi Sudah Transfer.'}
          </p>

          <label className="cursor-pointer group flex flex-col items-center justify-center w-full max-w-xl h-56 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-3xl transition-all duration-200">
            <Upload size={38} className="text-emerald-600 group-hover:scale-110 transition-transform mb-3" />
            <span className="font-extrabold text-emerald-950 text-base mb-1">Klik di sini untuk memilih file Excel</span>
            <span className="text-xs text-emerald-700/70 font-semibold">Mendukung format .xlsx atau .xls</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      )}

      {/* STEP 2 & 3: CONFIGURATION & PREVIEW */}
      {activeStep >= 2 && (
        <div className="space-y-8">
          {/* Panel Konfigurasi Sheet & Kolom */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Layers className="text-emerald-600" size={20} />
                  {migrationMode === 'full' 
                    ? 'Pemilihan Sheet & Pemetaan Kolom (2 Sheet)' 
                    : 'Pemetaan Kolom Data yang Sudah Bayar (1 Sheet)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  File: <strong className="text-slate-700">{fileName}</strong> — Sesuaikan sheet dan kolom yang sesuai.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                  <RefreshCw size={14} /> Ganti File Excel
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>

                {migrationMode === 'full' ? (
                  <button 
                    onClick={analyzeAndReconcile}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles size={16} /> Analisis & Cocokkan Data
                  </button>
                ) : (
                  <button 
                    onClick={analyzePaymentOnlyAgainstDB}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles size={16} /> Cek & Cocokkan ID Sewa ke Database
                  </button>
                )}
              </div>
            </div>

            {/* Form Mode 1 (Full 2 Sheets) */}
            {migrationMode === 'full' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kolom Kiri: Sheet Penyewa */}
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                      1. Sheet Data Penyewa (Reservasi)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Sheet Penyewa</label>
                    <select 
                      value={selectedPenyewaSheet}
                      onChange={e => {
                        setSelectedPenyewaSheet(e.target.value);
                        loadSheetHeaders(workbook, e.target.value, selectedBayarSheet);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    >
                      {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kolom ID Sewa *</label>
                      <select 
                        value={penyewaColMap.idSewa} 
                        onChange={e => setPenyewaColMap(prev => ({ ...prev, idSewa: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {penyewaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kolom Tanggal Sewa *</label>
                      <select 
                        value={penyewaColMap.tanggalSewa} 
                        onChange={e => setPenyewaColMap(prev => ({ ...prev, tanggalSewa: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {penyewaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kolom Lokasi Sewa *</label>
                      <select 
                        value={penyewaColMap.lokasiSewa} 
                        onChange={e => setPenyewaColMap(prev => ({ ...prev, lokasiSewa: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {penyewaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kolom Nama Penyewa *</label>
                      <select 
                        value={penyewaColMap.namaPenyewa} 
                        onChange={e => setPenyewaColMap(prev => ({ ...prev, namaPenyewa: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {penyewaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kolom No. HP</label>
                      <select 
                        value={penyewaColMap.noHp} 
                        onChange={e => setPenyewaColMap(prev => ({ ...prev, noHp: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {penyewaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kolom Keterangan</label>
                      <select 
                        value={penyewaColMap.keterangan} 
                        onChange={e => setPenyewaColMap(prev => ({ ...prev, keterangan: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {penyewaHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Sheet Sudah Bayar */}
                <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-teal-950 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-teal-600 rounded-full"></span>
                      2. Sheet Data yang Sudah Bayar (Lunas)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Sheet Sudah Bayar</label>
                    <select 
                      value={selectedBayarSheet}
                      onChange={e => {
                        setSelectedBayarSheet(e.target.value);
                        loadSheetHeaders(workbook, selectedPenyewaSheet, e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="">-- Tidak Ada (Anggap Semua Belum Bayar) --</option>
                      {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID Sewa (Kunci Matching) *</label>
                      <select 
                        value={bayarColMap.idSewa} 
                        onChange={e => setBayarColMap(prev => ({ ...prev, idSewa: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal Transfer</label>
                      <select 
                        value={bayarColMap.tanggalBayar} 
                        onChange={e => setBayarColMap(prev => ({ ...prev, tanggalBayar: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal Transfer</label>
                      <select 
                        value={bayarColMap.nominal} 
                        onChange={e => setBayarColMap(prev => ({ ...prev, nominal: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Pengirim (Opsional)</label>
                      <select 
                        value={bayarColMap.namaPengirim} 
                        onChange={e => setBayarColMap(prev => ({ ...prev, namaPengirim: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Mode 2 (Payment Only 1 Sheet) */}
            {migrationMode === 'payment_only' && (
              <div className="p-6 bg-teal-50/40 rounded-2xl border border-teal-100 max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-teal-200/50">
                  <h4 className="font-extrabold text-sm text-teal-950 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-700" />
                    Pilih Sheet dan Kolom Pembayaran
                  </h4>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Mode Update DB</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">1. Pilih Sheet Data yang Sudah Bayar</label>
                  <select 
                    value={selectedBayarSheet}
                    onChange={e => {
                      setSelectedBayarSheet(e.target.value);
                      loadSheetHeaders(workbook, '', e.target.value);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                      2. Kolom ID Sewa / No. Booking *
                    </label>
                    <select 
                      value={bayarColMap.idSewa} 
                      onChange={e => setBayarColMap(prev => ({ ...prev, idSewa: e.target.value }))}
                      className="w-full bg-white border border-emerald-400 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    >
                      <option value="">-- Pilih Kolom ID Sewa --</option>
                      {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Kunci untuk mencari data di database.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                      3. Kolom Tanggal Transfer
                    </label>
                    <select 
                      value={bayarColMap.tanggalBayar} 
                      onChange={e => setBayarColMap(prev => ({ ...prev, tanggalBayar: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Kolom Tanggal (Opsional) --</option>
                      {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                      4. Kolom Nominal / Jumlah Transfer
                    </label>
                    <select 
                      value={bayarColMap.nominal} 
                      onChange={e => setBayarColMap(prev => ({ ...prev, nominal: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Kolom Nominal (Opsional) --</option>
                      {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                      5. Kolom Nama Pengirim / Rekening
                    </label>
                    <select 
                      value={bayarColMap.namaPengirim} 
                      onChange={e => setBayarColMap(prev => ({ ...prev, namaPengirim: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Kolom Nama (Opsional) --</option>
                      {bayarHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {/* Mode 2 Action Buttons & Information */}
                <div className="pt-4 border-t border-teal-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetAllToUnpaid}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    title="Reset semua status sewa di database menjadi Belum Transfer"
                  >
                    <RotateCcw size={14} />
                    Reset Semua Status ke Belum Bayar
                  </button>

                  <button
                    type="button"
                    onClick={analyzePaymentOnlyAgainstDB}
                    disabled={isProcessing || !bayarColMap.idSewa}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    Cek & Cocokkan ID Sewa ke Database
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Kondisi Saat Ini:</strong> Semua data sewa di database telah diset ke status <strong>Belum Bayar</strong>. Ketika Anda mengupload file Excel pembayaran dan mengklik tombol <em>"Cek & Cocokkan ID Sewa ke Database"</em>, sistem akan memvalidasi ID Sewa dan mengubah hanya data yang cocok menjadi <strong>Sudah Transfer</strong>.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MODE 1 PREVIEW: HASIL REKONSILIASI 2 SHEET */}
          {migrationMode === 'full' && reconciledData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Data Penyewa</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-slate-200/60 rounded-xl text-slate-700 font-bold">
                    <Database size={24} />
                  </div>
                </div>

                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase">Sudah Bayar (Lunas)</p>
                    <p className="text-3xl font-black text-emerald-800 mt-1">{stats.paid}</p>
                  </div>
                  <div className="p-3 bg-emerald-200 text-emerald-800 rounded-xl font-bold">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-700 uppercase">Belum Bayar</p>
                    <p className="text-3xl font-black text-rose-800 mt-1">{stats.unpaid}</p>
                  </div>
                  <div className="p-3 bg-rose-200 text-rose-800 rounded-xl font-bold">
                    <AlertCircle size={24} />
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setFilterTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Semua ({stats.total})
                  </button>
                  <button 
                    onClick={() => setFilterTab('paid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterTab === 'paid' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    <CheckCircle2 size={14} /> Sudah Bayar ({stats.paid})
                  </button>
                  <button 
                    onClick={() => setFilterTab('unpaid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterTab === 'unpaid' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                  >
                    <AlertCircle size={14} /> Belum Bayar ({stats.unpaid})
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={onlyYear2025} 
                      onChange={e => setOnlyYear2025(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    Hanya data mulai 2025 ke atas
                  </label>

                  <div className="relative flex-1 sm:w-64">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari ID, nama, lokasi..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[420px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4">Status Pembayaran</th>
                      <th className="py-3 px-4">ID Sewa</th>
                      <th className="py-3 px-4">Tanggal Sewa</th>
                      <th className="py-3 px-4">Lokasi</th>
                      <th className="py-3 px-4">Nama Penyewa</th>
                      <th className="py-3 px-4">No. HP</th>
                      <th className="py-3 px-4 text-right">Biaya / Transfer</th>
                      <th className="py-3 px-4">Metode Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreview.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          Tidak ada data yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4">
                            {item.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                <CheckCircle2 size={12} /> SUDAH BAYAR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                <AlertCircle size={12} /> BELUM BAYAR
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{item.id_sewa}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-700">{formatTanggalIndo(item.tanggal_sewa)}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{item.lokasi_sewa}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{item.nama_penyewa}</td>
                          <td className="py-2.5 px-4 text-slate-600">{item.no_hp_penyewa}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                            Rp {new Intl.NumberFormat('id-ID').format(item.total_biaya)}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-500">
                            {item.isPaid ? `Cocok via ${item.matchMethod}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Execution Section */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={skipExisting} 
                      onChange={e => setSkipExisting(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4"
                    />
                    Lewati jika data dengan tanggal, lokasi & nama sudah ada di database (Mencegah duplikat)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Data akan dimasukkan ke koleksi <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-700">sewaList</code> Firebase dengan status pembayaran yang sesuai.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={handleFixExistingDatesInDB}
                    disabled={isProcessing}
                    className="px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    title="Rapikan data yang sudah sempat termigrasi sebelumnya dengan format tanggal panjang"
                  >
                    <RefreshCw size={14} />
                    Rapikan Tanggal di Database
                  </button>

                  <button 
                    type="button"
                    onClick={handleExecuteMigration}
                    disabled={isProcessing || filteredPreview.length === 0}
                    className="w-full md:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Memproses Migrasi ({progress}%)...
                      </>
                    ) : (
                      <>
                        <Database size={18} />
                        Migrasikan {filteredPreview.length} Data ke Sistem
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isProcessing && (
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-3 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2 PREVIEW: HASIL PENCOCOKAN ID SEWA KE DATABASE */}
          {migrationMode === 'payment_only' && paymentOnlyData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
              {/* KPI Cards Mode 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Data di Excel</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{paymentStats.total}</p>
                  </div>
                  <div className="p-3 bg-slate-200/60 rounded-xl text-slate-700 font-bold">
                    <FileSpreadsheet size={24} />
                  </div>
                </div>

                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase">Siap Diupdate</p>
                    <p className="text-3xl font-black text-emerald-800 mt-1">{paymentStats.ready}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Belum Bayar → Sudah Transfer</p>
                  </div>
                  <div className="p-3 bg-emerald-200 text-emerald-800 rounded-xl font-bold">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase">Sudah Lunas</p>
                    <p className="text-3xl font-black text-blue-800 mt-1">{paymentStats.alreadyPaid}</p>
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Sudah Transfer sebelumnya</p>
                  </div>
                  <div className="p-3 bg-blue-200 text-blue-800 rounded-xl font-bold">
                    <Check size={24} />
                  </div>
                </div>

                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-700 uppercase">Tidak Ditemukan di DB</p>
                    <p className="text-3xl font-black text-rose-800 mt-1">{paymentStats.notFound}</p>
                    <p className="text-[10px] text-rose-600 font-semibold mt-0.5">ID Sewa tidak terdaftar</p>
                  </div>
                  <div className="p-3 bg-rose-200 text-rose-800 rounded-xl font-bold">
                    <AlertCircle size={24} />
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search Bar Mode 2 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setFilterPaymentTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterPaymentTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Semua ({paymentStats.total})
                  </button>
                  <button 
                    onClick={() => setFilterPaymentTab('ready')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterPaymentTab === 'ready' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    <CheckCircle2 size={14} /> Siap Diupdate ({paymentStats.ready})
                  </button>
                  <button 
                    onClick={() => setFilterPaymentTab('already_paid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterPaymentTab === 'already_paid' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  >
                    <Check size={14} /> Sudah Lunas ({paymentStats.alreadyPaid})
                  </button>
                  <button 
                    onClick={() => setFilterPaymentTab('not_found')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterPaymentTab === 'not_found' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                  >
                    <AlertCircle size={14} /> Tidak Ditemukan ({paymentStats.notFound})
                  </button>
                </div>

                <div className="relative flex-1 sm:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari ID Sewa atau nama..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Table Preview Mode 2 */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[420px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4">Status Pencocokan</th>
                      <th className="py-3 px-4">ID Sewa (Excel)</th>
                      <th className="py-3 px-4">Nama Penyewa di DB</th>
                      <th className="py-3 px-4">Tanggal Sewa di DB</th>
                      <th className="py-3 px-4">Lokasi di DB</th>
                      <th className="py-3 px-4">Status Saat Ini</th>
                      <th className="py-3 px-4">Status Baru</th>
                      <th className="py-3 px-4 text-right">Nominal (Excel)</th>
                      <th className="py-3 px-4">Tgl Transfer (Excel)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPaymentPreview.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                          Tidak ada data yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPaymentPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4">
                            {item.status === 'ready_update' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                <CheckCircle2 size={12} /> SIAP DIUPDATE
                              </span>
                            )}
                            {item.status === 'already_paid' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                                <Check size={12} /> SUDAH LUNAS
                              </span>
                            )}
                            {item.status === 'not_found' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                <AlertCircle size={12} /> TIDAK ADA DI DB
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{item.id_sewa}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{item.nama_penyewa}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-700">{formatTanggalIndo(item.tanggal_sewa)}</td>
                          <td className="py-2.5 px-4 text-slate-800 font-semibold">{item.lokasi_sewa}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status_lama === 'Sudah Transfer' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {item.status_lama}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-emerald-700">
                            {item.status === 'ready_update' ? '→ Sudah Transfer' : (item.status === 'already_paid' ? 'Sudah Transfer' : '-')}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                            Rp {new Intl.NumberFormat('id-ID').format(item.nominal_excel)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 font-medium">
                            {formatTanggalIndo(item.tanggal_bayar_excel)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Execution Mode 2 */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Siap memperbarui <strong>{paymentStats.ready}</strong> data penyewa di database menjadi <span className="text-emerald-700 font-black">"Sudah Transfer"</span>.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Data yang sudah berstatus lunas sebelumnya atau tidak ditemukan tidak akan diubah.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={handleExecutePaymentUpdate}
                  disabled={isProcessing || paymentStats.ready === 0}
                  className="w-full md:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Memproses Pembaruan ({progress}%)...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Terapkan {paymentStats.ready} Data Sudah Bayar ke Database
                    </>
                  )}
                </button>
              </div>

              {isProcessing && (
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-3 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* LOG CONSOLE */}
          <div className="bg-slate-950 text-emerald-400 p-6 rounded-3xl h-64 overflow-auto font-mono text-xs shadow-inner border border-slate-800">
            <div className="font-bold text-emerald-500 mb-2 flex items-center justify-between sticky top-0 bg-slate-950 py-1">
              <span>--- LOG PROSES SISTEM ---</span>
              <span className="text-slate-500 text-[10px]">{log.length} baris log</span>
            </div>
            {log.length === 0 ? (
              <span className="opacity-40 italic">Pilih file spreadsheet di atas untuk memulai...</span>
            ) : (
              log.map((l, i) => (
                <div key={i} className="mb-1 border-b border-slate-900 pb-1 leading-relaxed">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
