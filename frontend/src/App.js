// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Components
import UserForm from './components/UserForm'; 
import LinkTagForm from './components/LinkTagForm';
import ResetPassword from './components/ResetPassword';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Profile from './pages/Profile';

import { api } from './api/clash';

// --- Auth Guard Wrapper ---
const ProtectedRoute = ({ user, token, children }) => {
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but no tag, force them to Link Tag page
  if (!user?.player_tag && location.pathname !== '/link-tag') {
    return <Navigate to="/link-tag" replace />;
  }

  return children;
};

// --- App Content ---
function AppContent() {
  const [token, setToken] = useState(localStorage.getItem('clash_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    const init = async () => {
      // 1. Check for Invite Link in URL (Query Params)
      // We do this manually here to persist it across the Auth flow
      const params = new URLSearchParams(window.location.search);
      const refToken = params.get('ref');

      if (refToken) {
        try {
            const data = await api.getInvite(refToken);
            setInviteData(data);
            // Clean URL visually (optional, but nice)
            // window.history.replaceState({}, document.title, window.location.pathname);
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
  }, []);

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
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-blue-500">
        <Loader2 className="animate-spin w-8 h-8"/>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!token ? <UserForm onLogin={handleLoginSuccess} /> : <Navigate to="/" />} 
      />
      <Route 
        path="/register" 
        element={!token ? <UserForm onLogin={handleLoginSuccess} inviteData={inviteData} /> : <Navigate to="/" />} 
      />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected: Tag Linking (No Layout) */}
      <Route 
        path="/link-tag" 
        element={
          token ? (
            user?.player_tag ? (
              <Navigate to="/" replace /> 
            ) : (
              <LinkTagForm token={token} onLink={handleLinkSuccess} onLogout={handleLogout} />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Protected: Main App (With Layout) */}
      <Route
        element={
          <ProtectedRoute user={user} token={token}>
            <Layout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard user={user} token={token} onLogout={handleLogout} />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile/:id" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}