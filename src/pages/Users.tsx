import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, User, Mail, Shield, MapPin, Loader2, 
  Edit2, Trash2, Check, X, ChevronRight, Search
} from 'lucide-react';

export default function UsersPage({ user: currentUser }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleName: '',
    locationIds: [] as number[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    try {
      const [userRes, roleRes, locRes] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/roles', { headers }),
        fetch('/api/locations', { headers })
      ]);
      const [userData, roleData, locData] = await Promise.all([userRes.json(), roleRes.json(), locRes.json()]);
      setUsers(Array.isArray(userData) ? userData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
      setLocations(Array.isArray(locData) ? locData : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.locationIds.length === 0) {
      setError('Please select at least one location.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', roleName: '', locationIds: [] });
        fetchData();
      } else {
        setError(data.error || 'An error occurred while saving the user.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchData();
  };

  const openEditUser = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      roleName: u.role,
      locationIds: u.location_ids ? u.location_ids.toString().split(',').map(Number) : []
    });
    setIsModalOpen(true);
  };

  const toggleLocation = (id: number) => {
    setFormData(prev => ({
      ...prev,
      locationIds: prev.locationIds.includes(id)
        ? prev.locationIds.filter(lId => lId !== id)
        : [...prev.locationIds, id]
    }));
  };

  const filteredRoles = roles.filter(r => {
    if (currentUser.role === 'principal') return r.name !== 'super_admin' && r.name !== 'principal';
    return false;
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreateUsers = currentUser.role === 'principal';

  if (currentUser.role === 'super_admin') {
    return (
      <div className="p-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-slate-200 mx-auto" />
        <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Access Restricted</h2>
        <p className="text-slate-500 font-medium">Super Admins manage dealerships directly. User management is handled by Principals.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Staff Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your dealership team and their access levels.</p>
        </div>
        {canCreateUsers && (
          <button 
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '', roleName: '', locationIds: [] });
              setIsModalOpen(true);
            }}
            className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
          >
            <Plus className="w-5 h-5" />
            Add Team Member
          </button>
        )}
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Total Staff: {filteredUsers.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Team Member</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Locations</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium italic">Loading team members...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium italic">No team members found.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-black text-sm shadow-inner">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">{u.role.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {u.location_names ? u.location_names.split(',').map((name: string, i: number) => (
                          <span key={i} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-slate-100 text-slate-500 rounded-lg shadow-sm">
                            {name}
                          </span>
                        )) : <span className="text-[10px] text-slate-300 italic">No locations assigned</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditUser(u)} className="p-3 bg-white text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl border border-slate-100 shadow-sm transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteUser(u.id)} className="p-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-100 shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{editingUser ? 'Edit Member' : 'New Member'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                    placeholder="john@dealership.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{editingUser ? 'New Password (Optional)' : 'Initial Password'}</label>
                  <input
                    required={!editingUser}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                  <select
                    required
                    value={formData.roleName}
                    onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-900 appearance-none"
                  >
                    <option value="">Select Role</option>
                    {filteredRoles.map(r => (
                      <option key={r.id} value={r.name}>{r.name.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Locations</label>
                <div className="grid grid-cols-2 gap-3 p-6 bg-slate-50 rounded-[2rem]">
                  {locations.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLocation(l.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                        formData.locationIds.includes(l.id) 
                          ? "bg-white border-brand-600 text-brand-600 shadow-md shadow-brand-100" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        formData.locationIds.includes(l.id) ? "bg-brand-600 border-brand-600" : "bg-white border-slate-200"
                      )}>
                        {formData.locationIds.includes(l.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingUser ? 'Update Member' : 'Create Member'}
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
