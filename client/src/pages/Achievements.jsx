import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data } = await axios.get('/api/achievements/progress', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAchievements(data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progress = (unlockedCount / achievements.length * 100).toFixed(0);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/profile')}
          className="text-white mb-6 hover:underline"
        >
          ← Back to Profile
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold mb-6">Achievements</h1>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Progress</span>
              <span className="font-bold text-primary">{unlockedCount}/{achievements.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-xl border-2 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-primary font-semibold">+{achievement.xpReward} XP</span>
                      <span className="text-yellow-600 font-semibold">+{achievement.coinsReward} Coins</span>
                    </div>
                    {achievement.unlocked && (
                      <div className="mt-2 text-xs text-green-600 font-semibold">
                        ✓ UNLOCKED
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
