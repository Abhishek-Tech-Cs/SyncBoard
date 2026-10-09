import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Kanban,
  List as ListIcon,
  Calendar as CalendarIcon,
  BarChart3,
  Plus,
  Filter,
  Search,
  Users,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { projectApi } from '../api/projectApi.js';
import { taskApi } from '../api/taskApi.js';
import { analyticsApi } from '../api/analyticsApi.js';
import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';
import { CalendarView } from '../components/calendar/CalendarView.jsx';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard.jsx';
import { TaskCreateModal } from '../components/kanban/TaskCreateModal.jsx';
import { TaskDetailModal } from '../components/kanban/TaskDetailModal.jsx';
import { PriorityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { KanbanBoardSkeleton } from '../components/common/Skeleton.jsx';
import { format } from 'date-fns';

export const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentView = searchParams.get('view') || 'kanban';
  const deepLinkTaskId = searchParams.get('task');

  const [projectData, setProjectData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, tasksRes, analyticsRes] = await Promise.all([
        projectApi.getProjectById(projectId),
        taskApi.getTasks({ projectId }),
        analyticsApi.getWorkspaceAnalytics({ projectId }),
      ]);

      setProjectData(projRes.data);
      setTasks(tasksRes.data.tasks || []);
      setAnalyticsData(analyticsRes.data);

      if (deepLinkTaskId) {
        const found = (tasksRes.data.tasks || []).find((t) => t._id === deepLinkTaskId);
        if (found) setSelectedTask(found);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleViewChange = (view) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', view);
      return next;
    });
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.taskKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return <KanbanBoardSkeleton />;
  }

  const { project, members = [], stats = {} } = projectData || {};

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Project Header */}
      <div className="shrink-0 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {project?.key}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {project?.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl truncate">
                {project?.description || 'No description'}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => handleViewChange('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  currentView === 'kanban'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => handleViewChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  currentView === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => handleViewChange('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => handleViewChange('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  currentView === 'analytics'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Filter Toolbar (for Kanban and List) */}
        {(currentView === 'kanban' || currentView === 'list') && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter tasks in this board..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main View Display */}
      <div className="flex-1 overflow-y-auto">
        {currentView === 'kanban' && (
          <KanbanBoard
            projectId={projectId}
            tasks={filteredTasks}
            members={members}
          />
        )}

        {currentView === 'list' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3.5">Key</th>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Assignees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredTasks.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">
                      {t.taskKey}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {t.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {t.dueDate ? format(new Date(t.dueDate), 'MMM d, yyyy') : 'No due date'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex -space-x-1.5">
                        {t.assignees?.map((a) => (
                          <Avatar key={a._id || a} name={a.name} src={a.avatar} size="xs" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentView === 'calendar' && (
          <CalendarView
            tasks={filteredTasks}
            members={members}
            onTaskUpdated={(upd) => {
              setTasks((prev) => prev.map((t) => (t._id === upd._id ? upd : t)));
            }}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsDashboard analyticsData={analyticsData} />
        )}
      </div>

      <TaskCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        members={members}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [...prev, newTask]);
        }}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('task');
              return next;
            });
          }}
          taskId={selectedTask._id}
          members={members}
          onTaskUpdated={(upd) => {
            setTasks((prev) => prev.map((t) => (t._id === upd._id ? upd : t)));
          }}
          onTaskDeleted={(delId) => {
            setTasks((prev) => prev.filter((t) => t._id !== delId));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

