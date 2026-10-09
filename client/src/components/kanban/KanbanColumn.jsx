import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { STATUS_CONFIG } from '../../utils/constants.js';
import { TaskCard } from './TaskCard.jsx';

export const KanbanColumn = ({
  status,
  tasks = [],
  onTaskClick,
  onAddTask,
  onTaskDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = STATUS_CONFIG[status] || { label: status, dot: 'bg-slate-400' };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-3 border transition-colors min-w-[280px] w-full max-w-sm ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
          : 'border-slate-200/70 dark:border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {config.label}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-xs border border-slate-200 dark:border-slate-700">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(status)}
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          title={`Add task to ${status}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List / Drop Area */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[150px] pr-1">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={onTaskClick}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

