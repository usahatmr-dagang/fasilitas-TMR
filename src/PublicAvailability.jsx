/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Calendar, CheckCircle2, AlertCircle, Tent, TreePine, X, Image, Film } from 'lucide-react';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
];

export default function PublicAvailability() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [masterLokasi, setMasterLokasi] = useState([]);
  const [sewaList, setSewaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMedia, setViewMedia] = useState(null);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  useEffect(() => {
    const unsubLokasi = onSnapshot(collection(db, 'masterLokasi'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let finalData = data.length > 0 ? data : defaultDataLokasi;
      
      finalData.sort((a, b) => {
          const urutanA = a.urutan ?? 999;
          const urutanB = b.urutan ?? 999;
          
          if (urutanA !== urutanB) {
              return urutanA - urutanB;
          }

          if (a.tipe !== b.tipe) {
              return a.tipe === 'pendopo' ? -1 : 1;
          }
          return (a.nama || '').localeCompare(b.nama || '');
      });

      setMasterLokasi([...finalData]);
    }, (error) => {
      console.error("Gagal memuat master lokasi:", error);
      setMasterLokasi([...defaultDataLokasi]);
    });

    const unsubSewa = onSnapshot(collection(db, 'publicSewaList'), (snapshot) => {
      setSewaList(snapshot.docs.map(doc => ({ id_sewa: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Gagal memuat daftar sewa:", error);
      alert("Akses ditolak: Anda tidak memiliki izin untuk melihat data ketersediaan (Aturan Firebase belum dibuka untuk publik).");
      setLoading(false);
    });

    return () => { unsubLokasi(); unsubSewa(); };
  }, []);

  const fasilitasHarian = masterLokasi.map(lokasi => {
    const booking = sewaList.find(sewa => sewa.tanggal_sewa === selectedDate && sewa.lokasi_sewa === lokasi.nama);
    return { ...lokasi, isBooked: !!booking };
  });

  const fasilitasTersedia = fasilitasHarian.filter(fas => !fas.isBooked);
  const fasilitasDisewa = fasilitasHarian.filter(fas => fas.isBooked);

  const handleOpenMedia = (lokasi) => {
      setViewMedia(lokasi);
  };

  const renderCard = (fas) => {
      const Icon = fas.tipe === 'lapangan' ? TreePine : Tent;
      const validPhotos = fas.photos ? fas.photos.filter(p => p) : [];
      const hasMedia = validPhotos.length > 0 || fas.video;

      return (
          <div key={fas.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(4,120,87,0.03)] hover:shadow-[0_8px_30px_rgba(4,120,87,0.08)] transition-all duration-300 flex flex-col group relative overflow-hidden">
              {hasMedia && <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>}
              
              <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-2xl transition-colors ${fas.tipe === 'lapangan' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}`}>
                          <Icon size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                          <h3 className="font-black text-emerald-950 text-sm md:text-base leading-tight">{fas.nama}</h3>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">{fas.tipe}</p>
                      </div>
                  </div>
              </div>
              
              <div className="mt-auto border-t border-slate-100/80 pt-4 flex items-center justify-between">
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider flex items-center ${fas.isBooked ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {fas.isBooked ? <><AlertCircle size={12} className="mr-1.5"/> DISEWA</> : <><CheckCircle2 size={12} className="mr-1.5"/> TERSEDIA</>}
                  </div>
                  
                  <button 
                    onClick={() => handleOpenMedia(fas)}
                    className="p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700"
                    title="Lihat Foto & Video"
                  >
                      <Image size={16} />
                  </button>
              </div>
          </div>
      );
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-[#F4F7F4] text-emerald-800 font-bold">Memuat Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F4] font-sans selection:bg-amber-200 selection:text-emerald-900 pb-20">
      <div className="bg-gradient-to-r from-[#022c22] via-[#043e30] to-[#01140f] pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-100 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Ketersediaan Fasilitas TMR</h1>
            <p className="text-emerald-100/80 font-medium max-w-xl mx-auto">Silakan pilih tanggal untuk melihat daftar fasilitas yang masih tersedia untuk disewa.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 mb-8 flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center text-emerald-950 font-bold bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 w-full md:w-auto">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mr-4 text-emerald-700 shadow-sm shrink-0">
                      <Calendar size={24} />
                  </div>
                  <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Cek Tanggal</p>
                      <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="bg-transparent border-none p-0 text-lg font-black focus:ring-0 outline-none cursor-pointer w-full text-emerald-950"
                      />
                  </div>
              </div>
          </div>

          <div className="space-y-10">
              <div>
                  <h2 className="text-xl font-black text-emerald-900 mb-5 flex items-center">
                      <CheckCircle2 className="mr-2 text-emerald-600" /> Fasilitas Tersedia
                      <span className="ml-3 bg-emerald-100 text-emerald-800 text-xs py-1 px-2.5 rounded-full">{fasilitasTersedia.length}</span>
                  </h2>
                  {fasilitasTersedia.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {fasilitasTersedia.map(renderCard)}
                      </div>
                  ) : (
                      <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                          <p className="text-slate-500 font-bold">Tidak ada fasilitas yang tersedia pada tanggal ini.</p>
                      </div>
                  )}
              </div>

              <div>
                  <h2 className="text-xl font-black text-rose-900 mb-5 flex items-center">
                      <AlertCircle className="mr-2 text-rose-600" /> Fasilitas Sedang Disewa
                      <span className="ml-3 bg-rose-100 text-rose-800 text-xs py-1 px-2.5 rounded-full">{fasilitasDisewa.length}</span>
                  </h2>
                  {fasilitasDisewa.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80 grayscale-[0.3]">
                          {fasilitasDisewa.map(renderCard)}
                      </div>
                  ) : (
                      <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                          <p className="text-slate-500 font-bold">Belum ada fasilitas yang disewa pada tanggal ini.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {viewMedia && (
          <div className="fixed inset-0 bg-[#022c22]/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={() => setViewMedia(null)}>
              <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                      <div>
                          <h3 className="font-black text-lg text-emerald-950 tracking-tight">{viewMedia.nama}</h3>
                          <p className="text-xs font-bold text-emerald-600 mt-0.5 uppercase tracking-widest">{viewMedia.tipe}</p>
                      </div>
                      <button type="button" onClick={() => setViewMedia(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all duration-200"><X size={18} /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto bg-slate-50 flex-1 hide-scrollbar">
                      <div className="space-y-8">
                          {(!viewMedia.photos || viewMedia.photos.filter(p=>p).length === 0) && !viewMedia.video && (
                              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                  <Image size={48} className="opacity-20 mb-3"/>
                                  <p className="text-sm font-bold">Foto dan Video belum tersedia untuk lokasi ini.</p>
                              </div>
                          )}

                          {viewMedia.photos && viewMedia.photos.filter(p=>p).length > 0 && (
                              <div>
                                  <h4 className="text-sm font-black text-emerald-950 flex items-center mb-4"><Image size={16} className="mr-2 text-emerald-600"/> Galeri Foto</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {viewMedia.photos.filter(p=>p).map((photo, i) => (
                                          <button type="button" key={i} onClick={() => setZoomedPhoto(photo)} className="block relative group overflow-hidden rounded-2xl shadow-sm border border-slate-200 w-full aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                              <img src={photo} alt={`Foto ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-slate-200" />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {viewMedia.video && (
                              <div>
                                  <h4 className="text-sm font-black text-emerald-950 flex items-center mb-4"><Film size={16} className="mr-2 text-blue-600"/> Video Lokasi</h4>
                                  <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-black">
                                      {(() => {
                                          const ytMatch = viewMedia.video.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                                          const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
                                          return ytId ? (
                                              <iframe src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen className="w-full h-[300px] sm:h-[400px]" />
                                          ) : (
                                              <a href={viewMedia.video} target="_blank" rel="noreferrer" className="text-blue-400 block p-8 text-center underline break-all">{viewMedia.video}</a>
                                          );
                                      })()}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      {/* Lightbox Photo View */}
      {zoomedPhoto && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex justify-center items-center p-2 sm:p-4 animate-fade-in" onClick={() => setZoomedPhoto(null)}>
              <button type="button" onClick={() => setZoomedPhoto(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white/10 text-white hover:bg-white/20 hover:scale-110 rounded-full transition-all duration-200 shadow-xl z-[210]">
                  <X size={24} />
              </button>
              <img src={zoomedPhoto} alt="Zoomed View" className="max-w-full max-h-[95vh] object-contain rounded-2xl shadow-2xl transition-transform" onClick={e => e.stopPropagation()} />
          </div>
      )}
    </div>
  );
}
