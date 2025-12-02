export const handleChatEvents = (socket, io) => {
  socket.on('chat_message', (data) => {
    io.to(data.roomCode).emit('chat_message', {
      username: socket.username,
      message: data.message,
      timestamp: Date.now()
    });
  });

  socket.on('reaction', (data) => {
    io.to(data.roomCode).emit('reaction', {
      username: socket.username,
      reaction: data.reaction,
      timestamp: Date.now()
    });
  });

  // Friend messaging
  socket.on('send_friend_message', async (data) => {
    const { to, message } = data;
    
    try {
      // Save message to database
      const Message = (await import('../../models/Message.js')).default;
      const newMessage = new Message({
        from: socket.userId,
        to,
        message
      });
      await newMessage.save();
      
      // Send to friend if online
      const friendSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === to);
      
      if (friendSocket) {
        friendSocket.emit('friend_message', {
          from: socket.userId,
          message,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Room invites
  socket.on('invite_to_room', (data) => {
    const { friendId, roomCode, fromUsername } = data;
    
    // Find the friend's socket
    const friendSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.userId === friendId);
    
    if (friendSocket) {
      friendSocket.emit('room_invite', {
        from: socket.userId,
        fromUsername,
        roomCode,
        timestamp: Date.now()
      });
    }
  });

  // Friend request notification
  socket.on('send_friend_request', (data) => {
    const { targetUserId } = data;
    
    // Find the target user's socket
    const targetSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.userId === targetUserId);
    
    if (targetSocket) {
      targetSocket.emit('friend_request_received', {
        from: socket.userId,
        timestamp: Date.now()
      });
    }
  });
};
