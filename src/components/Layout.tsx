import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MessageSquare, Settings, 
  LogOut, Menu, Building2, User, Bell, Search, 
  Plus, ChevronDown, Globe, Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user, onLogout }: { user: any, onLogout: () => void }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'principal', 'admin', 'user'] },
    { name: 'Dealerships', href: '/dealerships', icon: Building2, roles: ['super_admin'] },
    { name: 'Users', href: '/users', icon: User, roles: ['principal'] },
    { name: 'Leads', href: '/leads', icon: Users, roles: ['principal', 'admin', 'user'] },
    { name: 'Communication', href: '/messages', icon: MessageSquare, roles: ['principal', 'admin', 'user'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'principal', 'admin', 'user'] },
  ].filter(item => item.roles.includes(user.role));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-xl lg:shadow-none",
        !isMobileMenuOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
              <span className="text-white font-black text-xl tracking-tighter">D</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900">DEALFLOW</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">CRM System</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200",
                    isActive 
                      ? "bg-brand-50 text-brand-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-brand-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-100">
            <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold shadow-inner overflow-hidden">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">{user?.role || 'Role'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Header */}
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors lg:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Network Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/leads" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100">
                <Plus className="w-4 h-4" />
                Quick Lead
              </Link>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl border border-slate-100 transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</h3>
                    <span className="px-2 py-1 bg-brand-50 text-brand-600 text-[8px] font-black rounded-lg uppercase">{unreadCount} New</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-100 mx-auto mb-3" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">All caught up</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button key={n.id} className="w-full p-4 hover:bg-slate-50 rounded-2xl text-left transition-colors flex gap-4 items-start">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            n.read ? "bg-slate-200" : "bg-brand-500"
                          )} />
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-relaxed">{n.message}</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-2">Just now</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-600 transition-colors">Clear All</button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user?.name}</p>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-400 overflow-hidden">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
