import GameRoom from '../../models/GameRoom.js';
import User from '../../models/User.js';

export const setupSpectatorHandlers = (io, socket) => {
  // Join as spectator
  socket.on('join_as_spectator', async ({ roomCode, userId }) => {
    try {
      const room = await GameRoom.findOne({ roomCode });
      
      if (!room) {
        socket.emit('spectator_error', { message: 'Room not found' });
        return;
      }

      // Check if user is already a player
      const isPlayer = room.players.some(p => p.userId.toString() === userId);
      if (isPlayer) {
        socket.emit('spectator_error', { message: 'You are already a player in this game' });
        return;
      }

      // Add to spectators if not already there
      if (!room.spectators.includes(userId)) {
        room.spectators.push(userId);
        await room.save();
      }

      // Join socket room
      socket.join(roomCode);
      socket.join(`${roomCode}_spectators`);

      const user = await User.findById(userId);
      
      // Notify room that spectator joined
      io.to(roomCode).emit('spectator_joined', {
        username: user.username,
        spectatorCount: room.spectators.length
      });

      // Populate questions to get current question data
      const populatedRoom = await GameRoom.findOne({ roomCode }).populate('questions');
      
      // Send current game state to spectator
      const responseData = {
        room: {
          roomCode: populatedRoom.roomCode,
          status: populatedRoom.status,
          currentQuestion: populatedRoom.currentQuestion,
          players: populatedRoom.players.map(p => ({
            username: p.username,
            score: p.score
          })),
          spectatorCount: populatedRoom.spectators.length,
          settings: populatedRoom.settings
        }
      };

      // If game is in progress, send current question
      if (populatedRoom.status === 'playing' && populatedRoom.questions[populatedRoom.currentQuestion]) {
        const currentQ = populatedRoom.questions[populatedRoom.currentQuestion];
        responseData.currentQuestion = {
          index: populatedRoom.currentQuestion,
          question: {
            id: currentQ._id,
            question: currentQ.question,
            options: currentQ.options,
            difficulty: currentQ.difficulty,
            category: currentQ.category
          }
        };
      }

      socket.emit('spectator_joined_success', responseData);

      console.log(`👁️ ${user.username} joined as spectator in room: ${roomCode}`);
    } catch (error) {
      console.error('Error joining as spectator:', error);
      socket.emit('spectator_error', { message: 'Failed to join as spectator' });
    }
  });

  // Leave spectator mode
  socket.on('leave_spectator', async ({ roomCode, userId }) => {
    try {
      const room = await GameRoom.findOne({ roomCode });
      
      if (!room) return;

      // Remove from spectators
      room.spectators = room.spectators.filter(id => id.toString() !== userId);
      await room.save();

      // Leave socket room
      socket.leave(roomCode);
      socket.leave(`${roomCode}_spectators`);

      const user = await User.findById(userId);
      
      // Notify room
      io.to(roomCode).emit('spectator_left', {
        username: user.username,
        spectatorCount: room.spectators.length
      });

      console.log(`👁️ ${user.username} left spectator mode in room: ${roomCode}`);
    } catch (error) {
      console.error('Error leaving spectator:', error);
    }
  });

  // Get spectator list
  socket.on('get_spectators', async ({ roomCode }) => {
    try {
      const room = await GameRoom.findOne({ roomCode }).populate('spectators', 'username');
      
      if (!room) {
        socket.emit('spectator_error', { message: 'Room not found' });
        return;
      }

      socket.emit('spectators_list', {
        spectators: room.spectators.map(s => ({
          username: s.username
        })),
        count: room.spectators.length
      });
    } catch (error) {
      console.error('Error getting spectators:', error);
    }
  });
};

// Emit game events to spectators
export const emitToSpectators = (io, roomCode, event, data) => {
  io.to(`${roomCode}_spectators`).emit(event, data);
};
