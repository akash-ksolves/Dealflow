import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, MessageSquare, Clock, Building2, 
  Calendar, CheckCircle2, LayoutDashboard, ArrowUpRight,
  ArrowDownRight, Zap, Target, Activity, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const MOCK_CHART_DATA = [
  { name: 'Mon', leads: 12, deals: 4 },
  { name: 'Tue', leads: 18, deals: 6 },
  { name: 'Wed', leads: 15, deals: 8 },
  { name: 'Thu', leads: 25, deals: 12 },
  { name: 'Fri', leads: 32, deals: 15 },
  { name: 'Sat', leads: 28, deals: 10 },
  { name: 'Sun', leads: 20, deals: 7 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    if (user.role === 'super_admin') {
      fetch('/api/stats', { headers })
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        });
    } else {
      Promise.all([
        fetch('/api/stats', { headers }).then(res => res.json()),
        fetch('/api/leads', { headers }).then(res => res.json())
      ]).then(([statsData, leadsData]) => {
        setStats(statsData);
        setRecentLeads(Array.isArray(leadsData) ? leadsData.slice(0, 5) : []);
        setLoading(false);
      }).catch(err => {
        console.error('Dashboard fetch error:', err);
        setLoading(false);
      });
    }
  }, []);

  const statCards = user.role === 'super_admin' ? [
    { name: 'Total Dealerships', value: stats?.totalDealerships || '0', change: '+2', icon: Building2, trend: 'up' },
    { name: 'System Users', value: stats?.totalUsers || '0', change: '+15', icon: Users, trend: 'up' },
    { name: 'Active Sessions', value: '42', change: '+8', icon: Activity, trend: 'up' },
    { name: 'Global Leads', value: stats?.totalLeads || '0', change: '+124', icon: Target, trend: 'up' },
  ] : [
    { name: 'Total Leads', value: stats?.totalLeads || '0', change: '+12%', icon: Users, trend: 'up' },
    { name: 'Active Deals', value: stats?.activeDeals || '0', change: '+5%', icon: TrendingUp, trend: 'up' },
    { name: 'Unread Messages', value: stats?.unreadMessages || '0', change: '-2', icon: MessageSquare, trend: 'down' },
    { name: 'Avg. Response Time', value: stats?.avgResponseTime || 'N/A', change: '-3m', icon: Clock, trend: 'down' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
            {user.role === 'super_admin' ? 'System Intelligence' : 'Dealership Pulse'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-brand-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-brand-100">
            {user.name?.[0] || 'U'}
          </div>
          <div className="pr-4">
            <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 group hover:border-brand-600 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
              )}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.name}</p>
            <p className="text-4xl font-black tracking-tighter text-slate-900 mt-2">{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Performance Analytics</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-600"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leads</span>
                <span className="w-3 h-3 rounded-full bg-slate-200 ml-4"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deals</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CHART_DATA}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="deals" 
                    stroke="#e2e8f0" 
                    strokeWidth={4}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Recent Activity</h3>
              </div>
              <Link to="/leads" className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:underline flex items-center gap-1">
                View Pipeline <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {user.role === 'super_admin' ? (
                <div className="p-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <Building2 className="w-10 h-10 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-black uppercase tracking-tighter text-lg">System-Wide View</p>
                    <p className="text-slate-400 font-medium text-sm mt-1">Lead activity is managed at the dealership level.</p>
                  </div>
                  <Link to="/dealerships" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    Manage Dealerships
                  </Link>
                </div>
              ) : (
                recentLeads.length > 0 ? recentLeads.map((lead) => (
                  <div key={lead.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors shadow-inner">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </div>
                      <div>
                        <Link to={`/leads/${lead.id}`} className="text-sm font-black text-slate-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{lead.first_name} {lead.last_name}</Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lead.vehicle_interest || 'General Inquiry'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border shadow-sm",
                        lead.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>
                        {lead.status}
                      </span>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">{lead.source}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-20 text-center">
                    <Zap className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium italic">No recent activity detected.</p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 space-y-8">
          {user.role === 'super_admin' ? (
            <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <h2 className="text-xl font-black tracking-tighter uppercase mb-8 relative z-10">System Health</h2>
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">1.2 MB</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uptime</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">99.9%</span>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-brand-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-brand-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <h3 className="font-black uppercase tracking-widest text-[10px] mb-8 relative z-10 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <Link to="/leads" className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl border border-white/10 hover:bg-white/20 transition-all group">
                  <Users className="w-6 h-6 mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Leads</span>
                </Link>
                <Link to="/messages" className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl border border-white/10 hover:bg-white/20 transition-all group">
                  <MessageSquare className="w-6 h-6 mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
                </Link>
              </div>
            </section>
          )}

          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-8">System Navigation</h3>
            <div className="space-y-3">
              <Link to="/settings" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-600 transition-all group">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-brand-600 transition-colors">Account Settings</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
              </Link>
              {user.role === 'super_admin' && (
                <>
                  <Link to="/dealerships" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-600 transition-all group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-brand-600 transition-colors">Manage Dealerships</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                  </Link>
                </>
              )}
              {user.role === 'principal' && (
                <Link to="/users" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-600 transition-all group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-brand-600 transition-colors">Manage Team</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
