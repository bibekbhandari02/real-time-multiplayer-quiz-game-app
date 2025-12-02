import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function PowerupShop() {
  const [powerups, setPowerups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  
  const navigate = useNavigate();
  const { token, user, setUser } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchPowerups();
  }, []);

  const fetchPowerups = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/powerups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPowerups(data);
    } catch (error) {
      console.error('Failed to fetch powerups:', error);
      addToast('Failed to load powerups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const purchasePowerup = async (powerupKey, quantity = 1) => {
    try {
      setPurchasing(powerupKey);
      const { data } = await axios.post('/api/powerups/purchase', 
        { powerupKey, quantity },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Update user coins
      setUser({ ...user, coins: data.user.coins });

      // Update powerup quantity
      setPowerups(prev =>
        prev.map(p =>
          p.key === powerupKey
            ? { ...p, quantity: p.quantity + quantity }
            : p
        )
      );

      addToast(`Purchased ${data.powerup.name}!`, 'success');
    } catch (error) {
      addToast(error.response?.data?.error || 'Purchase failed', 'error');
    } finally {
      setPurchasing(null);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-orange-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400';
      case 'rare':
        return 'border-blue-400';
      case 'epic':
        return 'border-purple-400';
      case 'legendary':
        return 'border-yellow-400';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-6xl mx-auto">
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">⚡ Powerup Shop</h1>
              <p className="text-gray-600">Boost your gameplay with powerful items</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Your Coins</p>
              <p className="text-3xl font-bold text-yellow-500">🪙 {user?.coins || 0}</p>
            </div>
          </div>

          {/* Powerups Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading powerups...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {powerups.map((powerup, index) => (
                <motion.div
                  key={powerup.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${getRarityColor(powerup.rarity)} p-1 rounded-xl`}
                >
                  <div className="bg-white rounded-lg p-6 h-full flex flex-col">
                    {/* Rarity Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(powerup.rarity)}`}>
                        {powerup.rarity.toUpperCase()}
                      </span>
                      {powerup.quantity > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Owned: {powerup.quantity}
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="text-6xl text-center mb-4">
                      {powerup.icon}
                    </div>

                    {/* Info */}
                    <h3 className="text-xl font-bold text-center mb-2">{powerup.name}</h3>
                    <p className="text-sm text-gray-600 text-center mb-4 flex-1">
                      {powerup.description}
                    </p>

                    {/* Stats */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Uses per game:</span>
                        <span className="font-bold">{powerup.usesPerGame}</span>
                      </div>
                      {powerup.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-bold">{powerup.duration}s</span>
                        </div>
                      )}
                    </div>

                    {/* Purchase Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => purchasePowerup(powerup.key, 1)}
                        disabled={purchasing === powerup.key || user.coins < powerup.cost}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {purchasing === powerup.key ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Purchasing...
                          </span>
                        ) : (
                          <>Buy 1 for 🪙 {powerup.cost}</>
                        )}
                      </button>
                      
                      <button
                        onClick={() => purchasePowerup(powerup.key, 5)}
                        disabled={purchasing === powerup.key || user.coins < powerup.cost * 5}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Buy 5 for 🪙 {powerup.cost * 5}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">💡 How to Use Powerups</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Purchase powerups using coins earned from games</li>
              <li>• Use powerups during gameplay to gain advantages</li>
              <li>• Each powerup has limited uses per game</li>
              <li>• Higher rarity powerups are more powerful but cost more</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
