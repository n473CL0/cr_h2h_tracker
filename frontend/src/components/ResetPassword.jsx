import React, { useState, useEffect } from 'react';
import { api } from '../api/clash';
import { Lock, ArrowRight, Loader2, CheckCircle, AlertOctagon } from 'lucide-react';

const ResetPassword = () => {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('ref') || params.get('token');
    if (t) setToken(t);
    else {
        setStatus('error');
        setMsg('Missing reset token. Please use the link from your email.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setMsg("Passwords do not match.");
        return;
    }
    
    setStatus('loading');
    try {
        await api.resetPassword(token, password);
        setStatus('success');
    } catch (err) {
        setStatus('error');
        setMsg(err.response?.data?.detail || "Failed to reset password. The link may have expired.");
    }
  };

  if (status === 'success') {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-slate-400 mb-6">Your password has been updated successfully.</p>
                <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl font-bold block w-full">
                    Go to Login
                </a>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-8 text-center border-b border-slate-700 bg-slate-800/50">
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your new secure password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {status === 'error' && (
                <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 flex-shrink-0" />
                    {msg}
                </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={status === 'error'}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={status === 'error'}
              />
            </div>

            <button
                type="submit"
                disabled={status === 'loading' || status === 'error'}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5"/> : (
                  <>Update Password <ArrowRight className="w-5 h-5" /></>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;