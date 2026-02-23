import { useState, useEffect, FormEvent } from 'react';
import { Plus, Building2, User, Mail, Lock, Loader2 } from 'lucide-react';

export default function Dealerships() {
  const [dealerships, setDealerships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    principalName: '',
    principalEmail: '',
    principalPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDealerships();
  }, []);

  const fetchDealerships = async () => {
    const res = await fetch('/api/dealerships', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setDealerships(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/dealerships', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ name: '', principalName: '', principalEmail: '', principalPassword: '' });
      fetchDealerships();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Dealerships</h1>
          <p className="text-[#141414]/60 mt-1 font-medium">Manage all dealership groups in the system.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#141414]/90 transition-colors shadow-[4px_4px_0px_0px_rgba(228,227,224,1)]"
        >
          <Plus className="w-5 h-5" />
          Add Dealership
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center text-[#141414]/40 italic">Loading dealerships...</div>
        ) : dealerships.length === 0 ? (
          <div className="col-span-full p-20 text-center text-[#141414]/40 italic">No dealerships found.</div>
        ) : (
          dealerships.map((dealer) => (
            <div key={dealer.id} className="bg-white border-2 border-[#141414] p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#E4E3E0] rounded flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#141414]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{dealer.name}</h3>
                  <p className="text-xs text-[#141414]/40 font-mono uppercase tracking-widest">ID: #{dealer.id}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-[#141414]/10">
                <button className="w-full py-2 text-xs font-bold uppercase tracking-widest border-2 border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#141414]/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-[#141414] w-full max-w-lg p-8 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-2xl font-bold italic font-serif mb-6">Create New Dealership</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Dealership Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                    placeholder="e.g. Northside Motors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#141414]/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Principal User (Initial Admin)</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                    <input
                      required
                      type="text"
                      value={formData.principalName}
                      onChange={(e) => setFormData({...formData, principalName: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                      placeholder="Principal Full Name"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                    <input
                      required
                      type="email"
                      value={formData.principalEmail}
                      onChange={(e) => setFormData({...formData, principalEmail: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                      placeholder="Principal Email"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/40" />
                    <input
                      required
                      type="password"
                      value={formData.principalPassword}
                      onChange={(e) => setFormData({...formData, principalPassword: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                      placeholder="Initial Password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold uppercase tracking-widest border-2 border-[#141414] hover:bg-[#141414]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Dealership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
