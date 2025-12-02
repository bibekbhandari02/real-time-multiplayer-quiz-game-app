import express from 'express';
import User from '../models/User.js';
import GameRoom from '../models/GameRoom.js';
import Question from '../models/Question.js';
import { authenticateToken } from '../middleware/auth.js';
import { getRedisClient } from '../config/redis.js';

const router = express.Router();

// Admin middleware
const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(authenticateToken);
router.use(isAdmin);

// Analytics Dashboard
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await GameRoom.countDocuments();
    const activeGames = await GameRoom.countDocuments({ status: 'playing' });
    const totalQuestions = await Question.countDocuments();

    const recentGames = await GameRoom.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('host', 'username')
      .populate('winner', 'username');

    const topPlayers = await User.find()
      .sort({ elo: -1 })
      .limit(10)
      .select('username elo stats');

    const questionStats = await Question.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgAccuracy: { 
            $avg: { 
              $cond: [
                { $eq: ['$stats.timesAsked', 0] },
                0,
                { $divide: ['$stats.correctAnswers', '$stats.timesAsked'] }
              ]
            }
          }
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalGames,
        activeGames,
        totalQuestions
      },
      recentGames,
      topPlayers,
      questionStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get suspicious activities
router.get('/suspicious-activities', async (req, res) => {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return res.json({ activities: [] });
    }

    const keys = await redis.keys('suspicious:*');
    const activities = [];

    for (const key of keys) {
      const data = await redis.get(key);
      const [, userId, timestamp] = key.split(':');
      
      activities.push({
        userId,
        timestamp: parseInt(timestamp),
        flags: JSON.parse(data)
      });
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ activities: activities.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time stats
router.get('/realtime-stats', async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const gamesLast24h = await GameRoom.countDocuments({ 
      createdAt: { $gte: last24h } 
    });

    const newUsersLast24h = await User.countDocuments({ 
      createdAt: { $gte: last24h } 
    });

    const activeUsers = await GameRoom.distinct('players.userId', {
      status: { $in: ['waiting', 'playing'] }
    });

    res.json({
      gamesLast24h,
      newUsersLast24h,
      activeUsers: activeUsers.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Question difficulty heatmap
router.get('/question-heatmap', async (req, res) => {
  try {
    const heatmap = await Question.aggregate([
      {
        $group: {
          _id: {
            category: '$category',
            difficulty: '$difficulty'
          },
          count: { $sum: 1 },
          avgAccuracy: {
            $avg: {
              $cond: [
                { $eq: ['$stats.timesAsked', 0] },
                0,
                { $divide: ['$stats.correctAnswers', '$stats.timesAsked'] }
              ]
            }
          }
        }
      }
    ]);

    res.json({ heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
