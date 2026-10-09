import React from 'react';
import { CheckSquare, Paperclip, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { PriorityBadge } from '../common/Badge.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { format, isPast, isToday } from 'date-fns';

export const TaskCard = ({ task, onClick, onDragStart }) => {
  const completedChecklist = task.checklist?.filter((item) => item.completed).length || 0;
  const totalChecklist = task.checklist?.length || 0;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'Done';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(task);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(task)}
      className="group bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-grab active:cursor-grabbing select-none relative"
    >
      {/* Top Header: Task Key & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {task.taskKey}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Task Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 3).map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {lbl}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom info: Checklist, Attachments, Comments, Due Date, Assignees */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-400 text-xs mt-2">
        <div className="flex items-center gap-3">
          {totalChecklist > 0 && (
            <span
              className={`flex items-center gap-1 ${
                completedChecklist === totalChecklist
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="text-[11px]">
                {completedChecklist}/{totalChecklist}
              </span>
            </span>
          )}

          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="text-[11px]">{task.attachments.length}</span>
            </span>
          )}

          {task.dueDate && (
            <span
              className={`flex items-center gap-1 ${
                isOverdue
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-400'
              }`}
              title={isOverdue ? 'Overdue!' : 'Due date'}
            >
              {isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> : <Clock className="w-3.5 h-3.5" />}
              <span className="text-[11px]">
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            </span>
          )}
        </div>

        {/* Assignees stack */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {task.assignees?.map((u) => (
            <Avatar key={u._id || u} name={u.name} src={u.avatar} size="xs" />
          ))}
        </div>
      </div>
    </div>
  );
};

