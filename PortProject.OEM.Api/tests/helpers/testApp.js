/**
 * Test App Factory
 * Creates a configured Express app instance for API testing
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

// Create test router (copy of controller logic but with mock auth)
const createTestRouter = () => {
    const router = Router();
    
    // Mock Gateway
    const mockGateway = {
        getResourceById: async (id) => ({ id, kind: 'Crane' }), // Always return a dummy resource
        getStaffById: async (id) => ({ id, name: 'John Doe' }),
        getAllResources: async () => [],
        getAllStaff: async () => []
    };

    const service = new OperationPlanService(undefined, mockGateway);

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

    router.patch('/:planId/tasks/:taskId', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const { planId, taskId } = req.params;
            const updateData = req.body;
            const userEmail = req.user?.email || 'unknown';

            const result = await service.updateTask(planId, taskId, updateData, userEmail);
            
            // result.plan is already a DTO from the service mapper
            res.json({
                success: true,
                message: 'Task updated successfully',
                data: result.plan,
                warnings: result.warnings || []
            });
        } catch (error) {
            console.error('[TEST APP ERROR] PATCH /api/plans/:planId/tasks/:taskId:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update task',
                error: error.message,
                stack: process.env.NODE_ENV === 'test' ? error.stack : undefined
            });
        }
    });

    return router;
};

/**
 * Creates a minimal Express app for testing
 * without starting the server or connecting to external services
 */
export const createTestApp = () => {
  const app = express();

  // Security & Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes with test auth
  app.use('/api/plans', createTestRouter());

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

