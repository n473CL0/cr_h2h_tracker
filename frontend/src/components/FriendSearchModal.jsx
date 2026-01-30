import React, { useState } from 'react';
import { Search, UserPlus, X, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../api/clash';

const FriendSearchModal = ({ isOpen, onClose, currentUser, onFriendAdded }) => {
  const [searchTag, setSearchTag] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, searching, found, error
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTag) return;
    setStatus('searching');
    setSearchResult(null);
    setFeedback('');

    try {
      let tag = searchTag.toUpperCase().trim();
      if (!tag.startsWith('#')) tag = '#' + tag;

      if (tag === currentUser.player_tag) {
        setStatus('error');
        setFeedback("You cannot add yourself.");
        return;
      }

      const user = await api.searchUser(tag);
      setSearchResult(user);
      setStatus('found');
    } catch (err) {
      setStatus('error');
      setFeedback('Player not found.');
    }
  };

  const handleAddFriend = async () => {
    try {
      // Use numeric IDs for the relationship
      await api.addFriend(currentUser.id, searchResult.id);
      
      // Reset local state before closing
      setSearchTag('');
      setSearchResult(null);
      setStatus('idle');
      
      onFriendAdded(); // Refresh Dashboard data
      onClose();
    } catch (err) {
      setFeedback('Already friends or failed to add.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-blue-500" /> Find Rivals
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input
              type="text"
              placeholder="Player Tag (e.g. #P990V0)"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 font-mono uppercase text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg">
              <Search className="w-4 h-4 text-white" />
            </button>
          </form>

          {status === 'searching' && <div className="flex justify-center py-4 text-blue-500"><Loader2 className="animate-spin" /></div>}
          
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center mb-4">{feedback}</div>
          )}

          {status === 'found' && searchResult && (
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{searchResult.username}</div>
                <div className="text-xs text-slate-400 font-mono">{searchResult.player_tag}</div>
              </div>
              <button onClick={handleAddFriend} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all">
                Add Friend
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendSearchModal;