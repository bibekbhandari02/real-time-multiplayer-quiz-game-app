import GameRoom from '../../models/GameRoom.js';
import Question from '../../models/Question.js';
import User from '../../models/User.js';
import { calculateScore, updateElo, getScoreBreakdown } from '../../utils/scoring.js';
import { antiCheatDetector } from '../../services/antiCheatService.js';
import { checkAchievements } from '../../services/achievementService.js';
import { generateQuestionsWithFallback, enhanceQuestion, validateQuestion } from '../../services/aiService.js';

export const handleGameEvents = (socket, io) => {
  socket.on('start_game', async (data) => {
    try {
      const room = await GameRoom.findOne({ roomCode: data.roomCode });
      
      if (!room || room.host.toString() !== data.userId) {
        return socket.emit('error', { message: 'Only host can start the game' });
      }

      const category = room.settings.category || 'General Knowledge';
      const difficultyMode = room.settings.difficultyMode || 'mixed';
      const count = room.settings.questionsCount || 10;

      console.log(`🎮 Generating ${count} questions (${difficultyMode} mode) for category: ${category}`);
      
      // Notify players that questions are being generated
      const modeText = difficultyMode === 'mixed' ? 'mixed difficulty' : 
                       difficultyMode === 'progressive' ? 'progressively harder' :
                       difficultyMode;
      
      io.to(data.roomCode).emit('generating_questions', { 
        message: `🤖 AI is crafting ${count} ${modeText} questions about ${category}...` 
      });

      // Generate questions using enhanced AI with fallback
      const aiQuestions = await generateQuestionsWithFallback(category, difficultyMode, count);

      if (!aiQuestions || aiQuestions.length === 0) {
        console.error('❌ AI question generation failed');
        return socket.emit('error', { 
          message: 'Failed to generate questions. Please check your Gemini API key and try again.' 
        });
      }

      // Validate and enhance questions
      const validatedQuestions = aiQuestions
        .map(q => {
          const validation = validateQuestion(q);
          if (!validation.valid) {
            console.warn(`⚠️ Invalid question filtered:`, validation.issues);
            return null;
          }
          return enhanceQuestion(q, category, q.difficulty || 'medium');
        })
        .filter(q => q !== null);

      if (validatedQuestions.length === 0) {
        console.error('❌ No valid questions after validation');
        return socket.emit('error', { 
          message: 'Failed to generate valid questions. Please try again.' 
        });
      }

      console.log(`✅ Generated ${validatedQuestions.length} validated AI questions`);
      
      // Save validated questions to database
      const savedQuestions = await Question.insertMany(
        validatedQuestions.map(q => ({
          ...q,
          category: category,
          aiGenerated: true,
          generatedAt: new Date()
        }))
      );
      
      room.questions = savedQuestions.map(q => q._id);

      room.status = 'playing';
      room.startedAt = new Date();
      room.currentQuestion = 0;
      await room.save();

      // Populate questions for sending
      const populatedRoom = await GameRoom.findById(room._id).populate('questions');

      io.to(data.roomCode).emit('game_started', { 
        timestamp: Date.now(),
        totalQuestions: populatedRoom.questions.length,
        settings: populatedRoom.settings
      });

      // Send first question
      setTimeout(() => {
        sendQuestion(io, data.roomCode, populatedRoom.questions[0], 0, populatedRoom.settings);
      }, 3000);
    } catch (error) {
      console.error('Start game error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('submit_answer', async (data) => {
    try {
      const { roomCode, questionIndex, answer, timeSpent } = data;
      
      // First, get the room and question
      const room = await GameRoom.findOne({ roomCode }).populate('questions');
      if (!room || !room.questions[questionIndex]) return;

      const question = room.questions[questionIndex];
      const isCorrect = question.correctAnswer === answer;
      
      // Get player's current streak
      const currentPlayer = room.players.find(p => p.userId.toString() === socket.userId);
      let currentStreak = 0;
      
      if (currentPlayer && currentPlayer.answers.length > 0) {
        // Count consecutive correct answers from the end
        for (let i = currentPlayer.answers.length - 1; i >= 0; i--) {
          if (currentPlayer.answers[i].correct) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      // Calculate score with enhanced system
      const difficulty = question.difficulty || 'medium';
      const score = calculateScore(
        timeSpent, 
        room.settings.timePerQuestion, 
        difficulty, 
        currentStreak, 
        isCorrect
      );
      
      console.log(`💯 Score calculation - User: ${socket.userId}, Correct: ${isCorrect}, Score: ${score}`);
      
      // Debug logging
      console.log(`🔍 Answer check - Question: "${question.question.substring(0, 50)}..."`);
      console.log(`   Difficulty: ${difficulty}`);
      console.log(`   Current streak: ${currentStreak}`);
      console.log(`   Correct answer index: ${question.correctAnswer} (type: ${typeof question.correctAnswer})`);
      console.log(`   Player answer index: ${answer} (type: ${typeof answer})`);
      console.log(`   Is correct: ${isCorrect}`);
      console.log(`   Score awarded: ${score}`);

      // Use atomic update to avoid version conflicts
      const updatedRoom = await GameRoom.findOneAndUpdate(
        { 
          roomCode,
          'players.userId': socket.userId,
          status: 'playing'
        },
        {
          $inc: { 'players.$.score': score },
          $push: { 
            'players.$.answers': { 
              questionId: question._id.toString(),
              answer, 
              time: timeSpent, 
              correct: isCorrect,
              score: score
            }
          }
        },
        { new: true }
      );

      if (!updatedRoom) return;

      // Track for anti-cheat
      antiCheatDetector.trackAnswer(socket.userId, question._id, answer, timeSpent, isCorrect);

      // Update question stats atomically
      await Question.findByIdAndUpdate(question._id, {
        $inc: { 
          'stats.timesAsked': 1,
          'stats.correctAnswers': isCorrect ? 1 : 0
        }
      });

      const player = updatedRoom.players.find(p => p.userId.toString() === socket.userId);

      socket.emit('answer_result', { correct: isCorrect, score, totalScore: player.score });
      
      // Sort players by score in descending order for leaderboard
      const sortedPlayers = updatedRoom.players
        .map(p => ({ username: p.username, score: p.score }))
        .sort((a, b) => b.score - a.score);
      
      io.to(roomCode).emit('leaderboard_update', { 
        players: sortedPlayers
      });

      // Get fresh room data to ensure we have latest answers
      const freshRoom = await GameRoom.findOne({ roomCode }).populate('questions');
      if (!freshRoom) return;

      const currentQuestionId = freshRoom.questions[questionIndex]._id.toString();
      
      // Count how many players have answered THIS SPECIFIC question by checking questionId
      const playersAnswered = freshRoom.players.filter(p => 
        p.answers.some(ans => ans.questionId === currentQuestionId)
      ).length;
      const totalPlayers = freshRoom.players.length;

      console.log(`📊 Room ${roomCode} - Question ${questionIndex} (ID: ${currentQuestionId.substring(0, 8)}...): ${playersAnswered}/${totalPlayers} players answered`);
      
      // Debug: Show which players answered
      freshRoom.players.forEach(p => {
        const answeredCurrent = p.answers.some(ans => ans.questionId === currentQuestionId);
        console.log(`   👤 ${p.username}: ${answeredCurrent ? '✅' : '❌'} (${p.answers.length} total answers)`);
      });

      // Check if ALL players have answered THIS specific question
      const allAnswered = playersAnswered === totalPlayers;

      if (allAnswered && freshRoom.currentQuestion === questionIndex) {
        // Use a unique key to prevent multiple timeouts for the same question
        const advanceKey = `${roomCode}-${questionIndex}`;
        if (global.advancingQuestions?.has(advanceKey)) {
          console.log(`⚠️ Already advancing question ${questionIndex} in room ${roomCode}`);
          return;
        }
        
        if (!global.advancingQuestions) global.advancingQuestions = new Set();
        global.advancingQuestions.add(advanceKey);
        
        // All players answered, move to next question after 3 seconds
        console.log(`✅ ALL ${totalPlayers} players answered question ${questionIndex} in room ${roomCode} - advancing in 3s`);
        
        // Emit signal to all clients that everyone answered
        io.to(roomCode).emit('all_answered', { nextIn: 3000 });
        
        setTimeout(async () => {
          try {
            const roomToAdvance = await GameRoom.findOne({ roomCode }).populate('questions');
            if (!roomToAdvance || roomToAdvance.status !== 'playing') {
              global.advancingQuestions.delete(advanceKey);
              return;
            }
            
            // Double check we're still on the same question
            if (roomToAdvance.currentQuestion !== questionIndex) {
              console.log(`⚠️ Question already advanced in room ${roomCode}`);
              global.advancingQuestions.delete(advanceKey);
              return;
            }

            roomToAdvance.currentQuestion++;
            
            if (roomToAdvance.currentQuestion >= roomToAdvance.questions.length) {
              await endGame(io, roomToAdvance);
            } else {
              await roomToAdvance.save();
              console.log(`➡️ Moving to question ${roomToAdvance.currentQuestion} in room ${roomCode}`);
              sendQuestion(io, roomCode, roomToAdvance.questions[roomToAdvance.currentQuestion], roomToAdvance.currentQuestion, roomToAdvance.settings);
            }
            
            global.advancingQuestions.delete(advanceKey);
          } catch (error) {
            console.error('Error advancing question:', error);
            global.advancingQuestions.delete(advanceKey);
          }
        }, 3000);
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
        sendQuestion(io, data.roomCode, room.questions[room.currentQuestion], room.currentQuestion, room.settings);
      }
    } catch (error) {
      console.error('Next question error:', error);
    }
  });
};

const sendQuestion = (io, roomCode, question, index, roomSettings = {}) => {
  console.log(`📤 Sending question ${index} to room ${roomCode} with settings:`, roomSettings);
  io.to(roomCode).emit('new_question', {
    index,
    question: {
      id: question._id,
      question: question.question,
      options: question.options,
      difficulty: question.difficulty,
      category: question.category,
      correctAnswer: question.correctAnswer
    },
    roomSettings,
    timestamp: Date.now()
  });
};

const endGame = async (io, room) => {
  room.status = 'finished';
  room.finishedAt = new Date();
  
  const sortedPlayers = room.players.sort((a, b) => b.score - a.score);
  room.winner = sortedPlayers[0]?.userId;
  
  await room.save();

  // Update ELO for ranked games FIRST (before updating stats)
  if (room.settings.isRanked && sortedPlayers.length >= 2) {
    const winner = await User.findById(sortedPlayers[0].userId);
    const loser = await User.findById(sortedPlayers[1].userId);
    
    if (winner && loser) {
      const oldWinnerElo = winner.elo;
      const oldLoserElo = loser.elo;
      
      const newElos = updateElo(winner.elo, loser.elo);
      
      winner.elo = newElos.winner;
      loser.elo = newElos.loser;
      
      await winner.save();
      await loser.save();
      
      console.log(`🏆 ELO Updated - Winner: ${oldWinnerElo} → ${newElos.winner} (+${newElos.winner - oldWinnerElo})`);
      console.log(`💔 ELO Updated - Loser: ${oldLoserElo} → ${newElos.loser} (${newElos.loser - oldLoserElo})`);
    }
  }

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
      // Get fresh user data to include updated ELO
      const freshUser = await User.findById(player.userId);
      
      io.to(socketId).emit('game_results', {
        won,
        accuracy,
        xpGained: won ? 100 : 50,
        coinsGained: won ? 50 : 25,
        newAchievements,
        cheatWarning: cheatAnalysis.suspicious,
        isRanked: room.settings.isRanked || false,
        stats: {
          gamesPlayed: freshUser.stats.gamesPlayed,
          gamesWon: freshUser.stats.gamesWon,
          elo: freshUser.elo
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
