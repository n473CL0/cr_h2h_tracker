import React, { useState, useEffect } from 'react';
import UserForm from './components/UserForm';
import Dashboard from './pages/Dashboard';

function App() {
  // Simple persistence using localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clash_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('clash_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('clash_user');
  };

  return (
    <div className="font-sans antialiased">
      {!user ? (
        <UserForm onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;