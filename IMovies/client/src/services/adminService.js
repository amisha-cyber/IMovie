import { api } from './api.js';

export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getBookings: (params = {}) => api.get('/admin/bookings', { params }),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`)
};
