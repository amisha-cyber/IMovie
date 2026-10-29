import { api } from './api.js';

export const movieService = {
  getMovies: (params = {}) => api.get('/movies', { params }),
  getMovieById: (id) => api.get(`/movies/${id}`),
  createMovie: (movieData) => api.post('/movies', movieData),
  updateMovie: (id, movieData) => api.patch(`/movies/${id}`, movieData),
  deleteMovie: (id) => api.delete(`/movies/${id}`),
  uploadImage: (formData) => api.post('/movies/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};
