import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Layers, 
  Move, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Building, 
  Tag, 
  Save, 
  Loader2, 
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { defaultTitikPromoList } from '../data/defaultTitikPromo';

// Map layer sources (Google Maps & OSM tiles)
const TILE_LAYERS = {
  googleHybrid: {
    name: 'Google Satelit',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  googleRoad: {
    name: 'Google Jalan',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

export default function PromoMapView({ promoList = [], initialDate = null, onClose }) {
  // Format tanggal YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayStr());
  const [filterZona, setFilterZona] = useState('SEMUA');
  const [mapLayerKey, setMapLayerKey] = useState('googleHybrid');
  const [isDragMode, setIsDragMode] = useState(false);
  const [titikList, setTitikList] = useState(defaultTitikPromoList);
  const [selectedTitik, setSelectedTitik] = useState(null);
  const [isSavingTitik, setIsSavingTitik] = useState(false);
  const [toast, setToast] = useState(null);

  // Form edit titik lokal
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

  // 1. Sinkronisasi Data 100 Titik dari Firestore (dengan fallback defaultTitikPromoList)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'masterTitikPromo'), (snapshot) => {
      if (!snapshot.empty) {
        const remotePoints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Gabungkan remote dengan default (pastikan 100 titik selalu lengkap)
        const merged = defaultTitikPromoList.map(def => {
          const found = remotePoints.find(r => r.id === def.id || r.nomor === def.nomor);
          return found ? { ...def, ...found } : def;
        });
        setTitikList(merged);
      } else {
        setTitikList(defaultTitikPromoList);
      }
    }, (err) => {
      console.warn("Gagal membaca masterTitikPromo dari firestore:", err);
      setTitikList(defaultTitikPromoList);
    });

    return () => unsub();
  }, []);

  // Zona unik yang sudah ditentukan admin
  const uniqueZones = useMemo(() => {
    const zones = new Set();
    titikList.forEach(t => {
      if (t.zona && t.zona.trim()) {
        zones.add(t.zona.trim());
      }
    });
    return Array.from(zones);
  }, [titikList]);

  // 2. Pemetaan Booking Promo pada tanggal terpilih
  const bookedTitikMap = useMemo(() => {
    const mapping = {}; // titikId -> array of promo object
    if (!selectedDate) return mapping;

    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const selMonthName = monthNames[selMonth - 1] || '';

    promoList.forEach(promo => {
      // Cek apakah promo aktif di selectedDate
      let isActive = false;
      
      if (promo.selectedDates && Array.isArray(promo.selectedDates)) {
        isActive = promo.selectedDates.some(d => {
          const dateStr = typeof d === 'object' && d !== null ? d.date : d;
          return dateStr === selectedDate;
        });
      } else if (promo.tanggalTransfer === selectedDate) {
        isActive = true;
      }

      // Fallback matching teks tanggal (seperti "18 Oktober 2026")
      if (!isActive && promo.tanggalPromo) {
        const dayStr = String(selDay);
        if (promo.tanggalPromo.includes(dayStr) && promo.tanggalPromo.toLowerCase().includes(selMonthName.toLowerCase())) {
          isActive = true;
        }
      }

      if (isActive) {
        // Jika promo memiliki spesifik titikIds
        if (promo.titikIds && Array.isArray(promo.titikIds) && promo.titikIds.length > 0) {
          promo.titikIds.forEach(tId => {
            if (!mapping[tId]) mapping[tId] = [];
            mapping[tId].push(promo);
          });
        } else {
          // Fallback alokasi titik jika belum dispesifikasikan (berdasarkan urutan titik)
          const qty = parseInt(promo.jumlahTitik) || 1;
          for (let k = 1; k <= qty; k++) {
            const fakeId = `TP-${String(k).padStart(3, '0')}`;
            if (!mapping[fakeId]) mapping[fakeId] = [];
            mapping[fakeId].push(promo);
          }
        }
      }
    });

    return mapping;
  }, [promoList, selectedDate]);

  // Statistik Titik pada tanggal terpilih
  const stats = useMemo(() => {
    const bookedCount = Object.keys(bookedTitikMap).length;
    return {
      total: titikList.length,
      booked: bookedCount,
      available: Math.max(0, titikList.length - bookedCount)
    };
  }, [titikList, bookedTitikMap]);

  // 3. Inisialisasi Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Pusat Ragunan: Lat -6.3121, Lng 106.8201
      const map = L.map(mapContainerRef.current, {
        center: [-6.3121, 106.8201],
        zoom: 15,
        minZoom: 14,
        maxZoom: 19,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Batasi geser peta agar tidak keluar dari kawasan Ragunan
      const ragunanBounds = L.latLngBounds(
        L.latLng(-6.3250, 106.8080),
        L.latLng(-6.3000, 106.8320)
      );
      map.setMaxBounds(ragunanBounds);

      // Tile layer awal
      const layerConfig = TILE_LAYERS[mapLayerKey];
      tileLayerRef.current = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19
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

  // Ganti tile layer ketika layerKey berubah
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const layerConfig = TILE_LAYERS[mapLayerKey];
    tileLayerRef.current = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
  }, [mapLayerKey]);

  // 4. Render Marker untuk ke-100 Titik
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Bersihkan marker lama yang tidak ada
    const currentPointIds = new Set(titikList.map(t => t.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentPointIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    titikList.forEach(titik => {
      const isBooked = !!bookedTitikMap[titik.id];
      const activePromos = bookedTitikMap[titik.id] || [];
      const nomor = titik.nomor || parseInt(titik.id.replace(/\D/g, '')) || 0;

      const isZoneMatched = filterZona === 'SEMUA' 
        ? true 
        : filterZona === 'BELUM_DIATUR' 
          ? (!titik.zona || !titik.zona.trim()) 
          : (titik.zona && titik.zona.trim().toLowerCase() === filterZona.toLowerCase());

      const opacityClass = isZoneMatched ? 'opacity-100' : 'opacity-20 pointer-events-none';

      // Icon HTML kustom dengan nomor titik & warna status
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125 ${opacityClass}">
          ${isBooked ? '<span class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></span>' : ''}
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white ${
            isBooked 
              ? 'bg-rose-600 text-white shadow-rose-600/50' 
              : 'bg-emerald-600 text-white shadow-emerald-600/50 hover:bg-emerald-500'
          }">
            ${nomor}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-promo-pin',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
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

          // Simpan koordinat baru langsung ke state lokal
          setTitikList(prev => prev.map(t => t.id === titik.id ? { ...t, lat: updatedLat, lng: updatedLng } : t));
          
          // Simpan ke Firestore
          saveTitikToFirestore(titik.id, { lat: updatedLat, lng: updatedLng });
        });

        markersRef.current[titik.id] = marker;
      } else {
        marker.setLatLng([titik.lat, titik.lng]);
        marker.setIcon(customIcon);
        marker.setDraggable(isDragMode);
      }

      // Tooltip sederhana saat hover
      const tooltipContent = isBooked 
        ? `<b>${titik.nama}</b><br/><span style="color:#e11d48">Terisi: ${activePromos[0]?.namaProduk || activePromos[0]?.namaPerusahaan || 'Promo'}</span><br/><span style="color:#334155">Pengaju: ${activePromos[0]?.namaPenandaTangan || '-'}</span>`
        : `<b>${titik.nama}</b><br/><span style="color:#059669">Tersedia (Bisa Disewa)</span>${titik.zona ? `<br/><span style="color:#64748b">Zona: ${titik.zona}</span>` : ''}`;

      marker.bindTooltip(tooltipContent, { offset: [0, -10], direction: 'top' });
    });

  }, [titikList, bookedTitikMap, isDragMode, filterZona]);

  // Simpan perubahan data titik (zona, keterangan, koordinat) ke Firestore
  const saveTitikToFirestore = async (titikId, partialData) => {
    try {
      const docRef = doc(db, 'masterTitikPromo', titikId);
      await setDoc(docRef, partialData, { merge: true });
      showToast('Posisi / Data titik berhasil disimpan!');
    } catch (err) {
      console.error("Gagal menyimpan titik ke firestore:", err);
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
        zona: editTitikForm.zona.trim(), // Fleksibel
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

  const activePromosForSelectedTitik = selectedTitik ? (bookedTitikMap[selectedTitik.id] || []) : [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-emerald-800 text-white font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-600">
          <CheckCircle2 size={18} className="text-emerald-300" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <MapPin size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-emerald-950">Peta 100 Titik Promo Ragunan</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live Interactive
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Klik pin untuk melihat detail produk, kontak pengaju, atau sesuaikan posisi titik.</p>
          </div>
        </div>

        {/* Filter Tanggal, Zona & Stat Badges */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Kalender Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-inner">
            <CalendarIcon size={16} className="text-emerald-700 shrink-0" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            />
          </div>

          {/* Filter Zona Fleksibel */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-inner">
            <span className="text-[10px] font-extrabold uppercase text-slate-500">Zona:</span>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-950 outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Zona ({titikList.length} Titik)</option>
              {uniqueZones.map(z => (
                <option key={z} value={z}>Zona: {z}</option>
              ))}
              <option value="BELUM_DIATUR">Zona Belum Ditentukan</option>
            </select>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Total: <b>{stats.total} Titik</b>
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Tersedia: <b>{stats.available}</b>
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Terisi: <b>{stats.booked}</b>
            </span>
          </div>

          {/* Mode Geser Pin Toggle */}
          <button 
            type="button"
            onClick={() => setIsDragMode(!isDragMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isDragMode 
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Klik untuk mengaktifkan/menonaktifkan geser pin di peta"
          >
            <Move size={14} />
            {isDragMode ? 'Mode Geser Aktif (Drag Pin)' : 'Atur Posisi Pin'}
          </button>

          {/* Layer Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {Object.keys(TILE_LAYERS).map(key => (
              <button
                key={key}
                onClick={() => setMapLayerKey(key)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  mapLayerKey === key 
                    ? 'bg-white text-emerald-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {TILE_LAYERS[key].name}
              </button>
            ))}
          </div>

          {/* Close Map Modal */}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-1"
              title="Tutup Peta"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Map Body & Drawer */}
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0"></div>

        {/* Floating Detail Drawer (Ketika pin titik diklik) */}
        {selectedTitik && (
          <div className="absolute top-4 right-4 bottom-4 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 z-20 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-emerald-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    activePromosForSelectedTitik.length > 0 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {activePromosForSelectedTitik.length > 0 ? 'TERISI PROMO' : 'TERSEDIA (KOSONG)'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{selectedTitik.kode}</span>
                </div>
                <h3 className="text-lg font-black text-emerald-950 leading-tight">
                  {selectedTitik.nama || `Titik Promo ${selectedTitik.nomor}`}
                </h3>
                {selectedTitik.zona ? (
                  <span className="inline-block mt-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Zona: {selectedTitik.zona}
                  </span>
                ) : (
                  <span className="inline-block mt-1 text-xs font-semibold text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded-md">
                    Zona: Fleksibel (Belum ditentukan)
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedTitik(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              
              {/* Jika Ada Booking Promo di Titik Ini */}
              {activePromosForSelectedTitik.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag size={14} className="text-rose-500" /> Detail Promo di Tanggal Ini
                  </h4>

                  {activePromosForSelectedTitik.map((p, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <h5 className="font-black text-emerald-950 text-base">{p.namaPerusahaan || '-'}</h5>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                            p.status === 'Terverifikasi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status || 'Belum Verifikasi'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-700 mt-0.5">Produk: {p.namaProduk || '-'}</p>
                      </div>

                      {/* DATA PENGAJU PROMO LENGKAP & WHATSAPP */}
                      <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-sm">
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                          Data Pengaju / Penanggung Jawab:
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.namaPenandaTangan || 'Nama belum diisi'}</p>
                            <p className="text-xs font-mono font-semibold text-slate-500">{p.noHp || 'No HP belum diisi'}</p>
                          </div>
                          {p.noHp && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={`https://wa.me/${String(p.noHp).replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                                  `Halo Bapak/Ibu ${p.namaPenandaTangan || ''}, kami dari pihak Pengelola Taman Margasatwa Ragunan ingin menghubungi terkait permohonan promo ${p.namaProduk || ''} (${p.namaPerusahaan || ''}) di ${selectedTitik.nama}...`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                title="Hubungi Pengaju via WhatsApp"
                              >
                                <Phone size={12} /> WhatsApp
                              </a>
                              <a
                                href={`tel:${String(p.noHp).replace(/\D/g, '')}`}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs transition-all"
                                title="Telepon Langsung"
                              >
                                <Phone size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Jumlah Titik</span>
                          <span className="font-bold text-slate-800">{p.jumlahTitik || 1} Titik</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Jumlah Banner</span>
                          <span className="font-bold text-slate-800">{p.jumlahBanner || 0} Buah</span>
                        </div>
                      </div>

                      {p.pksDriveUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(p.pksDriveUrl, '_blank')}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ExternalLink size={14} /> Buka Dokumen PKS di Google Drive
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-center">
                  <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
                  <p className="font-extrabold text-emerald-950 text-sm">Titik Ini Masih Tersedia</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Belum ada promo yang mengisi titik ini pada tanggal <b>{selectedDate}</b>.
                  </p>
                </div>
              )}

              {/* Form Kelola Informasi Titik & Koordinat */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Info size={14} /> Atur Nama & Zona Titik (Fleksibel)
                </h4>

                <form onSubmit={handleSaveEditTitikForm} className="space-y-3">
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
                      Zona (Bisa Diatur Fleksibel Kapan Saja)
                    </label>
                    <input 
                      type="text" 
                      value={editTitikForm.zona}
                      onChange={(e) => setEditTitikForm({...editTitikForm, zona: e.target.value})}
                      placeholder="Contoh: Zona Utara, Zona Schmutzer, atau kosongkan"
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
                      placeholder="Misal: Dekat pos security / dekat pohon beringin"
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
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {isSavingTitik ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan Perubahan Titik
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
