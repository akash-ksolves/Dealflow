import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Phone, Mail, MessageSquare, User, Info, 
  Edit2, Check, X, ExternalLink, Tag, MapPin, 
  Clock, ArrowRight, Shield, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function LeadDetail({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', phone: '', status: '' });
  const [submitting, setSubmitting] = useState(false);

  const statuses = ['new', 'contacted', 'working', 'closed'];

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    try {
      const res = await fetch(`/api/leads/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLead(data);
        setEditForm({ email: data.email, phone: data.phone, status: data.status });
      }
    } catch (err) {
      console.error('Lead fetch error:', err);
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    const headers = { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchLead();
      }
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-600"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Lead Data...</p>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'working': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'closed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/leads" className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
            <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </Link>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
                {lead.first_name} {lead.last_name}
              </h1>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border shadow-sm",
                getStatusColor(lead.status)
              )}>
                {lead.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Lead ID: #{id}</p>
              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Created {format(new Date(lead.created_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCallModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
          >
            <Phone className="w-5 h-5" />
            Call Lead
          </button>
          <button 
            onClick={() => navigate(`/messages?leadId=${id}`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <MessageSquare className="w-5 h-5" />
            Message
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-12">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Contact Details</h3>
              </div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleUpdate} disabled={submitting} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                  />
                ) : (
                  <div className="flex items-center gap-3 text-slate-900">
                    <Mail className="w-4 h-4 text-slate-300" />
                    <p className="font-bold">{lead.email}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                  />
                ) : (
                  <div className="flex items-center gap-3 text-slate-900">
                    <Phone className="w-4 h-4 text-slate-300" />
                    <p className="font-bold">{lead.phone}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</label>
                {isEditing ? (
                  <select 
                    value={editForm.status} 
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900 appearance-none"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-300" />
                    <p className="font-black uppercase tracking-widest text-slate-900 text-xs">{lead.status}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Source</label>
                <div className="flex items-center gap-3 text-slate-900">
                  <Tag className="w-4 h-4 text-slate-300" />
                  <p className="font-bold">{lead.source}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Vehicle Interest</h3>
            </div>
            <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  <MapPin className="w-8 h-8 text-brand-600" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{lead.vehicle_interest || 'General Inquiry'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Requested Model</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-200" />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 relative z-10">Assigned Representative</h3>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-2xl font-black shadow-lg shadow-brand-500/20">
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">{user?.name || 'Unassigned'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1">{user?.role}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity History</h3>
              <Clock className="w-4 h-4 text-slate-300" />
            </div>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-600 shadow-sm shadow-brand-100"></div>
                  <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>
                </div>
                <div className="pb-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900">Lead Created</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2">{format(new Date(lead.created_at), 'MMM d, yyyy • HH:mm')}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">No further activity</p>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 bg-brand-50 rounded-[2.5rem] border border-brand-100">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-brand-600 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-brand-900">Quick Note</p>
                <p className="text-[10px] text-brand-700 font-medium mt-2 leading-relaxed">
                  Remember to update the status after every customer interaction to keep the pipeline accurate.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Call Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-12 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-brand-500/10 rounded-full animate-ping"></div>
              <div className="w-24 h-24 bg-brand-600 text-white rounded-full flex items-center justify-center mx-auto relative z-10 shadow-xl shadow-brand-200">
                <Phone className="w-10 h-10" />
              </div>
            </div>
            
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase mb-2">Calling Lead</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">{lead.first_name} {lead.last_name}</p>
            
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-10">
              <p className="text-3xl font-black tracking-widest text-slate-900 font-mono">{lead.phone}</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setIsCallModalOpen(false)}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
              >
                End Call
              </button>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Real-time sync active • Recording enabled
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
