import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-white mb-6 hover:underline"
        >
          ← Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-primary">{user.level}</p>
              <p className="text-gray-600">Level</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-secondary">{user.xp}</p>
              <p className="text-gray-600">XP</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-accent">{user.elo || 1000}</p>
              <p className="text-gray-600">ELO</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-500">{user.coins}</p>
              <p className="text-gray-600">Coins</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Badges</h2>
              <button
                onClick={() => navigate('/achievements')}
                className="text-primary hover:underline font-semibold"
              >
                View All →
              </button>
            </div>
            <div className="text-gray-600">
              {user.badges?.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {user.badges.map((badge, i) => (
                    <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {badge}
                    </span>
                  ))}
                </div>
              ) : (
                'No badges yet. Play more games to earn badges!'
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Game Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Games Played</p>
                <p className="text-2xl font-bold">{user.stats?.gamesPlayed || 0}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Win Rate</p>
                <p className="text-2xl font-bold">
                  {user.stats?.gamesPlayed > 0 
                    ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Accuracy</p>
                <p className="text-2xl font-bold">{user.stats?.accuracy?.toFixed(1) || 0}%</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-2xl font-bold">{user.stats?.streak || 0} 🔥</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
