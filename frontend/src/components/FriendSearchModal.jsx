import React, { useState } from 'react';
import { Search, UserPlus, X, Loader2, Link, Check, Share2, Copy } from 'lucide-react';
import { api } from '../api/clash';

const FriendSearchModal = ({ isOpen, onClose, currentUser, onFriendAdded }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); 
  const [status, setStatus] = useState('idle');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    
    setStatus('searching');
    setResult(null);
    setInviteLink('');
    setCopied(false);
    setIsInviting(false);

    try {
      const token = localStorage.getItem('clash_token');
      const data = await api.searchPlayer(query, token);
      setResult(data); 
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
        if (status !== 'error') setStatus('done');
    }
  };

  const handleAddFriend = async () => {
    if (!result?.user) return;
    try {
      const token = localStorage.getItem('clash_token');
      await api.addFriend(currentUser.id, result.user.id, token);
      onFriendAdded();
      onClose();
    } catch (err) {
      alert("Failed to add friend. Please try again.");
    }
  };

  const generateAndShareInvite = async () => {
      setIsInviting(true);
      try {
          const token = localStorage.getItem('clash_token');
          if (!token) {
              alert("You are not logged in.");
              return;
          }

          const targetTag = result?.status === 'api_found' ? result.tag : null;
          
          // Generate invite in backend to store the intent
          await api.createInvite(targetTag, token);
          
          // --- FIX START: Force IP Address in Link ---
          // If we are on localhost, swap it for the IP so the link works on mobile
          let baseUrl = window.location.origin;
          if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
              baseUrl = baseUrl.replace('localhost', '192.168.0.50').replace('127.0.0.1', '192.168.0.50');
          }
          
          const cleanTag = targetTag ? targetTag.replace('#', '') : '';
          // We MUST encode the # as %23, otherwise the browser treats it as a fragment
          const link = `${baseUrl}/register?ref=%23${cleanTag}`;
          // --- FIX END ---
          
          setInviteLink(link);

          if (navigator.share) {
              try {
                  await navigator.share({
                      title: 'Join me on ClashFriends',
                      text: 'Track our head-to-head battles!',
                      url: link,
                  });
              } catch (err) {
                  // User cancelled share
              }
          }
      } catch(err) {
          console.error("Invite generation failed", err);
          alert("Could not generate invite link.");
      } finally {
          setIsInviting(false);
      }
  };

  const copyToClipboard = () => {
      if (inviteLink) {
          navigator.clipboard.writeText(inviteLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-blue-500" /> Add Friend
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input
              type="text"
              placeholder="Player Tag (e.g. #P990V0)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {status === 'searching' && <div className="flex justify-center py-4 text-blue-500"><Loader2 className="animate-spin" /></div>}

          {result && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                  {result.status === 'friend' && (
                      <div className="flex items-center gap-3 text-green-400">
                          <Check className="w-5 h-5" />
                          <div>
                              <div className="font-bold">{result.user.username}</div>
                              <div className="text-xs opacity-70">Already your friend.</div>
                          </div>
                      </div>
                  )}

                  {result.status === 'user_found' && (
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="font-bold text-white">{result.user.username}</div>
                              <div className="text-xs text-slate-400 font-mono">{result.user.player_tag}</div>
                          </div>
                          <button onClick={handleAddFriend} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm">
                            Add Friend
                          </button>
                      </div>
                  )}

                  {(result.status === 'api_found' || result.status === 'not_found') && (
                      <div className="text-center">
                           <div className="mb-4">
                                {result.status === 'api_found' ? (
                                    <>
                                        <div className="font-bold text-white text-lg">{result.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mb-2">{result.tag}</div>
                                        <p className="text-sm text-slate-300">Player found on Clash Royale, but not here.</p>
                                    </>
                                ) : (
                                    <p className="text-slate-300">Player not found in ClashFriends.</p>
                                )}
                           </div>
                           
                           {!inviteLink ? (
                               <button onClick={generateAndShareInvite} disabled={isInviting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                   {isInviting ? <Loader2 className="animate-spin w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                   Share Invite Link
                               </button>
                           ) : (
                               <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center gap-2">
                                   <Link className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                   <input readOnly value={inviteLink} className="bg-transparent text-sm text-slate-300 w-full outline-none font-mono" />
                                   <button 
                                      onClick={copyToClipboard} 
                                      className={`${copied ? 'text-green-500' : 'text-blue-500'} text-xs font-bold whitespace-nowrap flex items-center gap-1`}
                                   >
                                       {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                       {copied ? "Copied" : "Copy"}
                                   </button>
                               </div>
                           )}
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendSearchModal;