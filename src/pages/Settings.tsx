import { Settings as SettingsIcon, User, Building2, Shield, Bell } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Settings</h1>
        <p className="text-[#141414]/60 mt-1 font-medium">Manage your profile and dealership preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 space-y-1">
          {[
            { name: 'Profile', icon: User, active: true },
            { name: 'Dealership', icon: Building2 },
            { name: 'Security', icon: Shield },
            { name: 'Notifications', icon: Bell },
          ].map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors border-2 ${
                item.active 
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' 
                  : 'bg-white text-[#141414]/60 border-transparent hover:border-[#141414]/10'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-9 space-y-10">
          <section className="bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xl font-bold italic font-serif border-b-2 border-[#141414] pb-2 mb-6">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Full Name</label>
                <input type="text" className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm" defaultValue="Admin User" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Email Address</label>
                <input type="email" className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm" defaultValue="admin@dealflow.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Role</label>
                <input type="text" className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] opacity-50 cursor-not-allowed font-mono text-sm" defaultValue="Administrator" disabled />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button className="bg-[#141414] text-[#E4E3E0] px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">
                Save Changes
              </button>
            </div>
          </section>

          <section className="bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xl font-bold italic font-serif border-b-2 border-[#141414] pb-2 mb-6">Dealership Details</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Dealership Name</label>
                <input type="text" className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm" defaultValue="Default Motors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Address</label>
                <textarea className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm h-24" defaultValue="123 Dealer Row, Motor City, MC 12345" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
