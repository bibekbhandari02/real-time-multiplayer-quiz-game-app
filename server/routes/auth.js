import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required',
        field: !username ? 'username' : !email ? 'email' : 'password'
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be between 3 and 20 characters',
        field: 'username'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address',
        field: 'email'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long',
        field: 'password'
      });
    }

    // Check for existing user
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'This email is already registered',
        field: 'email'
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false,
        message: 'This username is already taken',
        field: 'username'
      });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        xp: user.xp, 
        level: user.level,
        elo: user.elo,
        coins: user.coins,
        stats: user.stats,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required',
        field: !email ? 'email' : 'password'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address',
        field: 'email'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'No account found with this email',
        field: 'email'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Incorrect password',
        field: 'password'
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        xp: user.xp, 
        level: user.level, 
        elo: user.elo,
        coins: user.coins,
        stats: user.stats,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found'
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        elo: user.elo,
        coins: user.coins,
        stats: user.stats,
        badges: user.badges
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again'
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
});

export default router;
