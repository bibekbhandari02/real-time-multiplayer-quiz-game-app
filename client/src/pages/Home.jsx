import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { initSocket, getSocket } from '../socket/socket';
import Navbar from '../components/Navbar';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [category, setCategory] = useState('General Knowledge');
  const [questionsCount, setQuestionsCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [difficultyMode, setDifficultyMode] = useState('mixed');
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
        category,
        difficultyMode
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
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-[#CBD5E1]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0F172A] pb-20 pt-6 lg:pt-8 px-4">
        <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Create Room Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#1E293B] rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 border border-[#334155]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#334155] rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🎮
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#F1F5F9]">Create Room</h2>
              </div>
              <p className="text-[#CBD5E1] text-sm md:text-base mb-6">Start a new quiz game and invite friends to join</p>
              <button
                onClick={() => setShowSettings(true)}
                className="w-full bg-[#3B82F6] text-white py-3.5 rounded-xl font-semibold hover:bg-[#3B82F6] transition-all duration-300 shadow-lg shadow-[#3B82F6]/20 hover:scale-[1.02] text-sm md:text-base"
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
            className="group relative bg-[#1E293B] rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-[#22C55E]/20 transition-all duration-300 border border-[#334155]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#334155] rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🚪
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#F1F5F9]">Join Room</h2>
              </div>
              <p className="text-[#CBD5E1] text-sm md:text-base mb-4">Enter a room code to join an existing game</p>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter Room Code"
                maxLength={6}
                className="w-full px-4 py-3.5 bg-[#0F172A] border-2 border-[#475569] text-[#F1F5F9] rounded-xl mb-3 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] text-center text-base md:text-lg font-semibold tracking-wide placeholder:tracking-normal placeholder-[#94A3B8] transition-all"
              />
              <button
                onClick={joinRoom}
                className="w-full bg-[#22C55E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#16A34A] transition-all duration-300 shadow-lg shadow-[#22C55E]/20 hover:scale-[1.02] text-sm md:text-base mb-2"
              >
                Join Room
              </button>
              <button
                onClick={() => roomCode.trim() && navigate(`/spectator/${roomCode.toUpperCase()}`)}
                className="w-full bg-[#334155] hover:bg-[#475569] text-[#CBD5E1] py-2.5 rounded-xl font-medium transition-all border border-[#475569] hover:border-[#475569] text-sm flex items-center justify-center gap-2"
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
            className="group relative bg-[#1E293B] rounded-2xl p-6 md:p-8 shadow-2xl hover:shadow-[#FACC15]/20 transition-all duration-300 border border-[#334155]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#334155] rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  ⚔️
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#F1F5F9]">Ranked Match</h2>
              </div>
              <p className="text-[#CBD5E1] text-sm md:text-base mb-6">Compete with players at your skill level</p>
              <button
                onClick={() => navigate('/matchmaking')}
                className="w-full bg-[#FACC15] text-black py-3.5 rounded-xl font-semibold hover:bg-[#EAB308] transition-all duration-300 shadow-lg shadow-[#FACC15]/20 hover:scale-[1.02] text-sm md:text-base"
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
          className="mt-6 md:mt-8 bg-[#1E293B] rounded-2xl p-4 md:p-8 shadow-2xl border border-[#334155]"
        >
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-[#F1F5F9]">Personal Stats</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
            {/* Games Played */}
            <div className="bg-[#334155] p-3 md:p-4 rounded-lg text-center border border-[#475569] hover:border-[#3B82F6] transition-all">
              <p className="text-xs md:text-sm text-[#94A3B8] font-semibold mb-1 md:mb-2">Games</p>
              <p className="text-2xl md:text-3xl font-bold text-[#F1F5F9]">{user.stats?.gamesPlayed || 0}</p>
            </div>

            {/* Wins */}
            <div className="bg-[#334155] p-3 md:p-4 rounded-lg text-center border border-[#475569] hover:border-[#22C55E] transition-all">
              <p className="text-xs md:text-sm text-[#94A3B8] font-semibold mb-1 md:mb-2">Wins</p>
              <p className="text-2xl md:text-3xl font-bold text-[#22C55E]">{user.stats?.gamesWon || 0}</p>
            </div>

            {/* Win Rate */}
            <div className="bg-[#334155] p-3 md:p-4 rounded-lg text-center border border-[#475569] hover:border-[#3B82F6] transition-all">
              <p className="text-xs md:text-sm text-[#94A3B8] font-semibold mb-1 md:mb-2">Win Rate</p>
              <p className="text-2xl md:text-3xl font-bold text-[#3B82F6]">
                {user.stats?.gamesPlayed > 0 
                  ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>

            {/* Accuracy */}
            <div className="bg-[#334155] p-3 md:p-4 rounded-lg text-center border border-[#475569] hover:border-[#F97316] transition-all">
              <p className="text-xs md:text-sm text-[#94A3B8] font-semibold mb-1 md:mb-2">Accuracy</p>
              <p className="text-2xl md:text-3xl font-bold text-[#F97316]">{user.stats?.accuracy?.toFixed(0) || 0}%</p>
            </div>

            {/* ELO Rating */}
            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#FACC15] to-[#F59E0B] p-3 md:p-4 rounded-lg text-center border-2 border-[#FACC15] hover:shadow-lg hover:shadow-[#FACC15]/30 transition-all">
              <p className="text-xs md:text-sm text-black font-bold mb-1 md:mb-2">ELO Rating</p>
              <p className="text-2xl md:text-3xl font-bold text-black">{user.elo || 1000}</p>
            </div>
          </div>
        </motion.div>

        {/* Room Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1E293B] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[#334155]"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#F1F5F9]">⚙️ Room Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F172A] border-2 border-[#475569] text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
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
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Number of Questions: <span className="text-[#CBD5E1]">{questionsCount}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Time per Question: <span className="text-[#CBD5E1]">{timePerQuestion}s</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Difficulty Mode
                  </label>
                  <select
                    value={difficultyMode}
                    onChange={(e) => setDifficultyMode(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F172A] border-2 border-[#475569] text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  >
                    <option value="mixed">Mixed (Recommended)</option>
                    <option value="progressive">Progressive (Easy → Hard)</option>
                    <option value="easy">Easy Only</option>
                    <option value="medium">Medium Only</option>
                    <option value="hard">Hard Only</option>
                  </select>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {difficultyMode === 'mixed' && 'Balanced mix of all difficulties'}
                    {difficultyMode === 'progressive' && 'Starts easy, gets harder'}
                    {difficultyMode === 'easy' && 'Perfect for beginners'}
                    {difficultyMode === 'medium' && 'Balanced challenge'}
                    {difficultyMode === 'hard' && 'For trivia masters only'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-[#334155] text-slate-200 py-3 rounded-lg font-semibold hover:bg-[#475569] transition border border-[#475569]"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  className="flex-1 bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-[#3B82F6] transition shadow-lg shadow-[#3B82F6]/20"
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
