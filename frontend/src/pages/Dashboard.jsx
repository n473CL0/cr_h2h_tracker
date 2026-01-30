import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, RefreshCw, LogOut } from 'lucide-react';
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import PlayerProfileCard from '../components/PlayerProfileCard';
import FriendSearchModal from '../components/FriendSearchModal';
import { api } from '../api/clash';

const Dashboard = ({ user, token, onLogout }) => {
  const [matches, setMatches] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // We need to refresh user data periodically or on sync to get updated trophies
  const [currentUser, setCurrentUser] = useState(user);

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
      console.error("Fetch error:", err);
      // ADD THIS: Logout if token is invalid
      if (err.response && err.response.status === 401) {
        onLogout();
      }
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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="font-black text-xl tracking-tight text-white">
            CLASH<span className="text-blue-500">FRIENDS</span>
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={handleSync} disabled={syncing} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* NEW: Player Profile Card */}
            <PlayerProfileCard user={currentUser} />

            {/* <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Your Performance</h2>
                {loading ? (
                    <div className="h-24 flex items-center justify-center text-slate-500">Loading stats...</div>
                ) : (
                    <StatCard matches={matches} playerTag={user.player_tag} />
                )}
            </div> */}
            
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <p className="text-blue-400 text-sm">
                    Battle data is synced every 30 minutes. 
                    <button onClick={handleSync} className="underline ml-1 hover:text-blue-300">Sync now</button>
                </p>
            </div>
          </div>

          {/* Right Column: Leaderboard & Actions */}
          <div className="space-y-6">
            <button 
                onClick={() => setIsSearchOpen(true)} 
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-blue-900/20 text-white"
            >
              <UserPlus className="w-5 h-5" /> Add Friend
            </button>
            
            <Leaderboard matches={matches} friends={friends} playerTag={user.player_tag} />
          </div>
        </div>
      </main>

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