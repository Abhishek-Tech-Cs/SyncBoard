import React, { useState, useEffect } from 'react';
import { Search, Hash, FolderKanban, MessageSquare, Users, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/searchApi.js';
import { Avatar } from './Avatar.jsx';
import { StatusBadge, PriorityBadge } from './Badge.jsx';

export const CommandSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], projects: [], comments: [], members: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], projects: [], comments: [], members: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchApi.globalSearch({ q: query });
        setResults(res.data.results || { tasks: [], projects: [], comments: [], members: [] });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search tasks, projects, members, comments... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-base outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-center text-sm text-slate-400 py-4">Searching workspace...</p>}

          {!loading && !query && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Type to search across tasks, projects, chats, and members.
            </div>
          )}

          {/* Tasks */}
          {results.tasks?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tasks
              </div>
              <div className="space-y-1.5">
                {results.tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => {
                      navigate(`/projects/${task.project._id || task.project}?task=${task._id}`);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                        {task.taskKey}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {results.projects?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <FolderKanban className="w-3.5 h-3.5" /> Projects
              </div>
              <div className="space-y-1.5">
                {results.projects.map((proj) => (
                  <div
                    key={proj._id}
                    onClick={() => {
                      navigate(`/projects/${proj._id}`);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {proj.key}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{proj.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{proj.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {results.members?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" /> Members
              </div>
              <div className="space-y-1.5">
                {results.members.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <Avatar name={m.user.name} src={m.user.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.user.name}</p>
                      <p className="text-xs text-slate-400">{m.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

