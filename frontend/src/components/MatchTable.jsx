import React from 'react';

const MatchTable = ({ matches, playerTag }) => {
  if (!matches.length) return <div className="text-slate-500 text-center py-8">No matches found. Sync to fetch data!</div>;

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const isP1 = match.player_1_tag === playerTag;
        const opponentTag = isP1 ? match.player_2_tag : match.player_1_tag;
        const myCrowns = isP1 ? match.crowns_1 : match.crowns_2;
        const oppCrowns = isP1 ? match.crowns_2 : match.crowns_1;
        
        const isWin = match.winner_tag === playerTag;
        const isDraw = !match.winner_tag;
        
        // Dynamic Border Color
        const borderColor = isWin ? 'border-l-green-500' : isDraw ? 'border-l-slate-500' : 'border-l-red-500';

        return (
          <div key={match.battle_id} className={`bg-slate-800 border-l-4 ${borderColor} rounded-r-lg p-4 shadow-sm`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-mono">
                {new Date(match.battle_time).toLocaleDateString()}
              </span>
              <span className="text-xs font-bold bg-slate-700 px-2 py-1 rounded text-slate-300">
                {match.game_mode}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-400 mb-1">VS</div>
                <div className="font-bold text-white font-mono">{opponentTag}</div>
              </div>
              <div className="text-2xl font-black tracking-widest text-white">
                {myCrowns} - {oppCrowns}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatchTable;