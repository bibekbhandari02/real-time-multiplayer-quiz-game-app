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
      
      console.log('🏠 Room created with settings:', data.settings);
      
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
      // Allow joining rooms that are waiting or finished (for returning to lobby)
      const room = await GameRoom.findOne({ 
        roomCode: data.roomCode, 
        status: { $in: ['waiting', 'finished'] }
      });
      
      if (!room) {
        return socket.emit('error', { message: 'Room not found or currently playing' });
      }

      // If room is finished, reset it to waiting status when first player returns
      if (room.status === 'finished') {
        room.status = 'waiting';
        room.currentQuestion = 0;
        room.questions = [];
        room.winner = null;
        room.startedAt = null;
        room.finishedAt = null;
        
        // Reset all player scores and answers
        room.players.forEach(player => {
          player.score = 0;
          player.answers = [];
        });
        
        await room.save();
        console.log(`🔄 Room ${data.roomCode} reset to waiting status`);
        
        // Notify all players in the room that it has been reset
        io.to(data.roomCode).emit('room_reset', { 
          message: 'Room has been reset for a new game!',
          room 
        });
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

      // Check if the current host exists in the room
      const hostExists = room.players.some(p => p.userId.toString() === room.host.toString());
      
      // Add the new player
      room.players.push({
        userId: data.userId,
        username: data.username,
        score: 0
      });

      // Only transfer host if the current host doesn't exist and this is the first player
      if (!hostExists && room.players.length === 1) {
        const oldHost = room.host;
        room.host = data.userId;
        console.log(`👑 Host transferred to ${data.username} (previous host ${oldHost} not found)`);
      }
      
      await room.save();
      socket.join(data.roomCode);
      
      io.to(data.roomCode).emit('player_joined', {
        player: { userId: data.userId, username: data.username },
        players: room.players,
        room: room // Send updated room data
      });
      
      socket.emit('room_joined', { room });
      console.log(`👤 ${data.username} joined room: ${data.roomCode}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leave_room', async (data) => {
    try {
      const room = await GameRoom.findOne({ roomCode: data.roomCode });
      if (!room) {
        return socket.emit('error', { message: 'Room not found' });
      }

      // Find the player who's leaving to get their username
      const leavingPlayer = room.players.find(p => p.userId.toString() === data.userId);
      if (!leavingPlayer) {
        console.log(`⚠️ Player ${data.userId} not found in room ${data.roomCode}`);
        return;
      }

      const username = leavingPlayer.username;
      const wasHost = room.host.toString() === data.userId;
      
      // Remove the leaving player
      room.players = room.players.filter(p => p.userId.toString() !== data.userId);
      
      // If the host left and there are still players, transfer host to the first remaining player
      let newHost = null;
      if (wasHost && room.players.length > 0) {
        newHost = room.players[0];
        room.host = newHost.userId;
        console.log(`👑 Host transferred from ${username} to ${newHost.username} in room ${data.roomCode}`);
      } else if (room.players.length === 0) {
        // Room is empty, could delete it or mark it for cleanup
        console.log(`🏠 Room ${data.roomCode} is now empty`);
        socket.leave(data.roomCode);
        return;
      }
      
      await room.save();
      
      socket.leave(data.roomCode);
      
      // Sort players by score for consistent display, but keep full player objects for Lobby
      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
        
      io.to(data.roomCode).emit('player_left', { 
        userId: data.userId, 
        username: username,
        players: sortedPlayers,
        newHost: newHost ? { userId: newHost.userId, username: newHost.username } : null,
        room: room // Send updated room data with new host
      });
      
      console.log(`👋 ${username} left room: ${data.roomCode}${newHost ? ` (Host transferred to ${newHost.username})` : ''}`);
    } catch (error) {
      console.error('Leave room error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('kick_player', async (data) => {
    try {
      const { roomCode, targetUserId, hostUserId } = data;
      
      const room = await GameRoom.findOne({ roomCode });
      if (!room) {
        return socket.emit('error', { message: 'Room not found' });
      }

      // Verify that the requester is the host
      if (room.host.toString() !== hostUserId) {
        return socket.emit('error', { message: 'Only the host can kick players' });
      }

      // Can't kick yourself
      if (targetUserId === hostUserId) {
        return socket.emit('error', { message: 'Host cannot kick themselves' });
      }

      // Find the player to kick
      const playerToKick = room.players.find(p => p.userId.toString() === targetUserId);
      if (!playerToKick) {
        return socket.emit('error', { message: 'Player not found in room' });
      }

      // Remove the player from the room
      room.players = room.players.filter(p => p.userId.toString() !== targetUserId);
      await room.save();

      // Find the kicked player's socket and remove them from the room
      const kickedPlayerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === targetUserId);
      
      if (kickedPlayerSocket) {
        kickedPlayerSocket.leave(roomCode);
        kickedPlayerSocket.emit('kicked_from_room', { 
          message: `You have been kicked from room ${roomCode}`,
          roomCode 
        });
      }

      // Sort remaining players for consistent display
      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

      // Notify remaining players
      io.to(roomCode).emit('player_kicked', {
        kickedPlayer: { userId: targetUserId, username: playerToKick.username },
        players: sortedPlayers,
        room: room
      });

      console.log(`⚠️ ${playerToKick.username} was kicked from room ${roomCode} by host`);
      
    } catch (error) {
      console.error('Kick player error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle unexpected disconnections (browser close, network issues, etc.)
  socket.on('disconnect', async () => {
    try {
      if (!socket.userId) return;
      
      console.log(`🔌 User ${socket.userId} disconnected unexpectedly`);
      
      // Find any rooms where this user is a player
      const rooms = await GameRoom.find({ 
        'players.userId': socket.userId,
        status: { $in: ['waiting', 'finished'] }
      });
      
      for (const room of rooms) {
        const leavingPlayer = room.players.find(p => p.userId.toString() === socket.userId);
        if (!leavingPlayer) continue;
        
        const wasHost = room.host.toString() === socket.userId;
        const username = leavingPlayer.username;
        
        // Remove the disconnected player
        room.players = room.players.filter(p => p.userId.toString() !== socket.userId);
        
        // If the host disconnected and there are still players, transfer host
        let newHost = null;
        if (wasHost && room.players.length > 0) {
          newHost = room.players[0];
          room.host = newHost.userId;
          console.log(`👑 Host transferred from ${username} (disconnected) to ${newHost.username} in room ${room.roomCode}`);
        } else if (room.players.length === 0) {
          console.log(`🏠 Room ${room.roomCode} is now empty after disconnect`);
          continue;
        }
        
        await room.save();
        
        // Sort remaining players for consistent display
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
        
        // Notify remaining players
        socket.to(room.roomCode).emit('player_left', { 
          userId: socket.userId, 
          username: username,
          players: sortedPlayers,
          newHost: newHost ? { userId: newHost.userId, username: newHost.username } : null,
          room: room,
          reason: 'disconnected'
        });
        
        console.log(`🔌 ${username} disconnected from room ${room.roomCode}${newHost ? ` (Host transferred to ${newHost.username})` : ''}`);
      }
    } catch (error) {
      console.error('Disconnect handler error:', error);
    }
  });

  // Handle room status checks
  socket.on('check_room_status', async (data) => {
    try {
      const { roomCode, userId } = data;
      const room = await GameRoom.findOne({ roomCode });
      
      if (!room) {
        return socket.emit('room_not_found', { roomCode });
      }
      
      // Check if the current host exists in the room
      const hostExists = room.players.some(p => p.userId.toString() === room.host.toString());
      
      if (!hostExists && room.players.length > 0) {
        console.log(`⚠️ Host ${room.host} not found in room ${roomCode}. Transferring host to first player.`);
        
        // Transfer host to the first remaining player
        const newHost = room.players[0];
        room.host = newHost.userId;
        await room.save();
        
        console.log(`👑 Host transferred to ${newHost.username} in room ${roomCode}`);
        
        // Notify all players in the room about the host change
        io.to(roomCode).emit('player_left', { 
          userId: 'system', 
          username: 'System',
          players: room.players,
          newHost: { userId: newHost.userId, username: newHost.username },
          room: room,
          reason: 'host_missing'
        });
      }
      
      // Send current room status back to requester
      socket.emit('room_status_update', { room });
      
    } catch (error) {
      console.error('Room status check error:', error);
    }
  });

  // Removed aggressive cleanup that was causing host transfer issues
};
