import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, User, LogOut } from 'lucide-react';
import OnboardingWizard from './OnboardingWizard'; // <--- Import

const Layout = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState(user);
  
  // Callback to update local user state when onboarding finishes
  const handleOnboardingComplete = (updatedUser) => {
    setCurrentUser(updatedUser); 
  };
  
  // Use currentUser for rendering properly
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Feed', path: '/feed', icon: Activity },
    { name: 'Profile', path: `/profile/${currentUser?.id || 'me'}`, icon: User },
  ];
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
       {/* Inject Wizard */}
       <OnboardingWizard user={currentUser} onComplete={handleOnboardingComplete} />

       {/* ... Rest of existing Layout code (Header, Main, Mobile Nav) ... */}
       {/* ... Ensure you use 'currentUser' instead of 'user' prop in the header display ... */}
       
       <header className="hidden md:flex border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 h-16 items-center px-8 justify-between">
         {/* ... Header content ... */}
          <div className="flex items-center gap-4">
             <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-white">{currentUser?.username}</p>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.player_tag}</p>
             </div>
             <button onClick={onLogout} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
       </header>

       <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        <Outlet />
      </main>

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