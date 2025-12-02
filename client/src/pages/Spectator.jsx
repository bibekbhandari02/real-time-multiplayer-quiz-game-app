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
        correctAnswer: data.question.correctAnswer
      });
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
      // Update player scores in real-time
      setPlayers(prev => 
        prev.map(p => 
          p.username === data.username 
            ? { ...p, score: data.score }
            : p
        )
      );
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
    };
  }, [socket, user, roomCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Joining as spectator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Cannot Join</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👁️</span>
              <h1 className="text-white text-xl font-bold">Spectator Mode</h1>
            </div>
            <p className="text-white/70 text-sm">Room: {roomCode}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Spectators</p>
            <p className="text-white text-2xl font-bold">{spectatorCount}</p>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-white rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {gameState?.status === 'waiting' && '⏳ Waiting for game to start...'}
              {gameState?.status === 'playing' && '🎮 Game in Progress'}
              {gameState?.status === 'finished' && '🏁 Game Finished'}
            </h2>
            {gameState?.status === 'playing' && currentQuestion && (
              <div className="text-sm text-gray-600">
                Question {currentQuestion.questionNumber} / {gameState.settings.questionsCount}
              </div>
            )}
          </div>

          {/* Current Question (if playing) */}
          {gameState?.status === 'playing' && currentQuestion && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6 border-2 border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-semibold flex-1">{currentQuestion.question}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition"
                  >
                    <span className="font-bold mr-2 text-primary">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                <p>⏱️ Players are answering...</p>
              </div>
            </div>
          )}

          {gameState?.status === 'playing' && !currentQuestion && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center mb-6">
              <div className="animate-pulse">
                <p className="text-lg font-semibold text-blue-800">⏳ Waiting for next question...</p>
              </div>
            </div>
          )}

          {gameState?.status === 'waiting' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-yellow-800">⏳ Game hasn't started yet</p>
              <p className="text-sm text-yellow-600 mt-2">Waiting for the host to start the game...</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">🏆 Live Leaderboard</h2>
          <div className="space-y-2">
            {players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
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
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <div>
                      <p className="font-bold">{player.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.p 
                      key={player.score}
                      initial={{ scale: 1.5, color: '#10b981' }}
                      animate={{ scale: 1, color: '#6366f1' }}
                      transition={{ duration: 0.5 }}
                      className="text-2xl font-bold text-primary"
                    >
                      {player.score}
                    </motion.p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* Leave Button */}
        <div className="mt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Leave Spectator Mode
          </button>
        </div>
      </div>
    </div>
  );
}
