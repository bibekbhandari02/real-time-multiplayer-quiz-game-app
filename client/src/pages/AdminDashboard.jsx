import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [suspicious, setSuspicious] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
    fetchSuspicious();
    
    const interval = setInterval(fetchRealtimeStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchRealtimeStats = async () => {
    try {
      const { data } = await axios.get('/api/admin/realtime-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRealtimeStats(data);
    } catch (error) {
      console.error('Failed to fetch realtime stats:', error);
    }
  };

  const fetchSuspicious = async () => {
    try {
      const { data } = await axios.get('/api/admin/suspicious-activities', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuspicious(data.activities);
    } catch (error) {
      console.error('Failed to fetch suspicious activities:', error);
    }
  };

  if (!analytics) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            Back to Home
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-primary">{analytics.overview.totalUsers}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-secondary">{analytics.overview.totalGames}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Games</h3>
            <p className="text-3xl font-bold text-green-500">{analytics.overview.activeGames}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Questions</h3>
            <p className="text-3xl font-bold text-accent">{analytics.overview.totalQuestions}</p>
          </motion.div>
        </div>

        {/* Real-time Stats */}
        {realtimeStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Users</h3>
              <p className="text-2xl font-bold text-green-500">{realtimeStats.activeUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Games (24h)</h3>
              <p className="text-2xl font-bold text-blue-500">{realtimeStats.gamesLast24h}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">New Users (24h)</h3>
              <p className="text-2xl font-bold text-purple-500">{realtimeStats.newUsersLast24h}</p>
            </div>
          </div>
        )}

        {/* Top Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Top Players</h2>
            <div className="space-y-2">
              {analytics.topPlayers.map((player, index) => (
                <div key={player._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">#{index + 1}</span>
                    <span className="font-semibold">{player.username}</span>
                  </div>
                  <span className="text-primary font-bold">{player.elo} ELO</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Games */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
            <div className="space-y-2">
              {analytics.recentGames.map((game) => (
                <div key={game._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{game.roomCode}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      game.status === 'playing' ? 'bg-green-100 text-green-700' :
                      game.status === 'finished' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {game.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Host: {game.host?.username} | Players: {game.players.length}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Suspicious Activities */}
        {suspicious.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Suspicious Activities</h2>
            <div className="space-y-2">
              {suspicious.slice(0, 10).map((activity, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">User ID: {activity.userId}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    {JSON.parse(activity.flags).map((flag, i) => (
                      <span key={i} className="inline-block bg-red-200 text-red-800 px-2 py-1 rounded mr-2 mb-1">
                        {flag.type}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
