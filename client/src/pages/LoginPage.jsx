import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error handled by AuthContext toast
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass = 'Password123!') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    login(demoEmail, demoPass).then(() => navigate('/dashboard')).catch(() => {});
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your credentials to access your workspaces
        </p>
      </div>

      {/* 1-Click Demo Logins Banner */}
      <div className="mb-6 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> 1-Click Portfolio Demo Logins
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => handleQuickLogin('alex@syncboard.dev')}
            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-left font-medium hover:border-indigo-500 border border-transparent transition-all truncate text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            👑 Alex (Owner)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('samantha@syncboard.dev')}
            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-left font-medium hover:border-indigo-500 border border-transparent transition-all truncate text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            🛡️ Samantha (Admin)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('david@syncboard.dev')}
            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-left font-medium hover:border-indigo-500 border border-transparent transition-all truncate text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            ⚡ David (Manager)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('sophia@syncboard.dev')}
            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-left font-medium hover:border-indigo-500 border border-transparent transition-all truncate text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            👁️ Sophia (Viewer)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email address
          </label>
          <input
            type="email"
            required
            placeholder="alex@syncboard.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
};

