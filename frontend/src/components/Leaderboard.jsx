import React, { useState, useEffect } from 'react';
import { Skull, Swords, Crown, AlertCircle } from 'lucide-react';
import { api } from '../api/clash';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const [data, setData] = useState({ nemesis: [], rivals: [], domination: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rivals');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.getAdvancedLeaderboard();
        // Fallback checks in case API returns empty or simplified structure
        setData(result || { nemesis: [], rivals: [], domination: [] });
      } catch (error) {
        console.error("Failed to load leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const tabs = [
    { id: 'nemesis', label: 'Nemesis', icon: Skull, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'rivals', label: 'Rivals', icon: Swords, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'domination', label: 'Domination', icon: Crown, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const currentList = data[activeTab] || [];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === tab.id ? 'text-white bg-slate-700/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : 'opacity-50'}`} />
            <span className="text-xs font-bold tracking-wide uppercase">{tab.label}</span>
            {activeTab === tab.id && (
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.color.replace('text-', 'bg-')}`} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-0 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500">Loading stats...</div>
        ) : currentList.length > 0 ? (
          <div className="divide-y divide-slate-700/50">
            {currentList.map((player) => (
              <div 
                key={player.id}
                onClick={() => navigate(`/profile/${player.id}`)}
                className="p-4 flex items-center justify-between hover:bg-slate-700/30 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    activeTab === 'nemesis' ? 'bg-red-900/30 text-red-400' :
                    activeTab === 'rivals' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-green-900/30 text-green-400'
                  }`}>
                    {player.win_rate}%
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{player.username}</p>
                    <p className="text-xs text-slate-500">{player.wins}W - {player.losses}L</p>
                  </div>
                </div>
                
                {/* Visual Context Badge */}
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded border ${
                     activeTab === 'nemesis' ? 'border-red-900 text-red-400 bg-red-900/10' :
                     activeTab === 'rivals' ? 'border-yellow-900 text-yellow-400 bg-yellow-900/10' :
                     'border-green-900 text-green-400 bg-green-900/10'
                  }`}>
                    {activeTab === 'nemesis' ? 'Losing Streak' : activeTab === 'rivals' ? 'Tight Match' : 'Winning Streak'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 p-6 text-center">
            <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
            <p>No players in this category yet.</p>
            <p className="text-xs mt-1">Play more matches to populate your stats!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;