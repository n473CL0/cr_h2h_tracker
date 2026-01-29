import React, { useState } from 'react';
import { Search, UserPlus, Share2, Check } from 'lucide-react';
import { api } from '../api/clash';

const FriendSearch = ({ currentUser }) => {
  const [searchTag, setSearchTag] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, searching, found, not-found, error
  const [feedback, setFeedback] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTag) return;

    setStatus('searching');
    setSearchResult(null);
    setFeedback('');

    try {
      // Normalize tag just in case
      let tag = searchTag.toUpperCase();
      if (!tag.startsWith('#')) tag = '#' + tag;

      if (tag === currentUser.player_tag) {
        setStatus('error');
        setFeedback("That's you! You can't add yourself.");
        return;
      }

      const user = await api.searchUser(tag);
      
      if (user) {
        setSearchResult(user);
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setFeedback('Something went wrong. Try again.');
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    try {
      await api.addFriend(currentUser.id, searchResult.id);
      setStatus('success');
      setFeedback(`Success! You are now rivals with ${searchResult.username}.`);
      setSearchTag('');
      setSearchResult(null);
    } catch (err) {
      setStatus('error');
      // Check if it's a duplicate error
      if (err.response?.status === 400) {
        setFeedback('You are already friends with this player!');
      } else {
        setFeedback('Failed to add friend.');
      }
    }
  };

  const copyInviteLink = () => {
    // Mock invite link logic
    const link = `${window.location.origin}?ref=${currentUser.player_tag}`;
    navigator.clipboard.writeText(link);
    setFeedback('Invite link copied to clipboard!');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-blue-600" />
        Find Rivals
      </h3>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <input
          type="text"
          placeholder="Enter Player Tag (e.g. #P990V0)"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg py-3 pl-4 pr-12 font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Results Area */}
      {status === 'searching' && (
        <div className="text-center text-slate-500 py-4">Searching database...</div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-4">
          {feedback}
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center mb-4 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          {feedback}
        </div>
      )}

      {/* Scenario A: User Found */}
      {status === 'found' && searchResult && (
        <div className="bg-slate-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between animate-fade-in">
          <div>
            <div className="font-bold text-slate-800">{searchResult.username}</div>
            <div className="text-xs text-slate-500 font-mono">{searchResult.player_tag}</div>
          </div>
          <button
            onClick={handleAddFriend}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}

      {/* Scenario B: User Not Found */}
      {status === 'not-found' && (
        <div className="text-center py-4">
          <div className="text-slate-500 mb-3">User not found on H2H Tracker.</div>
          <button
            onClick={copyInviteLink}
            className="mx-auto flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-200"
          >
            <Share2 className="w-4 h-4" />
            Share Invite Link
          </button>
          {feedback && <div className="text-xs text-green-600 mt-2">{feedback}</div>}
        </div>
      )}
    </div>
  );
};

export default FriendSearch;