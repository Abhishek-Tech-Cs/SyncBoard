import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { PriorityBadge } from '../common/Badge.jsx';
import { TaskDetailModal } from '../kanban/TaskDetailModal.jsx';

export const CalendarView = ({ tasks = [], members = [], onTaskUpdated }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [selectedTask, setSelectedTask] = useState(null);

  const prevPeriod = () => {
    setCurrentDate((prev) => (viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)));
  };

  const nextPeriod = () => {
    setCurrentDate((prev) => (viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)));
  };

  const todayPeriod = () => {
    setCurrentDate(new Date());
  };

  // Generate days based on current view mode
  const days = React.useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  const getTasksForDay = (day) => {
    return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 flex flex-col h-full">
      {/* Calendar Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
            </h3>
            <p className="text-xs text-slate-400">Track task due dates across your timeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={todayPeriod}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={prevPeriod}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className={`grid grid-cols-7 gap-2 flex-1 ${viewMode === 'month' ? 'auto-rows-fr' : 'min-h-[400px]'}`}>
        {days.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const currentDay = isToday(day);

          return (
            <div
              key={idx}
              className={`min-h-[90px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                currentDay
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : isCurrentMonth
                  ? 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                  : 'border-slate-100 dark:border-slate-800/40 opacity-40 bg-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold ${
                    currentDay
                      ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>

              {/* Tasks List on this Day */}
              <div className="space-y-1 overflow-y-auto max-h-24">
                {dayTasks.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTask(t)}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 shadow-2xs cursor-pointer text-[11px] truncate flex items-center justify-between gap-1 group"
                  >
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {t.title}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        t.status === 'Done' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          members={members}
          onTaskUpdated={(updated) => {
            if (onTaskUpdated) onTaskUpdated(updated);
          }}
        />
      )}
    </div>
  );
};

