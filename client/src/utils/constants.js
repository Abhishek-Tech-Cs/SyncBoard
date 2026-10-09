export const TASK_STATUSES = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'];

export const STATUS_CONFIG = {
  Backlog: {
    label: 'Backlog',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  Todo: {
    label: 'Todo',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  'In Progress': {
    label: 'In Progress',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  Review: {
    label: 'Review',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  Done: {
    label: 'Done',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
};

export const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    iconColor: 'text-slate-400',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    iconColor: 'text-blue-500',
  },
  HIGH: {
    label: 'High',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  URGENT: {
    label: 'Urgent',
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    iconColor: 'text-rose-500',
  },
};

export const ROLE_CONFIG = {
  OWNER: {
    label: 'Owner',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  ADMIN: {
    label: 'Admin',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  MANAGER: {
    label: 'Manager',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  MEMBER: {
    label: 'Member',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
  VIEWER: {
    label: 'Viewer',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
};

