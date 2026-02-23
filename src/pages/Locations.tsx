import { useState, useEffect, FormEvent } from 'react';
import { Plus, MapPin, Building2, Loader2 } from 'lucide-react';

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [dealerships, setDealerships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dealershipId: '',
    name: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    const [locRes, dealRes] = await Promise.all([
      fetch('/api/locations', { headers }),
      fetch('/api/dealerships', { headers })
    ]);
    const [locData, dealData] = await Promise.all([locRes.json(), dealRes.json()]);
    setLocations(Array.isArray(locData) ? locData : []);
    setDealerships(Array.isArray(dealData) ? dealData : []);
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ dealershipId: '', name: '', address: '' });
      fetchData();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Locations</h1>
          <p className="text-[#141414]/60 mt-1 font-medium">Manage dealership locations and branches.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#141414]/90 transition-colors shadow-[4px_4px_0px_0px_rgba(228,227,224,1)]"
        >
          <Plus className="w-5 h-5" />
          Add Location
        </button>
      </header>

      <div className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-[#141414] bg-[#E4E3E0]/30 text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
          <div className="col-span-4">Location Name</div>
          <div className="col-span-4">Dealership Group</div>
          <div className="col-span-4">Address</div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-[#141414]/40 italic">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="p-20 text-center text-[#141414]/40 italic">No locations found.</div>
        ) : (
          <div className="divide-y divide-[#141414]/10">
            {locations.map((loc) => (
              <div key={loc.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#E4E3E0]/10 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#141414]/40" />
                  <span className="font-bold">{loc.name}</span>
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-[#141414]/40" />
                  <span className="text-sm">{loc.dealership_name}</span>
                </div>
                <div className="col-span-4">
                  <p className="text-xs text-[#141414]/60 truncate">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#141414]/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-[#141414] w-full max-w-lg p-8 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-2xl font-bold italic font-serif mb-6">Add New Location</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Dealership Group</label>
                <select
                  required
                  value={formData.dealershipId}
                  onChange={(e) => setFormData({...formData, dealershipId: e.target.value})}
                  className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                >
                  <option value="">Select Dealership</option>
                  {dealerships.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Location Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                  placeholder="e.g. Downtown Branch"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Address</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm h-24"
                  placeholder="Full address"
                />
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
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
