import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Leaderboard() {
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
          <h2 className="text-2xl font-bold mb-6">Global Leaderboard</h2>
          
          <div className="flex gap-2 mb-6">
            <button className="px-4 py-2 bg-primary text-white rounded-lg font-semibold">
              ELO
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Wins
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              XP
            </button>
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className={`flex justify-between items-center p-4 rounded-lg ${
                rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </span>
                  <div>
                    <p className="font-bold">Player {rank}</p>
                    <p className="text-sm text-gray-600">Level {10 - rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{1500 - rank * 50} ELO</p>
                  <p className="text-sm text-gray-600">{100 - rank * 10} wins</p>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-gray-500 mt-6 text-sm">
            Connect to database to see real rankings
          </p>
        </motion.div>
      </div>
    </div>
  );
}
