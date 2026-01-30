import React, { useState, useEffect } from 'react';
import UserForm from './components/UserForm'; 
import LinkTagForm from './components/LinkTagForm';
import ResetPassword from './components/ResetPassword';
import Dashboard from './pages/Dashboard';
import { api } from './api/clash';
import { Loader2 } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('clash_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);

  // Simple Router
  const path = window.location.pathname;

  useEffect(() => {
    const init = async () => {
      // 1. Check for Invite Link Format: /register?ref=TOKEN
      const params = new URLSearchParams(window.location.search);
      const refToken = params.get('ref');
      const isRegisterPath = path === '/register';

      if (isRegisterPath && refToken) {
        try {
            const data = await api.getInvite(refToken);
            setInviteData(data);
            window.history.replaceState({}, document.title, "/");
        } catch (err) {
            console.error("Invalid invite ref", err);
        }
      }

      // 2. Hydrate Session
      const storedToken = localStorage.getItem('clash_token');
      if (storedToken) {
        try {
          const userData = await api.getMe(storedToken);
          setToken(storedToken);
          setUser(userData);
        } catch (err) {
          handleLogout();
        }
      }
      setLoading(false);
    };
    init();
  }, [path]);

  const handleLoginSuccess = async (newToken) => {
    localStorage.setItem('clash_token', newToken);
    setToken(newToken);
    const userData = await api.getMe(newToken);
    setUser(userData);
  };

  const handleLinkSuccess = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('clash_token');
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-blue-500"><Loader2 className="animate-spin w-8 h-8"/></div>;
  }

  // Route: Reset Password
  if (path === '/reset-password') {
      return <ResetPassword />;
  }

  // Route: Login / Signup
  if (!token || !user) {
    return <UserForm onLogin={handleLoginSuccess} inviteData={inviteData} />;
  }

  // Route: Link Tag
  if (!user.player_tag) {
    return <LinkTagForm token={token} onLink={handleLinkSuccess} onLogout={handleLogout} />;
  }

  // Route: Dashboard
  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}

export default App;