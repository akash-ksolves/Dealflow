import { useState, ChangeEvent } from 'react';
import { 
  User, Shield, Lock, Bell, Globe, 
  Check, Loader2, AlertCircle, Camera
} from 'lucide-react';

export default function Settings({ onUpdate }: { onUpdate?: () => void }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profilePic, setProfilePic] = useState(user.profile_pic || '');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/pic', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ profile_pic: profilePic })
      });

      if (res.ok) {
        const updatedUser = { ...user, profile_pic: profilePic };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdate?.();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile pic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">System Settings</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your personal profile and security preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-2">
          <button className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-100">
            <User className="w-4 h-4" />
            Profile Info
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl">
            <Lock className="w-4 h-4" />
            Security
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl">
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </aside>

        <div className="lg:col-span-9 space-y-12">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Profile Information</h3>
              </div>
              {success && (
                <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-right-4">
                  <Check className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Changes Saved</span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-12 mb-12">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-300 border-4 border-white shadow-inner overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name?.[0]
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-100 hover:scale-110 transition-transform cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900" 
                      defaultValue={user.name} 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900" 
                      defaultValue={user.email} 
                    />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Shield className="w-6 h-6 text-brand-600" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Account Role</p>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.role?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    System Verified
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={submitting}
                className="px-10 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 flex items-center gap-3"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Security & Password</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900" 
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-10 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">
                Changing your password will require you to sign back in on all devices. 
                Make sure to use a strong, unique password.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
