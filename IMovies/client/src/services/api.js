import axios from 'axios';

// Support VITE_API_BASE_URL (full URL like https://api.example.com/api/v1) or VITE_API_URL (host like https://api.example.com)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return 'http://localhost:5000/api/v1';
  }
  const clean = envUrl.trim().replace(/\/$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-IMovies-Client': '1'
  }
});

// Attach Bearer token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and has stored credentials, clear and redirect to login
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    const message = error.response?.data?.message || error.message || 'Network error occurred.';
    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    enhancedError.code = error.response?.data?.code;
    enhancedError.data = error.response?.data;
    return Promise.reject(enhancedError);
  }
);
