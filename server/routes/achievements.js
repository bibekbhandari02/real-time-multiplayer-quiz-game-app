import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAllAchievements, getUserProgress } from '../services/achievementService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/all', (req, res) => {
  const achievements = getAllAchievements();
  res.json(achievements);
});

router.get('/progress', async (req, res) => {
  try {
    const progress = await getUserProgress(req.userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
