import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, Menu, Building2, MapPin, User } from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user, onLogout }: { user: any, onLogout: () => void }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin'] },
    { name: 'Dealerships', href: '/dealerships', icon: Building2, roles: ['super_admin'] },
    { name: 'Locations', href: '/locations', icon: MapPin, roles: ['super_admin'] },
    { name: 'Users', href: '/users', icon: User, roles: ['principal', 'admin'] },
    { name: 'Leads', href: '/leads', icon: Users, roles: ['principal', 'admin', 'user'] },
    { name: 'Lead Communication', href: '/messages', icon: MessageSquare, roles: ['principal', 'admin', 'user'] },
    { name: 'My Profile', href: '/profile', icon: User, roles: ['super_admin', 'principal', 'admin', 'user'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'principal', 'admin', 'user'] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#141414] text-[#E4E3E0] transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        !isMobileMenuOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col border-r border-[#141414]">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E4E3E0] rounded flex items-center justify-center">
              <span className="text-[#141414] font-bold text-xl">D</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight italic font-serif">Dealflow</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors",
                    isActive 
                      ? "bg-[#E4E3E0] text-[#141414]" 
                      : "text-[#E4E3E0]/60 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#E4E3E0]/10">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#E4E3E0]/20 flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-[#E4E3E0]/40 truncate uppercase tracking-wider">{user?.role || 'Role'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#E4E3E0]/60 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-[#141414]/10 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6 lg:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold italic font-serif">Dealflow</h1>
          <div className="w-6" />
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
