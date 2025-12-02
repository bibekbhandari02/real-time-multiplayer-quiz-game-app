export const handleConnection = (socket, io) => {
  socket.on('authenticate', (data) => {
    socket.userId = data.userId;
    socket.username = data.username;
    console.log(`🔐 User authenticated: ${data.username}`);
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
};
