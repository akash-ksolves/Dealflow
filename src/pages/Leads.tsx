import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, ChevronRight, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Leads fetch error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Leads</h1>
          <p className="text-[#141414]/60 mt-1 font-medium">Manage and track your sales pipeline.</p>
        </div>
        <button className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#141414]/90 transition-colors shadow-[4px_4px_0px_0px_rgba(228,227,224,1)]">
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/40" />
          <input
            type="text"
            placeholder="Search leads by name, email, or phone..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#141414] focus:outline-none font-mono text-sm"
          />
        </div>
        <button className="px-6 py-3 border-2 border-[#141414] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="bg-white border-2 border-[#141414] overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-[#141414] bg-[#E4E3E0]/30 text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
          <div className="col-span-4">Lead Information</div>
          <div className="col-span-3">Vehicle Interest</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-[#141414]/40 italic">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-20 text-center text-[#141414]/40 italic">No leads found. Start by adding one.</div>
        ) : (
          <div className="divide-y divide-[#141414]/10">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#E4E3E0]/10 transition-colors group"
              >
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold text-xs shrink-0">
                    {lead.first_name[0]}{lead.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{lead.first_name} {lead.last_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-[#141414]/40 font-mono">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[#141414]/40 font-mono">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="text-sm font-medium">{lead.vehicle_interest || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/60 px-2 py-1 bg-[#E4E3E0] rounded">
                    {lead.source}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                    lead.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  )}>
                    {lead.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <ChevronRight className="w-5 h-5 text-[#141414]/20 group-hover:text-[#141414] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
