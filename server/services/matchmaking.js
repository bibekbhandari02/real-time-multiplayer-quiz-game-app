import User from '../models/User.js';
import GameRoom from '../models/GameRoom.js';
import { generateRoomCode } from '../utils/helpers.js';

const matchmakingQueue = new Map();

export const addToQueue = async (userId, preferences = {}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  matchmakingQueue.set(userId, {
    userId,
    username: user.username,
    elo: user.elo,
    preferences,
    timestamp: Date.now()
  });

  return findMatch(userId);
};

export const removeFromQueue = (userId) => {
  matchmakingQueue.delete(userId);
};

const findMatch = async (userId) => {
  const player = matchmakingQueue.get(userId);
  if (!player) return null;

  const eloRange = 100;
  const matches = [];

  for (const [id, candidate] of matchmakingQueue) {
    if (id === userId) continue;
    
    const eloDiff = Math.abs(player.elo - candidate.elo);
    if (eloDiff <= eloRange) {
      matches.push(candidate);
    }
  }

  if (matches.length >= 1) {
    const roomCode = generateRoomCode();
    const players = [player, ...matches.slice(0, 9)];
    
    const room = new GameRoom({
      roomCode,
      host: player.userId,
      players: players.map(p => ({
        userId: p.userId,
        username: p.username,
        score: 0
      })),
      settings: {
        maxPlayers: 10,
        questionsCount: 10,
        timePerQuestion: 15,
        isRanked: true
      }
    });

    await room.save();

    players.forEach(p => matchmakingQueue.delete(p.userId));

    return { roomCode, players: players.map(p => p.userId) };
  }

  return null;
};

export const getQueueStatus = () => {
  return {
    playersInQueue: matchmakingQueue.size,
    averageWaitTime: calculateAverageWaitTime()
  };
};

const calculateAverageWaitTime = () => {
  if (matchmakingQueue.size === 0) return 0;
  
  const now = Date.now();
  let totalWait = 0;
  
  for (const player of matchmakingQueue.values()) {
    totalWait += now - player.timestamp;
  }
  
  return Math.round(totalWait / matchmakingQueue.size / 1000);
};
