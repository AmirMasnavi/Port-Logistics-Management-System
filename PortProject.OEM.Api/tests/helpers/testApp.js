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
import { ComplementaryTaskService } from '../../src/services/complementaryTaskService.js';
import { CreateComplementaryTaskDto, UpdateComplementaryTaskDto } from '../../src/application/dtos/ComplementaryTaskDto.js';
import { ComplementaryTaskMapper } from '../../src/application/mappers/ComplementaryTaskMapper.js';
import { ComplementaryTaskCategoryService } from '../../src/services/complementaryTaskCategoriesService.js';
import { CreateComplementaryTaskCategoryDto, UpdateComplementaryTaskCategoryDto } from '../../src/application/dtos/ComplementaryTaskCategoriesDto.js';
import { ComplementaryTaskCategoryMapper } from '../../src/application/mappers/ComplementaryTaskCategoriesMapper.js';

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

// Create test router for complementary tasks
const createComplementaryTaskTestRouter = () => {
    const router = Router();
    const service = new ComplementaryTaskService();

    // GET all tasks
    router.get('/', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const filters = {
                vveId: req.query.vveId,
                categoryId: req.query.categoryId,
                status: req.query.status,
                suspendsOperations: req.query.suspendsOperations !== undefined 
                    ? req.query.suspendsOperations === 'true' 
                    : undefined,
                responsibleTeam: req.query.responsibleTeam,
                startTimeFrom: req.query.startTimeFrom,
                startTimeTo: req.query.startTimeTo,
            };
            const tasks = await service.searchTasks(filters);
            const dtos = ComplementaryTaskMapper.toListDto(tasks);
            res.json({ success: true, count: dtos.length, data: dtos });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // GET impacting tasks
    router.get('/impacting', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const tasks = await service.getOngoingImpactingTasks();
            const dtos = ComplementaryTaskMapper.toListDto(tasks);
            res.json({ success: true, count: dtos.length, data: dtos });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // POST create task
    router.post('/', mockVerifyFirebaseToken, async (req, res) => {
        try {
            // Basic validation
            const { categoryId, vveId, responsibleTeam, startTime, status } = req.body;
            
            if (!categoryId || !vveId || !responsibleTeam || !startTime) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'Missing required fields' }] 
                });
            }

            // Validate status if provided
            if (status && !['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(status)) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'Invalid status' }] 
                });
            }
            
            const dto = new CreateComplementaryTaskDto(req.body);
            const created = await service.createTask(dto, req.user?.uid || 'system');
            const data = ComplementaryTaskMapper.toDto(created);
            res.status(201).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // GET by ID
    router.get('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const task = await service.getTaskById(req.params.id);
            const data = ComplementaryTaskMapper.toDto(task);
            res.json({ success: true, data });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // PUT update task
    router.put('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            // Validate status if provided
            if (req.body.status && !['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(req.body.status)) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'Invalid status' }] 
                });
            }
            
            const dto = new UpdateComplementaryTaskDto(req.body);
            const updated = await service.updateTask(req.params.id, dto, req.user?.uid || 'system');
            const data = ComplementaryTaskMapper.toDto(updated);
            res.json({ success: true, data });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // DELETE task
    router.delete('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const deleted = await service.deleteTask(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Not found', message: 'Task could not be deleted' });
            }
            res.json({ success: true, message: 'Task deleted successfully' });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // GET by VVE
    router.get('/vve/:vveId', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const tasks = await service.getTasksByVveId(req.params.vveId);
            const dtos = ComplementaryTaskMapper.toListDto(tasks);
            res.json({ success: true, count: dtos.length, data: dtos });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    return router;
};

// Create test router for complementary task categories
const createComplementaryTaskCategoryTestRouter = () => {
    const router = Router();
    const service = new ComplementaryTaskCategoryService();

    // GET all categories
    router.get('/', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const filters = {
                code: req.query.code,
                nameContains: req.query.nameContains,
                active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
                defaultDurationMinutes: req.query.defaultDurationMinutes !== undefined 
                    ? parseInt(req.query.defaultDurationMinutes, 10) 
                    : undefined,
                expectedImpactMinutes: req.query.expectedImpactMinutes !== undefined 
                    ? parseInt(req.query.expectedImpactMinutes, 10) 
                    : undefined,
                group: req.query.group,
            };

            // Validate numeric filters
            if (req.query.defaultDurationMinutes !== undefined && isNaN(filters.defaultDurationMinutes)) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'Invalid defaultDurationMinutes parameter' }] 
                });
            }
            if (req.query.expectedImpactMinutes !== undefined && isNaN(filters.expectedImpactMinutes)) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'Invalid expectedImpactMinutes parameter' }] 
                });
            }

            const categories = await service.searchCategories(filters);
            const dtos = ComplementaryTaskCategoryMapper.toListDto(categories);
            res.json({ success: true, count: dtos.length, data: dtos });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // POST create category
    router.post('/', mockVerifyFirebaseToken, async (req, res) => {
        try {
            // Basic validation
            const { code, name, defaultDurationMinutes, expectedImpactMinutes } = req.body;
            
            if (!code || !name) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'Missing required fields: code and name are required' }] 
                });
            }

            // Validate numeric fields
            if (defaultDurationMinutes !== undefined && defaultDurationMinutes !== null && defaultDurationMinutes < 0) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'defaultDurationMinutes must be non-negative' }] 
                });
            }
            if (expectedImpactMinutes !== undefined && expectedImpactMinutes !== null && expectedImpactMinutes < 0) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'expectedImpactMinutes must be non-negative' }] 
                });
            }
            
            const dto = new CreateComplementaryTaskCategoryDto(req.body);
            const created = await service.createCategory(dto, req.user?.uid || 'system');
            const data = ComplementaryTaskCategoryMapper.toDto(created);
            res.status(201).json({ success: true, data });
        } catch (error) {
            if (String(error.message || '').toLowerCase().includes('already exists')) {
                return res.status(409).json({ success: false, error: 'Conflict', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // GET by ID
    router.get('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const category = await service.getCategoryById(req.params.id);
            const data = ComplementaryTaskCategoryMapper.toDto(category);
            res.json({ success: true, data });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // PATCH update category
    router.patch('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            // Validate numeric fields if provided
            if (req.body.defaultDurationMinutes !== undefined && req.body.defaultDurationMinutes !== null && req.body.defaultDurationMinutes < 0) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'defaultDurationMinutes must be non-negative' }] 
                });
            }
            if (req.body.expectedImpactMinutes !== undefined && req.body.expectedImpactMinutes !== null && req.body.expectedImpactMinutes < 0) {
                return res.status(400).json({ 
                    success: false, 
                    errors: [{ msg: 'expectedImpactMinutes must be non-negative' }] 
                });
            }
            
            const dto = new UpdateComplementaryTaskCategoryDto(req.body);
            const updated = await service.updateCategory(req.params.id, dto, req.user?.uid || 'system');
            const data = ComplementaryTaskCategoryMapper.toDto(updated);
            res.json({ success: true, data });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // PUT update category
    router.put('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            const dto = new UpdateComplementaryTaskCategoryDto(req.body);
            const updated = await service.updateCategory(req.params.id, dto, req.user?.uid || 'system');
            const data = ComplementaryTaskCategoryMapper.toDto(updated);
            res.json({ success: true, data });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
        }
    });

    // DELETE category
    router.delete('/:id', mockVerifyFirebaseToken, async (req, res) => {
        try {
            await service.deleteCategory(req.params.id, req.user?.uid || 'system');
            res.status(204).send();
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, error: 'Not found', message: error.message });
            }
            res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
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
  app.use('/api/complementary-tasks', createComplementaryTaskTestRouter());
  app.use('/api/complementary-task-categories', createComplementaryTaskCategoryTestRouter());

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

