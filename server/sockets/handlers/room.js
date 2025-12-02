import GameRoom from '../../models/GameRoom.js';
import { generateRoomCode } from '../../utils/helpers.js';

export const handleRoomEvents = (socket, io) => {
  socket.on('create_room', async (data) => {
    try {
      const roomCode = generateRoomCode();
      const room = new GameRoom({
        roomCode,
        host: data.userId,
        players: [{
          userId: data.userId,
          username: data.username,
          score: 0
        }],
        settings: data.settings || {}
      });
      
      await room.save();
      socket.join(roomCode);
      socket.emit('room_created', { roomCode, room });
      console.log(`🎮 Room created: ${roomCode}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('join_room', async (data) => {
    try {
      const room = await GameRoom.findOne({ roomCode: data.roomCode, status: 'waiting' });
      
      if (!room) {
        return socket.emit('error', { message: 'Room not found or already started' });
      }

      // Check if player is already in the room
      const alreadyInRoom = room.players.some(p => p.userId.toString() === data.userId);
      
      if (alreadyInRoom) {
        // Player already in room, just send room data
        socket.join(data.roomCode);
        socket.emit('room_joined', { room });
        console.log(`👤 ${data.username} reconnected to room: ${data.roomCode}`);
        return;
      }

      if (room.players.length >= room.settings.maxPlayers) {
        return socket.emit('error', { message: 'Room is full' });
      }

      room.players.push({
        userId: data.userId,
        username: data.username,
        score: 0
      });
      
      await room.save();
      socket.join(data.roomCode);
      
      io.to(data.roomCode).emit('player_joined', {
        player: { userId: data.userId, username: data.username },
        players: room.players
      });
      
      socket.emit('room_joined', { room });
      console.log(`👤 ${data.username} joined room: ${data.roomCode}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leave_room', async (data) => {
    try {
      const room = await GameRoom.findOne({ roomCode: data.roomCode });
      if (room) {
        room.players = room.players.filter(p => p.userId.toString() !== data.userId);
        await room.save();
        
        socket.leave(data.roomCode);
        io.to(data.roomCode).emit('player_left', { userId: data.userId, players: room.players });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
