import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  explanation: { type: String },
  aiGenerated: { type: Boolean, default: false },
  stats: {
    timesAsked: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Question', questionSchema);
