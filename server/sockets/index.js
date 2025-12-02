import { handleConnection } from './handlers/connection.js';
import { handleRoomEvents } from './handlers/room.js';
import { handleGameEvents } from './handlers/game.js';
import { handleChatEvents } from './handlers/chat.js';
import { setupSpectatorHandlers } from './handlers/spectator.js';
import { antiCheatDetector } from '../services/antiCheatService.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);
    
    handleConnection(socket, io);
    handleRoomEvents(socket, io);
    handleGameEvents(socket, io);
    handleChatEvents(socket, io);
    setupSpectatorHandlers(io, socket);

    // Anti-cheat tracking
    socket.on('tab_visibility', (data) => {
      if (data.hidden && socket.userId) {
        antiCheatDetector.trackTabSwitch(socket.userId);
      }
    });

    socket.on('clipboard_event', () => {
      if (socket.userId) {
        antiCheatDetector.trackClipboard(socket.userId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};
