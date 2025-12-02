import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('elo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/leaderboard/global?sortBy=${sortBy}&limit=50`);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-white mb-4 md:mb-6 hover:underline text-sm md:text-base"
        >
          ← Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Global Leaderboard</h2>
          
          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
            <button 
              onClick={() => setSortBy('elo')}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
                sortBy === 'elo' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ELO Rating
            </button>
            <button 
              onClick={() => setSortBy('wins')}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
                sortBy === 'wins' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Most Wins
            </button>
            <button 
              onClick={() => setSortBy('accuracy')}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
                sortBy === 'accuracy' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Accuracy
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No players yet. Be the first to play!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                return (
                  <motion.div 
                    key={player._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex justify-between items-center p-3 md:p-4 rounded-lg ${
                      rank <= 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition`}
                  >
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      <span className="text-xl md:text-2xl font-bold w-8 md:w-12 flex-shrink-0">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base md:text-lg truncate">{player.username}</p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {player.stats?.gamesPlayed || 0} games
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {sortBy === 'elo' && (
                        <>
                          <p className="font-bold text-xl text-primary">{player.elo || 1000}</p>
                          <p className="text-sm text-gray-600">{player.stats?.gamesWon || 0} wins</p>
                        </>
                      )}
                      {sortBy === 'wins' && (
                        <>
                          <p className="font-bold text-xl text-green-600">{player.stats?.gamesWon || 0} wins</p>
                          <p className="text-sm text-gray-600">
                            {player.stats?.gamesPlayed > 0 
                              ? ((player.stats.gamesWon / player.stats.gamesPlayed) * 100).toFixed(1)
                              : 0}% win rate
                          </p>
                        </>
                      )}
                      {sortBy === 'accuracy' && (
                        <>
                          <p className="font-bold text-xl text-purple-600">{player.stats?.accuracy?.toFixed(1) || 0}%</p>
                          <p className="text-sm text-gray-600">{player.stats?.gamesWon || 0} wins</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
