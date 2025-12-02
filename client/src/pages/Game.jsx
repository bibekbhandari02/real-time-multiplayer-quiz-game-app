import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, initSocket } from '../socket/socket';
import { useAuthStore } from '../store/authStore';

export default function Game() {
  const { roomCode } = useParams();
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [playerLeftNotification, setPlayerLeftNotification] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const hasSubmittedRef = useRef(false);
  
  // Initialize socket if not already initialized
  const socket = getSocket() || initSocket(user.id, user.username);

  useEffect(() => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

    // Join the room via socket
    socket.emit('join_room', {
      roomCode,
      userId: user.id,
      username: user.username
    });

    let timerInterval = null;

    // Track tab visibility for anti-cheat
    const handleVisibilityChange = () => {
      if (socket) {
        socket.emit('tab_visibility', { hidden: document.hidden });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    socket.on('new_question', ({ question: q, index, timestamp }) => {
      // Clear any existing timer
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      setQuestion(q);
      setQuestionIndex(index);
      setSelectedAnswer(null);
      setAnswered(false);
      setIsCorrect(null);
      setShowResult(false);
      setAllAnswered(false);
      setCountdown(null);
      setTimeLeft(15);
      hasSubmittedRef.current = false;
      
      const startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, 15 - elapsed);
        setTimeLeft(newTimeLeft);
        
        // Auto-submit when time runs out if not answered
        if (newTimeLeft === 0 && !hasSubmittedRef.current) {
          hasSubmittedRef.current = true;
          clearInterval(timerInterval);
          setAnswered(true);
          socket.emit('submit_answer', {
            roomCode,
            questionIndex: index,
            answer: -1, // -1 means no answer
            timeSpent: 15
          });
        }
      }, 100);
    });

    socket.on('answer_result', ({ correct, score: newScore, totalScore }) => {
      setScore(totalScore);
      setIsCorrect(correct);
      setShowResult(true);
    });

    socket.on('leaderboard_update', ({ players }) => {
      setLeaderboard(players);
    });

    socket.on('all_answered', ({ nextIn }) => {
      setAllAnswered(true);
      setCountdown(Math.floor(nextIn / 1000));
      console.log(`All players answered! Next question in ${nextIn}ms`);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('ranked_starting', ({ countdown }) => {
      console.log(`Ranked match starting in ${countdown} seconds...`);
    });

    socket.on('game_over', ({ winner, leaderboard: finalBoard }) => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      setGameOver(true);
      setLeaderboard(finalBoard);
    });

    socket.on('player_left', ({ username, players }) => {
      // Show notification
      setPlayerLeftNotification(username);
      
      // Update leaderboard
      setLeaderboard(players.map(p => ({ username: p.username, score: p.score })));
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setPlayerLeftNotification(null);
      }, 5000);
    });

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('leaderboard_update');
      socket.off('all_answered');
      socket.off('game_over');
      socket.off('player_left');
      socket.off('ranked_starting');
    };
  }, [socket, roomCode]);

  const submitAnswer = (answerIndex) => {
    if (hasSubmittedRef.current) return;
    
    hasSubmittedRef.current = true;
    setAnswered(true);
    setSelectedAnswer(answerIndex);
    const timeSpent = 15 - timeLeft;
    
    socket.emit('submit_answer', {
      roomCode,
      questionIndex,
      answer: answerIndex,
      timeSpent
    });
  };

  if (gameOver) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full"
        >
          <h1 className="text-4xl font-bold text-center mb-6">Game Over!</h1>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-center">🏆 Game Over!</h2>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-center mb-2">Winner</h3>
              <p className="text-3xl font-bold text-center text-primary">{leaderboard[0]?.username}</p>
              <p className="text-center text-gray-600 mt-2">{leaderboard[0]?.score} points</p>
            </div>
            <h3 className="text-xl font-bold mb-3">Final Standings</h3>
            {leaderboard.map((player, index) => (
              <div key={index} className={`flex justify-between items-center p-4 rounded-lg mb-2 ${
                index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                'bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className="font-semibold">{player.username}</span>
                </div>
                <span className="text-primary font-bold">{player.score} pts</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-2xl">
        Starting game...
      </div>
    );
  }

  const quitGame = () => {
    if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
      socket.emit('leave_room', { roomCode, userId: user.id });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Mobile-optimized header */}
        <div className="flex justify-between items-center mb-4 md:mb-6 text-white gap-2">
          <div className="bg-white/20 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl flex-1 max-w-[100px] md:max-w-none">
            <p className="text-xs md:text-sm opacity-80">Score</p>
            <p className="text-xl md:text-2xl font-bold">{score}</p>
          </div>
          <button
            onClick={quitGame}
            className="bg-red-500/80 hover:bg-red-500 px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base whitespace-nowrap"
          >
            <span className="hidden md:inline">❌ Quit</span>
            <span className="md:hidden">❌</span>
          </button>
          <div className={`bg-white/20 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl flex-1 max-w-[100px] md:max-w-none ${timeLeft <= 5 ? 'animate-pulse bg-red-500/40' : ''}`}>
            <p className="text-xs md:text-sm opacity-80">Time</p>
            <p className="text-xl md:text-2xl font-bold">{timeLeft}s</p>
          </div>
        </div>

        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl mb-4 md:mb-6"
        >
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-gray-500 font-semibold">Q{questionIndex + 1}</span>
                {question.category && (
                  <span className="px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {question.category}
                  </span>
                )}
              </div>
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {question.difficulty?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg md:text-2xl font-bold leading-tight">{question.question}</h2>
          </div>

          <div className="grid gap-3 md:gap-4">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = showResult && question.correctAnswer === index;
              const isWrongAnswer = showResult && isSelected && !isCorrect;
              
              return (
                <button
                  key={index}
                  onClick={() => submitAnswer(index)}
                  disabled={answered || timeLeft === 0}
                  className={`p-3 md:p-4 rounded-lg text-left font-semibold transition-all relative min-h-[60px] md:min-h-[70px] ${
                    isCorrectAnswer
                      ? 'bg-green-500 text-white shadow-lg border-2 border-green-600'
                      : isWrongAnswer
                      ? 'bg-red-500 text-white shadow-lg border-2 border-red-600'
                      : isSelected
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 active:scale-95'
                  } ${answered || timeLeft === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm md:text-base">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="ml-9 md:ml-10 flex items-center justify-between text-sm md:text-base">
                    <span className="pr-2">{option}</span>
                    {isCorrectAnswer && <span className="text-xl md:text-2xl">✓</span>}
                    {isWrongAnswer && <span className="text-xl md:text-2xl">✗</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 md:mt-4 p-3 md:p-4 rounded-lg ${
                isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
              }`}
            >
              <p className={`font-bold text-base md:text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Wrong Answer'}
              </p>
              <p className="text-gray-700 mt-2 text-sm md:text-base">
                The correct answer is: <strong>{question.options[question.correctAnswer]}</strong>
              </p>
            </motion.div>
          )}

          {allAnswered && countdown !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-lg bg-blue-100 border-2 border-blue-500 text-center"
            >
              <p className="font-bold text-blue-700 text-xl">
                {countdown > 0 ? (
                  <>⏳ Next question in <span className="text-3xl">{countdown}</span>...</>
                ) : (
                  <>🚀 Loading next question...</>
                )}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Player Left Notification */}
        <AnimatePresence>
          {playerLeftNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-600">
                <p className="font-bold text-lg">
                  👋 {playerLeftNotification} left the game
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span>Live Leaderboard</span>
          </h3>
          <div className="space-y-2">
            {leaderboard.map((player, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-100' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500">#{index + 1}</span>
                  <span className="font-semibold">{player.username}</span>
                </div>
                <span className="font-bold text-primary">{player.score}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
