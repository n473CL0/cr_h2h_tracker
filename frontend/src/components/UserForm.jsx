import React, { useState, useEffect } from 'react';
import { api } from '../api/clash';
import { Mail, Lock, ArrowRight, Loader2, Gift, AlertTriangle, KeyRound, ArrowLeft } from 'lucide-react';

const UserForm = ({ onLogin, inviteData }) => {
  // States: LOGIN (default), SIGNUP (if invited), FORGOT
  const [mode, setMode] = useState(inviteData ? 'signup' : 'login');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (inviteData) setMode('signup');
  }, [inviteData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'forgot') {
         await api.forgotPassword(formData.email);
         setSuccessMsg("If an account exists, a reset link has been sent to your email.");
         setLoading(false);
         return;
      }

      if (mode === 'login') {
        const data = await api.login(formData.email, formData.password);
        onLogin(data.access_token);
      } else {
        // Signup
        const tokenToSend = inviteData ? inviteData.token : null;
        await api.signup({
          email: formData.email,
          password: formData.password,
          invite_token: tokenToSend,
          player_tag: inviteData?.target_tag 
        });
        
        const loginData = await api.login(formData.email, formData.password);
        onLogin(loginData.access_token);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if the main submit button should be visible
  const showSubmitButton = () => {
      if (mode === 'login') return true;
      if (mode === 'forgot') return true;
      if (mode === 'signup' && inviteData) return true; // Only show if invited
      return false;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        
        <div className="p-8 text-center border-b border-slate-700 bg-slate-800/50">
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            CLASH<span className="text-blue-500">FRIENDS</span>
          </h1>
          
          {mode === 'forgot' ? (
              <p className="text-slate-400 text-sm">Recover your account</p>
          ) : inviteData ? (
             <div className="bg-blue-900/20 text-blue-300 p-3 rounded-xl text-sm border border-blue-500/30 flex flex-col gap-1 items-center mt-4">
                <Gift className="w-5 h-5 mb-1" />
                <span>Invited by <strong>{inviteData.creator_username}</strong></span>
                {inviteData.target_tag && (
                    <span className="text-xs opacity-75">Sign up to claim tag <strong>{inviteData.target_tag}</strong></span>
                )}
             </div>
          ) : (
            <div className="mt-4">
               {mode === 'login' ? (
                  <p className="text-slate-400 text-sm">Welcome back, challenger.</p>
               ) : (
                   <div className="bg-yellow-900/20 text-yellow-200 p-3 rounded-xl text-sm border border-yellow-500/30 flex items-start gap-3 text-left">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-500" />
                      <div>
                          <strong className="block text-yellow-400 mb-1">Invite Only</strong>
                          For now, you can only join ClashFriends if you have been invited by a friend.
                      </div>
                   </div>
               )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {mode !== 'forgot' && (
                <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
                </div>
            )}
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg">{error}</div>}
          {successMsg && <div className="text-green-400 text-sm text-center bg-green-900/20 p-2 rounded-lg">{successMsg}</div>}

          {/* Active Submit Button (Login, Forgot, or Valid Signup) */}
          {showSubmitButton() && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : (
                  <>
                    {mode === 'login' && 'Log In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
          )}
          
          {/* Disabled Button (Only shown if Signup Mode + No Invite) */}
          {mode === 'signup' && !inviteData && (
               <button type="button" disabled className="w-full py-3 bg-slate-700 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  Registration Locked <Lock className="w-4 h-4" />
              </button>
          )}

          {/* Forgot Password Link */}
          {/* {mode === 'login' && (
              <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                    className="text-slate-500 hover:text-slate-300 text-xs flex items-center justify-center gap-1 mx-auto"
                  >
                      <KeyRound className="w-3 h-3" /> Forgot Password?
                  </button>
              </div>
          )} */}
        </form>

        <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-center">
            {mode === 'forgot' ? (
                <button 
                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                    className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
            ) : inviteData ? (
                 <button 
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                 >
                    {mode === 'login' ? "Have an invite? Create Account" : "Already have an account? Log in"}
                 </button>
            ) : (
                 <button 
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                 >
                    {mode === 'login' ? "I have an invite link" : "Back to Login"}
                 </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserForm;