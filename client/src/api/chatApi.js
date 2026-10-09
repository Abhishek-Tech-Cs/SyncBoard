import api from './client.js';

export const chatApi = {
  getChannels: () => api.get('/channels'),
  createChannel: (data) => api.post('/channels', data),
  getOrCreateDirectChannel: (targetUserId) => api.post('/channels/direct', { targetUserId }),
  getMessages: (channelId, params) => api.get(`/channels/${channelId}/messages`, { params }),
  sendMessage: (channelId, data) => api.post(`/channels/${channelId}/messages`, data),
  editMessage: (messageId, data) => api.put(`/channels/messages/${messageId}`, data),
  deleteMessage: (messageId) => api.delete(`/channels/messages/${messageId}`),
};

