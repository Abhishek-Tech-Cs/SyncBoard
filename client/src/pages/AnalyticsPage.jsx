import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/analyticsApi.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard.jsx';

export const AnalyticsPage = () => {
  const { currentWorkspace } = useWorkspace();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentWorkspace?._id) return;
      try {
        setLoading(true);
        const res = await analyticsApi.getWorkspaceAnalytics({});
        setAnalyticsData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [currentWorkspace?._id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Workspace Analytics & Performance
        </h2>
        <p className="text-xs text-slate-400">
          Real-time productivity trends and task completion metrics for {currentWorkspace?.name}
        </p>
      </div>

      <AnalyticsDashboard analyticsData={analyticsData} />
    </div>
  );
};

