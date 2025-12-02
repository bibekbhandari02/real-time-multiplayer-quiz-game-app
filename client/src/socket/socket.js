import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
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
