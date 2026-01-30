import React from 'react';
import { Trophy, Swords, User } from 'lucide-react';

const Leaderboard = ({ matches, friends, playerTag }) => {
  // Helper to normalize tags for reliable comparison
  const normalize = (tag) => tag.toUpperCase().trim().startsWith('#') ? tag.toUpperCase().trim() : `#${tag.toUpperCase().trim()}`;
  
  const myNormalizedTag = normalize(playerTag);

  // 1. Initialize stats for ALL friends using normalized tags as keys
  const h2hStats = friends.reduce((acc, friend) => {
    const normalizedFriendTag = normalize(friend.player_tag);
    acc[normalizedFriendTag] = {
      wins: 0,
      losses: 0,
      tag: normalizedFriendTag,
      username: friend.username || 'Rival'
    };
    return acc;
  }, {});

  // 2. Aggregate match data using normalized comparisons
  matches.forEach((match) => {
    const p1 = normalize(match.player_1_tag);
    const p2 = normalize(match.player_2_tag);
    
    // Determine who the opponent is in this match
    const oppTag = (p1 === myNormalizedTag) ? p2 : p1;
    
    // If the opponent is a tracked friend, update stats
    if (h2hStats[oppTag]) {
      const winner = match.winner_tag ? normalize(match.winner_tag) : null;
      if (winner === myNormalizedTag) {
        h2hStats[oppTag].wins++;
      } else if (winner && winner === oppTag) {
        h2hStats[oppTag].losses++;
      }
    }
  });

  const sorted = Object.values(h2hStats).sort((a, b) => b.wins - a.wins);

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-4 bg-slate-700/30 border-b border-slate-700 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-white">H2H Standings</h3>
      </div>
      <div className="divide-y divide-slate-700">
        {sorted.length > 0 ? (
          sorted.map((s) => (
            <div key={s.tag} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border border-slate-500">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{s.username}</p>
                  <p className="text-[10px] font-mono text-slate-500">{s.tag}</p>
                </div>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Wins</p>
                  <p className="text-green-400 font-black text-lg">{s.wins}</p>
                </div>
                <div className="w-px h-8 bg-slate-700 my-auto"></div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Losses</p>
                  <p className="text-red-400 font-black text-lg">{s.losses}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm italic">
            Add friends to see rivalries
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;