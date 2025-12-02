import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { initSocket, getSocket } from '../socket/socket';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
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
        questionsCount: 10,
        timePerQuestion: 15
      }
    });
  };

  const joinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/lobby/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Quiz Master</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Profile
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Leaderboard
            </button>
            <button
              onClick={() => navigate('/achievements')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Achievements
            </button>
            <button
              onClick={() => navigate('/friends')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Friends
            </button>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">Create Room</h2>
            <p className="text-gray-600 mb-6">Start a new quiz game and invite friends</p>
            <button
              onClick={createRoom}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Create New Room
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">Join Room</h2>
            <p className="text-gray-600 mb-6">Enter a room code to join an existing game</p>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={joinRoom}
              className="w-full bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-secondary/90 transition"
            >
              Join Room
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">Ranked Match</h2>
            <p className="text-gray-600 mb-6">Compete with players at your skill level</p>
            <button
              onClick={() => navigate('/matchmaking')}
              className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Find Match
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{user.level}</p>
              <p className="text-gray-600">Level</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">{user.xp}</p>
              <p className="text-gray-600">XP</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{user.elo || 1000}</p>
              <p className="text-gray-600">ELO</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{user.coins || 100}</p>
              <p className="text-gray-600">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">0</p>
              <p className="text-gray-600">Badges</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
