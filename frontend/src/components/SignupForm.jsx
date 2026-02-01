import React, { useState } from 'react';
import { Loader2, UserPlus, Hash } from 'lucide-react';
import { api } from '../api/clash';

const SignupForm = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    player_tag: '',
    invite_token: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic Validation
    let formattedTag = formData.player_tag.toUpperCase();
    if (!formattedTag.startsWith('#')) {
      formattedTag = '#' + formattedTag;
    }

    try {
      // 1. Register Identity (Username/Pass/Invite)
      // Note: We don't send player_tag here because the auth endpoint doesn't handle CR API verification
      await api.signup({
        username: formData.username,
        password: formData.password,
        invite_token: formData.invite_token,
        player_tag: formattedTag
      });
      
      // 2. Auto-Login to get JWT
      const loginData = await api.login(formData.username, formData.password);
      onSignupSuccess(loginData.access_token);
      
      // 3. CRITICAL FIX: Link the Player Tag now that we are logged in
      try {
         await api.linkPlayerTag(formattedTag);
      } catch (tagErr) {
         console.warn("Tag linking failed during signup:", tagErr);
         // We don't block entry, but the user will need to link it later
      }
      
      // 4. Fetch full profile and enter app
      const user = await api.getMe();
      onSignupSuccess({ ...user, ...loginData });

    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Username might be taken.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-900/20">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Join ClashFriends</h1>
          <p className="text-slate-400 text-sm">Link your tag and start tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clash Royale Tag</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="#P990V0"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all uppercase placeholder-slate-600"
                value={formData.player_tag}
                onChange={(e) => setFormData({...formData, player_tag: e.target.value})}
              />
              <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invite Code <span className="text-slate-600 lowercase">(optional)</span></label>
            <input
              type="text"
              placeholder="Paste code here..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={formData.invite_token}
              onChange={(e) => setFormData({...formData, invite_token: e.target.value})}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-green-400 hover:text-green-300 font-bold">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;