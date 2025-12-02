import { useState, useEffect } from 'react';
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
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Initialize socket if not already initialized
  const socket = getSocket() || initSocket(user.id, user.username);

  useEffect(() => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

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
      setTimeLeft(15);
      
      const startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, 15 - elapsed);
        setTimeLeft(newTimeLeft);
        
        // Auto-submit when time runs out if not answered
        if (newTimeLeft === 0) {
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
      // Don't set answered here, it's already set in submitAnswer
    });

    socket.on('leaderboard_update', ({ players }) => {
      setLeaderboard(players);
    });

    socket.on('game_over', ({ winner, leaderboard: finalBoard }) => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      setGameOver(true);
      setLeaderboard(finalBoard);
    });

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('leaderboard_update');
      socket.off('game_over');
    };
  }, [socket, roomCode]);

  const submitAnswer = (answerIndex) => {
    if (answered || timeLeft === 0) return;
    
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 text-white">
          <div className="bg-white/20 px-6 py-3 rounded-xl">
            <p className="text-sm opacity-80">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <div className={`bg-white/20 px-6 py-3 rounded-xl ${timeLeft <= 5 ? 'animate-pulse bg-red-500/40' : ''}`}>
            <p className="text-sm opacity-80">Time</p>
            <p className="text-2xl font-bold">{timeLeft}s</p>
          </div>
        </div>

        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl mb-6"
        >
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Question {questionIndex + 1}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {question.difficulty?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold mt-2">{question.question}</h2>
          </div>

          <div className="grid gap-4">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: answered ? 1 : 1.02 }}
                whileTap={{ scale: answered ? 1 : 0.98 }}
                onClick={() => submitAnswer(index)}
                disabled={answered || timeLeft === 0}
                className={`p-4 rounded-lg text-left font-semibold transition relative ${
                  selectedAnswer === index
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                } ${answered || timeLeft === 0 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="ml-10">{option}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

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
