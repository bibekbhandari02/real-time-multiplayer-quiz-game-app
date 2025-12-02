import mongoose from 'mongoose';

const gameRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    score: { type: Number, default: 0 },
    answers: [{ questionId: String, answer: Number, time: Number, correct: Boolean }],
    joinedAt: { type: Date, default: Date.now }
  }],
  spectators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    maxPlayers: { type: Number, default: 10 },
    questionsCount: { type: Number, default: 10 },
    timePerQuestion: { type: Number, default: 15 },
    category: String,
    difficulty: String,
    isPrivate: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  currentQuestion: { type: Number, default: 0 },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: Date,
  finishedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('GameRoom', gameRoomSchema);
