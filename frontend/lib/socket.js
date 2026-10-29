import { io } from 'socket.io-client';
let socket;

function getSocketUrl() {
  if (typeof window === 'undefined') return '';
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl) return socketUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const normalized = apiUrl.replace(/\/api\/?$/, '');
  return normalized || window.location.origin;
}

/**
 * Get or create the Socket.IO singleton.
 * Uses withCredentials: true so the browser sends the httpOnly JWT cookie
 * automatically with the WebSocket handshake — no need to pass the token
 * in auth, which was broken on page refresh (in-memory token was lost).
 */
export function getSocket() {
  if (!socket || !socket.connected) {
    const url = getSocketUrl();
    socket = io(url, {
      withCredentials: true,
      autoConnect: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
