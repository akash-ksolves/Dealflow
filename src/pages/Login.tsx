import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Shield, Mail, Lock } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('super@dealflow.com');
  const [password, setPassword] = useState('superadmin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data);
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 rounded-3xl mb-8 shadow-2xl shadow-brand-200 animate-in zoom-in duration-500">
            <span className="text-white font-black text-4xl tracking-tighter">D</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Dealflow</h1>
          <p className="text-slate-400 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">CRM Systems Inc.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3">
                <Shield className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="name@dealership.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-700 transition-all shadow-xl shadow-brand-100 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
              Sign In to System
            </button>
          </form>
        </div>

        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Secure Access Portal • v2.4.0
          </p>
          <div className="flex justify-center gap-6">
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-brand-600 transition-colors">Privacy Policy</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-brand-600 transition-colors">Support Center</button>
          </div>
        </div>
      </div>
    </div>
  );
}
