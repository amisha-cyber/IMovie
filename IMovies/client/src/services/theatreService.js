import { api } from './api.js';

export const theatreService = {
  getTheatres: (params = {}) => api.get('/theatres', { params }),
  getTheatreById: (id) => api.get(`/theatres/${id}`),
  createTheatre: (data) => api.post('/theatres', data),
  updateTheatre: (id, data) => api.patch(`/theatres/${id}`, data),
  deleteTheatre: (id) => api.delete(`/theatres/${id}`),
  getScreens: (theatreId) => api.get(`/theatres/${theatreId}/screens`),
  createScreen: (theatreId, data) => api.post(`/theatres/${theatreId}/screens`, data),
  updateScreen: (screenId, data) => api.patch(`/screens/${screenId}`, data),
  deleteScreen: (screenId) => api.delete(`/screens/${screenId}`)
};
