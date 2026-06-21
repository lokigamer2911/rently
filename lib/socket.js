import { io } from 'socket.io-client';
let socket;
export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      autoConnect: true,
    });
  }
  return socket;
}
