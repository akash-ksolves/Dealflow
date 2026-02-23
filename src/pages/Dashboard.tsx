import { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
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
  }, []);

  const statCards = [
    { name: 'Total Leads', value: stats?.totalLeads || '0', change: '+12%', icon: Users },
    { name: 'Active Deals', value: stats?.activeDeals || '0', change: '+5%', icon: TrendingUp },
    { name: 'Unread Messages', value: stats?.unreadMessages || '0', change: '-2', icon: MessageSquare },
    { name: 'Avg. Response Time', value: stats?.avgResponseTime || 'N/A', change: '-3m', icon: Clock },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Overview</h1>
        <p className="text-[#141414]/60 mt-1 font-medium">Welcome back to your dealership command center.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#E4E3E0] rounded">
                <stat.icon className="w-5 h-5 text-[#141414]" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/50">{stat.name}</p>
            <p className="text-3xl font-bold mt-1 font-mono">{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h2 className="text-xl font-bold italic font-serif border-b-2 border-[#141414] pb-2">Recent Activity</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="p-10 text-center text-[#141414]/40 italic">Loading activity...</div>
            ) : recentLeads.length === 0 ? (
              <div className="p-10 text-center text-[#141414]/40 italic">No recent activity.</div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex gap-4 items-start p-4 bg-white/50 border border-[#141414]/10 rounded hover:border-[#141414]/30 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold text-xs">
                    {lead.first_name[0]}{lead.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{lead.first_name} {lead.last_name} <span className="font-normal text-[#141414]/60">interested in</span> {lead.vehicle_interest || 'General Inquiry'}</p>
                    <p className="text-xs text-[#141414]/40 mt-1 font-mono uppercase tracking-widest">{lead.source} • New Inquiry</p>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {lead.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold italic font-serif border-b-2 border-[#141414] pb-2">Performance</h2>
          <div className="bg-white border-2 border-[#141414] p-8 h-[300px] flex items-center justify-center text-[#141414]/40 italic">
            Chart visualization would go here
          </div>
        </div>
      </div>
    </div>
  );
}
