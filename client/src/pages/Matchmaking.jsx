import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
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
    if (!socket) return;

    const handleMatchFound = ({ roomCode, autoStart }) => {
      console.log('🎮 Match found!', { roomCode, autoStart });
      setSearching(false);
      
      if (autoStart) {
        // For ranked matches, show countdown then go to game
        // First navigate to a waiting screen, then to game when it starts
        navigate(`/lobby/${roomCode}`);
      } else {
        // For regular matches, go to lobby
        navigate(`/lobby/${roomCode}`);
      }
    };

    socket.on('match_found', handleMatchFound);

    return () => {
      socket.off('match_found', handleMatchFound);
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
    <div className="min-h-screen p-3 md:p-4 flex items-center justify-center bg-[#0F172A]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1E293B] rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full border border-[#334155]"
      >
        <div className="text-center mb-4 md:mb-6">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#F1F5F9]">Ranked Matchmaking</h1>
        </div>

        {queueStatus && (
          <div className="bg-[#334155] rounded-lg p-3 md:p-4 mb-4 md:mb-6 border border-[#334155]">
            <div className="flex justify-between mb-2 text-sm md:text-base">
              <span className="text-[#CBD5E1]">Players in Queue:</span>
              <span className="font-bold text-[#F1F5F9]">{queueStatus.playersInQueue}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-[#CBD5E1]">Avg Wait Time:</span>
              <span className="font-bold text-[#F1F5F9]">{queueStatus.averageWaitTime}s</span>
            </div>
          </div>
        )}

        {!searching ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startMatchmaking}
            className="w-full bg-gradient-to-r from-[#FACC15] to-[#F97316] text-black py-4 rounded-lg font-bold text-lg shadow-lg shadow-[#FACC15]/30 hover:from-[#EAB308] hover:to-[#EA580C] transition"
          >
            🎮 Find Match
          </motion.button>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-xl font-semibold mb-2 text-[#F1F5F9]">Searching for opponents...</p>
            <p className="text-[#CBD5E1] mb-6">Wait time: <span className="text-[#F1F5F9] font-bold">{waitTime}s</span></p>
            <button
              onClick={cancelMatchmaking}
              className="bg-[#EF4444] text-white px-6 py-2 rounded-lg hover:bg-[#DC2626] transition"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-[#F1F5F9] hover:text-[#3B82F6] transition font-semibold"
        >
          ← Back to Home
        </button>
      </motion.div>
    </div>
  );
}

