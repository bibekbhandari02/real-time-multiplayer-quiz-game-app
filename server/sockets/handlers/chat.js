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
};
