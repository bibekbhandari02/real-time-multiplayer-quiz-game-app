import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getSocket } from '../socket/socket';

export default function Matchmaking() {
  const [searching, setSearching] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [waitTime, setWaitTime] = useState(0);
  const navigate = useNavigate();
  const socket = getSocket();

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
    socket.on('match_found', ({ roomCode }) => {
      navigate(`/lobby/${roomCode}`);
    });

    return () => {
      socket.off('match_found');
    };
  }, [socket, navigate]);

  const fetchQueueStatus = async () => {
    try {
      const { data } = await axios.get('/api/matchmaking/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setQueueStatus(data);
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const startMatchmaking = async () => {
    try {
      setSearching(true);
      setWaitTime(0);
      
      const { data } = await axios.post('/api/matchmaking/join-queue', 
        { preferences: {} },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (data.matched) {
        navigate(`/lobby/${data.roomCode}`);
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      setSearching(false);
    }
  };

  const cancelMatchmaking = async () => {
    try {
      await axios.post('/api/matchmaking/leave-queue', {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSearching(false);
      setWaitTime(0);
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full"
      >
        <h1 className="text-3xl font-bold text-center mb-6">Ranked Matchmaking</h1>

        {queueStatus && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Players in Queue:</span>
              <span className="font-bold">{queueStatus.playersInQueue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Wait Time:</span>
              <span className="font-bold">{queueStatus.averageWaitTime}s</span>
            </div>
          </div>
        )}

        {!searching ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startMatchmaking}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-bold text-lg shadow-lg"
          >
            Find Match
          </motion.button>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-xl font-semibold mb-2">Searching for opponents...</p>
            <p className="text-gray-600 mb-6">Wait time: {waitTime}s</p>
            <button
              onClick={cancelMatchmaking}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 transition"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
