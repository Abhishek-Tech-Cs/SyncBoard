import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Zap,
  Users,
  Shield,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/30 text-xl">
            S
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight">SyncBoard</span>
            <span className="text-[10px] font-bold text-indigo-400 block -mt-1">REAL-TIME PLATFORM</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all"
            >
              Open Workspace <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-3">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          Powered by Socket.io, Redis & MongoDB Aggregations
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Synchronize Your Team at the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
            Speed of Thought
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-normal">
          An enterprise-grade, real-time collaborative project management SaaS platform.
          Featuring drag-and-drop Kanban, WebSocket instant syncing, team chat, granular RBAC,
          and production-grade Redis caching.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            Launch Interactive Demo <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-sm border border-slate-700/80 transition-all"
          >
            View Architecture Docs
          </a>
        </div>

        {/* Live UI Mockup Card */}
        <div className="w-full max-w-5xl rounded-3xl p-3 bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-750 shadow-2xl relative">
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 text-left overflow-hidden border border-slate-800">
            {/* Top Bar Mockup */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-500 ml-2">Acme Corp Engineering / SyncBoard Web Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                  ● Socket.io Live
                </span>
              </div>
            </div>

            {/* Columns Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-3">Todo (4)</span>
                <div className="bg-slate-850 p-3 rounded-lg border border-slate-750 mb-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">SYNC-101</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1">Configure Redis Adapter for Socket scaling</p>
                </div>
                <div className="bg-slate-850 p-3 rounded-lg border border-slate-750">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">SYNC-102</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1">Build Zod schema validation middleware</p>
                </div>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-3">In Progress (3)</span>
                <div className="bg-slate-850 p-3 rounded-lg border border-indigo-500/40 shadow-sm shadow-indigo-500/10 mb-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">SYNC-98</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1">Real-time Kanban Drag & Drop synchronizer</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>Alex Rivera</span>
                    <span className="text-amber-400 font-semibold">URGENT</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-3">Done (12)</span>
                <div className="bg-slate-850 p-3 rounded-lg border border-slate-750 opacity-80 mb-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">SYNC-95</span>
                  <p className="text-xs font-semibold text-slate-300 line-through mt-1">Strict workspace isolation & RBAC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-3">Engineered for Scalability & Speed</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Architected to demonstrate mastery in backend systems, distributed communication, and modern frontend ergonomics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800">
            <div className="p-3 bg-indigo-950/60 rounded-xl text-indigo-400 w-fit mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Real-Time WebSocket Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Granular room partitioning by workspace and project. Instant card re-ordering, comments, typing indicators, and user presence broadcasts.
            </p>
          </div>

          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800">
            <div className="p-3 bg-violet-950/60 rounded-xl text-violet-400 w-fit mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Strict Multi-Tenant RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tenancy middleware safeguards every endpoint. Granular roles (Owner, Admin, Manager, Member, Viewer) enforced strictly on backend APIs.
            </p>
          </div>

          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800">
            <div className="p-3 bg-emerald-950/60 rounded-xl text-emerald-400 w-fit mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">MongoDB Aggregation Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time velocity tracking, workload distribution, and completion rates calculated on-the-fly using MongoDB pipelines, cached in Redis.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-20 border-t border-slate-800 px-6 sm:px-12 flex items-center justify-between text-xs text-slate-500 max-w-7xl mx-auto w-full">
        <div>SyncBoard © 2026-2027. Production-grade MERN Portfolio SaaS Platform.</div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-slate-300">Sign In</Link>
          <Link to="/register" className="hover:text-slate-300">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
};

