// Global test setup for Jest

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5999';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.MASTER_DATA_API_URL = 'http://localhost:5273';

