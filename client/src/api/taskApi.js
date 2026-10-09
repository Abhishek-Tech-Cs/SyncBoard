import api from './client.js';

export const taskApi = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  moveTask: (id, data) => api.put(`/tasks/${id}/move`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),

  // Checklist
  addChecklistItem: (taskId, text) => api.post(`/tasks/${taskId}/checklist`, { text }),
  toggleChecklistItem: (taskId, itemId, completed) =>
    api.put(`/tasks/${taskId}/checklist/${itemId}`, { completed }),
  deleteChecklistItem: (taskId, itemId) =>
    api.delete(`/tasks/${taskId}/checklist/${itemId}`),

  // Comments
  getComments: (taskId) => api.get(`/tasks/${taskId}/comments`),
  addComment: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),

  // Attachments
  uploadAttachment: (formData) =>
    api.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAttachment: (id) => api.delete(`/attachments/${id}`),
};

