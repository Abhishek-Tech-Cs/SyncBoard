import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Users,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { workspaceApi } from '../api/workspaceApi.js';
import { ProjectCard } from '../components/projects/ProjectCard.jsx';
import { ProjectModal } from '../components/projects/ProjectModal.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { formatDistanceToNow } from 'date-fns';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const res = await workspaceApi.getDashboard(currentWorkspace._id);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentWorkspace?._id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const {
    activeTasks = 0,
    completedTasks = 0,
    overdueTasks = 0,
    completionPercentage = 0,
    recentProjects = [],
    recentActivity = [],
    memberCount = 0,
    projectCount = 0,
  } = dashboardData || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
              Workspace Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Here is what's happening today in <strong className="text-white">{currentWorkspace?.name}</strong>.
              You have <span className="text-indigo-300 font-semibold">{activeTasks} active tasks</span> in your current sprint.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tasks</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {activeTasks}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Tasks</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {completedTasks}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Tasks</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {overdueTasks}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {completionPercentage}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Active Projects ({projectCount})
            </h3>
            <p className="text-xs text-slate-400">Jump right into your project Kanban boards</p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all projects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentProjects.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
          {recentProjects.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No projects created yet. Click "New Project" to get started!
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Audit Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Workspace Activity
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">Immutable Audit Trail</span>
        </div>

        <div className="space-y-4">
          {recentActivity.map((log) => (
            <div key={log._id} className="flex items-start gap-3 text-xs sm:text-sm">
              <Avatar name={log.actor?.name} src={log.actor?.avatar} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 dark:text-slate-200">
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {log.actor?.name || 'User'}
                  </strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">
                    {log.action.toLowerCase().replace(/_/g, ' ')}
                  </span>
                  {log.details?.title && (
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 ml-1">
                      "{log.details.title}"
                    </span>
                  )}
                  {log.details?.from && log.details?.to && (
                    <span className="text-slate-400 ml-1">
                      ({log.details.from} → {log.details.to})
                    </span>
                  )}
                </p>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ''}
                </span>
              </div>
            </div>
          ))}

          {recentActivity.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No recent activities logged yet.</p>
          )}
        </div>
      </div>

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onProjectCreated={loadDashboard}
      />
    </div>
  );
};

