import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Flag, 
  Package, 
  Settings, 
  ChevronRight, 
  Save, 
  Loader2, 
  X,
  ExternalLink,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { defaultTitikPromoList } from '../data/defaultTitikPromo';
import {
  monthNames,
  normalizeDateToYMD,
  formatShortDate,
  extractPromoDates,
  isPromoOnDate,
  getPromoRequestedTitikQty,
  hasPromoBannerOnDate,
  getPromoBannerCountOnDate,
  formatDatesSummary,
  generateDatesRange
} from '../utils/promoDateHelper';

// ALOKASI ANTI-BENTROK: 1 Titik 1 Promo per Hari
const computeAllocationForDate = (promoList, dateYMD, titikList) => {
  const allocation = {}; // titikId -> promo object
  if (!dateYMD || !promoList || promoList.length === 0 || !titikList || titikList.length === 0) {
    return { allocation };
  }

  const activePromos = promoList.filter(p => isPromoOnDate(p, dateYMD));
  if (activePromos.length === 0) {
    return { allocation };
  }

  const occupied = new Set();
  const unassigned = [];

  // Pass 1: Titik eksplisit
  activePromos.forEach(promo => {
    let explicitIds = [];
    if (promo.titikIds && Array.isArray(promo.titikIds) && promo.titikIds.length > 0) {
      explicitIds = promo.titikIds;
    } else if (promo.titikId) {
      explicitIds = [promo.titikId];
    }

    if (explicitIds.length > 0) {
      explicitIds.forEach(tId => {
        if (!occupied.has(tId)) {
          occupied.add(tId);
          allocation[tId] = promo;
        }
      });
    } else {
      unassigned.push(promo);
    }
  });

  // Pass 2: Titik dinamis non-overlapping (1 Titik 1 Promo)
  const allTitikIds = titikList.map(t => t.id);
  unassigned.forEach(promo => {
    const qty = getPromoRequestedTitikQty(promo, dateYMD);
    let count = 0;
    for (const tId of allTitikIds) {
      if (!occupied.has(tId)) {
        occupied.add(tId);
        allocation[tId] = promo;
        count++;
        if (count >= qty) break;
      }
    }
  });

  return { allocation };
};

export default function TitikPromoManager({ 
  promoList = [], 
  onOpenMapAtTitik, 
  initialDate = null 
}) {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(initialDate ? normalizeDateToYMD(initialDate) : getTodayStr());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZona, setFilterZona] = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA'); // 'SEMUA', 'TERSEDIA', 'TERISI'
  const [titikList, setTitikList] = useState(defaultTitikPromoList);
  const [toast, setToast] = useState(null);

  // Modal Kelola Promo Titik (Modal Detail & Tambah Jadwal)
  const [managingTitik, setManagingTitik] = useState(null);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  // Form Booking
  const [bookingFormData, setBookingFormData] = useState({
    namaPerusahaan: '',
    namaProduk: '',
    dateMode: 'range',
    startDate: '',
    endDate: '',
    hasBanner: false,
    jumlahBanner: '1',
    catatan: ''
  });

  // Modal Edit Master Data Titik (Nama, Zona, Patokan)
  const [editingMasterTitik, setEditingMasterTitik] = useState(null);
  const [isSavingMasterTitik, setIsSavingMasterTitik] = useState(false);
  const [masterForm, setMasterForm] = useState({ nama: '', zona: '', keterangan: '', lat: 0, lng: 0 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Sinkronisasi Data 100 Titik dari Firestore masterTitikPromo
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'masterTitikPromo'), (snapshot) => {
      if (!snapshot.empty) {
        const remotePoints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const merged = defaultTitikPromoList.map(def => {
          const found = remotePoints.find(r => r.id === def.id || r.nomor === def.nomor);
          return found ? { ...def, ...found } : def;
        });
        setTitikList(merged);
      } else {
        setTitikList(defaultTitikPromoList);
      }
    }, (err) => {
      console.warn("Gagal membaca masterTitikPromo:", err);
      setTitikList(defaultTitikPromoList);
    });

    return () => unsub();
  }, []);

  // Zona unik
  const uniqueZones = useMemo(() => {
    const zones = new Set();
    titikList.forEach(t => {
      if (t.zona && t.zona.trim()) zones.add(t.zona.trim());
    });
    return Array.from(zones);
  }, [titikList]);

  // Alokasi pada selectedDate (100% Anti-Bentrok)
  const { allocation: allocationOnDate } = useMemo(() => {
    return computeAllocationForDate(promoList, selectedDate, titikList);
  }, [promoList, selectedDate, titikList]);

  // Statistik 100 Titik pada selectedDate
  const stats = useMemo(() => {
    const bookedCount = Object.keys(allocationOnDate).length;
    return {
      total: titikList.length,
      booked: bookedCount,
      available: Math.max(0, titikList.length - bookedCount)
    };
  }, [titikList, allocationOnDate]);

  // Jadwal Seluruh Tanggal untuk Titik yang sedang dikelola di Modal
  const managingTitikSchedules = useMemo(() => {
    if (!managingTitik) return [];

    const schedulesByPromo = {};

    promoList.forEach(promo => {
      const pDates = extractPromoDates(promo);
      pDates.forEach(dStr => {
        const { allocation } = computeAllocationForDate(promoList, dStr, titikList);
        if (allocation[managingTitik.id] && allocation[managingTitik.id].id === promo.id) {
          if (!schedulesByPromo[promo.id]) {
            schedulesByPromo[promo.id] = { promo, dates: [] };
          }
          schedulesByPromo[promo.id].dates.push(dStr);
        }
      });
    });

    const result = Object.values(schedulesByPromo).map(({ promo, dates }) => {
      const sortedDates = [...new Set(dates)].sort();
      const hasBanner = Boolean(
        promo.hasBanner || 
        (parseInt(promo.jumlahBanner, 10) > 0) || 
        (promo.selectedDates && promo.selectedDates.some(d => typeof d === 'object' && parseInt(d?.banner, 10) > 0))
      );
      const bannerCount = parseInt(promo.jumlahBanner, 10) || (hasBanner ? 1 : 0);

      return {
        id: promo.id,
        namaPerusahaan: promo.namaPerusahaan || 'Tanpa Brand',
        namaProduk: promo.namaProduk || 'Produk Promo',
        dates: sortedDates,
        tanggalPromo: formatDatesSummary(sortedDates),
        hasBanner: hasBanner,
        jumlahBanner: bannerCount,
        rawPromo: promo
      };
    });

    result.sort((a, b) => {
      const dateA = a.dates[0] || '9999-99-99';
      const dateB = b.dates[0] || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    return result;
  }, [managingTitik, promoList, titikList]);

  // Validasi Anti-Bentrok Form Booking
  const activeFormDates = useMemo(() => {
    if (bookingFormData.dateMode === 'range') {
      return generateDatesRange(bookingFormData.startDate, bookingFormData.endDate);
    }
    return bookingFormData.startDate ? [bookingFormData.startDate] : [];
  }, [bookingFormData.dateMode, bookingFormData.startDate, bookingFormData.endDate]);

  const conflictCheck = useMemo(() => {
    if (!managingTitik || activeFormDates.length === 0) {
      return { hasConflict: false };
    }

    for (const dStr of activeFormDates) {
      const { allocation } = computeAllocationForDate(promoList, dStr, titikList);
      const existing = allocation[managingTitik.id];
      if (existing && (!editingBookingId || existing.id !== editingBookingId)) {
        return {
          hasConflict: true,
          conflictingDate: dStr,
          conflictingBrand: existing.namaPerusahaan || existing.namaProduk,
          conflictingProduk: existing.namaProduk
        };
      }
    }

    return { hasConflict: false };
  }, [managingTitik, activeFormDates, promoList, titikList, editingBookingId]);

  // Filter & Search List 100 Titik
  const filteredTitikList = useMemo(() => {
    return titikList.filter(t => {
      const activePromo = allocationOnDate[t.id];
      const isOccupied = !!activePromo;

      // Filter Status
      if (filterStatus === 'TERSEDIA' && isOccupied) return false;
      if (filterStatus === 'TERISI' && !isOccupied) return false;

      // Filter Zona
      if (filterZona !== 'SEMUA') {
        if (filterZona === 'BELUM_DIATUR' && t.zona && t.zona.trim()) return false;
        if (filterZona !== 'BELUM_DIATUR' && (!t.zona || t.zona.trim().toLowerCase() !== filterZona.toLowerCase())) return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = String(t.nomor).includes(q) || t.kode.toLowerCase().includes(q);
        const matchName = (t.nama || '').toLowerCase().includes(q);
        const matchZona = (t.zona || '').toLowerCase().includes(q);
        const matchKet = (t.keterangan || '').toLowerCase().includes(q);
        const matchBrand = activePromo ? (activePromo.namaPerusahaan || '').toLowerCase().includes(q) : false;
        const matchProduk = activePromo ? (activePromo.namaProduk || '').toLowerCase().includes(q) : false;

        return matchNumber || matchName || matchZona || matchKet || matchBrand || matchProduk;
      }

      return true;
    });
  }, [titikList, allocationOnDate, filterStatus, filterZona, searchQuery]);

  // Buka Modal Kelola Promo untuk Titik Tertentu
  const handleOpenManageTitik = (titik) => {
    setManagingTitik(titik);
    setIsAddingBooking(false);
    setEditingBookingId(null);
    setBookingFormData({
      namaPerusahaan: '',
      namaProduk: '',
      dateMode: 'range',
      startDate: selectedDate || getTodayStr(),
      endDate: selectedDate || getTodayStr(),
      hasBanner: false,
      jumlahBanner: '1',
      catatan: ''
    });
  };

  // Simpan Booking Titik
  const handleSaveBooking = async (e) => {
    e.preventDefault();
    if (!managingTitik) return;

    if (!bookingFormData.namaPerusahaan.trim()) {
      showToast('Nama Brand / Perusahaan wajib diisi!', 'error');
      return;
    }
    if (!bookingFormData.namaProduk.trim()) {
      showToast('Nama Produk wajib diisi!', 'error');
      return;
    }
    if (activeFormDates.length === 0) {
      showToast('Pilih minimal 1 tanggal!', 'error');
      return;
    }

    if (conflictCheck.hasConflict) {
      showToast(`Bentrok pada ${conflictCheck.conflictingDate} oleh ${conflictCheck.conflictingBrand}!`, 'error');
      return;
    }

    setIsSavingBooking(true);
    try {
      const bannerCountStr = bookingFormData.hasBanner ? String(bookingFormData.jumlahBanner || 1) : '0';
      const formattedDatesText = formatDatesSummary(activeFormDates);

      const payload = {
        namaPerusahaan: bookingFormData.namaPerusahaan.trim(),
        namaProduk: bookingFormData.namaProduk.trim(),
        titikIds: [managingTitik.id],
        titikId: managingTitik.id,
        selectedDates: activeFormDates.map(d => ({
          date: d,
          titik: '1',
          banner: bannerCountStr
        })),
        dates: activeFormDates,
        tanggalPromo: formattedDatesText,
        jumlahTitik: '1',
        jumlahBanner: bannerCountStr,
        hasBanner: Boolean(bookingFormData.hasBanner),
        status: 'Terverifikasi',
        isPreBooking: true,
        catatan: bookingFormData.catatan.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (editingBookingId) {
        await updateDoc(doc(db, 'promoList', editingBookingId), payload);
        showToast(`Booking Titik ${managingTitik.nomor} berhasil diperbarui!`);
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'promoList'), payload);
        showToast(`Berhasil booking Titik ${managingTitik.nomor} untuk ${payload.namaPerusahaan}!`);
      }

      setIsAddingBooking(false);
      setEditingBookingId(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan booking.', 'error');
    } finally {
      setIsSavingBooking(false);
    }
  };

  // Hapus Booking
  const handleDeleteBooking = async (scheduleItem) => {
    if (!window.confirm(`Hapus jadwal ${scheduleItem.namaPerusahaan} di Titik ini?`)) return;

    setIsDeletingBooking(true);
    try {
      const raw = scheduleItem.rawPromo;
      if (raw && raw.titikIds && raw.titikIds.length > 1) {
        const remaining = raw.titikIds.filter(id => id !== managingTitik.id);
        await updateDoc(doc(db, 'promoList', scheduleItem.id), {
          titikIds: remaining,
          jumlahTitik: String(remaining.length)
        });
        showToast(`Titik dilepas dari promo ini.`);
      } else {
        await deleteDoc(doc(db, 'promoList', scheduleItem.id));
        showToast(`Jadwal promo berhasil dihapus.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus jadwal.', 'error');
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Simpan Edit Master Titik
  const handleSaveMasterTitik = async (e) => {
    e.preventDefault();
    if (!editingMasterTitik) return;
    setIsSavingMasterTitik(true);
    try {
      const payload = {
        nama: masterForm.nama.trim(),
        zona: masterForm.zona.trim(),
        keterangan: masterForm.keterangan.trim(),
        lat: Number(masterForm.lat),
        lng: Number(masterForm.lng)
      };
      await setDoc(doc(db, 'masterTitikPromo', editingMasterTitik.id), payload, { merge: true });
      setTitikList(prev => prev.map(t => t.id === editingMasterTitik.id ? { ...t, ...payload } : t));
      showToast('Data master titik berhasil disimpan!');
      setEditingMasterTitik(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan master titik.', 'error');
    } finally {
      setIsSavingMasterTitik(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] text-white font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border ${
          toast.type === 'error' ? 'bg-rose-700 border-rose-500' : 'bg-emerald-800 border-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-300" />}
          <span className="text-xs sm:text-sm">{toast.msg}</span>
        </div>
      )}

      {/* TOP CONTROL BAR: STATS, FILTER TANGGAL, ZONA, STATUS & SEARCH */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        
        {/* Row 1: Header Title & Live Counter Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2.5">
              <Layers size={22} className="text-emerald-600" />
              Kelola 100 Titik Promo Ragunan
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Dashboard operasional untuk mengatur jadwal brand, produk, dan banner di setiap titik promo.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Total: <b>{stats.total} Titik</b>
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Tersedia: <b>{stats.available}</b>
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              Terisi: <b>{stats.booked}</b>
            </span>
          </div>
        </div>

        {/* Row 2: Filter Controls & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* Tanggal Pantau */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl shadow-inner">
            <CalendarIcon size={16} className="text-emerald-700 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Tanggal Pantau</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(normalizeDateToYMD(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Filter Status */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl shadow-inner">
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Status Ketersediaan</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full cursor-pointer"
            >
              <option value="SEMUA">Semua Status ({stats.total})</option>
              <option value="TERSEDIA">🟢 Hanya Tersedia ({stats.available})</option>
              <option value="TERISI">🔴 Hanya Terisi ({stats.booked})</option>
            </select>
          </div>

          {/* Filter Zona */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl shadow-inner">
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Zona Titik</span>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full cursor-pointer"
            >
              <option value="SEMUA">Semua Zona</option>
              {uniqueZones.map(z => (
                <option key={z} value={z}>Zona: {z}</option>
              ))}
              <option value="BELUM_DIATUR">Zona Belum Diatur</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl shadow-inner">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor, brand, atau produk..."
              className="bg-transparent text-xs font-bold text-slate-800 outline-none w-full placeholder:text-slate-400 placeholder:font-normal"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* GRID 100 TITIK PROMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTitikList.map(titik => {
          const activePromo = allocationOnDate[titik.id];
          const isOccupied = !!activePromo;
          const hasBanner = activePromo ? hasPromoBannerOnDate(activePromo, selectedDate) : false;
          const bannerCount = activePromo ? getPromoBannerCountOnDate(activePromo, selectedDate) : 0;

          return (
            <div 
              key={titik.id}
              className={`bg-white rounded-3xl border transition-all duration-200 p-4.5 flex flex-col justify-between shadow-sm hover:shadow-md ${
                isOccupied ? 'border-rose-200 hover:border-rose-400' : 'border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div>
                {/* Header Card: Nomor & Status Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      {titik.kode}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm">{titik.nama}</h3>
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    isOccupied 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
                    {isOccupied ? 'Terisi' : 'Tersedia'}
                  </span>
                </div>

                {/* Zona & Patokan */}
                <div className="text-[11px] text-slate-500 mb-3 flex items-center justify-between">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {titik.zona || 'Zona: Fleksibel'}
                  </span>
                  {titik.keterangan && (
                    <span className="text-slate-400 truncate max-w-[140px]" title={titik.keterangan}>
                      {titik.keterangan}
                    </span>
                  )}
                </div>

                {/* Detail Promo Pada Tanggal Pantau */}
                <div className={`p-3 rounded-2xl mb-3 border ${
                  isOccupied ? 'bg-rose-50/70 border-rose-100' : 'bg-slate-50/70 border-slate-100'
                }`}>
                  {isOccupied ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Brand</span>
                        <span className="font-black text-slate-900 truncate">{activePromo.namaPerusahaan}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Produk</span>
                        <span className="font-extrabold text-rose-700 truncate">{activePromo.namaProduk}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-rose-100/60 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Banner</span>
                        <span className={`text-[10px] font-extrabold ${hasBanner ? 'text-amber-800' : 'text-slate-500'}`}>
                          {hasBanner ? `🚩 Pakai (${bannerCount})` : '🚫 Tanpa Banner'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-1">
                      <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                        <CheckCircle2 size={13} /> Siap Ditempati
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Kosong pada {formatShortDate(selectedDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Lihat di Peta & Kelola Promo */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenMapAtTitik && onOpenMapAtTitik(titik.id, selectedDate)}
                  className="py-2 px-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Lihat posisi pin titik ini di peta interaktif"
                >
                  <MapPin size={13} className="text-emerald-600" />
                  <span>Lihat di Peta</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenManageTitik(titik)}
                  className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Kelola jadwal promo, isi brand baru, atau atur tanggal"
                >
                  <Edit3 size={13} />
                  <span>Kelola Promo</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTitikList.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Layers size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-black text-slate-700">Tidak ada titik yang sesuai dengan filter.</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Coba sesuaikan kata kunci pencarian, filter status, atau zona.</p>
        </div>
      )}

      {/* MODAL KELOLA & ISI PROMO TITIK */}
      {managingTitik && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {managingTitik.kode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {managingTitik.zona ? `Zona: ${managingTitik.zona}` : 'Zona: Fleksibel'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-emerald-950">
                  {managingTitik.nama}
                </h3>
              </div>
              <button 
                onClick={() => setManagingTitik(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Scroll */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {/* Form Tambah/Edit Booking Baru */}
              {isAddingBooking ? (
                <div className="bg-emerald-50/50 border-2 border-emerald-500/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Plus size={15} className="text-emerald-600" />
                      {editingBookingId ? 'Edit Jadwal Booking' : `Booking Titik ${managingTitik.nomor}`}
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingBooking(false)}
                      className="text-xs font-bold text-slate-400 hover:text-rose-600"
                    >
                      Batal
                    </button>
                  </div>

                  <form onSubmit={handleSaveBooking} className="space-y-3">
                    {/* Brand */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Nama Brand / Perusahaan <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={bookingFormData.namaPerusahaan}
                        onChange={(e) => setBookingFormData({...bookingFormData, namaPerusahaan: e.target.value})}
                        placeholder="Contoh: Brand Sari Roti / Oreo / Sosro"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Produk */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Nama Produk <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={bookingFormData.namaProduk}
                        onChange={(e) => setBookingFormData({...bookingFormData, namaProduk: e.target.value})}
                        placeholder="Contoh: Produk Roti / Wafer Coklat"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Rentang Tanggal */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                          <CalendarIcon size={12} className="text-emerald-600" /> Tanggal Booking
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setBookingFormData({...bookingFormData, dateMode: 'range'})}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bookingFormData.dateMode === 'range' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Rentang Tanggal
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingFormData({...bookingFormData, dateMode: 'single'})}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bookingFormData.dateMode === 'single' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            1 Hari
                          </button>
                        </div>
                      </div>

                      {bookingFormData.dateMode === 'range' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 mb-0.5">Dari Tanggal</span>
                            <input 
                              type="date"
                              required
                              value={bookingFormData.startDate}
                              onChange={(e) => setBookingFormData({...bookingFormData, startDate: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 mb-0.5">Sampai Tanggal</span>
                            <input 
                              type="date"
                              required
                              value={bookingFormData.endDate}
                              min={bookingFormData.startDate}
                              onChange={(e) => setBookingFormData({...bookingFormData, endDate: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input 
                            type="date"
                            required
                            value={bookingFormData.startDate}
                            onChange={(e) => setBookingFormData({...bookingFormData, startDate: e.target.value, endDate: e.target.value})}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      )}

                      {activeFormDates.length > 0 && (
                        <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span>Total: {activeFormDates.length} Hari</span>
                          <span className="truncate max-w-[180px]">{formatDatesSummary(activeFormDates)}</span>
                        </div>
                      )}
                    </div>

                    {/* Banner */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-600">Pemasangan Banner</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingFormData({...bookingFormData, hasBanner: true})}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                            bookingFormData.hasBanner ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <Flag size={13} /> Pakai Banner
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingFormData({...bookingFormData, hasBanner: false})}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                            !bookingFormData.hasBanner ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          🚫 Tanpa Banner
                        </button>
                      </div>

                      {bookingFormData.hasBanner && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase">Jumlah:</span>
                          <input 
                            type="number"
                            min="1"
                            max="20"
                            value={bookingFormData.jumlahBanner}
                            onChange={(e) => setBookingFormData({...bookingFormData, jumlahBanner: e.target.value})}
                            className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center outline-none"
                          />
                          <span className="text-xs font-bold text-slate-600">Buah</span>
                        </div>
                      )}
                    </div>

                    {/* Indikator Anti-Bentrok */}
                    {conflictCheck.hasConflict ? (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
                        <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-rose-950">⚠️ BENTROK TERDETEKSI!</p>
                          <p className="text-[11px] text-rose-800 mt-0.5 leading-snug">
                            Titik ini sudah terisi pada {conflictCheck.conflictingDate} oleh <b>{conflictCheck.conflictingBrand}</b>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      activeFormDates.length > 0 && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>✅ Tanggal Tersedia: Bebas bentrok di titik ini.</span>
                        </div>
                      )
                    )}

                    {/* Tombol Simpan */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingBooking(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingBooking || conflictCheck.hasConflict}
                        className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isSavingBooking ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Simpan Booking Titik
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingBooking(true);
                    setEditingBookingId(null);
                    setBookingFormData({
                      namaPerusahaan: '',
                      namaProduk: '',
                      dateMode: 'range',
                      startDate: selectedDate || getTodayStr(),
                      endDate: selectedDate || getTodayStr(),
                      hasBanner: false,
                      jumlahBanner: '1',
                      catatan: ''
                    });
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-dashed border-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <Plus size={15} /> + Tambah Jadwal / Booking Titik Ini
                </button>
              )}

              {/* DAFTAR SELURUH JADWAL DI TITIK INI */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-emerald-700" /> Agenda Seluruh Jadwal Titik Ini
                  </h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {managingTitikSchedules.length} Jadwal
                  </span>
                </div>

                {managingTitikSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {managingTitikSchedules.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md mb-1 border border-slate-100">
                            <CalendarIcon size={11} className="text-emerald-600" />
                            <span>{item.tanggalPromo}</span>
                          </div>

                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {item.namaPerusahaan}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 truncate">
                              &bull; {item.namaProduk}
                            </span>
                          </div>

                          <div className="mt-1">
                            {item.hasBanner ? (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                🚩 Pakai Banner ({item.jumlahBanner})
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                                🚫 Tanpa Banner
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Aksi Edit & Hapus */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const dates = item.dates;
                              setEditingBookingId(item.id);
                              setBookingFormData({
                                namaPerusahaan: item.namaPerusahaan,
                                namaProduk: item.namaProduk,
                                dateMode: dates.length > 1 ? 'range' : 'single',
                                startDate: dates[0] || getTodayStr(),
                                endDate: dates[dates.length - 1] || dates[0] || getTodayStr(),
                                hasBanner: item.hasBanner,
                                jumlahBanner: String(item.jumlahBanner || 1),
                                catatan: item.rawPromo?.catatan || ''
                              });
                              setIsAddingBooking(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Edit Jadwal"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingBooking}
                            onClick={() => handleDeleteBooking(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Jadwal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-medium">
                    Belum ada jadwal promo yang terdaftar di titik ini.
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal: Tombol Arahkan ke Peta */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetId = managingTitik.id;
                  setManagingTitik(null);
                  if (onOpenMapAtTitik) {
                    onOpenMapAtTitik(targetId, selectedDate);
                  }
                }}
                className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <MapPin size={15} className="text-emerald-600" />
                <span>Lihat Lokasi Titik di Peta &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setManagingTitik(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
