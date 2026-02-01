import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/clash';
import PlayerProfileCard from '../components/PlayerProfileCard';
import MatchTable from '../components/MatchTable';
import Leaderboard from '../components/Leaderboard';
import H2HDrillDown from '../components/H2HDrillDown'; 
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [h2hStats, setH2HStats] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        // 1. Resolve the User First ("me" -> Real ID)
        // We must await this before fetching matches, because the matches 
        // endpoint requires an Integer ID, but 'id' might be "me".
        const userIdParam = id === 'me' ? 'me' : id;
        const userProfile = await api.getUser(userIdParam);
        
        setProfile(userProfile);

        // 2. Use the Real ID for subsequent calls
        const realId = userProfile.id; 
        
        const promises = [
          api.getUserMatches(realId)
        ];

        // 3. Conditional H2H (Only if looking at another player)
        // We check friendship_status to confirm it's not "self"
        if (userProfile.friendship_status !== 'self') {
            promises.push(api.getH2HStats(realId));
        }

        const results = await Promise.all(promises);
        
        setMatches(results[0]);
        if (results[1]) setH2HStats(results[1]);

      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [id]);

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
        {/* FIX: Prop name changed from 'player' to 'user' to match Component definition */}
        <PlayerProfileCard user={profile} />
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
           <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default Profile;