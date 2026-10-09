import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-2xl flex items-center justify-center mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The page you are looking for doesn't exist or has been moved to another location.
      </p>
      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
      >
        <Home className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
};

