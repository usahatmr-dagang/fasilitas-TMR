import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F4] p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-emerald-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-emerald-950">Login Admin</h2>
          <p className="text-emerald-700/60 text-sm mt-1 font-semibold">Sistem Informasi Fasilitas TMR</p>
        </div>
        
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold mb-6 text-center border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-slate-700 bg-slate-50 transition-all focus:ring-2 focus:ring-emerald-500/10"
                placeholder="admin@tmr.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-slate-700 bg-slate-50 transition-all focus:ring-2 focus:ring-emerald-500/10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
