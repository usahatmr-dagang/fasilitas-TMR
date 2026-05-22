import React from 'react';
import { Tent, Tag, FileText, LogOut } from 'lucide-react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export default function MainDashboard({ onNavigate }) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F4] flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={handleLogout}
        className="absolute top-6 right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-rose-600 font-bold shadow-sm hover:bg-rose-50 border border-rose-100 transition-all active:scale-95 text-sm"
      >
        <LogOut size={16} /> Keluar
      </button>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-emerald-950 mb-2">Master Menu Admin</h1>
        <p className="text-emerald-700/70 font-semibold">Sistem Informasi Manajemen Fasilitas TMR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Fasilitas TMR */}
        <div 
          onClick={() => onNavigate('fasilitas')}
          className="bg-white p-8 rounded-3xl shadow-lg shadow-emerald-900/5 border border-emerald-100 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Tent size={40} />
          </div>
          <h2 className="text-xl font-black text-emerald-950 mb-2">Fasilitas TMR</h2>
          <p className="text-emerald-700/60 text-sm font-semibold">Kelola reservasi, data master, dan bukti pembayaran fasilitas.</p>
        </div>

        {/* Promo TMR */}
        <div 
          className="bg-white p-8 rounded-3xl shadow-lg shadow-emerald-900/5 border border-emerald-100 flex flex-col items-center text-center cursor-not-allowed opacity-80 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Coming Soon</div>
          <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
            <Tag size={40} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Promo TMR</h2>
          <p className="text-slate-500/80 text-sm font-semibold">Manajemen diskon dan paket promo khusus kunjungan.</p>
        </div>

        {/* Dispensasi TMR */}
        <div 
          className="bg-white p-8 rounded-3xl shadow-lg shadow-emerald-900/5 border border-emerald-100 flex flex-col items-center text-center cursor-not-allowed opacity-80 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Coming Soon</div>
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-6">
            <FileText size={40} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Dispensasi TMR</h2>
          <p className="text-slate-500/80 text-sm font-semibold">Pengelolaan surat permohonan keringanan dan dispensasi.</p>
        </div>
      </div>
    </div>
  );
}
