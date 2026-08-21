import { io } from 'socket.io-client';
import { getStoredAuthToken } from './authToken';
let socket;

function getSocketUrl() {
  if (typeof window === 'undefined') return '';
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl) return socketUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const normalized = apiUrl.replace(/\/api\/?$/, '');
  return normalized || window.location.origin;
}

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    const url = getSocketUrl();
    socket = io(url, {
      auth: { token: getStoredAuthToken() },
      autoConnect: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
