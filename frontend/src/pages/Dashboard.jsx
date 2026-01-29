import React, { useEffect, useState } from 'react';
import { RefreshCcw, LogOut } from 'lucide-react';
import { api } from '../api/clash';
import StatCard from '../components/StatCard';
import MatchTable from '../components/MatchTable';

const Dashboard = ({ user, onLogout }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Initial Fetch
  useEffect(() => {
    fetchHistory();
  }, [user.player_tag]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getMatches(user.player_tag);
      setMatches(data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncBattles(user.player_tag);
      await fetchHistory(); // Refresh list after sync
    } catch (error) {
      console.error("Sync failed", error);
      alert("Failed to sync with Supercell. Try again later.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 p-4 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">{user.username}</h2>
            <p className="text-xs text-blue-400 font-mono">{user.player_tag}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`p-2 rounded-full bg-slate-700 hover:bg-blue-600 transition-colors ${syncing ? 'animate-spin text-blue-400' : 'text-white'}`}
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="p-2 rounded-full bg-slate-700 hover:bg-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        <StatCard matches={matches} playerTag={user.player_tag} />
        
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Battle Log</h3>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500 animate-pulse">Loading battle data...</div>
        ) : (
          <MatchTable matches={matches} playerTag={user.player_tag} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;