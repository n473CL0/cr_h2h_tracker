import React from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">User Profile</h2>
        <p className="text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg">
            ID: {id}
        </p>
        <p className="text-slate-500 mt-4 text-sm">Detailed player stats coming soon.</p>
    </div>
  );
};

export default Profile;