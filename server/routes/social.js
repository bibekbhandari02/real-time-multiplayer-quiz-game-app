import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Send friend request
router.post('/friend-request', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    const user = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.friends.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already sent
    if (targetUser.friendRequests?.some(req => req.from.toString() === req.userId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request to target user
    if (!targetUser.friendRequests) targetUser.friendRequests = [];
    targetUser.friendRequests.push({
      from: req.userId,
      username: user.username,
      sentAt: new Date()
    });
    
    await targetUser.save();

    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/friend-request/accept', async (req, res) => {
  try {
    const { requesterId } = req.body;
    
    const user = await User.findById(req.userId);
    const requester = await User.findById(requesterId);
    
    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to friends list
    if (!user.friends.includes(requesterId)) {
      user.friends.push(requesterId);
    }
    if (!requester.friends.includes(req.userId)) {
      requester.friends.push(req.userId);
    }

    // Remove friend request
    user.friendRequests = user.friendRequests?.filter(
      req => req.from.toString() !== requesterId
    ) || [];
    
    await user.save();
    await requester.save();

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline friend request
router.post('/friend-request/decline', async (req, res) => {
  try {
    const { requesterId } = req.body;
    
    const user = await User.findById(req.userId);
    
    // Remove friend request
    user.friendRequests = user.friendRequests?.filter(
      req => req.from.toString() !== requesterId
    ) || [];
    
    await user.save();

    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friend requests
router.get('/friend-requests', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user.friendRequests || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
router.delete('/friend/:friendId', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friend = await User.findById(req.params.friendId);
    
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.friends = user.friends.filter(id => id.toString() !== req.params.friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== req.userId);
    
    await user.save();
    await friend.save();

    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friends list
router.get('/friends', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username level xp elo avatar lastActive');
    
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.userId }
    })
    .limit(20)
    .select('username level xp elo avatar');

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat messages with a friend
router.get('/messages/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const Message = (await import('../models/Message.js')).default;
    
    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { from: req.userId, to: friendId },
        { from: friendId, to: req.userId }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(100)
    .select('from to message createdAt');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message (backup, mainly saved via socket)
router.post('/messages', async (req, res) => {
  try {
    const { to, message } = req.body;
    const Message = (await import('../models/Message.js')).default;
    
    const newMessage = new Message({
      from: req.userId,
      to,
      message
    });
    
    await newMessage.save();
    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's current active room (only waiting rooms for invites)
router.get('/my-room', async (req, res) => {
  try {
    const GameRoom = (await import('../models/GameRoom.js')).default;
    
    // Only find rooms in "waiting" status - games that haven't started yet
    const room = await GameRoom.findOne({
      'players.userId': req.userId,
      status: 'waiting'
    }).select('roomCode status players settings');
    
    if (!room) {
      return res.status(404).json({ error: 'No active room found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
