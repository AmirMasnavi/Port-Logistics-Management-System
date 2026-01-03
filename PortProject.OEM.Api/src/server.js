import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import { MasterDataGateway } from './gateways/masterDataGateway.js';
import { createOemTestRouter } from './controllers/oemTestController.js';
import { createVveRouter } from './controllers/vveController.js';
import { swaggerSpec } from './config/swagger.js';
import { createOperationPlanRouter } from './controllers/operationPlanController.js';
import {createIncidentTypeRouter} from "./controllers/incidentTypeController.js";
import {createIncidentRouter} from "./controllers/incidentController.js";
import { createComplementaryTaskCategoryRouter } from './controllers/complementaryTaskCategoriesController.js';
import { createComplementaryTaskRouter } from './controllers/complementaryTaskController.js';

// Load environment variables
dotenv.config();

// --- 1. CONFIGURATION ---
const PORT = process.env.PORT || 5274;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portsystem_oem';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'blueport-508e6';
const MASTER_DATA_API_URL = process.env.MASTER_DATA_API_URL || 'http://localhost:5273';
const MASTER_DATA_API_TOKEN = process.env.MASTER_DATA_API_TOKEN; // Optional auth token
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
];

console.log('[OEM STARTUP] ========================================');
console.log(`[OEM STARTUP] Port: ${PORT}`);
console.log(`[OEM STARTUP] MongoDB URI: ${MONGODB_URI}`);
console.log(`[OEM STARTUP] Firebase Project: ${FIREBASE_PROJECT_ID}`);
console.log(`[OEM STARTUP] Master Data API: ${MASTER_DATA_API_URL}`);
console.log(`[OEM STARTUP] Master Data Auth: ${MASTER_DATA_API_TOKEN ? '✅ Token configured' : '⚠️  No token (may fail if auth required)'}`);
console.log('[OEM STARTUP] ========================================');

// --- 2. CREATE EXPRESS APP ---
const app = express();

// --- 3. SECURITY & MIDDLEWARE ---
app.use(helmet()); // Security headers
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- 4. INITIALIZE SERVICES ---
let masterDataGateway;

try {
  // Initialize Firebase Admin SDK for authentication
  initializeFirebase(FIREBASE_PROJECT_ID);
  
  // Initialize Master Data Gateway for inter-module communication
  masterDataGateway = new MasterDataGateway(MASTER_DATA_API_URL, MASTER_DATA_API_TOKEN);
  
} catch (error) {
  console.error('[STARTUP ERROR] Failed to initialize services:', error);
  process.exit(1);
}

// --- 5. SWAGGER DOCUMENTATION ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OEM API Documentation',
}));

// --- 6. ROUTES ---
// Test routes
app.use('/api/oem', createOemTestRouter(masterDataGateway));
app.use('/api/vve', createVveRouter(masterDataGateway));
app.use('/api/plans', createOperationPlanRouter());
app.use('/api/incident-type', createIncidentTypeRouter(masterDataGateway));
app.use('/api/incidents', createIncidentRouter(masterDataGateway));
app.use('/api/complementary-task-categories', createComplementaryTaskCategoryRouter(masterDataGateway));
app.use('/api/complementary-tasks', createComplementaryTaskRouter());


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'OEM API - Operations & Execution Management',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs',
    endpoints: {
      ping: '/api/oem/ping',
      secure: '/api/oem/secure',
      checkVvn: '/api/oem/check-vvn/:id',
      checkDb: '/api/oem/check-db',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    documentation: '/api-docs',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// --- 7. START SERVER ---
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase(MONGODB_URI);
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ ========================================');
      console.log(`✅ OEM API Server is running on port ${PORT}`);
      console.log(`✅ API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`✅ Health Check: http://localhost:${PORT}/health`);
      console.log('✅ ========================================');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Export app for testing
export { app };

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
