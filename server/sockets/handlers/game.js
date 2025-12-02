import GameRoom from '../../models/GameRoom.js';
import Question from '../../models/Question.js';
import User from '../../models/User.js';
import { calculateScore, updateElo } from '../../utils/scoring.js';
import { antiCheatDetector } from '../../services/antiCheatService.js';
import { checkAchievements } from '../../services/achievementService.js';

export const handleGameEvents = (socket, io) => {
  socket.on('start_game', async (data) => {
    try {
      const room = await GameRoom.findOne({ roomCode: data.roomCode });
      
      if (!room || room.host.toString() !== data.userId) {
        return socket.emit('error', { message: 'Only host can start the game' });
      }

      const questions = await Question.aggregate([
        { $match: room.settings.category ? { category: room.settings.category } : {} },
        { $sample: { size: room.settings.questionsCount } }
      ]);

      room.questions = questions.map(q => q._id);
      room.status = 'playing';
      room.startedAt = new Date();
      room.currentQuestion = 0;
      await room.save();

      io.to(data.roomCode).emit('game_started', { 
        timestamp: Date.now(),
        totalQuestions: questions.length
      });

      // Send first question
      setTimeout(() => {
        sendQuestion(io, data.roomCode, questions[0], 0);
      }, 3000);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('submit_answer', async (data) => {
    try {
      const { roomCode, questionIndex, answer, timeSpent } = data;
      const room = await GameRoom.findOne({ roomCode }).populate('questions');
      
      if (!room) return;

      const question = room.questions[questionIndex];
      const isCorrect = question.correctAnswer === answer;
      const score = isCorrect ? calculateScore(timeSpent, room.settings.timePerQuestion) : 0;

      const player = room.players.find(p => p.userId.toString() === socket.userId);
      if (player) {
        player.score += score;
        player.answers.push({ questionId: question._id, answer, time: timeSpent, correct: isCorrect });
      }

      // Track for anti-cheat
      antiCheatDetector.trackAnswer(socket.userId, question._id, answer, timeSpent, isCorrect);

      // Update question stats
      question.stats.timesAsked++;
      if (isCorrect) question.stats.correctAnswers++;
      question.stats.averageTime = 
        (question.stats.averageTime * (question.stats.timesAsked - 1) + timeSpent) / question.stats.timesAsked;
      await question.save();

      await room.save();

      socket.emit('answer_result', { correct: isCorrect, score, totalScore: player.score });
      io.to(roomCode).emit('leaderboard_update', { 
        players: room.players.map(p => ({ username: p.username, score: p.score }))
      });

      // Check if all players have answered this question
      const allAnswered = room.players.every(p => 
        p.answers.length > questionIndex
      );

      if (allAnswered && room.currentQuestion === questionIndex) {
        // All players answered, move to next question after 2 seconds
        console.log(`All players answered question ${questionIndex} in room ${roomCode}`);
        
        setTimeout(async () => {
          const updatedRoom = await GameRoom.findOne({ roomCode }).populate('questions');
          if (!updatedRoom || updatedRoom.status !== 'playing') return;
          
          // Double check we're still on the same question
          if (updatedRoom.currentQuestion !== questionIndex) return;

          updatedRoom.currentQuestion++;
          
          if (updatedRoom.currentQuestion >= updatedRoom.questions.length) {
            await endGame(io, updatedRoom);
          } else {
            await updatedRoom.save();
            sendQuestion(io, roomCode, updatedRoom.questions[updatedRoom.currentQuestion], updatedRoom.currentQuestion);
          }
        }, 2000);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('next_question', async (data) => {
    try {
      const room = await GameRoom.findOne({ roomCode: data.roomCode }).populate('questions');
      
      if (!room) return;

      room.currentQuestion++;
      
      if (room.currentQuestion >= room.questions.length) {
        await endGame(io, room);
      } else {
        await room.save();
        sendQuestion(io, data.roomCode, room.questions[room.currentQuestion], room.currentQuestion);
      }
    } catch (error) {
      console.error('Next question error:', error);
    }
  });
};

const sendQuestion = (io, roomCode, question, index) => {
  io.to(roomCode).emit('new_question', {
    index,
    question: {
      id: question._id,
      question: question.question,
      options: question.options,
      difficulty: question.difficulty
    },
    timestamp: Date.now()
  });

  // Auto-advance after 20 seconds (15s question + 5s buffer)
  setTimeout(async () => {
    const room = await GameRoom.findOne({ roomCode }).populate('questions');
    if (!room || room.status !== 'playing') return;
    
    // Check if we're still on this question
    if (room.currentQuestion === index) {
      room.currentQuestion++;
      
      if (room.currentQuestion >= room.questions.length) {
        await endGame(io, room);
      } else {
        await room.save();
        sendQuestion(io, roomCode, room.questions[room.currentQuestion], room.currentQuestion);
      }
    }
  }, 20000);
};

const endGame = async (io, room) => {
  room.status = 'finished';
  room.finishedAt = new Date();
  
  const sortedPlayers = room.players.sort((a, b) => b.score - a.score);
  room.winner = sortedPlayers[0]?.userId;
  
  await room.save();

  // Update player stats and check achievements
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];
    const user = await User.findById(player.userId);
    
    if (!user) continue;

    const won = i === 0;
    const correctAnswers = player.answers.filter(a => a.correct).length;
    const accuracy = (correctAnswers / player.answers.length) * 100;

    user.stats.gamesPlayed++;
    if (won) user.stats.gamesWon++;
    user.stats.totalScore += player.score;
    user.stats.accuracy = ((user.stats.accuracy * (user.stats.gamesPlayed - 1)) + accuracy) / user.stats.gamesPlayed;
    
    // Update ELO for ranked games
    if (room.settings.isRanked && sortedPlayers.length >= 2) {
      if (i === 0 && sortedPlayers[1]) {
        const winner = await User.findById(sortedPlayers[0].userId);
        const loser = await User.findById(sortedPlayers[1].userId);
        const newElos = updateElo(winner.elo, loser.elo);
        winner.elo = newElos.winner;
        loser.elo = newElos.loser;
        await winner.save();
        await loser.save();
      }
    }

    // Check for achievements
    const newAchievements = await checkAchievements(user._id, {
      won,
      accuracy,
      score: player.score
    });

    // Anti-cheat analysis
    const cheatAnalysis = await antiCheatDetector.analyzePlayer(player.userId.toString());
    
    await user.save();

    // Send individual results
    const socketId = Array.from(io.sockets.sockets.values())
      .find(s => s.userId === player.userId.toString())?.id;
    
    if (socketId) {
      io.to(socketId).emit('game_results', {
        won,
        accuracy,
        xpGained: won ? 100 : 50,
        coinsGained: won ? 50 : 25,
        newAchievements,
        cheatWarning: cheatAnalysis.suspicious,
        stats: {
          gamesPlayed: user.stats.gamesPlayed,
          gamesWon: user.stats.gamesWon,
          elo: user.elo
        }
      });
    }

    antiCheatDetector.clearPlayer(player.userId.toString());
  }

  io.to(room.roomCode).emit('game_over', {
    winner: sortedPlayers[0],
    leaderboard: sortedPlayers.map(p => ({ username: p.username, score: p.score }))
  });
};
