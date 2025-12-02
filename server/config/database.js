import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Atlas connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Make sure your IP is whitelisted in MongoDB Atlas');
    process.exit(1);
  }
};
