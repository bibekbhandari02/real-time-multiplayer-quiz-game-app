import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['friend_request', 'friend_accept', 'game_invite', 'achievement', 'game_start', 'message', 'system'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '🔔' },
  
  // Related data
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromUsername: { type: String },
  roomCode: { type: String },
  achievementKey: { type: String },
  
  // Action data
  actionUrl: { type: String },
  actionLabel: { type: String },
  
  // Status
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  
  // Metadata
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  expiresAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Notification', notificationSchema);
