import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/global', async (req, res) => {
  try {
    const { limit = 100, sortBy = 'elo' } = req.query;
    
    const sortOptions = {
      elo: { elo: -1 },
      wins: { 'stats.gamesWon': -1 },
      xp: { xp: -1 },
      accuracy: { 'stats.accuracy': -1 }
    };

    const leaderboard = await User.find()
      .sort(sortOptions[sortBy] || sortOptions.elo)
      .limit(parseInt(limit))
      .select('username level xp elo stats avatar badges');

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username level xp elo stats avatar');
    
    const friendsLeaderboard = user.friends.sort((a, b) => b.elo - a.elo);
    
    res.json(friendsLeaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rank/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rank = await User.countDocuments({ elo: { $gt: user.elo } }) + 1;
    const totalUsers = await User.countDocuments();
    const percentile = ((totalUsers - rank) / totalUsers * 100).toFixed(2);

    res.json({ rank, totalUsers, percentile, elo: user.elo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
