export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};
