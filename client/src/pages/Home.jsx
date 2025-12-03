import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { initSocket, getSocket } from '../socket/socket';
import Navigation from '../components/Navigation';
import Navbar from '../components/Navbar';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [category, setCategory] = useState('General Knowledge');
  const [questionsCount, setQuestionsCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const { user, logout, refreshUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (!user?.id || !user?.username) return;
    
    initSocket(user.id, user.username);
    
    const socket = getSocket();
    socket.on('room_created', ({ roomCode }) => {
      navigate(`/lobby/${roomCode}`);
    });

    return () => {
      socket.off('room_created');
    };
  }, [user, navigate]);

  const createRoom = () => {
    if (!user?.id || !user?.username) {
      console.error('User not loaded');
      return;
    }
    
    const socket = getSocket();
    socket.emit('create_room', {
      userId: user.id,
      username: user.username,
      settings: {
        maxPlayers: 10,
        questionsCount,
        timePerQuestion,
        category
      }
    });
    setShowSettings(false);
  };

  const joinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/lobby/${roomCode.toUpperCase()}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pb-20 pt-4 px-4">
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Navigation />
        </div>

      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Create Room Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  ✨
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-black">Create Room</h2>
              </div>
              <p className="text-gray-600 text-sm md:text-base mb-6">Start a new quiz game and invite friends to join</p>
              <button
                onClick={() => setShowSettings(true)}
                className="w-full bg-gray-50 text-black py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:scale-[1.02] text-sm md:text-base"
              >
                Create New Room
              </button>
            </div>
          </motion.div>

          {/* Join Room Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🎮
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-black">Join Room</h2>
              </div>
              <p className="text-gray-600 text-sm md:text-base mb-4">Enter a room code to join an existing game</p>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full px-4 py-3.5 bg-gray-100 border-2 border-gray-200 text-black rounded-xl mb-3 focus:ring-2 focus:ring-black focus:border-black text-center text-lg font-bold tracking-[0.3em] placeholder-gray-400 transition-all"
              />
              <button
                onClick={joinRoom}
                className="w-full bg-gray-50 text-black py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:scale-[1.02] text-sm md:text-base mb-2"
              >
                Join Room
              </button>
              <button
                onClick={() => roomCode.trim() && navigate(`/spectator/${roomCode.toUpperCase()}`)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-all border border-gray-200 hover:border-gray-300 text-sm flex items-center justify-center gap-2"
              >
                <span>👁️</span> Spectate Mode
              </button>
            </div>
          </motion.div>

          {/* Ranked Match Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🏆
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-black">Ranked Match</h2>
              </div>
              <p className="text-gray-600 text-sm md:text-base mb-6">Compete with players at your skill level</p>
              <button
                onClick={() => navigate('/matchmaking')}
                className="w-full bg-gray-50 text-black py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:scale-[1.02] text-sm md:text-base"
              >
                Find Match
              </button>
            </div>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 md:mt-8 bg-white rounded-2xl p-4 md:p-8 shadow-2xl"
        >
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg md:text-xl shadow-lg">
              📊
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-black">Your Performance</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
            {/* Games Played */}
            <div className="group relative bg-gray-50 p-3 md:p-3 rounded-lg md:rounded-xl text-center border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <div className="text-xl md:text-2xl mb-1">🎮</div>
                <p className="text-xl md:text-3xl font-bold text-black mb-0.5">{user.stats?.gamesPlayed || 0}</p>
                <p className="text-gray-600 font-medium text-[10px] md:text-sm">Games</p>
              </div>
            </div>

            {/* Wins */}
            <div className="group relative bg-gray-50 p-3 md:p-3 rounded-lg md:rounded-xl text-center border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <div className="text-xl md:text-2xl mb-1">🏅</div>
                <p className="text-xl md:text-3xl font-bold text-black mb-0.5">{user.stats?.gamesWon || 0}</p>
                <p className="text-gray-600 font-medium text-[10px] md:text-sm">Wins</p>
              </div>
            </div>

            {/* Win Rate */}
            <div className="group relative bg-gray-50 p-3 md:p-3 rounded-lg md:rounded-xl text-center border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <div className="text-xl md:text-2xl mb-1">📈</div>
                <p className="text-xl md:text-3xl font-bold text-black mb-0.5">
                  {user.stats?.gamesPlayed > 0 
                    ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-gray-600 font-medium text-[10px] md:text-sm">Win Rate</p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="group relative bg-gray-50 p-3 md:p-3 rounded-lg md:rounded-xl text-center border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10">
                <div className="text-xl md:text-2xl mb-1">🎯</div>
                <p className="text-xl md:text-3xl font-bold text-black mb-0.5">{user.stats?.accuracy?.toFixed(1) || 0}%</p>
                <p className="text-gray-600 font-medium text-[10px] md:text-sm">Accuracy</p>
              </div>
            </div>
          </div>
          
          {/* ELO Rating - Featured */}
          <div className="flex justify-center">
            <div className="group relative bg-gray-50 px-4 md:px-5 py-3 rounded-lg md:rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="relative z-10 flex items-center gap-3">
                <div className="text-2xl md:text-3xl">⭐</div>
                <div>
                  <p className="text-[10px] md:text-sm text-gray-600 font-medium mb-0.5">ELO Rating</p>
                  <p className="text-xl md:text-3xl font-bold text-black">{user.elo || 1000}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Room Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-gray-100/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-black">⚙️ Room Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Technology">Technology</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="Music">Music</option>
                    <option value="Anime">Anime & Manga</option>
                    <option value="Movies">Movies & TV Shows</option>
                    <option value="Sports">Sports</option>
                    <option value="Video Games">Video Games</option>
                    <option value="Literature">Literature & Books</option>
                    <option value="Art">Art & Culture</option>
                    <option value="Food">Food & Cooking</option>
                    <option value="Nature">Nature & Animals</option>
                    <option value="Space">Space & Astronomy</option>
                    <option value="Mythology">Mythology & Legends</option>
                    <option value="Politics">Politics & World Affairs</option>
                    <option value="Business">Business & Economics</option>
                    <option value="Fashion">Fashion & Style</option>
                    <option value="Cars">Cars & Vehicles</option>
                    <option value="Programming">Programming & Coding</option>
                    <option value="Marvel">Marvel Universe</option>
                    <option value="DC">DC Universe</option>
                    <option value="Pokemon">Pokémon</option>
                    <option value="Harry Potter">Harry Potter</option>
                    <option value="Star Wars">Star Wars</option>
                    <option value="Lord of the Rings">Lord of the Rings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Number of Questions: <span className="text-gray-700">{questionsCount}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Time per Question: <span className="text-gray-700">{timePerQuestion}s</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-200 text-black py-3 rounded-lg font-semibold hover:bg-gray-300 transition border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg"
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
