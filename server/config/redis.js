import { createClient } from 'redis';

let redisClient;

export const connectRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      console.log('ℹ️  Redis URL not configured, skipping Redis connection');
      return;
    }

    redisClient = createClient({ url: process.env.REDIS_URL });
    
    redisClient.on('error', (err) => console.error('Redis error:', err));
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    console.log('⚠️  Running without Redis (limited scalability)');
  }
};

export const getRedisClient = () => redisClient;
