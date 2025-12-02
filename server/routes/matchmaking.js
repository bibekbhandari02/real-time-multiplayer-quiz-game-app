import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { addToQueue, removeFromQueue, getQueueStatus } from '../services/matchmaking.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/join-queue', async (req, res) => {
  try {
    const { preferences } = req.body;
    const result = await addToQueue(req.userId, preferences);
    
    if (result) {
      res.json({ matched: true, roomCode: result.roomCode });
    } else {
      res.json({ matched: false, message: 'Added to queue' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/leave-queue', (req, res) => {
  removeFromQueue(req.userId);
  res.json({ success: true });
});

router.get('/status', (req, res) => {
  const status = getQueueStatus();
  res.json(status);
});

export default router;
