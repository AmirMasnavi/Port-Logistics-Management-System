/**
 * Integration Tests for OperationPlanRepository
 * 
 * Type: Integration Testing with SUT = Repository + MongoDB
 * Goal: Test repository operations with real MongoDB (in-memory)
 * Tool: Jest + mongodb-memory-server
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { OperationPlanRepository } from '../../../src/infrastructure/repositories/OperationPlanRepository.js';

describe('Integration Test - OperationPlanRepository', () => {
  let mongoServer;
  let repository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    repository = new OperationPlanRepository();
  });

  afterEach(async () => {
    await repository.model.deleteMany({});
  });

  describe('create', () => {
    test('should create a new operation plan successfully', async () => {
      const planData = {
        planId: 'PLAN-20260103-001',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        status: 'Confirmed'
      };

      const result = await repository.create(planData);

      expect(result).toBeDefined();
      expect(result.planId).toBe('PLAN-20260103-001');
      expect(result.date).toBe('2026-01-03');
      expect(result.algorithm).toBe('genetic');
    });

    test('should create plan with scheduled tasks', async () => {
      const planData = {
        planId: 'PLAN-20260103-002',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            resourceId: 'RES-001',
            staffId: 'STAFF-001',
            dockId: 'DOCK-001',
            startTime: new Date('2026-01-03T08:00:00Z'),
            endTime: new Date('2026-01-03T10:00:00Z'),
            loadingTime: 1.5,
            unloadingTime: 0.5
          }
        ]
      };

      const result = await repository.create(planData);

      expect(result.scheduledTasks).toHaveLength(1);
      expect(result.scheduledTasks[0].vesselVisitId).toBe('VV-001');
    });

    test('should create plan with genetic parameters', async () => {
      const planData = {
        planId: 'PLAN-20260103-003',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        geneticParams: {
          populationSize: 100,
          generations: 50,
          mutationRate: 0.1
        }
      };

      const result = await repository.create(planData);

      expect(result.geneticParams.populationSize).toBe(100);
      expect(result.geneticParams.generations).toBe(50);
    });
  });

  describe('findById', () => {
    test('should find plan by planId', async () => {
      const planData = {
        planId: 'PLAN-20260103-004',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      await repository.create(planData);

      const result = await repository.findById('PLAN-20260103-004');

      expect(result).toBeDefined();
      expect(result.planId).toBe('PLAN-20260103-004');
    });

    test('should find plan by MongoDB ObjectId', async () => {
      const planData = {
        planId: 'PLAN-20260103-005',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const created = await repository.create(planData);
      const objectId = created._id.toString();

      const result = await repository.findById(objectId);

      expect(result).toBeDefined();
      expect(result.planId).toBe('PLAN-20260103-005');
    });

    test('should return null when plan not found', async () => {
      const result = await repository.findById('PLAN-NOTFOUND');

      expect(result).toBeNull();
    });

    test('should return null for invalid ObjectId format', async () => {
      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({
        planId: 'PLAN-20260103-006',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            resourceId: 'RES-001',
            startTime: new Date(),
            endTime: new Date()
          }
        ]
      });

      await repository.create({
        planId: 'PLAN-20260104-007',
        date: '2026-01-04',
        algorithm: 'heuristic',
        createdBy: 'test@example.com',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-002',
            resourceId: 'RES-002',
            startTime: new Date(),
            endTime: new Date()
          }
        ]
      });

      await repository.create({
        planId: 'PLAN-20260103-008',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test2@example.com',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            resourceId: 'RES-003',
            startTime: new Date(),
            endTime: new Date()
          }
        ]
      });
    });

    test('should return all plans when no filters provided', async () => {
      const result = await repository.findAll();

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should filter plans by date', async () => {
      const result = await repository.findAll({ date: '2026-01-03' });

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(plan => {
        expect(plan.date).toBe('2026-01-03');
      });
    });

    test('should filter plans by vesselVisitId', async () => {
      const result = await repository.findAll({ vesselVisitId: 'VV-001' });

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(plan => {
        const hasVessel = plan.scheduledTasks.some(
          task => task.vesselVisitId === 'VV-001'
        );
        expect(hasVessel).toBe(true);
      });
    });

    test('should combine date and vesselVisitId filters', async () => {
      const result = await repository.findAll({
        date: '2026-01-03',
        vesselVisitId: 'VV-001'
      });

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(plan => {
        expect(plan.date).toBe('2026-01-03');
        const hasVessel = plan.scheduledTasks.some(
          task => task.vesselVisitId === 'VV-001'
        );
        expect(hasVessel).toBe(true);
      });
    });

    test('should sort plans by createdAt descending', async () => {
      const result = await repository.findAll();

      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].createdAt);
        const next = new Date(result[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    test('should return lean objects (plain JavaScript)', async () => {
      const result = await repository.findAll();

      expect(result.length).toBeGreaterThan(0);
      // Lean objects don't have Mongoose document methods
      expect(result[0].save).toBeUndefined();
    });

    test('should return empty array when no plans match filters', async () => {
      const result = await repository.findAll({ date: '2026-12-31' });

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    test('should delete plan successfully', async () => {
      const planData = {
        planId: 'PLAN-20260103-009',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      await repository.create(planData);

      const result = await repository.delete('PLAN-20260103-009');

      expect(result).toBe(true);

      const deleted = await repository.findById('PLAN-20260103-009');
      expect(deleted).toBeNull();
    });

    test('should return false when deleting non-existent plan', async () => {
      const result = await repository.delete('PLAN-NOTFOUND');

      expect(result).toBe(false);
    });
  });

  describe('Complex Queries', () => {
    beforeEach(async () => {
      // Create complex test data
      await repository.create({
        planId: 'PLAN-COMPLEX-001',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        status: 'Confirmed',
        metrics: {
          totalDelay: 100,
          executionTimeMs: 5000
        },
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            resourceId: 'RES-001',
            dockId: 'DOCK-001',
            vesselImo: 'IMO1234567',
            startTime: new Date('2026-01-03T08:00:00Z'),
            endTime: new Date('2026-01-03T10:00:00Z'),
            loadingTime: 1.5,
            unloadingTime: 0.5
          },
          {
            vesselVisitId: 'VV-002',
            resourceId: 'RES-002',
            dockId: 'DOCK-002',
            vesselImo: 'IMO7654321',
            startTime: new Date('2026-01-03T10:00:00Z'),
            endTime: new Date('2026-01-03T12:00:00Z'),
            loadingTime: 1.0,
            unloadingTime: 1.0
          }
        ],
        changeLogs: [
          {
            author: 'test@example.com',
            reason: 'Resource conflict',
            details: 'Moved task to different crane'
          }
        ]
      });
    });

    test('should retrieve plan with all nested data', async () => {
      const result = await repository.findById('PLAN-COMPLEX-001');

      expect(result).toBeDefined();
      expect(result.scheduledTasks).toHaveLength(2);
      expect(result.metrics.totalDelay).toBe(100);
      expect(result.changeLogs).toHaveLength(1);
    });

    test('should find plan by vessel within scheduled tasks', async () => {
      const result = await repository.findAll({ vesselVisitId: 'VV-002' });

      expect(result.length).toBeGreaterThanOrEqual(1);
      const plan = result.find(p => p.planId === 'PLAN-COMPLEX-001');
      expect(plan).toBeDefined();
      expect(plan.scheduledTasks.some(t => t.vesselVisitId === 'VV-002')).toBe(true);
    });

    test('should preserve all data types correctly', async () => {
      const result = await repository.findById('PLAN-COMPLEX-001');

      expect(result.scheduledTasks[0].loadingTime).toBe(1.5);
      expect(result.scheduledTasks[0].startTime).toBeInstanceOf(Date);
      expect(result.metrics.totalDelay).toBe(100);
      expect(result.status).toBe('Confirmed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle plan with empty scheduledTasks array', async () => {
      const planData = {
        planId: 'PLAN-EMPTY-TASKS',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        scheduledTasks: []
      };

      const result = await repository.create(planData);

      expect(result.scheduledTasks).toEqual([]);
    });

    test('should handle plan with no geneticParams', async () => {
      const planData = {
        planId: 'PLAN-NO-PARAMS',
        date: '2026-01-03',
        algorithm: 'heuristic',
        createdBy: 'test@example.com'
      };

      const result = await repository.create(planData);

      expect(result.geneticParams).toBeUndefined();
    });

    test('should handle plan with no metrics', async () => {
      const planData = {
        planId: 'PLAN-NO-METRICS',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com'
      };

      const result = await repository.create(planData);

      expect(result.metrics).toBeUndefined();
    });

    test('should handle plan with very long date range in tasks', async () => {
      const planData = {
        planId: 'PLAN-LONG-RANGE',
        date: '2026-01-03',
        algorithm: 'genetic',
        createdBy: 'test@example.com',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            resourceId: 'RES-001',
            startTime: new Date('2026-01-03T00:00:00Z'),
            endTime: new Date('2026-01-03T23:59:59Z'),
            loadingTime: 12.0,
            unloadingTime: 12.0
          }
        ]
      };

      const result = await repository.create(planData);

      const duration = new Date(result.scheduledTasks[0].endTime) - 
                       new Date(result.scheduledTasks[0].startTime);
      const hours = duration / (1000 * 60 * 60);
      
      expect(hours).toBeCloseTo(24, 0);
    });
  });
});

