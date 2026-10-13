import React from 'react';
import { 
  X, 
  Trash2, 
  TreePine, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Save 
} from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  selectedDate,
  cartLokasi,
  setCartLokasi,
  formData,
  setFormData,
  isCustomPicCheckout,
  setIsCustomPicCheckout,
  picList,
  handleSubmitBooking,
  formatTanggalIndo,
  formatTanggalPendek,
  formatRupiah,
  getBiayaLokasi
}) {
  if (!isOpen || cartLokasi.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-[#022c22]/60 backdrop-blur-sm z-[50] flex justify-center items-end sm:items-center p-0 sm:p-4 pb-14 sm:pb-0 animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_-8px_40px_-4px_rgba(4,120,87,0.18)] sm:shadow-[0_25px_50px_-12px_rgba(4,120,87,0.15)] w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[calc(94vh-3.5rem)] sm:max-h-[92vh] border border-emerald-100/50 transition-all duration-300 animate-slide-up-sheet sm:animate-none">
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-emerald-800/10 flex items-center justify-between bg-gradient-to-r from-[#022c22] via-[#043e30] to-[#01140f] text-white shadow-md">
          <div>
            <h3 className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Formulir Checkout
            </h3>
            <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase mt-0.5">
              {cartLokasi.length} Fasilitas Terpilih • {formatTanggalIndo(selectedDate)}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 hover:scale-105"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form fields */}
        <div className="overflow-y-auto flex-1 visible-scrollbar bg-slate-50/50 pr-1">
          <form id="booking-form" onSubmit={handleSubmitBooking} className="p-4 sm:p-6 space-y-4 relative z-10">
            
            {/* Ringkasan Fasilitas */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2">
                Fasilitas yang Dipesan
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                {cartLokasi.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold bg-slate-50 p-2 rounded-lg border border-slate-100 group">
                    <span className="text-emerald-800 flex items-center flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 shrink-0"></span>
                      <span className="truncate pr-2">{item.nama}</span>
                    </span>
                    <div className="flex items-center shrink-0">
                      <span className="text-slate-500">
                        {item.tipe === 'lapangan' ? 'TBD' : formatRupiah(getBiayaLokasi(item.nama))}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newCart = cartLokasi.filter(l => l.nama !== item.nama);
                          setCartLokasi(newCart);
                          if (newCart.length === 0) onClose();
                        }}
                        className="ml-2.5 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-white border border-slate-200 rounded-lg transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] active:scale-95"
                        title="Hapus fasilitas"
                      >
                        <Trash2 size={12} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KHUSUS LAPANGAN: Input Luas Lahan (Berlaku untuk semua lapangan) */}
            {cartLokasi.some(l => l.tipe === 'lapangan') && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-[0.04] text-emerald-850">
                  <TreePine size={96}/>
                </div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2">
                  Total Luas Lahan Digunakan (Minimal 50 m²)
                </label>
                <p className="text-[10px] text-emerald-700 font-bold mb-3">
                  Jika menyewa lebih dari 1 lapangan, luas lahan ini akan dibagi rata ke semua lapangan.
                </p>
                <div className="flex items-center space-x-3">
                  <input 
                    required 
                    type="number" 
                    min="50" 
                    value={formData.luasLahan} 
                    onChange={(e) => setFormData({ ...formData, luasLahan: e.target.value })} 
                    className="w-28 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none text-base bg-white font-extrabold text-center shadow-inner" 
                  />
                  <span className="font-bold text-emerald-800 text-sm">m² × Rp 2.000 / m²</span>
                </div>
              </div>
            )}

            {/* PAKET GAZEBO SPESIAL */}
            {cartLokasi.some(l => l.nama === 'GAZEBO') && (
              <div className={`border rounded-3xl p-4 shadow-sm transition-all duration-300 cursor-pointer ${formData.isGazeboPackage ? 'border-amber-300 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20' : 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'}`}>
                <label className="flex items-start cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={formData.isGazeboPackage} 
                    onChange={(e) => setFormData({ ...formData, isGazeboPackage: e.target.checked })} 
                    className="mt-1 w-5 h-5 text-amber-500 rounded border-slate-350 focus:ring-amber-500 cursor-pointer shrink-0" 
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-extrabold text-emerald-950 flex items-center">
                      Ambil Paket Lahan Depan Gazebo
                    </span>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                      Biaya Gazebo menjadi Total <strong className="text-amber-600">Rp 650.000</strong> (Sudah termasuk sewa lahan bagian depan gazebo)
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Ringkasan Biaya Realtime */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(4,120,87,0.02)] space-y-3">
              {(() => {
                const jumlahLapangan = cartLokasi.filter(l => l.tipe === 'lapangan').length;
                const isLapangan = jumlahLapangan > 0;
                const luas_lahan_total = isLapangan ? Math.max(Number(formData.luasLahan), 50) : null;
                const luas_per_lapangan = isLapangan ? (luas_lahan_total / jumlahLapangan) : null;
                let totalBiayaLokasi = 0;
                cartLokasi.forEach(lokasi => {
                  if (lokasi.tipe === 'lapangan') {
                    const hargaM2 = (Number(lokasi.harga) > 0 && Number(lokasi.harga) <= 50000) ? Number(lokasi.harga) : 2000;
                    totalBiayaLokasi += luas_per_lapangan * hargaM2;
                  } else if (lokasi.nama === 'GAZEBO' && formData.isGazeboPackage) {
                    totalBiayaLokasi += 650000;
                  } else {
                    totalBiayaLokasi += getBiayaLokasi(lokasi.nama);
                  }
                });
                
                return (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <span>Tarif Sewa Lokasi:</span>
                      <span className="font-extrabold text-emerald-950">{formatRupiah(totalBiayaLokasi)}</span>
                    </div>
                    {formData.listrikTambahan && (
                      <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center"><Zap size={14} className="mr-1 text-amber-500" /> Listrik Tambahan:</span>
                        <span className="font-extrabold text-amber-600">{formatRupiah(100000)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-100">
                      <span className="font-extrabold text-emerald-950 uppercase tracking-wider">Total Tagihan:</span>
                      <span className="font-black text-emerald-700 text-xl">{formatRupiah(totalBiayaLokasi + (formData.listrikTambahan ? 100000 : 0))}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Nama Rombongan / Instansi</label>
              <input required type="text" value={formData.namaRombongan} onChange={(e) => setFormData({ ...formData, namaRombongan: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" placeholder="Tuliskan nama rombongan..." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">PIC Rombongan</label>
                <input required type="text" value={formData.picRombongan} onChange={(e) => setFormData({ ...formData, picRombongan: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" placeholder="Nama tamu" />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">No. WhatsApp</label>
                <input required type="tel" value={formData.noWa} onChange={(e) => setFormData({ ...formData, noWa: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" placeholder="08..." />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Tanggal</label>
                <input type="text" value={formatTanggalPendek(selectedDate)} disabled className="w-full px-4 py-3 border border-slate-200 bg-slate-100 text-slate-500 text-sm font-extrabold rounded-2xl cursor-not-allowed shadow-inner" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider">PIC Kantor (TMR)</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCustomPicCheckout(prev => !prev);
                      if (isCustomPicCheckout) setFormData({ ...formData, picKantor: '' });
                    }} 
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCustomPicCheckout ? '← Pilih dari List' : '➕ Input Manual (Magang)'}
                  </button>
                </div>

                {isCustomPicCheckout ? (
                  <div>
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        value={formData.picKantor} 
                        onChange={(e) => setFormData({ ...formData, picKantor: e.target.value })} 
                        placeholder="Ketik nama PIC / Magang..." 
                        className="w-full px-4 py-3 border-2 border-emerald-400 bg-emerald-50/20 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-bold text-emerald-950 shadow-sm pr-20 placeholder:text-slate-400 placeholder:font-normal"
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsCustomPicCheckout(false);
                          setFormData({ ...formData, picKantor: '' });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-extrabold rounded-xl transition-all shadow-sm"
                        title="Pilih dari daftar master PIC"
                      >
                        Pilih List
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-bold mt-1">
                      *Nama hanya menempel pada pesanan ini (tidak disimpan ke data master).
                    </p>
                  </div>
                ) : (
                  <select 
                    required 
                    value={formData.picKantor} 
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomPicCheckout(true);
                        setFormData({ ...formData, picKantor: '' });
                      } else {
                        setFormData({ ...formData, picKantor: e.target.value });
                      }
                    }} 
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_1rem_center] bg-[length:1.25em_1.25em] bg-no-repeat pr-10"
                  >
                    <option value="" disabled>Pilih Nama PIC...</option>
                    {picList.map((pic, idx) => <option key={pic.id || idx} value={pic.nama}>{pic.nama}</option>)}
                    <option value="__custom__">➕ Ketik Nama Manual / Anak Magang...</option>
                  </select>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Catatan Tambahan (Bawa Tenda, Kursi, dll)</label>
              <textarea value={formData.catatan} onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-semibold text-emerald-950 bg-white shadow-sm placeholder:text-slate-400" rows="2" placeholder="Catat jika rombongan bawa tenda / kursi..." />
            </div>

            <div className={`border rounded-3xl p-4 shadow-sm transition-all duration-300 cursor-pointer ${formData.listrikTambahan ? 'border-amber-300 bg-amber-50/20' : 'border-slate-100 bg-white hover:border-emerald-100'}`}>
              <label className="flex items-center cursor-pointer select-none">
                <input type="checkbox" checked={formData.listrikTambahan} onChange={(e) => setFormData({ ...formData, listrikTambahan: e.target.checked })} className="w-5 h-5 text-amber-500 rounded border-slate-350 focus:ring-amber-500 cursor-pointer" />
                <span className="ml-3 text-sm font-extrabold text-emerald-950 flex items-center"><Zap size={16} className="text-amber-500 mr-1.5"/> Gunakan Listrik Tambahan (+Rp 100rb)</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider mb-2">Status Pendaftaran Awal</label>
              <div className="flex space-x-3">
                <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl border cursor-pointer transition-all duration-250 ${formData.statusPembayaran === 'Sudah Transfer' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 shadow-sm ring-2 ring-emerald-100/50' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'}`}>
                  <input type="radio" name="statusPembayaran" value="Sudah Transfer" checked={formData.statusPembayaran === 'Sudah Transfer'} onChange={(e) => setFormData({ ...formData, statusPembayaran: e.target.value })} className="hidden" />
                  <CheckCircle2 size={20} className={`mb-1.5 ${formData.statusPembayaran === 'Sudah Transfer' ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className="text-xs font-extrabold">Lunas di Awal</span>
                </label>
                <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl border cursor-pointer transition-all duration-200 ${formData.statusPembayaran === 'Belum Transfer' ? 'border-rose-450 bg-rose-50/40 text-rose-950 shadow-sm ring-2 ring-rose-100/50' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'}`}>
                  <input type="radio" name="statusPembayaran" value="Belum Transfer" checked={formData.statusPembayaran === 'Belum Transfer'} onChange={(e) => setFormData({ ...formData, statusPembayaran: e.target.value })} className="hidden" />
                  <AlertCircle size={20} className={`mb-1.5 ${formData.statusPembayaran === 'Belum Transfer' ? 'text-rose-550' : 'text-slate-300'}`} />
                  <span className="text-xs font-extrabold">Belum Transfer</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky action footer */}
        <div
          className="shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 pt-4 flex space-x-2 sm:space-x-3"
          style={{ paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom, 0px)))' }}
        >
          <button
            type="button"
            onClick={() => {
              setCartLokasi([]);
              onClose();
              setFormData({ namaRombongan: '', picRombongan: '', noWa: '', picKantor: '', keterangan: '', catatan: '', statusPembayaran: 'Belum Transfer', listrikTambahan: false, luasLahan: 50, isGazeboPackage: false });
            }}
            className="w-1/5 sm:w-auto px-0 sm:px-4 py-4 sm:py-3.5 text-xs sm:text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center flex-col sm:flex-row gap-1"
            title="Bersihkan Formulir & Keranjang"
          >
            <Trash2 size={16} /> <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-auto flex-1 py-4 sm:py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-200 active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            form="booking-form"
            className="w-auto flex-[2] py-4 sm:py-3.5 text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-2xl shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_25px_-4px_rgba(16,185,129,0.4)] transition-all duration-200 flex justify-center items-center active:scale-95"
          >
            <Save size={18} className="mr-2"/> Proses {cartLokasi.length} Fasilitas
          </button>
        </div>

      </div>
    </div>
  );
}
