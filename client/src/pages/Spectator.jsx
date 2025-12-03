import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../socket/socket';

export default function Spectator() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const socket = getSocket();
  
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playersAnswered, setPlayersAnswered] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(15);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  useEffect(() => {
    if (!socket || !user) return;

    console.log('🔍 Spectator: Joining room', roomCode, 'as user', user.id);

    // Join as spectator
    socket.emit('join_as_spectator', { roomCode, userId: user.id });

    // Listen for spectator events
    socket.on('spectator_joined_success', (data) => {
      console.log('✅ Spectator joined successfully:', data);
      setGameState(data.room);
      setPlayers(data.room.players);
      setSpectatorCount(data.room.spectatorCount);
      
      // If there's a current question, set it
      if (data.currentQuestion) {
        console.log('📝 Setting current question:', data.currentQuestion);
        setCurrentQuestion({
          questionNumber: data.currentQuestion.index + 1,
          question: data.currentQuestion.question.question,
          options: data.currentQuestion.question.options,
          correctAnswer: data.currentQuestion.question.correctAnswer
        });
      }
      
      setLoading(false);
    });

    socket.on('spectator_error', (data) => {
      console.error('❌ Spectator error:', data);
      setError(data.message);
      setLoading(false);
    });

    socket.on('spectator_joined', (data) => {
      setSpectatorCount(data.spectatorCount);
    });

    socket.on('spectator_left', (data) => {
      setSpectatorCount(data.spectatorCount);
    });

    // Game events
    socket.on('game_started', (data) => {
      console.log('🎮 Game started:', data);
      setGameState(prev => ({ ...prev, status: 'playing' }));
    });

    socket.on('new_question', (data) => {
      console.log('❓ New question received:', data);
      setCurrentQuestion({
        questionNumber: data.index + 1,
        question: data.question.question,
        options: data.question.options,
        correctAnswer: data.question.correctAnswer,
        difficulty: data.question.difficulty,
        category: data.question.category
      });
      setPlayersAnswered(new Set());
      setTimeLeft(15);
      setShowCorrectAnswer(false);
    });

    socket.on('answer_result', (data) => {
      console.log('📊 Answer result:', data);
      // Update player scores
      setPlayers(prev => 
        prev.map(p => 
          p.username === data.username 
            ? { ...p, score: data.newScore }
            : p
        )
      );
    });

    socket.on('player_answered', (data) => {
      console.log('✅ Player answered:', data);
      // Track who has answered
      setPlayersAnswered(prev => new Set([...prev, data.username]));
      
      // Update player scores in real-time
      setPlayers(prev => 
        prev.map(p => 
          p.username === data.username 
            ? { ...p, score: data.score }
            : p
        )
      );
    });

    socket.on('all_answered', () => {
      console.log('✅ All players answered');
      setShowCorrectAnswer(true);
    });

    socket.on('leaderboard_update', (data) => {
      console.log('📊 Leaderboard update:', data);
      // Update all player scores
      setPlayers(data.players);
    });

    socket.on('game_over', (data) => {
      console.log('🏁 Game over:', data);
      setGameState(prev => ({ ...prev, status: 'finished' }));
      setCurrentQuestion(null);
    });

    socket.on('next_question', (data) => {
      console.log('➡️ Moving to next question:', data);
      // Clear current question briefly before new one arrives
      setCurrentQuestion(null);
      setPlayersAnswered(new Set());
      setShowCorrectAnswer(false);
    });

    return () => {
      socket.emit('leave_spectator', { roomCode, userId: user.id });
      socket.off('spectator_joined_success');
      socket.off('spectator_error');
      socket.off('spectator_joined');
      socket.off('spectator_left');
      socket.off('game_started');
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('player_answered');
      socket.off('leaderboard_update');
      socket.off('game_over');
      socket.off('next_question');
      socket.off('all_answered');
    };
  }, [socket, user, roomCode]);

  // Timer countdown effect
  useEffect(() => {
    if (!currentQuestion || gameState?.status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          setShowCorrectAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, gameState?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-white text-xl">Joining as spectator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1E293B] rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4 text-[#F1F5F9]">Cannot Join</h2>
          <p className="text-[#CBD5E1] mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#3B82F6] text-white px-6 py-3 rounded-lg hover:bg-[#2563EB] transition"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 bg-[#0F172A]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#1E293B] rounded-xl p-4 mb-4 border border-[#334155]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#334155] rounded-xl flex items-center justify-center text-2xl shadow-lg">
                👁️
              </div>
              <div>
                <h1 className="text-[#F1F5F9] text-xl font-bold">Spectator Mode</h1>
                <p className="text-[#CBD5E1] text-sm">Room Code: <span className="font-mono font-bold text-[#3B82F6]">{roomCode}</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#334155] px-4 py-2 rounded-lg border border-[#475569]">
                <p className="text-[#94A3B8] text-xs uppercase tracking-wide">Players</p>
                <p className="text-[#F1F5F9] text-2xl font-bold">{players.length}</p>
              </div>
              <div className="bg-[#334155] px-4 py-2 rounded-lg border border-[#475569]">
                <p className="text-[#94A3B8] text-xs uppercase tracking-wide">Watching</p>
                <p className="text-[#3B82F6] text-2xl font-bold">{spectatorCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-[#1E293B] rounded-xl p-6 mb-4 border border-[#334155]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F1F5F9]">
              {gameState?.status === 'waiting' && '⏳ Waiting for game to start...'}
              {gameState?.status === 'playing' && '🎮 Game in Progress'}
              {gameState?.status === 'finished' && '🏁 Game Finished'}
            </h2>
            {gameState?.status === 'playing' && currentQuestion && (
              <div className="text-sm text-[#CBD5E1]">
                Question {currentQuestion.questionNumber} / {gameState.settings.questionsCount}
              </div>
            )}
          </div>

          {/* Current Question (if playing) */}
          {gameState?.status === 'playing' && currentQuestion && (
            <div className="bg-[#0F172A] p-6 rounded-lg mb-6 border border-[#475569]">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {currentQuestion.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      currentQuestion.difficulty === 'easy' ? 'bg-[#22C55E] text-white' :
                      currentQuestion.difficulty === 'medium' ? 'bg-[#F97316] text-white' :
                      'bg-[#EF4444] text-white'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                  {currentQuestion.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#334155] text-[#CBD5E1] border border-[#475569]">
                      {currentQuestion.category}
                    </span>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold text-xl ${
                  timeLeft <= 5 ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-[#334155] text-[#FACC15]'
                }`}>
                  ⏱️ {timeLeft}s
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-[#1E293B] p-4 rounded-lg mb-4 border border-[#334155]">
                <p className="text-lg md:text-xl font-semibold text-[#F1F5F9]">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = showCorrectAnswer && index === currentQuestion.correctAnswer;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCorrect
                          ? 'bg-[#22C55E] border-[#16A34A] text-white shadow-lg shadow-[#22C55E]/30'
                          : 'bg-[#334155] border-[#475569] text-[#F1F5F9] hover:border-[#3B82F6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isCorrect ? 'bg-white text-[#22C55E]' : 'bg-[#1E293B] text-[#CBD5E1]'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {isCorrect && <span className="text-2xl">✓</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Player Answer Status */}
              <div className="bg-[#1E293B] p-4 rounded-lg border border-[#334155]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#CBD5E1]">
                    📊 Players Answered: {playersAnswered.size} / {players.length}
                  </p>
                  <div className="flex gap-1">
                    {players.map((player, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all ${
                          playersAnswered.has(player.username)
                            ? 'bg-[#22C55E] shadow-lg shadow-[#22C55E]/50'
                            : 'bg-[#475569]'
                        }`}
                        title={player.username}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-full bg-[#334155] rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(playersAnswered.size / players.length) * 100}%` }}
                    className="bg-gradient-to-r from-[#3B82F6] to-[#22C55E] h-2 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {gameState?.status === 'playing' && !currentQuestion && (
            <div className="bg-[#0F172A] border border-[#475569] rounded-lg p-6 text-center mb-6">
              <div className="animate-pulse">
                <p className="text-lg font-semibold text-[#F1F5F9]">⏳ Waiting for next question...</p>
              </div>
            </div>
          )}

          {gameState?.status === 'waiting' && (
            <div className="bg-[#0F172A] border border-[#475569] rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-[#F1F5F9]">⏳ Game hasn't started yet</p>
              <p className="text-sm text-[#CBD5E1] mt-2">Waiting for the host to start the game...</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F1F5F9]">🏆 Live Leaderboard</h2>
            {gameState?.status === 'playing' && (
              <span className="px-3 py-1 bg-[#22C55E] text-white text-xs font-bold rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <div className="space-y-2">
            {players.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#CBD5E1]">No players yet</p>
              </div>
            ) : (
              players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => {
                  const hasAnswered = playersAnswered.has(player.username);
                  
                  return (
                    <motion.div
                      key={player.username}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ 
                        delay: index * 0.05,
                        scale: { duration: 0.3 }
                      }}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        index === 0 ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white border-2 border-[#F59E0B] shadow-lg shadow-[#F59E0B]/30' :
                        index === 1 ? 'bg-[#334155] text-[#F1F5F9] border-2 border-[#94A3B8]' :
                        index === 2 ? 'bg-[#475569] text-[#F1F5F9] border-2 border-[#CD7F32]' :
                        'bg-[#334155] text-[#F1F5F9] border border-[#475569]'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl font-bold min-w-[40px]">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{player.username}</p>
                            {gameState?.status === 'playing' && (
                              <span className={`w-2 h-2 rounded-full ${
                                hasAnswered ? 'bg-[#22C55E] animate-pulse' : 'bg-[#94A3B8]'
                              }`} title={hasAnswered ? 'Answered' : 'Thinking...'} />
                            )}
                          </div>
                          {gameState?.status === 'playing' && (
                            <p className={`text-xs ${index === 0 ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                              {hasAnswered ? '✓ Answered' : '⏳ Thinking...'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.p 
                          key={player.score}
                          initial={{ scale: 1.5, color: '#FACC15' }}
                          animate={{ scale: 1, color: 'inherit' }}
                          transition={{ duration: 0.5 }}
                          className="text-2xl font-bold"
                        >
                          {player.score}
                        </motion.p>
                        <p className={`text-xs ${index === 0 ? 'text-white/80' : 'text-[#94A3B8]'}`}>points</p>
                      </div>
                    </motion.div>
                  );
                })
            )}
          </div>
        </div>

        {/* Leave Button */}
        <div className="mt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#EF4444] text-white py-3 rounded-lg hover:bg-[#DC2626] transition font-semibold"
          >
            Leave Spectator Mode
          </button>
        </div>
      </div>
    </div>
  );
}
