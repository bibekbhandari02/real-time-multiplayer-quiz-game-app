import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getSocket } from '../socket/socket';
import { useAuthStore } from '../store/authStore';

export default function Matchmaking() {
  const [searching, setSearching] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [waitTime, setWaitTime] = useState(0);
  const navigate = useNavigate();
  const socket = getSocket();
  const { token } = useAuthStore();

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searching) {
      const timer = setInterval(() => {
        setWaitTime(t => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [searching]);

  useEffect(() => {
    socket.on('match_found', ({ roomCode, autoStart }) => {
      if (autoStart) {
        // For ranked matches, go directly to game
        setSearching(false);
        navigate(`/game/${roomCode}`);
      } else {
        // For regular matches, go to lobby
        navigate(`/lobby/${roomCode}`);
      }
    });

    return () => {
      socket.off('match_found');
    };
  }, [socket, navigate]);

  const fetchQueueStatus = async () => {
    try {
      if (!token) return;
      const { data } = await axios.get('/api/matchmaking/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueueStatus(data);
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const startMatchmaking = async () => {
    try {
      if (!token) {
        alert('Please log in to use matchmaking');
        return;
      }
      
      setSearching(true);
      setWaitTime(0);
      
      const { data } = await axios.post('/api/matchmaking/join-queue', 
        { preferences: {} },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.matched) {
        navigate(`/lobby/${data.roomCode}`);
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      alert('Failed to join matchmaking. Please try again.');
      setSearching(false);
    }
  };

  const cancelMatchmaking = async () => {
    try {
      if (!token) return;
      await axios.post('/api/matchmaking/leave-queue', {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearching(false);
      setWaitTime(0);
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full border-2 border-green-500/50"
      >
        <div className="text-center mb-4 md:mb-6">
          <div className="text-5xl mb-3 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">⚔️</div>
          <h1 className="text-2xl md:text-3xl font-bold text-green-400">Ranked Matchmaking</h1>
        </div>

        {queueStatus && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-3 md:p-4 mb-4 md:mb-6 border border-green-500/30">
            <div className="flex justify-between mb-2 text-sm md:text-base">
              <span className="text-gray-400">Players in Queue:</span>
              <span className="font-bold text-green-400">{queueStatus.playersInQueue}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-400">Avg Wait Time:</span>
              <span className="font-bold text-green-400">{queueStatus.averageWaitTime}s</span>
            </div>
          </div>
        )}

        {!searching ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startMatchmaking}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition"
          >
            🎮 Find Match
          </motion.button>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            />
            <p className="text-xl font-semibold mb-2 text-green-400">Searching for opponents...</p>
            <p className="text-gray-400 mb-6">Wait time: <span className="text-green-400 font-bold">{waitTime}s</span></p>
            <button
              onClick={cancelMatchmaking}
              className="bg-gradient-to-r from-red-900 to-red-800 text-red-300 px-6 py-2 rounded-lg hover:from-red-800 hover:to-red-700 transition border border-red-500/50"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-400 hover:text-green-400 transition"
        >
          ← Back to Home
        </button>
      </motion.div>
    </div>
  );
}
