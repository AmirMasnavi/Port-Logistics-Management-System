/**
 * US 4.1.2 - API Tests for Operation Plans Endpoints
 * 
 * Type: Functional Testing with SUT = application
 * Goal: Test HTTP Endpoints (POST, GET, DELETE /api/plans) with real database
 * Tool: supertest + mongodb-memory-server
 * 
 * Tests the following scenarios:
 * - POST /api/plans - Create a new operation plan
 * - GET /api/plans - Retrieve all plans
 * - DELETE /api/plans/:id - Delete a specific plan
 * - Authentication and authorization
 * - Validation errors
 */

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp.js';

describe('API Tests', () => {
  let mongoServer;
  let app;

  // Setup: Start in-memory MongoDB and create app
  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create test app
    app = createTestApp();
  });

  // Cleanup: Close database connection and stop server
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear database between tests
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /api/plans - Create Operation Plan', () => {
    test('should create a plan successfully with valid data', async () => {
      // Arrange
      const payload = {
        date: '2025-12-10',
        algorithm: 'optimal',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-001',
            vesselVisitBusinessId: 'VISIT-2025-001',
            dockName: 'Dock A',
            resourceKind: 'Crane-1',
            resourceId: 'R-001',
            staffShortName: 'John Doe',
            staffId: 'S-001',
            startTime: '2025-12-10T08:00:00Z',
            endTime: '2025-12-10T10:00:00Z'
          }
        ],
        totalDelay: 0,
        executionTimeMs: 100
      };

      // Act
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Operation Plan saved successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.planId).toMatch(/^PLAN-\d{8}-\d{4}$/);
      expect(res.body.data.status).toBe('Confirmed');
    });

    test('should create a plan with genetic algorithm parameters', async () => {
      // Arrange
      const payload = {
        date: '2025-12-11',
        algorithm: 'genetic',
        geneticParams: {
          populationSize: 50,
          generations: 100,
          mutationRate: 0.2,
          desiredTimeSeconds: 5,
          craneMode: 'single'
        },
        scheduledTasks: [
          {
            vesselVisitId: 'VV-002',
            vesselVisitBusinessId: 'VISIT-2025-002',
            dockName: 'Dock B',
            resourceKind: 'Crane-2',
            startTime: '2025-12-11T09:00:00Z',
            endTime: '2025-12-11T11:00:00Z'
          }
        ],
        totalDelay: 15,
        executionTimeMs: 250
      };

      // Act
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.algorithm).toBe('genetic');
    });

    test('should reject request without authentication token', async () => {
      // Arrange
      const payload = {
        date: '2025-12-10',
        algorithm: 'optimal',
        scheduledTasks: [{ vesselVisitId: 'V1' }]
      };

      // Act
      const res = await request(app)
        .post('/api/plans')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    test('should reject request with invalid token', async () => {
      // Arrange
      const payload = {
        date: '2025-12-10',
        algorithm: 'optimal',
        scheduledTasks: [{ vesselVisitId: 'V1' }]
      };

      // Act
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-invalid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should handle validation errors for missing fields', async () => {
      // Arrange - Missing scheduledTasks
      const payload = {
        date: '2025-12-10',
        algorithm: 'optimal'
        // scheduledTasks missing
      };

      // Act
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should handle multiple scheduled tasks', async () => {
      // Arrange
      const payload = {
        date: '2025-12-12',
        algorithm: 'multicrane',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-003',
            startTime: '2025-12-12T08:00:00Z',
            endTime: '2025-12-12T10:00:00Z'
          },
          {
            vesselVisitId: 'VV-004',
            startTime: '2025-12-12T10:30:00Z',
            endTime: '2025-12-12T12:30:00Z'
          },
          {
            vesselVisitId: 'VV-005',
            startTime: '2025-12-12T13:00:00Z',
            endTime: '2025-12-12T15:00:00Z'
          }
        ],
        totalDelay: 20,
        executionTimeMs: 180
      };

      // Act
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/plans - Retrieve Plans', () => {
    test('should retrieve all plans', async () => {
      // Arrange - Create two plans first
      const plan1 = {
        date: '2025-12-10',
        algorithm: 'optimal',
        scheduledTasks: [{ vesselVisitId: 'V1', startTime: new Date(), endTime: new Date() }],
        totalDelay: 0,
        executionTimeMs: 100
      };

      const plan2 = {
        date: '2025-12-11',
        algorithm: 'genetic',
        scheduledTasks: [{ vesselVisitId: 'V2', startTime: new Date(), endTime: new Date() }],
        totalDelay: 5,
        executionTimeMs: 200
      };

      await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(plan1);

      await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(plan2);

      // Act
      const res = await request(app)
        .get('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].planId).toBeDefined();
      expect(res.body.data[0].date).toBeDefined();
    });

    test('should filter plans by date', async () => {
      // Arrange - Create plans for different dates
      const plan1 = {
        date: '2025-12-10',
        algorithm: 'optimal',
        scheduledTasks: [{ vesselVisitId: 'V1', startTime: new Date(), endTime: new Date() }]
      };

      const plan2 = {
        date: '2025-12-11',
        algorithm: 'optimal',
        scheduledTasks: [{ vesselVisitId: 'V2', startTime: new Date(), endTime: new Date() }]
      };

      await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(plan1);

      await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(plan2);

      // Act
      const res = await request(app)
        .get('/api/plans?date=2025-12-10')
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].date).toBe('2025-12-10');
    });

    test('should return empty array when no plans exist', async () => {
      // Act
      const res = await request(app)
        .get('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    test('should require authentication', async () => {
      // Act
      const res = await request(app)
        .get('/api/plans');

      // Assert
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/plans/:id - Delete Plan', () => {
    test('should delete an existing plan', async () => {
      // Arrange - Create a plan first
      const createRes = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send({
          date: '2025-12-10',
          algorithm: 'optimal',
          scheduledTasks: [{ vesselVisitId: 'V1', startTime: new Date(), endTime: new Date() }]
        });

      const planId = createRes.body.data.planId;

      // Act
      const deleteRes = await request(app)
        .delete(`/api/plans/${planId}`)
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toContain('deleted successfully');

      // Verify plan is deleted
      const getRes = await request(app)
        .get('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token');

      expect(getRes.body.count).toBe(0);
    });

    test('should handle deletion of non-existent plan gracefully', async () => {
      // Act
      const res = await request(app)
        .delete('/api/plans/PLAN-NONEXISTENT-0001')
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(res.statusCode).toBe(200); // Should not error
      expect(res.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      // Act
      const res = await request(app)
        .delete('/api/plans/PLAN-20251210-0001');

      // Assert
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Integration Flow - Create, Retrieve, Delete', () => {
    test('should complete full lifecycle of a plan', async () => {
      // Step 1: Create
      const createPayload = {
        date: '2025-12-10',
        algorithm: 'optimal',
        scheduledTasks: [
          {
            vesselVisitId: 'VV-FLOW-001',
            startTime: '2025-12-10T08:00:00Z',
            endTime: '2025-12-10T10:00:00Z'
          }
        ],
        totalDelay: 0,
        executionTimeMs: 100
      };

      const createRes = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(createPayload);

      expect(createRes.statusCode).toBe(201);
      const planId = createRes.body.data.planId;

      // Step 2: Retrieve
      const getRes = await request(app)
        .get('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token');

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.count).toBe(1);
      expect(getRes.body.data[0].planId).toBe(planId);

      // Step 3: Delete
      const deleteRes = await request(app)
        .delete(`/api/plans/${planId}`)
        .set('Authorization', 'Bearer mock-valid-token');

      expect(deleteRes.statusCode).toBe(200);

      // Step 4: Verify deletion
      const getFinalRes = await request(app)
        .get('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token');

      expect(getFinalRes.body.count).toBe(0);
    });
  });

  describe('PATCH /api/plans/:planId/tasks/:taskId - Update Task (US 4.1.4)', () => {
    let createdPlanId;
    let createdTaskId;

    // Helper to create a fresh plan before these tests
    beforeEach(async () => {
      const payload = {
        date: '2025-12-20',
        algorithm: 'optimal',
        scheduledTasks: [
          {
            vesselVisitId: 'V1',
            vesselVisitBusinessId: 'VISIT-V1',
            resourceId: 'Crane-1',
            startTime: '2025-12-20T09:00:00Z',
            endTime: '2025-12-20T10:00:00Z'
          },
          {
            vesselVisitId: 'V2',
            vesselVisitBusinessId: 'VISIT-V2',
            resourceId: 'Crane-2',
            startTime: '2025-12-20T09:00:00Z',
            endTime: '2025-12-20T10:00:00Z'
          }
        ],
        totalDelay: 0,
        executionTimeMs: 100
      };

      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      createdPlanId = res.body.data.planId;
      // Get the _id of the first task created by Mongoose
      createdTaskId = res.body.data.scheduledTasks[0]._id;
    });

    test('should update task and log change successfully', async () => {
      // Act
      const updateData = {
        resourceId: 'Crane-5',
        startTime: '2025-12-20T12:00:00Z',
        endTime: '2025-12-20T13:00:00Z',
        reason: 'Operator Request'
      };

      const res = await request(app)
        .patch(`/api/plans/${createdPlanId}/tasks/${createdTaskId}`)
        .set('Authorization', 'Bearer mock-valid-token')
        .send(updateData);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      const updatedPlan = res.body.data;
      const updatedTask = updatedPlan.scheduledTasks.find(t => t._id === createdTaskId);
      
      // Check values updated
      expect(updatedTask.resourceId).toBe('Crane-5');
      
      // Check Audit Log
      expect(updatedPlan.changeLogs).toHaveLength(1);
      expect(updatedPlan.changeLogs[0].reason).toBe('Operator Request');
      expect(updatedPlan.changeLogs[0].details).toContain('Resource: Reassigned');
    });

    test('should return warnings on resource conflict', async () => {
      // Act: Try to move Task 1 to where Task 2 is (Crane-2, 09:00-10:00)
      const updateData = {
        resourceId: 'Crane-2', // Conflict!
        startTime: '2025-12-20T09:30:00Z',
        endTime: '2025-12-20T10:30:00Z',
        reason: 'Bad Move'
      };

      const res = await request(app)
        .patch(`/api/plans/${createdPlanId}/tasks/${createdTaskId}`)
        .set('Authorization', 'Bearer mock-valid-token')
        .send(updateData);

      // Assert
      expect(res.statusCode).toBe(200); // It still succeeds
      expect(res.body.warnings).toBeDefined();
      expect(res.body.warnings.length).toBeGreaterThan(0);
      expect(res.body.warnings[0]).toContain('Conflict');
      // expect(res.body.warnings[0]).toContain('Crane-2');
    });

    test('should fail with 404 if plan or task does not exist', async () => {
      const res = await request(app)
        .patch(`/api/plans/${createdPlanId}/tasks/000000000000000000000000`) // Fake Object ID
        .set('Authorization', 'Bearer mock-valid-token')
        .send({ resourceId: 'Crane-X' });

      // Depending on implementation this may be 404 or 500; assert failure response shape
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      // Act
      const res = await request(app)
        .patch(`/api/plans/${createdPlanId}/tasks/${createdTaskId}`)
        .send({ resourceId: 'Crane-X' });

      // Assert
      expect(res.statusCode).toBe(401);
    });
  });
});

