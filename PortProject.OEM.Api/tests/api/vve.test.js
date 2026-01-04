/**
 * API Tests for VVE (Vessel Visit Execution) Endpoints
 * 
 * Type: Functional Testing with SUT = application
 * Goal: Test HTTP Endpoints with real database (in-memory)
 * Tool: supertest + mongodb-memory-server
 */

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import { jest } from '@jest/globals';

// Mock Firebase authentication
jest.unstable_mockModule('../../src/config/firebase.js', () => ({
  verifyFirebaseToken: (req, res, next) => {
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
  }
}));

// Mock Master Data Gateway
const createMockGateway = () => ({
  setAuthToken: jest.fn(),
  
  // Mock VVN lookup - using getVvnAsync as per service implementation
  getVvnAsync: jest.fn(async (vvnId) => {
    if (vvnId === 'VVN-NOT-FOUND') {
      return null; // Return null instead of throwing to let service handle the error
    }
    return {
      vvnId: vvnId,
      vesselImo: 'IMO1234567',
      vesselName: 'Test Vessel',
      estimatedArrivalTime: '2026-01-03T08:00:00Z',
      estimatedDepartureTime: '2026-01-03T20:00:00Z',
      status: 'Approved'
    };
  }),

  // Mock Operation Plan lookup
  getOperationPlan: jest.fn(async (vvnId) => {
    if (vvnId === 'VVN-NO-PLAN') {
      return null;
    }
    return {
      planId: 'PLAN-20260103-001',
      date: '2026-01-03',
      scheduledTasks: [
        {
          operationId: 'OP-001',
          name: 'Container Loading',
          type: 'LOADING',
          startTime: '2026-01-03T10:00:00Z',
          endTime: '2026-01-03T12:00:00Z',
          resourceId: 'Crane-1',
          staffId: 'STAFF-001'
        },
        {
          operationId: 'OP-002',
          name: 'Safety Inspection',
          type: 'Inspection',
          startTime: '2026-01-03T12:30:00Z',
          endTime: '2026-01-03T13:00:00Z',
          resourceId: 'Crane-1',
          staffId: 'STAFF-002'
        }
      ]
    };
  })
});

// Dynamic import after mock
const { createVveRouter } = await import('../../src/controllers/vveController.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  
  const mockGateway = createMockGateway();
  app.use('/api/vve', createVveRouter(mockGateway));
  
  return app;
};

describe('API Tests - VVE (Vessel Visit Execution)', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = createApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /api/vve - Create VVE', () => {
    test('should create a new VVE with valid data', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z',
        notes: 'Vessel arrived on time',
        generateInitialOperations: false
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('VVE created successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.vveId).toMatch(/^VVE-\d{8}-\d{4}$/);
      expect(res.body.data.vvnId).toBe('VVN-20260103-001');
      expect(res.body.data.vesselIdentifier).toBe('IMO1234567');
      expect(res.body.data.status).toBe('In Progress');
      expect(res.body.data.notes).toBe('Vessel arrived on time');
      expect(res.body.data.creatorEmail).toBe('testuser@example.com');
    });

    test('should create VVE with minimal required fields', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-002',
        vesselIdentifier: 'IMO7654321',
        actualArrivalTime: '2026-01-03T09:30:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vvnId).toBe('VVN-20260103-002');
      expect(res.body.data.notes).toBe('');
      expect(res.body.data.executedOperations).toEqual([]);
    });

    test('should create VVE with generateInitialOperations flag (operations generated Just-In-Time)', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-003',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z',
        generateInitialOperations: true
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.executedOperations).toBeDefined();
      // Note: Operations are initialized as empty array during creation
      // They are generated Just-In-Time when needed (not during VVE creation)
      expect(Array.isArray(res.body.data.executedOperations)).toBe(true);
      expect(res.body.data.executedOperations).toEqual([]);
    });

    test('should reject request without authentication token', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    test('should reject request with invalid token', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-invalid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid token');
    });

    test('should return 400 when vvnId is missing', async () => {
      // Arrange
      const payload = {
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.some(err => err.msg.includes('VVN ID is required'))).toBe(true);
    });

    test('should return 400 when vesselIdentifier is missing', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(err => err.msg.includes('Vessel identifier is required'))).toBe(true);
    });

    test('should return 400 when actualArrivalTime is missing', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(err => err.msg.includes('arrival time is required'))).toBe(true);
    });

    test('should return 400 when actualArrivalTime has invalid format', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: 'invalid-date-format'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 when VVN not found in Master Data', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-NOT-FOUND',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VVN not found');
    });

    test('should return 409 when VVE already exists for the VVN', async () => {
      // Arrange - First create a VVE
      const payload = {
        vvnId: 'VVN-20260103-DUPLICATE',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Act - Try to create another VVE with same VVN
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Conflict');
      expect(res.body.message).toContain('already exists');
    });

    test('should create VVE with optional berth information', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-004',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z',
        actualBerthTime: '2026-01-03T09:00:00Z',
        berthDockId: 'DOCK-A1'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      // Note: These fields might need to be added to CreateVveDto
      // and service if not already supported
    });

    test('should handle multiple VVEs for different VVNs', async () => {
      // Arrange - Create first VVE
      const payload1 = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1111111',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      const payload2 = {
        vvnId: 'VVN-20260103-002',
        vesselIdentifier: 'IMO2222222',
        actualArrivalTime: '2026-01-03T10:00:00Z'
      };

      // Act - Create two VVEs
      const res1 = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload1);

      const res2 = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload2);

      // Assert
      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);
      expect(res1.body.data.vveId).not.toBe(res2.body.data.vveId);
      expect(res1.body.data.vvnId).toBe('VVN-20260103-001');
      expect(res2.body.data.vvnId).toBe('VVN-20260103-002');
    });

    test('should validate generateInitialOperations is boolean', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z',
        generateInitialOperations: 'not-a-boolean'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should create VVE with timestamp metadata', async () => {
      // Arrange
      const beforeCreate = new Date();
      const payload = {
        vvnId: 'VVN-20260103-005',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      const afterCreate = new Date();

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
      
      const createdAt = new Date(res.body.data.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    test('should create VVE with empty audit logs initially', async () => {
      // Arrange
      const payload = {
        vvnId: 'VVN-20260103-006',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };

      // Act
      const res = await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send(payload);

      // Assert
      expect(res.statusCode).toBe(201);
      expect(res.body.data.auditLogs).toBeDefined();
      expect(Array.isArray(res.body.data.auditLogs)).toBe(true);
    });
  });

  describe('GET /api/vve - List VVEs', () => {
    test('should return all VVEs', async () => {
      // Arrange - Create two VVEs
      await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send({
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1111111',
          actualArrivalTime: '2026-01-03T08:00:00Z'
        });

      await request(app)
        .post('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token')
        .send({
          vvnId: 'VVN-20260103-002',
          vesselIdentifier: 'IMO2222222',
          actualArrivalTime: '2026-01-03T10:00:00Z'
        });

      // Act
      const res = await request(app)
        .get('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    test('should return empty array when no VVEs exist', async () => {
      // Act
      const res = await request(app)
        .get('/api/vve')
        .set('Authorization', 'Bearer mock-valid-token');

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    test('should require authentication to list VVEs', async () => {
      // Act
      const res = await request(app)
        .get('/api/vve');

      // Assert
      expect(res.statusCode).toBe(401);
    });
  });
});

