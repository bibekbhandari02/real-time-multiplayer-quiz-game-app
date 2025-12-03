import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import adminRoutes from './routes/admin.js';
import matchmakingRoutes, { setIoInstance } from './routes/matchmaking.js';
import achievementsRoutes from './routes/achievements.js';
import aiRoutes from './routes/ai.js';
import leaderboardRoutes from './routes/leaderboard.js';
import socialRoutes from './routes/social.js';
import notificationRoutes from './routes/notifications.js';
import powerupRoutes from './routes/powerups.js';
import { setupSocketHandlers } from './sockets/index.js';
import NotificationService from './services/notificationService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Initialize notification service
const notificationService = new NotificationService(io);
export { notificationService };

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/powerups', powerupRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'client/dist' });
  });
}

// Socket.IO setup
setupSocketHandlers(io);

// Set io instance for matchmaking
setIoInstance(io);

// Database connections
await connectDB();
await connectRedis();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 WebSocket server ready`);
});
