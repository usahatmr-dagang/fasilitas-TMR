import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Move, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Loader2, 
  Info,
  Plus,
  Trash2,
  Edit3,
  Flag,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Lock,
  Check
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

// Konfigurasi Google Street (Roadmap) khusus kawasan Ragunan
const GOOGLE_STREET_URL = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

/**
 * SISTEM ALOKASI TITIK DINAMIS & ANTI-TABRAKAN (100% BEBAS BENTROK)
 * Aturan Mutlak: PADA TANGGAL YANG SAMA, 1 TITIK HANYA BISA DIISI OLEH 1 PROMO.
 * Jika Need's butuh 2 titik, Need's mengisi TP-001 & TP-002.
 * Maka YUPI otomatis dialokasikan ke TP-003 (TIDAK AKAN PERNAH MENUMPUK DI TP-001).
 */
const computeAllocationForDate = (promoList, dateYMD, titikList) => {
  const allocation = {}; // titikId -> promo object
  const promoToTitikMap = {}; // promoId -> array of titikIds
  if (!dateYMD || !promoList || promoList.length === 0 || !titikList || titikList.length === 0) {
    return { allocation, promoToTitikMap };
  }

  // Ambil semua promo yang aktif pada tanggal ini
  const activePromos = promoList.filter(p => isPromoOnDate(p, dateYMD));
  if (activePromos.length === 0) {
    return { allocation, promoToTitikMap };
  }

  const occupied = new Set();
  const unassigned = [];

  // Pass 1: Prioritaskan promo yang SUDAH memiliki titikIds eksplisit dari database / admin
  activePromos.forEach(promo => {
    let explicitIds = [];
    if (promo.titikIds && Array.isArray(promo.titikIds) && promo.titikIds.length > 0) {
      explicitIds = promo.titikIds;
    } else if (promo.titikId) {
      explicitIds = [promo.titikId];
    }

    if (explicitIds.length > 0) {
      const assigned = [];
      explicitIds.forEach(tId => {
        if (!occupied.has(tId)) {
          occupied.add(tId);
          allocation[tId] = promo;
          assigned.push(tId);
        }
      });
      if (assigned.length > 0) {
        promoToTitikMap[promo.id] = assigned;
      } else {
        unassigned.push(promo);
      }
    } else {
      unassigned.push(promo);
    }
  });

  // Pass 2: Alokasikan promo yang belum memiliki titikIds ke titik kosong berikutnya
  // Secara non-overlapping (1 titik 1 promo)
  const allTitikIds = titikList.map(t => t.id);

  unassigned.forEach(promo => {
    const qty = getPromoRequestedTitikQty(promo, dateYMD);
    const assigned = [];

    for (const tId of allTitikIds) {
      if (!occupied.has(tId)) {
        occupied.add(tId);
        allocation[tId] = promo;
        assigned.push(tId);
        if (assigned.length >= qty) {
          break;
        }
      }
    }

    if (assigned.length > 0) {
      promoToTitikMap[promo.id] = assigned;
    }
  });

  return { allocation, promoToTitikMap };
};

export default function PromoMapView({ promoList = [], initialDate = null, initialTitikId = null, onClose }) {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(initialDate ? normalizeDateToYMD(initialDate) : getTodayStr());
  const [filterZona, setFilterZona] = useState('SEMUA');
  const [isDragMode, setIsDragMode] = useState(false);
  const [titikList, setTitikList] = useState(defaultTitikPromoList);
  const [selectedTitik, setSelectedTitik] = useState(null);

  // Auto-focus ke initialTitikId jika diarahkan dari dashboard 100 Titik
  useEffect(() => {
    if (initialTitikId && titikList && titikList.length > 0) {
      const found = titikList.find(t => t.id === initialTitikId || t.nomor === Number(initialTitikId) || t.kode === initialTitikId);
      if (found) {
        setSelectedTitik(found);
        setEditTitikForm({
          nama: found.nama || `Titik Promo ${String(found.nomor).padStart(2, '0')}`,
          zona: found.zona || '',
          keterangan: found.keterangan || '',
          lat: found.lat,
          lng: found.lng
        });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([found.lat, found.lng], 17, { animate: true });
        }
      }
    }
  }, [initialTitikId, titikList]);
  const [isSavingTitik, setIsSavingTitik] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Booking Baru / Edit Booking
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  
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

  // Modal Pindah Titik (Relokasi Titik)
  const [relocateModalData, setRelocateModalData] = useState(null); // { promo, currentTitikId }
  const [targetNewTitikId, setTargetNewTitikId] = useState('');
  const [isSavingRelocation, setIsSavingRelocation] = useState(false);

  // Form edit koordinat & zona titik
  const [editTitikForm, setEditTitikForm] = useState({
    nama: '',
    zona: '',
    keterangan: '',
    lat: 0,
    lng: 0
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const tileLayerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Sinkronisasi Data 100 Titik dari Firestore
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
      if (t.zona && t.zona.trim()) {
        zones.add(t.zona.trim());
      }
    });
    return Array.from(zones);
  }, [titikList]);

  // 2. HASIL ALOKASI TITIK PADA TANGGAL TERPILIH (100% BEBAS BENTROK)
  // Mapping: titikId -> promo object tunggal yang menempati titik ini pada selectedDate
  const { allocation: bookedTitikOnSelectedDateMap, promoToTitikMap: currentPromoToTitikMap } = useMemo(() => {
    return computeAllocationForDate(promoList, selectedDate, titikList);
  }, [promoList, selectedDate, titikList]);

  // Statistik Titik pada tanggal terpilih
  const stats = useMemo(() => {
    const bookedCount = Object.keys(bookedTitikOnSelectedDateMap).length;
    return {
      total: titikList.length,
      booked: bookedCount,
      available: Math.max(0, titikList.length - bookedCount)
    };
  }, [titikList, bookedTitikOnSelectedDateMap]);

  // Promo yang aktif pada selectedDate di titik yang sedang diklik (JAMINAN MAKSIMAL 1 PROMO)
  const activePromoOnSelectedTitik = useMemo(() => {
    if (!selectedTitik) return null;
    return bookedTitikOnSelectedDateMap[selectedTitik.id] || null;
  }, [selectedTitik, bookedTitikOnSelectedDateMap]);

  // 3. DAFTAR SELURUH JADWAL / AGENDA DI TITIK TERPILIH (LINTAS TANGGAL / HIGH SEASON)
  const titikSchedules = useMemo(() => {
    if (!selectedTitik) return [];

    const schedulesByPromo = {};

    promoList.forEach(promo => {
      const pDates = extractPromoDates(promo);
      pDates.forEach(dStr => {
        const { allocation } = computeAllocationForDate(promoList, dStr, titikList);
        if (allocation[selectedTitik.id] && allocation[selectedTitik.id].id === promo.id) {
          if (!schedulesByPromo[promo.id]) {
            schedulesByPromo[promo.id] = {
              promo: promo,
              dates: []
            };
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
  }, [selectedTitik, promoList, titikList]);

  // 4. VALIDASI ANTI-BENTROK UNTUK FORM BOOKING
  const activeFormDates = useMemo(() => {
    if (bookingFormData.dateMode === 'range') {
      return generateDatesRange(bookingFormData.startDate, bookingFormData.endDate);
    }
    return bookingFormData.startDate ? [bookingFormData.startDate] : [];
  }, [bookingFormData.dateMode, bookingFormData.startDate, bookingFormData.endDate]);

  const conflictCheck = useMemo(() => {
    if (!selectedTitik || activeFormDates.length === 0) {
      return { hasConflict: false };
    }

    for (const dStr of activeFormDates) {
      const { allocation } = computeAllocationForDate(promoList, dStr, titikList);
      const existing = allocation[selectedTitik.id];
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
  }, [selectedTitik, activeFormDates, promoList, titikList, editingBookingId]);

  // 5. Inisialisasi Peta Leaflet Khusus Kawasan Ragunan
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const ragunanBounds = L.latLngBounds(
        L.latLng(-6.3210, 106.8130),
        L.latLng(-6.3030, 106.8270)
      );

      const map = L.map(mapContainerRef.current, {
        center: [-6.3115, 106.8200],
        zoom: 16,
        minZoom: 15,
        maxZoom: 18,
        maxBounds: ragunanBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        preferCanvas: true
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      tileLayerRef.current = L.tileLayer(GOOGLE_STREET_URL, {
        attribution: '&copy; Google Maps',
        bounds: ragunanBounds,
        minZoom: 15,
        maxZoom: 18,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 1
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 6. Render Marker Leaflet untuk 100 Titik
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentPointIds = new Set(titikList.map(t => t.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentPointIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    titikList.forEach(titik => {
      const activePromoOnDate = bookedTitikOnSelectedDateMap[titik.id];
      const isBooked = !!activePromoOnDate;
      const nomor = titik.nomor || parseInt(titik.id.replace(/\D/g, ''), 10) || 0;

      const isZoneMatched = filterZona === 'SEMUA' 
        ? true 
        : filterZona === 'BELUM_DIATUR' 
          ? (!titik.zona || !titik.zona.trim()) 
          : (titik.zona && titik.zona.trim().toLowerCase() === filterZona.toLowerCase());

      const opacityClass = isZoneMatched ? 'opacity-100' : 'opacity-20 pointer-events-none';

      const ringDragStyle = isDragMode 
        ? 'ring-4 ring-amber-400 scale-110 shadow-amber-500/50 cursor-grab active:cursor-grabbing' 
        : 'cursor-pointer hover:scale-125';

      const iconHtml = `
        <div class="relative flex items-center justify-center transition-transform duration-150 ${ringDragStyle} ${opacityClass}">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white ${
            isBooked 
              ? 'bg-rose-600 text-white shadow-rose-600/40 ring-2 ring-rose-400/80' 
              : 'bg-emerald-600 text-white shadow-emerald-600/40 hover:bg-emerald-500'
          }">
            ${nomor}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-promo-pin',
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      let marker = markersRef.current[titik.id];

      if (!marker) {
        marker = L.marker([titik.lat, titik.lng], {
          icon: customIcon,
          draggable: isDragMode,
          title: titik.nama
        }).addTo(map);

        marker.on('click', () => {
          setSelectedTitik(titik);
          setIsBookingFormOpen(false);
          setEditingBookingId(null);
          setEditTitikForm({
            nama: titik.nama || `Titik Promo ${String(titik.nomor).padStart(2, '0')}`,
            zona: titik.zona || '',
            keterangan: titik.keterangan || '',
            lat: titik.lat,
            lng: titik.lng
          });
        });

        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          const updatedLat = Number(newPos.lat.toFixed(6));
          const updatedLng = Number(newPos.lng.toFixed(6));
          
          setSelectedTitik(prev => prev && prev.id === titik.id ? { ...prev, lat: updatedLat, lng: updatedLng } : prev);
          setEditTitikForm(prev => ({ ...prev, lat: updatedLat, lng: updatedLng }));
          setTitikList(prev => prev.map(t => t.id === titik.id ? { ...t, lat: updatedLat, lng: updatedLng } : t));
          saveTitikToFirestore(titik.id, { lat: updatedLat, lng: updatedLng });
        });

        markersRef.current[titik.id] = marker;
      } else {
        marker.setLatLng([titik.lat, titik.lng]);
        marker.setIcon(customIcon);
        if (marker.dragging) {
          if (isDragMode) {
            marker.dragging.enable();
          } else {
            marker.dragging.disable();
          }
        }
      }

      // Tooltip: Hanya Tanggal, Produk, Brand & Banner
      let bannerInfo = 'Tanpa Banner';
      if (activePromoOnDate) {
        const hasB = Boolean(
          activePromoOnDate.hasBanner || 
          (parseInt(activePromoOnDate.jumlahBanner, 10) > 0)
        );
        bannerInfo = hasB ? `🚩 Banner (${activePromoOnDate.jumlahBanner || 1})` : '🚫 Tanpa Banner';
      }

      const tooltipContent = isBooked 
        ? `<div style="font-size: 11px; line-height: 1.4; padding: 4px; min-width: 140px;">
             <b style="font-size: 12px; color: #064e3b;">${titik.nama}</b><br/>
             <span style="color: #e11d48; font-weight: 800;">📦 ${activePromoOnDate?.namaProduk || 'Produk'}</span><br/>
             <span style="color: #334155; font-weight: 700;">🏷️ ${activePromoOnDate?.namaPerusahaan || 'Brand'}</span><br/>
             <span style="color: #0284c7; font-weight: 600;">📅 ${formatShortDate(selectedDate)}</span><br/>
             <span style="font-weight: 700; color: #b45309;">${bannerInfo}</span>
           </div>`
        : `<div style="font-size: 11px; line-height: 1.4; padding: 4px;">
             <b style="font-size: 12px; color: #064e3b;">${titik.nama}</b><br/>
             <span style="color: #059669; font-weight: 800;">🟢 Tersedia (Bisa Ditempati)</span>
           </div>`;

      marker.bindTooltip(tooltipContent, { offset: [0, -10], direction: 'top' });
    });

  }, [titikList, bookedTitikOnSelectedDateMap, isDragMode, filterZona, selectedDate]);

  // Simpan perubahan koordinat/data master titik
  const saveTitikToFirestore = async (titikId, partialData) => {
    try {
      const docRef = doc(db, 'masterTitikPromo', titikId);
      await setDoc(docRef, partialData, { merge: true });
      showToast('Posisi titik tersimpan!');
    } catch (err) {
      console.error("Gagal menyimpan titik:", err);
      showToast('Perubahan tersimpan lokal!', 'info');
    }
  };

  const handleSaveEditTitikForm = async (e) => {
    e.preventDefault();
    if (!selectedTitik) return;

    setIsSavingTitik(true);
    try {
      const payload = {
        nama: editTitikForm.nama,
        zona: editTitikForm.zona.trim(),
        keterangan: editTitikForm.keterangan.trim(),
        lat: Number(editTitikForm.lat),
        lng: Number(editTitikForm.lng)
      };

      await saveTitikToFirestore(selectedTitik.id, payload);
      setTitikList(prev => prev.map(t => t.id === selectedTitik.id ? { ...t, ...payload } : t));
      setSelectedTitik(prev => ({ ...prev, ...payload }));
      showToast('Data titik berhasil diperbarui!');
    } finally {
      setIsSavingTitik(false);
    }
  };

  // Buka Form Booking Baru
  const handleOpenNewBooking = (targetDate = null) => {
    const defaultStart = targetDate || selectedDate || getTodayStr();
    setEditingBookingId(null);
    setBookingFormData({
      namaPerusahaan: '',
      namaProduk: '',
      dateMode: 'range',
      startDate: defaultStart,
      endDate: defaultStart,
      hasBanner: false,
      jumlahBanner: '1',
      catatan: ''
    });
    setIsBookingFormOpen(true);
  };

  // Buka Form Edit Booking
  const handleOpenEditBooking = (scheduleItem) => {
    const dates = scheduleItem.dates;
    const start = dates[0] || getTodayStr();
    const end = dates[dates.length - 1] || start;

    setEditingBookingId(scheduleItem.id);
    setBookingFormData({
      namaPerusahaan: scheduleItem.namaPerusahaan || '',
      namaProduk: scheduleItem.namaProduk || '',
      dateMode: dates.length > 1 ? 'range' : 'single',
      startDate: start,
      endDate: end,
      hasBanner: Boolean(scheduleItem.hasBanner),
      jumlahBanner: String(scheduleItem.jumlahBanner || 1),
      catatan: scheduleItem.rawPromo?.catatan || ''
    });
    setIsBookingFormOpen(true);
  };

  // Simpan Booking Baru / Edit
  const handleSaveBooking = async (e) => {
    e.preventDefault();
    if (!selectedTitik) return;

    if (!bookingFormData.namaPerusahaan.trim()) {
      showToast('Nama Brand / Perusahaan wajib diisi!', 'error');
      return;
    }
    if (!bookingFormData.namaProduk.trim()) {
      showToast('Nama Produk wajib diisi!', 'error');
      return;
    }
    if (activeFormDates.length === 0) {
      showToast('Pilih minimal 1 tanggal booking!', 'error');
      return;
    }

    if (conflictCheck.hasConflict) {
      showToast(
        `Bentrok! Titik sudah terisi pada tanggal ${conflictCheck.conflictingDate} oleh ${conflictCheck.conflictingBrand}.`,
        'error'
      );
      return;
    }

    setIsSavingBooking(true);
    try {
      const bannerCountStr = bookingFormData.hasBanner ? String(bookingFormData.jumlahBanner || 1) : '0';
      const formattedDatesText = formatDatesSummary(activeFormDates);

      const payload = {
        namaPerusahaan: bookingFormData.namaPerusahaan.trim(),
        namaProduk: bookingFormData.namaProduk.trim(),
        titikIds: [selectedTitik.id],
        titikId: selectedTitik.id,
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
        showToast(`Booking Titik ${selectedTitik.nomor} berhasil diperbarui!`);
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'promoList'), payload);
        showToast(`Berhasil booking Titik ${selectedTitik.nomor} untuk ${payload.namaPerusahaan}!`);
      }

      setIsBookingFormOpen(false);
      setEditingBookingId(null);
    } catch (err) {
      console.error("Gagal menyimpan booking promo:", err);
      showToast('Gagal menyimpan booking: ' + (err.message || 'Error server'), 'error');
    } finally {
      setIsSavingBooking(false);
    }
  };

  // Hapus Booking
  const handleDeleteBooking = async (scheduleItem) => {
    if (!window.confirm(`Hapus jadwal booking untuk "${scheduleItem.namaPerusahaan}" (Produk: ${scheduleItem.namaProduk}) di Titik ini?`)) {
      return;
    }

    setIsDeletingBooking(true);
    try {
      const raw = scheduleItem.rawPromo;
      if (raw && raw.titikIds && raw.titikIds.length > 1) {
        const remainingTitik = raw.titikIds.filter(id => id !== selectedTitik.id);
        await updateDoc(doc(db, 'promoList', scheduleItem.id), {
          titikIds: remainingTitik,
          jumlahTitik: String(remainingTitik.length)
        });
        showToast(`Titik ${selectedTitik.nomor} dilepas dari promo ini.`);
      } else {
        await deleteDoc(doc(db, 'promoList', scheduleItem.id));
        showToast(`Jadwal booking berhasil dihapus.`);
      }
    } catch (err) {
      console.error("Gagal menghapus booking:", err);
      showToast('Gagal menghapus jadwal promo.', 'error');
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Kunci Titik Permanen untuk Promo yang Sedang Menempati Titik Ini
  const handleLockTitikForPromo = async (promo) => {
    if (!promo || !selectedTitik) return;
    try {
      const currentIds = Array.isArray(promo.titikIds) ? promo.titikIds : [];
      const updatedIds = currentIds.includes(selectedTitik.id) ? currentIds : [...currentIds, selectedTitik.id];

      await updateDoc(doc(db, 'promoList', promo.id), {
        titikIds: updatedIds,
        titikId: selectedTitik.id,
        updatedAt: new Date().toISOString()
      });
      showToast(`Titik ${selectedTitik.nomor} berhasil dikunci permanen untuk ${promo.namaPerusahaan}!`);
    } catch (err) {
      console.error("Gagal mengunci titik:", err);
      showToast('Gagal mengunci titik.', 'error');
    }
  };

  // Buka Modal Pindah Titik
  const handleOpenRelocateModal = (promo) => {
    setRelocateModalData({ promo, currentTitikId: selectedTitik.id });
    setTargetNewTitikId('');
  };

  // Simpan Perpindahan Titik
  const handleSaveRelocation = async () => {
    if (!relocateModalData || !targetNewTitikId) return;
    setIsSavingRelocation(true);
    try {
      const promo = relocateModalData.promo;
      const currentIds = Array.isArray(promo.titikIds) && promo.titikIds.length > 0 ? promo.titikIds : [relocateModalData.currentTitikId];
      const updatedIds = currentIds.map(id => id === relocateModalData.currentTitikId ? targetNewTitikId : id);
      if (!updatedIds.includes(targetNewTitikId)) {
        updatedIds.push(targetNewTitikId);
      }

      await updateDoc(doc(db, 'promoList', promo.id), {
        titikIds: updatedIds,
        titikId: targetNewTitikId,
        updatedAt: new Date().toISOString()
      });

      showToast(`Berhasil memindahkan ${promo.namaPerusahaan} ke ${targetNewTitikId}!`);
      setRelocateModalData(null);
    } catch (err) {
      console.error("Gagal memindahkan titik:", err);
      showToast('Gagal memindahkan titik: ' + err.message, 'error');
    } finally {
      setIsSavingRelocation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] text-white font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border ${
          toast.type === 'error' ? 'bg-rose-700 border-rose-500' : 'bg-emerald-800 border-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-300" />}
          <span className="text-xs sm:text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <MapPin size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-emerald-950">Peta 100 Titik Promo Ragunan</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                1 Titik 1 Promo &bull; Anti-Bentrok
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Setiap titik hanya diisi 1 produk per hari. Klik pin untuk cek tanggal & status banner.</p>
          </div>
        </div>

        {/* Filter Tanggal, Zona & Stat Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Kalender Selector Tanggal */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-inner">
            <CalendarIcon size={15} className="text-emerald-700 shrink-0" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(normalizeDateToYMD(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              title="Pilih tanggal untuk mengecek ketersediaan titik"
            />
          </div>

          {/* Filter Zona Fleksibel */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-inner">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Zona:</span>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-950 outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Zona ({titikList.length})</option>
              {uniqueZones.map(z => (
                <option key={z} value={z}>Zona: {z}</option>
              ))}
              <option value="BELUM_DIATUR">Belum Diatur</option>
            </select>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Tersedia: <b>{stats.available}</b>
            </span>
            <span className="text-[11px] font-bold px-2 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Terisi: <b>{stats.booked}</b>
            </span>
          </div>

          {/* Mode Geser Pin Toggle */}
          <button 
            type="button"
            onClick={() => setIsDragMode(!isDragMode)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isDragMode 
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Klik untuk mengaktifkan geser pin di peta"
          >
            <Move size={13} />
            {isDragMode ? 'Geser Pin Aktif' : 'Atur Posisi'}
          </button>

          {/* Tombol Cepat Kembali ke Pusat Ragunan */}
          <button 
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([-6.3115, 106.8200], 16, { animate: true });
              }
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
            title="Pusatkan kembali ke kawasan Ragunan"
          >
            🎯 Pusat TMR
          </button>

          {/* Close Map Modal */}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-1"
              title="Tutup Peta"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Map Body & Drawer */}
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* Floating Banner Mode Geser Pin */}
        {isDragMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-amber-500 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 border border-amber-400 font-bold text-xs animate-in fade-in slide-in-from-top-2">
            <Move size={15} className="animate-pulse shrink-0" />
            <span>Mode Atur Posisi Aktif: Drag pin ke lokasi baru, tersimpan otomatis.</span>
            <button 
              type="button" 
              onClick={() => setIsDragMode(false)}
              className="px-2 py-0.5 bg-white text-amber-950 hover:bg-amber-50 rounded-lg text-xs font-black shadow-sm"
            >
              Selesai
            </button>
          </div>
        )}

        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0"></div>

        {/* Floating Detail Drawer (Ketika pin titik diklik) */}
        {selectedTitik && (
          <div className="absolute top-3 right-3 bottom-3 w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/90 z-20 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-250">
            
            {/* Drawer Header: Titik Number & Zona */}
            <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-emerald-50/60 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                    {selectedTitik.kode}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    activePromoOnSelectedTitik 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {activePromoOnSelectedTitik ? 'TERISI PROMO' : 'TERSEDIA (KOSONG)'}
                  </span>
                </div>
                <h3 className="text-base font-black text-emerald-950 leading-tight">
                  {selectedTitik.nama || `Titik Promo ${selectedTitik.nomor}`}
                </h3>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-slate-500">
                  {selectedTitik.zona ? `Zona: ${selectedTitik.zona}` : 'Zona: Fleksibel'}
                </span>
              </div>
              <button 
                onClick={() => {
                  setSelectedTitik(null);
                  setIsBookingFormOpen(false);
                  setEditingBookingId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all"
                title="Tutup Panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
              
              {/* JIKA FORM BOOKING DIBUKA: TAMPILKAN FORM INPUT PRE-BOOKING */}
              {isBookingFormOpen ? (
                <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Plus size={15} className="text-emerald-600" />
                      {editingBookingId ? `Edit Booking Titik ${selectedTitik.nomor}` : `Booking Titik ${selectedTitik.nomor}`}
                    </h4>
                    <button 
                      type="button"
                      onClick={() => setIsBookingFormOpen(false)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <form onSubmit={handleSaveBooking} className="space-y-3">
                    {/* Input Nama Brand / Perusahaan */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Nama Brand / Perusahaan <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={bookingFormData.namaPerusahaan}
                        onChange={(e) => setBookingFormData({...bookingFormData, namaPerusahaan: e.target.value})}
                        placeholder="Contoh: Sari Roti / Oreo / Unilever"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none transition-all"
                      />
                    </div>

                    {/* Input Nama Produk */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Nama Produk <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={bookingFormData.namaProduk}
                        onChange={(e) => setBookingFormData({...bookingFormData, namaProduk: e.target.value})}
                        placeholder="Contoh: Roti Tawar / Wafer Coklat / Sabun"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none transition-all"
                      />
                    </div>

                    {/* Pilihan Rentang Tanggal */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                          <CalendarIcon size={12} className="text-emerald-600" /> Tanggal Pelaksanaan
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setBookingFormData({...bookingFormData, dateMode: 'range'})}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              bookingFormData.dateMode === 'range' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            Rentang Tanggal
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingFormData({...bookingFormData, dateMode: 'single'})}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              bookingFormData.dateMode === 'single' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
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
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
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
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
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
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      )}

                      {/* Preview Rentang Tanggal Terpilih */}
                      {activeFormDates.length > 0 && (
                        <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span>Total: {activeFormDates.length} Hari</span>
                          <span className="text-[10px] text-emerald-700 truncate max-w-[170px]">
                            {formatDatesSummary(activeFormDates)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pilihan Pakai Banner atau Tidak */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Flag size={12} className="text-amber-600" /> Pemasangan Banner
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingFormData({...bookingFormData, hasBanner: true})}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            bookingFormData.hasBanner 
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Flag size={13} /> Pakai Banner
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingFormData({...bookingFormData, hasBanner: false})}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            !bookingFormData.hasBanner 
                              ? 'bg-slate-800 text-white border-slate-900 shadow-sm' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          🚫 Tanpa Banner
                        </button>
                      </div>

                      {bookingFormData.hasBanner && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase">Jumlah Banner:</span>
                          <input 
                            type="number"
                            min="1"
                            max="20"
                            value={bookingFormData.jumlahBanner}
                            onChange={(e) => setBookingFormData({...bookingFormData, jumlahBanner: e.target.value})}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center outline-none"
                          />
                          <span className="text-xs font-bold text-slate-600">Buah</span>
                        </div>
                      )}
                    </div>

                    {/* Indikator Anti-Bentrok Realtime */}
                    {conflictCheck.hasConflict ? (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2 animate-pulse">
                        <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-rose-950">⚠️ BENTROK TERDETEKSI!</p>
                          <p className="text-[11px] text-rose-800 mt-0.5 leading-snug">
                            Titik ini sudah terisi pada tanggal <b>{conflictCheck.conflictingDate}</b> oleh <b>{conflictCheck.conflictingBrand}</b> ({conflictCheck.conflictingProduk}).
                          </p>
                          <p className="text-[10px] text-rose-600 font-semibold mt-1">
                            Satu titik tidak bisa diisi 2 promo di hari yang sama. Silakan ganti tanggal atau pilih titik lain.
                          </p>
                        </div>
                      </div>
                    ) : (
                      activeFormDates.length > 0 && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>✅ Tanggal Tersedia: Bebas bentrok di Titik {selectedTitik.nomor}.</span>
                        </div>
                      )
                    )}

                    {/* Tombol Simpan */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsBookingFormOpen(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingBooking || conflictCheck.hasConflict}
                        className={`flex-[2] py-2 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                          conflictCheck.hasConflict 
                            ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                        }`}
                      >
                        {isSavingBooking ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Simpan Booking Titik
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {/* SEKSI 1: STATUS PADA TANGGAL TERPILIH (HANYA 1 PROMO TUNGGAL, TANGGAL, PRODUK, BANNER) */}
                  <div className={`p-4 rounded-2xl border ${
                    activePromoOnSelectedTitik
                      ? 'bg-rose-50/90 border-rose-200 shadow-sm'
                      : 'bg-emerald-50/90 border-emerald-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Status Tanggal: {formatShortDate(selectedDate)}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        activePromoOnSelectedTitik ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                      }`}>
                        {activePromoOnSelectedTitik ? 'Terisi Promo (1 Mitra)' : 'Tersedia (Kosong)'}
                      </span>
                    </div>

                    {activePromoOnSelectedTitik ? (
                      <div className="space-y-2">
                        {/* Nama Brand & Nama Produk */}
                        <div className="bg-white/90 p-3 rounded-xl border border-rose-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500">
                            <span>🏷️ Brand:</span>
                            <span className="text-slate-900 font-black">{activePromoOnSelectedTitik.namaPerusahaan}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-black text-rose-950">
                            <span>📦 Produk:</span>
                            <span className="text-rose-700 font-black">{activePromoOnSelectedTitik.namaProduk}</span>
                          </div>
                        </div>

                        {/* Tanggal & Banner */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100 flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Tanggal Promo</span>
                            <span className="font-extrabold text-slate-800 mt-0.5 truncate">
                              {activePromoOnSelectedTitik.tanggalPromo || formatShortDate(selectedDate)}
                            </span>
                          </div>

                          <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100 flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Status Banner</span>
                            <span className={`font-black mt-0.5 flex items-center gap-1 ${
                              activePromoOnSelectedTitik.hasBanner || parseInt(activePromoOnSelectedTitik.jumlahBanner, 10) > 0 ? 'text-amber-700' : 'text-slate-500'
                            }`}>
                              {activePromoOnSelectedTitik.hasBanner || parseInt(activePromoOnSelectedTitik.jumlahBanner, 10) > 0
                                ? `🚩 Pakai (${activePromoOnSelectedTitik.jumlahBanner || 1} Buah)` 
                                : '🚫 Tanpa Banner'}
                            </span>
                          </div>
                        </div>

                        {/* Tombol Aksi: Pindah Titik, Kunci Titik, Edit, Hapus */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-rose-100">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenRelocateModal(activePromoOnSelectedTitik)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              title="Pindahkan promo ini ke titik nomor lain"
                            >
                              <ArrowRightLeft size={13} /> Pindah Titik
                            </button>

                            {/* Tombol Kunci Titik jika belum dikunci di database */}
                            {(!activePromoOnSelectedTitik.titikIds || !activePromoOnSelectedTitik.titikIds.includes(selectedTitik.id)) && (
                              <button
                                type="button"
                                onClick={() => handleLockTitikForPromo(activePromoOnSelectedTitik)}
                                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                                title="Kunci titik ini secara permanen untuk promo ini"
                              >
                                <Lock size={12} /> Kunci Titik
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBooking({
                                id: activePromoOnSelectedTitik.id,
                                namaPerusahaan: activePromoOnSelectedTitik.namaPerusahaan,
                                namaProduk: activePromoOnSelectedTitik.namaProduk,
                                dates: extractPromoDates(activePromoOnSelectedTitik),
                                hasBanner: activePromoOnSelectedTitik.hasBanner,
                                jumlahBanner: activePromoOnSelectedTitik.jumlahBanner,
                                rawPromo: activePromoOnSelectedTitik
                              })}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all"
                              title="Edit Detail Promo"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingBooking}
                              onClick={() => handleDeleteBooking({
                                id: activePromoOnSelectedTitik.id,
                                namaPerusahaan: activePromoOnSelectedTitik.namaPerusahaan,
                                namaProduk: activePromoOnSelectedTitik.namaProduk,
                                rawPromo: activePromoOnSelectedTitik
                              })}
                              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold shadow-sm transition-all"
                              title="Hapus / Batalkan Booking"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" /> Siap Ditempati
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-700 mt-0.5 mb-3 leading-relaxed">
                          Titik ini masih kosong pada tanggal <b>{formatShortDate(selectedDate)}</b>. Siap dialokasikan untuk brand baru.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenNewBooking(selectedDate)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Plus size={14} /> Booking Titik Ini di Tanggal Ini
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SEKSI 2: DAFTAR SELURUH JADWAL / AGENDA DI TITIK INI (LINTAS TANGGAL / HIGH SEASON) */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <CalendarIcon size={14} className="text-emerald-700" /> Agenda Seluruh Jadwal di Titik Ini
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {titikSchedules.length} Jadwal
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      Pengaturan slot libur panjang/high season (1 Titik bisa diisi bergantian sesuai tanggalnya):
                    </p>

                    {/* Tombol Tambah Jadwal Baru */}
                    <button
                      type="button"
                      onClick={() => handleOpenNewBooking()}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus size={14} /> + Tambah Jadwal / Booking Titik Ini
                    </button>

                    {/* List Jadwal Titik */}
                    {titikSchedules.length > 0 ? (
                      <div className="space-y-2">
                        {titikSchedules.map((item, idx) => (
                          <div 
                            key={item.id || idx}
                            className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 shadow-sm transition-all flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              {/* Tanggal Badge */}
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mb-1.5">
                                <CalendarIcon size={11} className="text-emerald-600" />
                                <span>{item.tanggalPromo}</span>
                              </div>

                              {/* Brand & Produk */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {item.namaPerusahaan}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-800 truncate">
                                  &bull; {item.namaProduk}
                                </span>
                              </div>

                              {/* Status Banner */}
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

                            {/* Tombol Aksi */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenRelocateModal(item.rawPromo)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Pindahkan ke Titik Lain"
                              >
                                <ArrowRightLeft size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditBooking(item)}
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
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-slate-500 text-xs">
                        Belum ada jadwal promo di titik ini. Titik ini kosong dan bebas di-booking.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SEKSI 3: Form Kelola Koordinat & Zona Titik (Ringkas / Accordion) */}
              <details className="group pt-2 border-t border-slate-100">
                <summary className="text-xs font-bold text-slate-500 cursor-pointer flex items-center justify-between hover:text-emerald-700 select-none py-1">
                  <span className="flex items-center gap-1.5">
                    <Info size={14} /> Atur Nama & Zona Titik (Fleksibel)
                  </span>
                  <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <form onSubmit={handleSaveEditTitikForm} className="space-y-3 mt-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Nama Titik
                    </label>
                    <input 
                      type="text" 
                      value={editTitikForm.nama}
                      onChange={(e) => setEditTitikForm({...editTitikForm, nama: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Zona (Fleksibel)
                    </label>
                    <input 
                      type="text" 
                      value={editTitikForm.zona}
                      onChange={(e) => setEditTitikForm({...editTitikForm, zona: e.target.value})}
                      placeholder="Contoh: Zona A, Plaza Barat, dll"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Keterangan / Patokan Lapangan
                    </label>
                    <input 
                      type="text" 
                      value={editTitikForm.keterangan}
                      onChange={(e) => setEditTitikForm({...editTitikForm, keterangan: e.target.value})}
                      placeholder="Dekat pos security / pohon beringin"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div>Lat: <b>{editTitikForm.lat}</b></div>
                    <div>Lng: <b>{editTitikForm.lng}</b></div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSavingTitik}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {isSavingTitik ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan Perubahan Titik
                  </button>
                </form>
              </details>

            </div>
          </div>
        )}

        {/* MODAL PINDAH TITIK (RELOKASI PROMO KE NOMOR TITIK LAIN) */}
        {relocateModalData && (
          <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                    <ArrowRightLeft size={18} className="text-emerald-600" />
                    Pindahkan Lokasi Titik Promo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Pindahkan promo ini ke titik yang masih kosong pada tanggal <b>{formatShortDate(selectedDate)}</b>.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setRelocateModalData(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Info Promo yang Dipindah */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Brand:</span>
                  <span className="font-black text-slate-900">{relocateModalData.promo.namaPerusahaan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Produk:</span>
                  <span className="font-black text-emerald-800">{relocateModalData.promo.namaProduk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Posisi Saat Ini:</span>
                  <span className="font-black text-rose-700">{relocateModalData.currentTitikId}</span>
                </div>
              </div>

              {/* Selector Titik Tujuan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Pilih Titik Tujuan Baru:
                </label>
                <select
                  value={targetNewTitikId}
                  onChange={(e) => setTargetNewTitikId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Nomor Titik Kosong --</option>
                  {titikList.map(t => {
                    const occupiedPromo = bookedTitikOnSelectedDateMap[t.id];
                    const isOccupied = !!occupiedPromo && occupiedPromo.id !== relocateModalData.promo.id;
                    const isCurrent = t.id === relocateModalData.currentTitikId;

                    return (
                      <option 
                        key={t.id} 
                        value={t.id}
                        disabled={isOccupied}
                      >
                        {t.kode} - {t.nama} {isCurrent ? '(Titik Saat Ini)' : isOccupied ? `(Terisi: ${occupiedPromo.namaPerusahaan})` : '🟢 Tersedia'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRelocateModalData(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!targetNewTitikId || isSavingRelocation || targetNewTitikId === relocateModalData.currentTitikId}
                  onClick={handleSaveRelocation}
                  className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isSavingRelocation ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Simpan Perpindahan Titik
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
