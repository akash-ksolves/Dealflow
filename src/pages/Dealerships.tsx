import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, Building2, User, Mail, Lock, Loader2, 
  Edit2, Trash2, MapPin, Check, ChevronRight,
  Globe, Shield, Phone, X
} from 'lucide-react';

export default function Dealerships() {
  const [dealerships, setDealerships] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<any>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  
  const [dealerFormData, setDealerFormData] = useState({
    name: '',
    principalName: '',
    principalEmail: '',
    principalPassword: '',
    locationName: '',
    locationAddress: ''
  });

  const [locationFormData, setLocationFormData] = useState({
    name: '',
    address: '',
    isDefault: false
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    try {
      const [dRes, lRes] = await Promise.all([
        fetch('/api/dealerships', { headers }),
        fetch('/api/locations', { headers })
      ]);
      const [dData, lData] = await Promise.all([dRes.json(), lRes.json()]);
      setDealerships(Array.isArray(dData) ? dData : []);
      setLocations(Array.isArray(lData) ? lData : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDealerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = editingDealer ? `/api/dealerships/${editingDealer.id}` : '/api/dealerships';
    const method = editingDealer ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dealerFormData)
      });

      if (res.ok) {
        setIsDealerModalOpen(false);
        setEditingDealer(null);
        setDealerFormData({ 
          name: '', principalName: '', principalEmail: '', principalPassword: '',
          locationName: '', locationAddress: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId) return;
    setSubmitting(true);
    
    const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
    const method = editingLocation ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...locationFormData,
          dealershipId: selectedDealerId
        })
      });

      if (res.ok) {
        setIsLocationModalOpen(false);
        setEditingLocation(null);
        setLocationFormData({ name: '', address: '', isDefault: false });
        fetchData();
      }
    } catch (err) {
      console.error('Location submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDealer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dealership? This will soft-delete it.')) return;
    await fetch(`/api/dealerships/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchData();
  };

  const deleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    await fetch(`/api/locations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchData();
  };

  const openEditDealer = (dealer: any) => {
    setEditingDealer(dealer);
    setDealerFormData({
      name: dealer.name,
      principalName: dealer.principal_name || '',
      principalEmail: dealer.principal_email || '',
      principalPassword: '', // Don't show password
      locationName: '',
      locationAddress: ''
    });
    setIsDealerModalOpen(true);
  };

  const openEditLocation = (loc: any) => {
    setEditingLocation(loc);
    setLocationFormData({
      name: loc.name,
      address: loc.address,
      isDefault: loc.is_default === 1
    });
    setSelectedDealerId(loc.dealership_id);
    setIsLocationModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Dealerships</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage dealership groups, locations, and principals.</p>
        </div>
        <button 
          onClick={() => {
            setEditingDealer(null);
            setDealerFormData({ 
              name: '', principalName: '', principalEmail: '', principalPassword: '',
              locationName: '', locationAddress: ''
            });
            setIsDealerModalOpen(true);
          }}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
        >
          <Plus className="w-5 h-5" />
          Add Dealership
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium italic">Loading management data...</p>
          </div>
        ) : dealerships.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium italic">No dealerships found.</p>
          </div>
        ) : (
          dealerships.map((dealer) => (
            <div key={dealer.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group transition-all hover:shadow-2xl hover:shadow-brand-100/20">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-brand-100">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{dealer.name}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100">ID: #{dealer.id}</span>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{dealer.principal_name || 'No Principal Assigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openEditDealer(dealer)}
                    className="p-4 bg-white text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl transition-all border border-slate-100 shadow-sm"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => deleteDealer(dealer.id)}
                    className="p-4 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-slate-100 shadow-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Locations</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDealerId(dealer.id);
                      setEditingLocation(null);
                      setLocationFormData({ name: '', address: '', isDefault: false });
                      setIsLocationModalOpen(true);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-brand-600 hover:text-white transition-all"
                  >
                    + Add Location
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {locations.filter(l => l.dealership_id === dealer.id).map(loc => (
                    <div key={loc.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 relative group/loc transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900">{loc.name}</h4>
                          {loc.is_default === 1 && (
                            <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-700 rounded-lg">Default</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/loc:opacity-100 transition-opacity">
                          <button onClick={() => openEditLocation(loc)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteLocation(loc.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{loc.address}</p>
                    </div>
                  ))}
                  {locations.filter(l => l.dealership_id === dealer.id).length === 0 && (
                    <div className="col-span-full p-12 text-center bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic text-sm font-medium">
                      No locations added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dealer Modal */}
      {isDealerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{editingDealer ? 'Edit Dealership' : 'New Dealership'}</h2>
              <button onClick={() => setIsDealerModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleDealerSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Dealership Info</label>
                <input
                  required
                  type="text"
                  value={dealerFormData.name}
                  onChange={(e) => setDealerFormData({...dealerFormData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                  placeholder="Dealership Name (e.g. Northside Motors)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Principal Name</label>
                  <input
                    required
                    type="text"
                    value={dealerFormData.principalName}
                    onChange={(e) => setDealerFormData({...dealerFormData, principalName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Principal Email</label>
                  <input
                    required
                    type="email"
                    value={dealerFormData.principalEmail}
                    onChange={(e) => setDealerFormData({...dealerFormData, principalEmail: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                    placeholder="email@dealership.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {editingDealer ? 'Update Password (Leave blank to keep current)' : 'Initial Password'}
                </label>
                <input
                  required={!editingDealer}
                  type="password"
                  value={dealerFormData.principalPassword}
                  onChange={(e) => setDealerFormData({...dealerFormData, principalPassword: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                  placeholder="••••••••"
                />
              </div>

              {!editingDealer && (
                <div className="pt-8 border-t border-slate-100 space-y-6">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Initial Location</label>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      required
                      type="text"
                      value={dealerFormData.locationName}
                      onChange={(e) => setDealerFormData({...dealerFormData, locationName: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                      placeholder="Location Name (e.g. Main Branch)"
                    />
                    <textarea
                      required
                      value={dealerFormData.locationAddress}
                      onChange={(e) => setDealerFormData({...dealerFormData, locationAddress: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900 h-24 resize-none"
                      placeholder="Full Address"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsDealerModalOpen(false)} className="flex-1 py-4 font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingDealer ? 'Update Dealership' : 'Create Dealership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
              <button onClick={() => setIsLocationModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Location Name</label>
                <input
                  required
                  type="text"
                  value={locationFormData.name}
                  onChange={(e) => setLocationFormData({...locationFormData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                  placeholder="e.g. Downtown Branch"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                <textarea
                  required
                  value={locationFormData.address}
                  onChange={(e) => setLocationFormData({...locationFormData, address: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900 h-32 resize-none"
                  placeholder="Full address"
                />
              </div>

              <label className="flex items-center gap-4 cursor-pointer group p-4 bg-slate-50 rounded-2xl transition-all hover:bg-brand-50">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${locationFormData.isDefault ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-200'}`}>
                  {locationFormData.isDefault && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={locationFormData.isDefault}
                  onChange={(e) => setLocationFormData({...locationFormData, isDefault: e.target.checked})}
                />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-brand-600">Set as Default Location</span>
              </label>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="flex-1 py-4 font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingLocation ? 'Update' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
