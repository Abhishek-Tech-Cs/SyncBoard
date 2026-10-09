import api from './client.js';

export const workspaceApi = {
  getWorkspaces: () => api.get('/workspaces'),
  getWorkspace: (id) => api.get(`/workspaces/${id}`, { headers: { 'x-workspace-id': id } }),
  createWorkspace: (data) => api.post('/workspaces', data),
  updateWorkspace: (id, data) => api.put(`/workspaces/${id}`, data, { headers: { 'x-workspace-id': id } }),
  deleteWorkspace: (id) => api.delete(`/workspaces/${id}`, { headers: { 'x-workspace-id': id } }),
  getDashboard: (id) => api.get(`/workspaces/${id}/dashboard`, { headers: { 'x-workspace-id': id } }),
  getMembers: (id) => api.get(`/workspaces/${id}/members`, { headers: { 'x-workspace-id': id } }),
  updateMemberRole: (workspaceId, memberId, role) =>
    api.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role }, { headers: { 'x-workspace-id': workspaceId } }),
  removeMember: (workspaceId, memberId) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`, { headers: { 'x-workspace-id': workspaceId } }),
  leaveWorkspace: (workspaceId) =>
    api.post(`/workspaces/${workspaceId}/leave`, {}, { headers: { 'x-workspace-id': workspaceId } }),

  // Invitations
  inviteMember: (workspaceId, data) =>
    api.post('/invitations', data, { headers: { 'x-workspace-id': workspaceId } }),
  getPendingInvitations: (workspaceId) =>
    api.get('/invitations/pending', { headers: { 'x-workspace-id': workspaceId } }),
  acceptInvitation: (token) => api.post(`/invitations/${token}/accept`),
  declineInvitation: (token) => api.post(`/invitations/${token}/decline`),
  revokeInvitation: (workspaceId, id) =>
    api.delete(`/invitations/${id}`, { headers: { 'x-workspace-id': workspaceId } }),
};

