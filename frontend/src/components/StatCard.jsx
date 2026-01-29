import React from 'react';
import { Trophy, Swords } from 'lucide-react';

const StatCard = ({ matches, playerTag }) => {
  if (!matches || matches.length === 0) return null;

  // Calculate stats
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.winner_tag === playerTag).length;
  const winRate = Math.round((wins / totalMatches) * 100);
  
  // Calculate crowns (if I am player_1, use crowns_1, etc.)
  const totalCrowns = matches.reduce((acc, m) => {
    const isP1 = m.player_1_tag === playerTag;
    return acc + (isP1 ? m.crowns_1 : m.crowns_2);
  }, 0);

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Swords className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Win Rate</span>
        </div>
        <div className="text-2xl font-black text-white">{winRate}%</div>
        <div className="text-xs text-slate-500">{wins} Wins / {totalMatches} Matches</div>
      </div>
      
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold uppercase">Crowns</span>
        </div>
        <div className="text-2xl font-black text-white">{totalCrowns}</div>
        <div className="text-xs text-slate-500">Total Crowns Taken</div>
      </div>
    </div>
  );
};

export default StatCard;