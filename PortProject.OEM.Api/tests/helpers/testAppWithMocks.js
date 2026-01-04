/**
 * Test App Factory with Mocked Gateway
 * Creates a configured Express app instance for API testing with mocked external dependencies
 * This version specifically mocks the MasterDataGateway for testing the /missing endpoint
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Router } from 'express';
import { OperationPlanService } from '../../src/services/operationPlanService.js';
import { CreateOperationPlanDto } from '../../src/application/dtos/OperationPlanDto.js';
import { OperationPlanMapper } from '../../src/application/mappers/OperationPlanMapper.js';

// Mock Firebase middleware for testing
const mockVerifyFirebaseToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (token === 'mock-invalid-token') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Set mock user for valid tokens
  req.user = {
    uid: 'test-user-123',
    email: 'testuser@example.com',
    email_verified: true
  };
  next();
};

// Create mock MasterDataGateway
const createMockGateway = (mockPendingVVNs) => {
    return {
        getPendingVisitsAsync: async (date) => {
            console.log(`[MockGateway] Returning ${mockPendingVVNs.length} pending VVNs for date: ${date}`);
            return mockPendingVVNs;
        },
        setAuthToken: (token) => {
            console.log(`[MockGateway] Auth token set`);
        },
        getResourceById: async (id) => ({ id, kind: 'Crane' }),
        getStaffById: async (id) => ({ id, name: 'Mock Staff' }),
        getAllResources: async () => [],
        getAllStaff: async () => []
    };
};

// Create test router with mocked gateway
const createTestRouterWithMocks = (mockPendingVVNs) => {
    const router = Router();
    const mockGateway = createMockGateway(mockPendingVVNs);
    
    // Create service with mock gateway
    const service = new OperationPlanService();
    // Override the gateway with our mock
    service.masterDataGateway = mockGateway;

    // GET /api/plans - List plans
    router.get('/', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const filter = req.query.date ? { date: req.query.date } : {};
            const plans = await service.getAllPlans(filter);
            const dtos = plans.map(plan => OperationPlanMapper.toResponseDto(plan));
            res.json({
                success: true,
                count: dtos.length,
                data: dtos
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve plans',
                error: error.message
            });
        }
    });

    // GET /api/plans/missing - Get missing plans
    router.get('/missing', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const { date } = req.query;
            
            if (!date) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date parameter is required' 
                });
            }
            
            console.log(`[TEST API] Fetching missing plans for date: ${date}`);
            
            // Extract the Firebase token from the request headers
            const authToken = req.headers.authorization?.replace('Bearer ', '');
            
            const result = await service.getMissingPlans(date, authToken);
            
            res.json({
                success: true,
                date: date,
                missingCount: result.missingVVNs.length,
                hasExistingPlans: result.existingPlans.length > 0,
                data: {
                    missingVVNs: result.missingVVNs,
                    existingPlans: result.existingPlans
                }
            });
        } catch (error) {
            console.error('[TEST API ERROR] GET /api/plans/missing:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

    // POST /api/plans - Create plan
    router.post('/', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const dto = new CreateOperationPlanDto(req.body);
            const validation = dto.validate();
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validation.errors
                });
            }

            const userEmail = req.user?.email || 'unknown';
            const savedPlan = await service.createPlan(dto, userEmail);
            const responseDto = OperationPlanMapper.toResponseDto(savedPlan);

            res.status(201).json({
                success: true,
                message: 'Operation Plan saved successfully',
                data: responseDto
            });
        } catch (error) {
            console.error('[TEST APP ERROR] POST /api/plans:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create plan',
                error: error.message,
                stack: process.env.NODE_ENV === 'test' ? error.stack : undefined
            });
        }
    });

    // DELETE /api/plans/:id - Delete plan
    router.delete('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const planId = req.params.id;
            await service.deletePlan(planId);
            res.json({
                success: true,
                message: `Plan ${planId} deleted successfully`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete plan',
                error: error.message
            });
        }
    });

    return router;
};

/**
 * Creates a minimal Express app for testing with mocked gateway
 * @param {Array} mockPendingVVNs - Array of mock VVN objects to return from gateway
 * @returns {Express.Application} Configured Express app
 */
export const createTestAppWithMocks = (mockPendingVVNs = []) => {
  const app = express();

  // Security & Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes with test auth and mocked gateway
  app.use('/api/plans', createTestRouterWithMocks(mockPendingVVNs));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('[TEST ERROR]', err);
    res.status(err.status || 500).json({
      error: err.name || 'Internal Server Error',
      message: err.message,
    });
  });

  return app;
};

