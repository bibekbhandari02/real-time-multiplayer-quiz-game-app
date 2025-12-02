// Track online users
const onlineUsers = new Map(); // userId -> socketId

export const setupPresenceHandlers = (io, socket) => {
  // User comes online
  socket.on('user_connected', async ({ userId }) => {
    if (!userId) return;
    
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    console.log(`👤 User ${userId} is now online`);
    
    // Broadcast to all connected clients that this user is online
    io.emit('user_online', { userId });
  });

  // Get list of online friends
  socket.on('get_online_friends', async ({ friendIds }) => {
    if (!friendIds || !Array.isArray(friendIds)) {
      return socket.emit('online_friends_list', { onlineUserIds: [] });
    }
    
    // Check which friends are online
    const onlineUserIds = friendIds.filter(friendId => onlineUsers.has(friendId));
    
    socket.emit('online_friends_list', { onlineUserIds });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`👤 User ${socket.userId} went offline`);
      
      // Broadcast to all connected clients that this user is offline
      io.emit('user_offline', { userId: socket.userId });
    }
  });
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Get all online users
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
