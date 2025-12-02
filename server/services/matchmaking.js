import User from '../models/User.js';
import GameRoom from '../models/GameRoom.js';
import { generateRoomCode } from '../utils/helpers.js';

const matchmakingQueue = new Map();

export const addToQueue = async (userId, preferences = {}, io = null) => {
  const user = await User.findById(userId);
  if (!user) return null;

  matchmakingQueue.set(userId, {
    userId,
    username: user.username,
    elo: user.elo,
    preferences,
    timestamp: Date.now()
  });

  return findMatch(userId, io);
};

export const removeFromQueue = (userId) => {
  matchmakingQueue.delete(userId);
};

const findMatch = async (userId, io = null) => {
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
    const players = [player, ...matches.slice(0, 1)]; // Match 2 players for now
    
    const room = new GameRoom({
      roomCode,
      host: player.userId,
      players: players.map(p => ({
        userId: p.userId,
        username: p.username,
        score: 0
      })),
      settings: {
        maxPlayers: 2,
        questionsCount: 10,
        timePerQuestion: 15,
        category: 'General Knowledge',
        isRanked: true
      },
      status: 'waiting'
    });

    await room.save();

    // Notify all matched players via socket
    if (io) {
      players.forEach(p => {
        const sockets = Array.from(io.sockets.sockets.values());
        const playerSocket = sockets.find(s => s.userId === p.userId.toString());
        if (playerSocket) {
          // Notify about match
          playerSocket.emit('match_found', { roomCode, autoStart: true });
        }
      });

      // Wait for players to join, then auto-start
      // Check every 500ms if all players have joined
      const checkInterval = setInterval(async () => {
        const currentRoom = await GameRoom.findOne({ roomCode });
        if (!currentRoom) {
          clearInterval(checkInterval);
          return;
        }

        // Count how many matched players are in the socket room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
        const playersJoined = socketsInRoom ? socketsInRoom.size : 0;

        console.log(`🎮 Ranked match ${roomCode}: ${playersJoined}/${players.length} players joined`);

        // If all players joined, start the game
        if (playersJoined >= players.length) {
          clearInterval(checkInterval);
          
          // Notify players game is starting soon
          io.to(roomCode).emit('ranked_starting', { countdown: 3 });
          
          // Start after 3 second countdown
          setTimeout(async () => {
            const updatedRoom = await GameRoom.findOne({ roomCode });
            if (updatedRoom && updatedRoom.status === 'waiting') {
              // Import and generate questions
              const { generateQuestions } = await import('./aiService.js');
              const Question = (await import('../models/Question.js')).default;
              
              console.log(`🎮 Auto-starting ranked match: ${roomCode}`);
              
              // Generate questions
              const aiQuestions = await generateQuestions(
                updatedRoom.settings.category || 'General Knowledge',
                'medium',
                updatedRoom.settings.questionsCount || 10
              );

              if (aiQuestions && aiQuestions.length > 0) {
                const savedQuestions = await Question.insertMany(
                  aiQuestions.map(q => ({
                    ...q,
                    category: updatedRoom.settings.category,
                    aiGenerated: true
                  }))
                );
                updatedRoom.questions = savedQuestions.map(q => q._id);
                updatedRoom.status = 'playing';
                updatedRoom.startedAt = new Date();
                updatedRoom.currentQuestion = 0;
                await updatedRoom.save();

                const populatedRoom = await GameRoom.findById(updatedRoom._id).populate('questions');

                // Notify players game is starting
                io.to(roomCode).emit('game_started', { 
                  timestamp: Date.now(),
                  totalQuestions: populatedRoom.questions.length
                });

                // Send first question
                setTimeout(() => {
                  io.to(roomCode).emit('new_question', {
                    index: 0,
                    question: {
                      id: populatedRoom.questions[0]._id,
                      question: populatedRoom.questions[0].question,
                      options: populatedRoom.questions[0].options,
                      difficulty: populatedRoom.questions[0].difficulty,
                      category: populatedRoom.questions[0].category,
                      correctAnswer: populatedRoom.questions[0].correctAnswer
                    },
                    timestamp: Date.now()
                  });
                }, 3000);
              }
            }
          }, 3000);
        }
      }, 500); // Check every 500ms
    }

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
