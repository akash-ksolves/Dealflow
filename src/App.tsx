import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Dealerships from './pages/Dealerships';
import Locations from './pages/Locations';
import UsersPage from './pages/Users';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (data: any) => {
    const userProfile = data.user;
    setUser(userProfile);
    localStorage.setItem('user', JSON.stringify(userProfile));
    localStorage.setItem('token', data.token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const getInitialRoute = () => {
    if (!user) return '/login';
    if (user.role === 'super_admin') return '/';
    return '/leads';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={getInitialRoute()} /> : <Login onLogin={handleLogin} />} />
        
        <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/" element={user?.role === 'super_admin' ? <Dashboard /> : <Navigate to="/leads" />} />
          <Route path="/dealerships" element={<Dealerships />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/users" element={<UsersPage user={user} />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail user={user} />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Settings />} /> {/* Reuse settings for now */}
        </Route>

        <Route path="*" element={<Navigate to={getInitialRoute()} />} />
      </Routes>
    </BrowserRouter>
  );
}
