import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <div className="min-h-screen p-3 md:p-4 pb-20 md:pb-4 bg-[#0F172A]">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-slate-300 mb-4 md:mb-6 hover:text-blue-400 text-sm md:text-base"
        >
          ← Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-700"
        >
          <div className="text-center mb-6 md:mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg shadow-blue-500/30">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{user.username || 'User'}</h1>
            <p className="text-slate-400 text-sm md:text-base">{user.email || ''}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-slate-700 p-4 md:p-6 rounded-lg text-center border-2 border-slate-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition">
              <p className="text-2xl md:text-4xl font-bold text-slate-100">{user.stats?.gamesPlayed || 0}</p>
              <p className="text-slate-400 font-semibold mt-1 text-xs md:text-base">Games Played</p>
            </div>
            <div className="bg-slate-700 p-4 md:p-6 rounded-lg text-center border-2 border-slate-600 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition">
              <p className="text-2xl md:text-4xl font-bold text-slate-100">{user.stats?.gamesWon || 0}</p>
              <p className="text-slate-400 font-semibold mt-1 text-xs md:text-base">Wins</p>
            </div>
            <div className="bg-slate-700 p-4 md:p-6 rounded-lg text-center border-2 border-slate-600 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 transition">
              <p className="text-2xl md:text-4xl font-bold text-slate-100">{user.elo || 1000}</p>
              <p className="text-slate-400 font-semibold mt-1 text-xs md:text-base">ELO Rating</p>
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">Badges</h2>
              <button
                onClick={() => navigate('/achievements')}
                className="text-blue-400 hover:text-blue-300 font-semibold text-sm md:text-base"
              >
                View All →
              </button>
            </div>
            <div className="text-slate-400">
              {user.badges?.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {user.badges.map((badge, i) => (
                    <span key={i} className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/30">
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
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-slate-100">Performance Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-slate-700 p-3 md:p-4 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-xs md:text-sm font-semibold">Win Rate</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-100">
                  {user.stats?.gamesPlayed > 0 
                    ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold">Accuracy</p>
                <p className="text-3xl font-bold text-slate-100">{user.stats?.accuracy?.toFixed(1) || 0}%</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold">Total Score</p>
                <p className="text-3xl font-bold text-slate-100">{user.stats?.totalScore || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
