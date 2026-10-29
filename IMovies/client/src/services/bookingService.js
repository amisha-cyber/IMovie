import { api } from './api.js';

export const bookingService = {
  holdSeats: (data) => api.post('/bookings/hold', data),
  createPaymentOrder: (data) => api.post('/bookings/create-order', data),
  confirmBooking: (data) => api.post('/bookings/confirm', data),
  getMyBookings: () => api.get('/bookings/my'),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id, data = {}) => api.post(`/bookings/${id}/cancel`, data),
  getTicket: (id) => api.get(`/bookings/${id}/ticket`),
  simulatePayment: (data) => api.post('/payments/simulate', data)
};
