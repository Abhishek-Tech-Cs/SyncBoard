import api from './client.js';

export const searchApi = {
  globalSearch: (params) => api.get('/search', { params }),
};

