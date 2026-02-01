import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/clash';
import PlayerProfileCard from '../components/PlayerProfileCard';
import MatchTable from '../components/MatchTable';
import Leaderboard from '../components/Leaderboard';
import H2HDrillDown from '../components/H2HDrillDown'; // <--- Import
import { Loader2, UserPlus, Check } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [h2hStats, setH2HStats] = useState(null); // <--- New State
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const userId = id === 'me' ? 'me' : id;
        
        const promises = [
          api.getUser(userId),
          api.getUserMatches(userId)
        ];

        // Only fetch H2H if we are looking at someone else
        if (userId !== 'me') {
            promises.push(api.getH2HStats(userId));
        }

        const results = await Promise.all(promises);
        
        setProfile(results[0]);
        setMatches(results[1]);
        if (results[2]) setH2HStats(results[2]);

      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [id]);

  // ... handleAddFriend logic ... (same as before)

  if (loading) {
     return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return <div className="text-white text-center">User not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Section */}
      <div className="relative">
        <PlayerProfileCard player={profile} />
        {/* ... Friend Button logic ... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Column (2/3 width on Desktop) */}
        <div className="lg:col-span-2 space-y-8">
            {/* Show H2H if available */}
            {h2hStats && (
                <H2HDrillDown stats={h2hStats} opponentName={profile.username} />
            )}

            <div>
                <h3 className="text-xl font-bold text-white mb-4">Recent Battles</h3>
                <MatchTable matches={matches} />
            </div>
        </div>

        {/* Sidebar Column (1/3 width on Desktop) */}
        <div className="lg:col-span-1">
           <h3 className="text-xl font-bold text-white mb-4">Global Ladder</h3>
           {/* Reusing Leaderboard here, but it now has internal tabs */}
           <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default Profile;