import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, User, LogOut } from 'lucide-react';
import OnboardingWizard from './OnboardingWizard';

const Layout = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState(user);
  
  const handleOnboardingComplete = (updatedUser) => {
    setCurrentUser(updatedUser); 
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Feed', path: '/feed', icon: Activity },
    { name: 'Profile', path: `/profile/${currentUser?.id || 'me'}`, icon: User },
  ];
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
       <OnboardingWizard user={currentUser} onComplete={handleOnboardingComplete} />

       {/* --- UNIFIED HEADER (Desktop & Mobile) --- */}
       <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 h-16">
         <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            
            {/* 1. Logo */}
            <div className="flex items-center gap-8">
              <h1 className="font-black text-xl tracking-tight text-white select-none">
                CLASH<span className="text-blue-500">FRIENDS</span>
              </h1>

              {/* 2. Desktop Navigation (Hidden on Mobile) */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                        isActive 
                          ? 'bg-blue-500/10 text-blue-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* 3. User Actions */}
            <div className="flex items-center gap-4">
               <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-white">{currentUser?.username}</p>
                  <p className="text-xs text-slate-500 font-mono">{currentUser?.player_tag}</p>
               </div>
               <button 
                 onClick={onLogout} 
                 className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                 title="Sign Out"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
         </div>
       </header>

       {/* --- MAIN CONTENT WRAPPER --- */}
       <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-8">
        <Outlet context={{ currentUser, setCurrentUser }} />
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
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