import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { initSocket, getSocket } from '../socket/socket';
import Navigation from '../components/Navigation';

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

  return (
    <div className="min-h-screen pb-20 pt-16 md:pt-4 px-4">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Navigation />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.location.reload();
          }}
          className="text-4xl font-bold text-white hover:opacity-80 transition cursor-pointer"
        >
          TriviaNova
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/profile')}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            Profile
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            Leaderboard
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            Achievements
          </button>
          <button
            onClick={() => navigate('/friends')}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            Friends
          </button>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="text-4xl mb-3">🎮</div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Create Room</h2>
            <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">Start a new quiz game and invite friends</p>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full bg-primary text-white py-3 md:py-3 rounded-lg font-semibold hover:bg-primary/90 transition text-sm md:text-base"
            >
              Create New Room
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="text-4xl mb-3">🚪</div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Join Room</h2>
            <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">Enter a room code to join an existing game</p>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary text-center text-lg font-bold tracking-wider"
            />
            <button
              onClick={joinRoom}
              className="w-full bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-secondary/90 transition text-sm md:text-base"
            >
              Join Room
            </button>
            <button
              onClick={() => roomCode.trim() && navigate(`/spectator/${roomCode.toUpperCase()}`)}
              className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition text-sm"
            >
              👁️ Spectate Instead
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="text-4xl mb-3">⚔️</div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Ranked Match</h2>
            <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">Compete with players at your skill level</p>
            <button
              onClick={() => navigate('/matchmaking')}
              className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition text-sm md:text-base"
            >
              Find Match
            </button>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 md:mt-8 bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <h2 className="text-xl md:text-2xl font-bold mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg text-center border border-blue-200">
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{user.stats?.gamesPlayed || 0}</p>
              <p className="text-gray-700 font-semibold text-xs md:text-sm mt-1">Games Played</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-lg text-center border border-green-200">
              <p className="text-2xl md:text-3xl font-bold text-green-600">{user.stats?.gamesWon || 0}</p>
              <p className="text-gray-700 font-semibold text-xs md:text-sm mt-1">Wins</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 md:p-4 rounded-lg text-center border border-purple-200">
              <p className="text-2xl md:text-3xl font-bold text-purple-600">
                {user.stats?.gamesPlayed > 0 
                  ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-gray-700 font-semibold text-xs md:text-sm mt-1">Win Rate</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 md:p-4 rounded-lg text-center border border-orange-200">
              <p className="text-2xl md:text-3xl font-bold text-orange-600">{user.stats?.accuracy?.toFixed(1) || 0}%</p>
              <p className="text-gray-700 font-semibold text-xs md:text-sm mt-1">Accuracy</p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-3 rounded-lg border-2 border-yellow-300">
              <p className="text-xs md:text-sm text-gray-600 font-semibold">ELO Rating</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-700">{user.elo || 1000}</p>
            </div>
          </div>
        </motion.div>

        {/* Room Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Room Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Questions: {questionsCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time per Question: {timePerQuestion}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
