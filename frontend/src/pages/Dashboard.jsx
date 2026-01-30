import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, RefreshCw, LogOut } from 'lucide-react';
import MatchTable from '../components/MatchTable';
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import FriendSearchModal from '../components/FriendSearchModal';
import { api } from '../api/clash';

const Dashboard = ({ user, onLogout }) => {
  const [matches, setMatches] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [matchData, friendData] = await Promise.all([
        api.getMatches(user.player_tag),
        api.getFriends(user.id)
      ]);
      setMatches(matchData);
      setFriends(friendData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
          <h1 className="font-black text-xl tracking-tight text-blue-500">CR<span className="text-white">H2H</span></h1>
          <div className="flex items-center gap-3">
            <button onClick={handleSync} disabled={syncing} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-red-900/20 text-red-500 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <StatCard matches={matches} playerTag={user.player_tag} />
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-bold">Recent Battles</h2>
              </div>
              <div className="p-6">
                {loading ? <p className="text-center text-slate-500">Loading...</p> : <MatchTable matches={matches} playerTag={user.player_tag} />}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <button onClick={() => setIsSearchOpen(true)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-blue-900/20">
              <UserPlus className="w-5 h-5" /> Find Rivals
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