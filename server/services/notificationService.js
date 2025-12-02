import Notification from '../models/Notification.js';

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Send notification to user
  async sendNotification(userId, notificationData) {
    try {
      const notification = new Notification({
        userId,
        ...notificationData
      });
      
      await notification.save();
      
      // Emit real-time notification via socket
      this.io.to(userId.toString()).emit('notification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Friend request notification
  async notifyFriendRequest(toUserId, fromUser) {
    return this.sendNotification(toUserId, {
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${fromUser.username} sent you a friend request`,
      icon: '👋',
      fromUser: fromUser._id,
      fromUsername: fromUser.username,
      actionUrl: '/friends',
      actionLabel: 'View',
      priority: 'medium'
    });
  }

  // Friend accept notification
  async notifyFriendAccept(toUserId, fromUser) {
    return this.sendNotification(toUserId, {
      type: 'friend_accept',
      title: 'Friend Request Accepted',
      message: `${fromUser.username} accepted your friend request`,
      icon: '🎉',
      fromUser: fromUser._id,
      fromUsername: fromUser.username,
      actionUrl: '/friends',
      actionLabel: 'Chat',
      priority: 'medium'
    });
  }

  // Game invite notification
  async notifyGameInvite(toUserId, fromUser, roomCode) {
    return this.sendNotification(toUserId, {
      type: 'game_invite',
      title: 'Game Invitation',
      message: `${fromUser.username} invited you to join a game`,
      icon: '🎮',
      fromUser: fromUser._id,
      fromUsername: fromUser.username,
      roomCode,
      actionUrl: `/game/${roomCode}`,
      actionLabel: 'Join Game',
      priority: 'high',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
  }

  // Achievement unlocked notification
  async notifyAchievement(userId, achievement) {
    return this.sendNotification(userId, {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You unlocked: ${achievement.name}`,
      icon: achievement.icon || '🏆',
      achievementKey: achievement.key,
      actionUrl: '/achievements',
      actionLabel: 'View',
      priority: 'high'
    });
  }

  // Game starting notification
  async notifyGameStart(userId, roomCode) {
    return this.sendNotification(userId, {
      type: 'game_start',
      title: 'Game Starting',
      message: 'Your game is about to start!',
      icon: '🚀',
      roomCode,
      actionUrl: `/game/${roomCode}`,
      actionLabel: 'Join',
      priority: 'high',
      expiresAt: new Date(Date.now() + 30 * 1000) // 30 seconds
    });
  }

  // New message notification
  async notifyMessage(toUserId, fromUser, messagePreview) {
    return this.sendNotification(toUserId, {
      type: 'message',
      title: 'New Message',
      message: `${fromUser.username}: ${messagePreview}`,
      icon: '💬',
      fromUser: fromUser._id,
      fromUsername: fromUser.username,
      actionUrl: '/friends',
      actionLabel: 'Reply',
      priority: 'low'
    });
  }

  // System notification
  async notifySystem(userId, title, message, options = {}) {
    return this.sendNotification(userId, {
      type: 'system',
      title,
      message,
      icon: options.icon || '📢',
      priority: options.priority || 'medium',
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel
    });
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  // Mark all as read
  async markAllAsRead(userId) {
    return Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isDeleted: true },
      { new: true }
    );
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const { limit = 20, skip = 0, unreadOnly = false } = options;
    
    const query = { userId, isDeleted: false };
    if (unreadOnly) {
      query.isRead = false;
    }

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  // Get unread count
  async getUnreadCount(userId) {
    return Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false
    });
  }
}

export default NotificationService;
