import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!rawUrl) {
    return 'http://localhost:5000';
  }
  return rawUrl.trim().replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
};

const SOCKET_URL = getSocketUrl();

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
};
