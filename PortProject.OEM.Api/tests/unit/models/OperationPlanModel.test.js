/**
 * Unit Tests for OperationPlanModel
 * 
 * Type: Functional Black-Box Testing with SUT = Mongoose Model
 * Goal: Test Mongoose schema validation, defaults, and constraints
 * Tool: Jest + mongodb-memory-server
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { OperationPlanModel } from '../../../src/infrastructure/models/OperationPlanModel.js';

describe('Unit Test - OperationPlanModel', () => {
  let mongoServer;

  // Setup: Start in-memory MongoDB before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // Cleanup: Close connection and stop server after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear database between tests
  afterEach(async () => {
    await OperationPlanModel.deleteMany({});
  });

  describe('Model Creation', () => {
    test('should create a valid operation plan with all required fields', async () => {
      const planData = {
        planId: 'PLAN-20260103-001',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        status: 'Confirmed'
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();

      expect(savedPlan._id).toBeDefined();
      expect(savedPlan.planId).toBe('PLAN-20260103-001');
      expect(savedPlan.date).toBe('2026-01-03');
      expect(savedPlan.algorithm).toBe('genetic');
      expect(savedPlan.createdBy).toBe('test@example.com');
      expect(savedPlan.status).toBe('Confirmed');
    });

    test('should create plan with genetic parameters', async () => {
      const planData = {
        planId: 'PLAN-20260103-002',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        geneticParams: {
          populationSize: 100,
          generations: 50,
          mutationRate: 0.1,
          desiredTimeSeconds: 30,
          craneMode: 'auto'
        }
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();

      expect(savedPlan.geneticParams.populationSize).toBe(100);
      expect(savedPlan.geneticParams.generations).toBe(50);
      expect(savedPlan.geneticParams.mutationRate).toBe(0.1);
      expect(savedPlan.geneticParams.desiredTimeSeconds).toBe(30);
      expect(savedPlan.geneticParams.craneMode).toBe('auto');
    });

    test('should create plan with metrics', async () => {
      const planData = {
        planId: 'PLAN-20260103-003',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        metrics: {
          totalDelay: 150,
          executionTimeMs: 5000
        }
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();

      expect(savedPlan.metrics.totalDelay).toBe(150);
      expect(savedPlan.metrics.executionTimeMs).toBe(5000);
    });

    test('should create plan with scheduled tasks', async () => {
      const planData = {
        planId: 'PLAN-20260103-004',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            resourceId: 'RES-001',
            staffId: 'STAFF-001',
            dockId: 'DOCK-001',
            vesselImo: 'IMO1234567',
            vesselVisitBusinessId: 'VVN-001',
            dockName: 'Dock A',
            resourceKind: 'Crane',
            staffShortName: 'John D.',
            startTime: new Date('2026-01-03T08:00:00Z'),
            endTime: new Date('2026-01-03T10:00:00Z'),
            loadingTime: 1.5,
            unloadingTime: 0.5
          }
        ]
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();

      expect(savedPlan.scheduledTasks).toHaveLength(1);
      expect(savedPlan.scheduledTasks[0].vesselVisitId).toBe('VV-001');
      expect(savedPlan.scheduledTasks[0].resourceId).toBe('RES-001');
      expect(savedPlan.scheduledTasks[0].vesselImo).toBe('IMO1234567');
      expect(savedPlan.scheduledTasks[0].loadingTime).toBe(1.5);
      expect(savedPlan.scheduledTasks[0].unloadingTime).toBe(0.5);
    });

    test('should create plan with change logs', async () => {
      const planData = {
        planId: 'PLAN-20260103-005',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        changeLogs: [
          {
            author: 'test@example.com',
            reason: 'Resource conflict',
            details: 'Moved Task X to Crane 2'
          }
        ]
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();

      expect(savedPlan.changeLogs).toHaveLength(1);
      expect(savedPlan.changeLogs[0].author).toBe('test@example.com');
      expect(savedPlan.changeLogs[0].reason).toBe('Resource conflict');
      expect(savedPlan.changeLogs[0].details).toBe('Moved Task X to Crane 2');
      expect(savedPlan.changeLogs[0].timestamp).toBeDefined();
    });

    test('should default status to Confirmed', async () => {
      const planData = {
        planId: 'PLAN-20260103-006',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();

      expect(savedPlan.status).toBe('Confirmed');
    });

    test('should set createdAt timestamp automatically', async () => {
      const beforeCreation = new Date();
      
      const planData = {
        planId: 'PLAN-20260103-007',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const plan = new OperationPlanModel(planData);
      const savedPlan = await plan.save();
      
      const afterCreation = new Date();

      expect(savedPlan.createdAt).toBeDefined();
      expect(savedPlan.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(savedPlan.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('Validation', () => {
    test('should fail validation when planId is missing', async () => {
      const planData = {
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const plan = new OperationPlanModel(planData);

      await expect(plan.save()).rejects.toThrow();
    });

    test('should fail validation when date is missing', async () => {
      const planData = {
        planId: 'PLAN-20260103-008',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const plan = new OperationPlanModel(planData);

      await expect(plan.save()).rejects.toThrow();
    });

    test('should fail validation when algorithm is missing', async () => {
      const planData = {
        planId: 'PLAN-20260103-009',
        date: '2026-01-03',
        createdBy: 'test@example.com'
      };

      const plan = new OperationPlanModel(planData);

      await expect(plan.save()).rejects.toThrow();
    });

    test('should fail validation when createdBy is missing', async () => {
      const planData = {
        planId: 'PLAN-20260103-010',
        date: '2026-01-03',
        algorithm: 'genetic'
      };

      const plan = new OperationPlanModel(planData);

      await expect(plan.save()).rejects.toThrow();
    });

    test('should fail validation with invalid status', async () => {
      const planData = {
        planId: 'PLAN-20260103-011',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        status: 'InvalidStatus'
      };

      const plan = new OperationPlanModel(planData);

      await expect(plan.save()).rejects.toThrow();
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['Draft', 'Confirmed', 'Executed'];
      
      for (let i = 0; i < validStatuses.length; i++) {
        const status = validStatuses[i];
        const planData = {
          planId: `PLAN-20260103-${100 + i}`,
          date: '2026-01-03',
          algorithm: 'genetic',
          createdBy: 'test@example.com',
          status: status
        };

        const plan = new OperationPlanModel(planData);
        const savedPlan = await plan.save();

        expect(savedPlan.status).toBe(status);
      }
    });

    test('should enforce unique planId constraint', async () => {
      const planData1 = {
        planId: 'PLAN-UNIQUE-001',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const planData2 = {
        planId: 'PLAN-UNIQUE-001',
        date: '2026-01-04',
        algorithm: 'heuristic',
        createdBy: 'test2@example.com'
      };

      const plan1 = new OperationPlanModel(planData1);
      await plan1.save();

      const plan2 = new OperationPlanModel(planData2);

      await expect(plan2.save()).rejects.toThrow();
    });
  });

  describe('Indexing', () => {
    test('should have index on planId', async () => {
      const indexes = await OperationPlanModel.collection.getIndexes();
      
      const planIdIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'planId')
      );
      
      expect(planIdIndex).toBeDefined();
    });

    test('should have index on date', async () => {
      const indexes = await OperationPlanModel.collection.getIndexes();
      
      const dateIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'date')
      );
      
      expect(dateIndex).toBeDefined();
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Create some test data
      await OperationPlanModel.create([
        {
          planId: 'PLAN-20260103-Q1',
          date: '2026-01-03',
          algorithm: 'genetic',
          createdBy: 'user1@example.com',
          status: 'Confirmed'
        },
        {
          planId: 'PLAN-20260104-Q2',
          date: '2026-01-04',
          algorithm: 'heuristic',
          createdBy: 'user2@example.com',
          status: 'Draft'
        },
        {
          planId: 'PLAN-20260105-Q3',
          date: '2026-01-05',
          algorithm: 'genetic',
          createdBy: 'user1@example.com',
          status: 'Executed'
        }
      ]);
    });

    test('should find plan by planId', async () => {
      const plan = await OperationPlanModel.findOne({ planId: 'PLAN-20260103-Q1' });
      
      expect(plan).toBeDefined();
      expect(plan.planId).toBe('PLAN-20260103-Q1');
      expect(plan.date).toBe('2026-01-03');
    });

    test('should find plans by date', async () => {
      const plans = await OperationPlanModel.find({ date: '2026-01-04' });
      
      expect(plans).toHaveLength(1);
      expect(plans[0].planId).toBe('PLAN-20260104-Q2');
    });

    test('should find plans by status', async () => {
      const plans = await OperationPlanModel.find({ status: 'Confirmed' });
      
      expect(plans.length).toBeGreaterThanOrEqual(1);
      expect(plans.every(p => p.status === 'Confirmed')).toBe(true);
    });

    test('should find plans by algorithm', async () => {
      const plans = await OperationPlanModel.find({ algorithm: 'genetic' });
      
      expect(plans.length).toBeGreaterThanOrEqual(2);
      expect(plans.every(p => p.algorithm === 'genetic')).toBe(true);
    });
  });
});

