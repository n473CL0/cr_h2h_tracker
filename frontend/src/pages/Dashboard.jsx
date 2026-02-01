import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, RefreshCw } from 'lucide-react'; // Removed LogOut (handled by Layout)
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import PlayerProfileCard from '../components/PlayerProfileCard';
import FriendSearchModal from '../components/FriendSearchModal';
import BetaBanner from '../components/BetaBanner';
import FeedbackModal from '../components/FeedbackModal';
import { api } from '../api/clash';

const Dashboard = ({ user, token, onLogout }) => {
  // ... Keep existing state definitions (matches, friends, etc.) ...
  const [matches, setMatches] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  // ... Keep existing fetchData and useEffect ...
  const fetchData = useCallback(async () => {
    try {
      const [matchData, friendData, userData] = await Promise.all([
        api.getMatches(user.player_tag, token),
        api.getFriends(user.id, token),
        api.getMe(token)
      ]);
      setMatches(matchData);
      setFriends(friendData);
      setCurrentUser(userData);
    } catch (err) {
      if (err.response && err.response.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  }, [user.player_tag, user.id, token, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncBattles(user.player_tag);
      await fetchData();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Moved BetaBanner here or keep in Layout if you prefer global */}
      <BetaBanner onOpenFeedback={() => setIsFeedbackOpen(true)} />

      {/* --- CONTENT ONLY (Header Removed) --- */}
      
      {/* Mobile/Tablet: Sync Button & Title Row */}
      <div className="flex items-center justify-between md:hidden">
         <h2 className="text-2xl font-bold text-white">Dashboard</h2>
         <button 
            onClick={handleSync} 
            disabled={syncing}
            className="p-2 bg-slate-800 rounded-lg text-blue-400 hover:text-white transition-colors"
         >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <PlayerProfileCard user={currentUser} />
          
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
              <p className="text-blue-400 text-sm">
                  Battle data is synced automatically.
              </p>
              {/* Desktop Sync Button */}
              <button 
                onClick={handleSync} 
                disabled={syncing}
                className="hidden md:flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <button 
              onClick={() => setIsSearchOpen(true)} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 text-white transition-all transform active:scale-95"
          >
            <UserPlus className="w-5 h-5" /> Add Friend
          </button>
          
          <Leaderboard matches={matches} friends={friends} playerTag={user.player_tag} />
        </div>
      </div>

      {/* ... Modals ... */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <FriendSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        currentUser={user} 
        onFriendAdded={fetchData}
      />
    </div>
  );
};

export default Dashboard;