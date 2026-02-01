import React from 'react';
import { Swords, Trophy } from 'lucide-react';

const H2HDrillDown = ({ stats, opponentName }) => {
  if (!stats) return null;

  const totalGames = stats.wins + stats.losses;
  const myCrowns = stats.total_crowns_won || 0;
  const theirCrowns = stats.total_crowns_lost || 0;
  const totalCrowns = myCrowns + theirCrowns;

  const myCrownWidth = totalCrowns > 0 ? (myCrowns / totalCrowns) * 100 : 50;
  
  // Streak Logic: Assuming stats.last_5 is array of booleans/strings ['W', 'L', 'W'...]
  // If backend doesn't provide it, we hide this section.
  const streak = stats.last_5 || []; 

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
        <Swords className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-white">Head-to-Head</h3>
      </div>

      <div className="space-y-6">
        {/* Record Summary */}
        <div className="flex justify-between items-center text-sm font-medium">
            <div className="text-center">
                <div className="text-2xl font-black text-green-400">{stats.wins}</div>
                <div className="text-slate-500">Wins</div>
            </div>
            <div className="flex flex-col items-center px-4">
                <span className="text-xs text-slate-400 uppercase tracking-widest">Versus</span>
                <span className="text-white font-bold text-lg">{totalGames} Games</span>
            </div>
            <div className="text-center">
                <div className="text-2xl font-black text-red-400">{stats.losses}</div>
                <div className="text-slate-500">Losses</div>
            </div>
        </div>

        {/* Crown Comparison Bar */}
        <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500"/> You ({myCrowns})</span>
                <span className="flex items-center gap-1">{opponentName} ({theirCrowns}) <Trophy className="w-3 h-3 text-slate-600"/></span>
            </div>
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden flex relative">
                <div 
                    className="h-full bg-yellow-600 transition-all duration-1000" 
                    style={{ width: `${myCrownWidth}%` }}
                />
                <div className="h-full bg-slate-700 flex-1" />
                
                {/* Center marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900 z-10" />
            </div>
        </div>

        {/* Recent Streak */}
        {streak.length > 0 && (
            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                <span className="text-xs text-slate-400 font-bold uppercase">Last 5</span>
                <div className="flex gap-2">
                    {streak.map((result, idx) => (
                        <div 
                            key={idx}
                            title={result === 'W' ? 'Win' : 'Loss'}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                result === 'W' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                : 'bg-red-500/20 text-red-400 border-red-500/50'
                            }`}
                        >
                            {result}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default H2HDrillDown;