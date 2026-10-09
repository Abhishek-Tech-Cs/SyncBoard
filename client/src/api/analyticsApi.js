import api from './client.js';

export const analyticsApi = {
  getWorkspaceAnalytics: (params) => api.get('/analytics', { params }),
};

