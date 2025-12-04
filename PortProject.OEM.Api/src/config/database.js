import mongoose from 'mongoose';

/**
 * Database connection configuration
 * Equivalent to OemDbContext in C#
 */
export const connectDatabase = async (mongoUri) => {
  try {
    console.log('[Database] Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      // These options are good defaults
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ [Database] Connected to MongoDB successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ [Database] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  [Database] Disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[Database] Connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ [Database] Failed to connect:', error.message);
    throw error;
  }
};

/**
 * Check if database connection is active
 * Equivalent to CanConnectAsync() in C#
 */
export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

export default mongoose;

