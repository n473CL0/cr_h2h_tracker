// src/components/Layout.jsx
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, User, LogOut, Swords } from 'lucide-react';

const Layout = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Feed', path: '/feed', icon: Activity },
    { name: 'Profile', path: `/profile/${user?.id || 'me'}`, icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 h-16 items-center px-8 justify-between">
        <div className="flex items-center gap-2">
           <h1 className="font-black text-xl tracking-tight text-white">
            CLASH<span className="text-blue-500">FRIENDS</span>
          </h1>
        </div>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-bold transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
           <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-white">{user?.username}</p>
              <p className="text-xs text-slate-500 font-mono">{user?.player_tag}</p>
           </div>
           <button 
             onClick={onLogout}
             className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
             title="Sign Out"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-500' : 'text-slate-500'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;