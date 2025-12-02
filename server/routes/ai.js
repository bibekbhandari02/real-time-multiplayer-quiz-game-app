import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateQuestions } from '../services/aiService.js';
import Question from '../models/Question.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/generate-questions', async (req, res) => {
  try {
    const { category, difficulty, count } = req.body;
    
    const questions = await generateQuestions(category, difficulty, count);
    
    // Save to database
    const savedQuestions = await Question.insertMany(
      questions.map(q => ({
        ...q,
        category,
        difficulty,
        aiGenerated: true
      }))
    );

    res.json({ 
      success: true, 
      count: savedQuestions.length,
      questions: savedQuestions 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/explain-answer', async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Return existing explanation or generate new one
    res.json({ 
      explanation: question.explanation || 'Explanation not available',
      correctAnswer: question.correctAnswer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
