import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.model('Achievement', achievementSchema);
