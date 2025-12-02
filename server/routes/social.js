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

    user.friends.push(targetUserId);
    targetUser.friends.push(req.userId);
    
    await user.save();
    await targetUser.save();

    res.json({ success: true, message: 'Friend added' });
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

export default router;
