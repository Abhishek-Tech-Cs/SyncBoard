import React from 'react';
import { STATUS_CONFIG, PRIORITY_CONFIG, ROLE_CONFIG } from '../../utils/constants.js';

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority,
    color: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${config.color}`}>
      {config.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const config = ROLE_CONFIG[role] || {
    label: role,
    color: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
};

