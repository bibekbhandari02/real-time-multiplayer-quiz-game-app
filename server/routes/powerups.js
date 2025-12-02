import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Powerup from '../models/Powerup.js';
import { purchasePowerup, getUserPowerups } from '../services/powerupService.js';

const router = express.Router();

router.use(authenticateToken);

// Get all available powerups
router.get('/', async (req, res) => {
  try {
    const powerups = await getUserPowerups(req.userId);
    res.json(powerups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get powerup shop
router.get('/shop', async (req, res) => {
  try {
    const powerups = await Powerup.find({ isActive: true }).sort({ cost: 1 });
    res.json(powerups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase powerup
router.post('/purchase', async (req, res) => {
  try {
    const { powerupKey, quantity = 1 } = req.body;

    if (!powerupKey) {
      return res.status(400).json({ error: 'Powerup key is required' });
    }

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 10' });
    }

    const result = await purchasePowerup(req.userId, powerupKey, quantity);
    
    res.json({
      message: 'Powerup purchased successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
