import mongoose from 'mongoose';

const powerupSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  type: {
    type: String,
    enum: ['time_freeze', 'fifty_fifty', 'skip_question', 'double_points', 'hint'],
    required: true
  },
  cost: { type: Number, required: true }, // Cost in coins
  duration: { type: Number }, // Duration in seconds (for time-based powerups)
  usesPerGame: { type: Number, default: 1 }, // Max uses per game
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Powerup', powerupSchema);
