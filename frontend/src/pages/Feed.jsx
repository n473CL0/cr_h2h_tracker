import React, { useState, useEffect } from 'react';
import { api } from '../api/clash';
import MatchTable from '../components/MatchTable';
import { Loader2, AlertCircle } from 'lucide-react';

const Feed = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  const fetchFeed = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      
      const newMatches = await api.getFeed(skip, LIMIT);
      
      if (newMatches.length < LIMIT) setHasMore(false);
      
      setMatches(prev => isLoadMore ? [...prev, ...newMatches] : newMatches);
    } catch (error) {
      console.error("Failed to load feed", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [skip]);

  const handleLoadMore = () => {
    setSkip(prev => prev + LIMIT);
  };

  if (loading && matches.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Social Feed</h2>
        <p className="text-slate-400">Recent battles from your friends network.</p>
      </div>

      {matches.length > 0 ? (
        <>
          <MatchTable matches={matches} />
          
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
           <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-white">No activity yet</h3>
           <p className="text-slate-400 mt-2">Add friends to see their battle history here!</p>
        </div>
      )}
    </div>
  );
};

export default Feed;