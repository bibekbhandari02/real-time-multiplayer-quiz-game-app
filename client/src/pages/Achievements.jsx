import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    // Use default achievements based on user stats
    setAchievements(getDefaultAchievements());
    setLoading(false);
  };

  const getDefaultAchievements = () => [
    { id: 1, name: 'First Victory', description: 'Win your first game', icon: '🏆', unlocked: (user?.stats?.gamesWon || 0) >= 1 },
    { id: 2, name: 'Winning Streak', description: 'Win 5 games', icon: '🔥', unlocked: (user?.stats?.gamesWon || 0) >= 5 },
    { id: 3, name: 'Trivia Champion', description: 'Win 10 games', icon: '👑', unlocked: (user?.stats?.gamesWon || 0) >= 10 },
    { id: 4, name: 'Perfect Score', description: 'Get 100% accuracy in a game', icon: '💯', unlocked: false },
    { id: 5, name: 'Speed Demon', description: 'Answer all questions in under 5 seconds', icon: '⚡', unlocked: false },
    { id: 6, name: 'Dedicated Player', description: 'Play 25 games', icon: '🎮', unlocked: (user?.stats?.gamesPlayed || 0) >= 25 },
    { id: 7, name: 'Sharp Mind', description: 'Maintain 80% accuracy over 10 games', icon: '🧠', unlocked: (user?.stats?.accuracy || 0) >= 80 && (user?.stats?.gamesPlayed || 0) >= 10 },
    { id: 8, name: 'Rising Star', description: 'Reach 1200 ELO', icon: '⭐', unlocked: (user?.elo || 1000) >= 1200 },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progress = achievements.length > 0 ? (unlockedCount / achievements.length * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-black mb-6 hover:text-gray-700"
        >
          ← Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-black">🏆 Achievements</h1>

          <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-xl border-2 ${
            progress === '100' 
              ? 'bg-gray-100 border-gray-300' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-base md:text-lg text-black">Your Progress</span>
              <span className="font-bold text-black text-lg md:text-xl">{unlockedCount}/{achievements.length}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
                className="h-4 rounded-full bg-black shadow-lg"
              />
            </div>
            {progress === '100' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 text-center"
              >
                <p className="text-lg font-bold text-black">🎉 Perfect! All Achievements Unlocked! 🎉</p>
                <p className="text-sm text-gray-600 mt-1">You're a true TriviaNova Champion!</p>
              </motion.div>
            ) : (
              <p className="text-sm text-gray-600 mt-2">{progress}% Complete - Keep playing to unlock more!</p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading achievements...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-gray-50 border-gray-300 shadow-lg'
                      : 'bg-gray-100 border-gray-200 opacity-70 hover:opacity-90 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-5xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-1 ${achievement.unlocked ? 'text-black' : 'text-gray-500'}`}>{achievement.name}</h3>
                      <p className={`text-sm mb-2 ${achievement.unlocked ? 'text-gray-700' : 'text-gray-500'}`}>{achievement.description}</p>
                      {achievement.unlocked ? (
                        <div className="mt-2 inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                          ✓ UNLOCKED
                        </div>
                      ) : (
                        <div className="mt-2 inline-block px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold border border-gray-300">
                          🔒 LOCKED
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

