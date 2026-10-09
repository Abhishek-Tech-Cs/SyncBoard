import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';
import { PriorityBadge } from '../common/Badge.jsx';
import { format } from 'date-fns';

export const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const progress = project.progress || 0;
  const totalTasks = project.totalTasks || 0;
  const completedTasks = project.completedTasks || 0;

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center font-mono">
              {project.key}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {project.name}
            </h3>
          </div>
          <PriorityBadge priority={project.priority} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {project.description || 'No description provided for this project.'}
        </p>
      </div>

      <div>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-500">Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{completedTasks}/{totalTasks}</span>
            </span>
            {project.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(project.dueDate), 'MMM d')}</span>
              </span>
            )}
          </div>

          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
            Open Board <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

