import express from 'express';
import Question from '../models/Question.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/questions', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter).limit(parseInt(limit));
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Question.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
