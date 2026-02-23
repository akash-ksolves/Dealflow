import { useState, useEffect, FormEvent } from 'react';
import { Plus, User, Mail, Shield, MapPin, Loader2, Lock } from 'lucide-react';

export default function UsersPage({ user: currentUser }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleName: '',
    locationId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    const [userRes, roleRes, locRes] = await Promise.all([
      fetch('/api/users', { headers }),
      fetch('/api/roles', { headers }),
      fetch('/api/locations', { headers })
    ]);
    const [userData, roleData, locData] = await Promise.all([userRes.json(), roleRes.json(), locRes.json()]);
    setUsers(Array.isArray(userData) ? userData : []);
    setRoles(Array.isArray(roleData) ? roleData : []);
    setLocations(Array.isArray(locData) ? locData : []);
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', roleName: '', locationId: '' });
      fetchData();
    }
    setSubmitting(false);
  };

  const filteredRoles = roles.filter(r => {
    if (currentUser.role === 'principal') return r.name !== 'super_admin';
    if (currentUser.role === 'admin') return !['super_admin', 'principal'].includes(r.name);
    return false;
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#141414]">Users</h1>
          <p className="text-[#141414]/60 mt-1 font-medium">Manage dealership staff and access levels.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#141414]/90 transition-colors shadow-[4px_4px_0px_0px_rgba(228,227,224,1)]"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </header>

      <div className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-[#141414] bg-[#E4E3E0]/30 text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
          <div className="col-span-4">User Information</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-3">Location</div>
          <div className="col-span-2">Status</div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-[#141414]/40 italic">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-20 text-center text-[#141414]/40 italic">No users found.</div>
        ) : (
          <div className="divide-y divide-[#141414]/10">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#E4E3E0]/10 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold text-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{u.name}</p>
                    <p className="text-[10px] text-[#141414]/40 font-mono">{u.email}</p>
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-[#141414]/40" />
                  <span className="text-xs font-bold uppercase tracking-widest">{u.role}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-[#141414]/40" />
                  <span className="text-xs">{u.location_name || 'All Locations'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-green-100 text-green-700 rounded">
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#141414]/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-[#141414] w-full max-w-lg p-8 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-2xl font-bold italic font-serif mb-6">Create New User</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                    placeholder="Staff Member Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                    placeholder="email@dealership.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Initial Password</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Role</label>
                  <select
                    required
                    value={formData.roleName}
                    onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                    className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                  >
                    <option value="">Select Role</option>
                    {filteredRoles.map(r => (
                      <option key={r.id} value={r.name}>{r.name.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Location</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                    className="w-full px-4 py-3 bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                  >
                    <option value="">All Locations</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
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
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
