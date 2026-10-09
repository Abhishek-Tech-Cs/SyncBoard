import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
  );
};

export const KanbanBoardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full h-[calc(100vh-12rem)]">
      {[1, 2, 3, 4, 5].map((col) => (
        <div key={col} className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col gap-3 border border-slate-200/60 dark:border-slate-800">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
};

