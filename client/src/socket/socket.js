import { io } from 'socket.io-client';

// Use relative URL in production, localhost in development
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:5000');

let socket = null;

export const initSocket = (userId, username) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      socket.emit('authenticate', { userId, username });
      // Announce user is online
      socket.emit('user_connected', { userId });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      socket.emit('authenticate', { userId, username });
      socket.emit('user_connected', { userId });
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
