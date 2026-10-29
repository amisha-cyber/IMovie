import { api } from './api.js';

export const showService = {
  getShows: (params = {}) => api.get('/shows', { params }),
  getShowById: (id) => api.get(`/shows/${id}`),
  createShow: (showData) => api.post('/shows', showData),
  updateShow: (id, showData) => api.patch(`/shows/${id}`, showData),
  deleteShow: (id) => api.delete(`/shows/${id}`),
  getSeats: (showId) => api.get(`/shows/${showId}/seats`)
};
