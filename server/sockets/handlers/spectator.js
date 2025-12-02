import GameRoom from '../../models/GameRoom.js';

export const handleSpectatorEvents = (socket, io) => {
  socket.on('spectate_room', async (data) => {
    try {
      const { roomCode, userId } = data;
      const room = await GameRoom.findOne({ roomCode });
      
      if (!room) {
        return socket.emit('error', { message: 'Room not found' });
      }

      if (!room.spectators) {
        room.spectators = [];
      }

      if (!room.spectators.includes(userId)) {
        room.spectators.push(userId);
        await room.save();
      }

      socket.join(`${roomCode}-spectators`);
      
      socket.emit('spectate_joined', {
        room: {
          roomCode: room.roomCode,
          status: room.status,
          currentQuestion: room.currentQuestion,
          players: room.players.map(p => ({
            username: p.username,
            score: p.score
          }))
        }
      });

      io.to(roomCode).emit('spectator_joined', { 
        spectatorCount: room.spectators.length 
      });

      console.log(`👁️ Spectator joined room: ${roomCode}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leave_spectate', async (data) => {
    try {
      const { roomCode, userId } = data;
      const room = await GameRoom.findOne({ roomCode });
      
      if (room && room.spectators) {
        room.spectators = room.spectators.filter(id => id.toString() !== userId);
        await room.save();
        
        socket.leave(`${roomCode}-spectators`);
        io.to(roomCode).emit('spectator_left', { 
          spectatorCount: room.spectators.length 
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('spectator_reaction', (data) => {
    const { roomCode, reaction } = data;
    io.to(roomCode).emit('spectator_reaction', {
      username: socket.username,
      reaction,
      timestamp: Date.now()
    });
  });
};
