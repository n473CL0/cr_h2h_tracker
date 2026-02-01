import React from 'react';
import { Activity } from 'lucide-react';

const Feed = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Activity className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Social Feed</h2>
      <p className="text-slate-400 max-w-sm">
        See recent battles from your friends and track who is climbing the ladder. Coming soon!
      </p>
    </div>
  );
};

export default Feed;