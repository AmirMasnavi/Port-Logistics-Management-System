/**
 * Unit Tests for VesselVisitExecutionModel
 * 
 * Type: Functional Black-Box Testing with SUT = Mongoose Model
 * Goal: Test Mongoose schema validation, defaults, and constraints
 * Tool: Jest + mongodb-memory-server
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { VesselVisitExecutionModel } from '../../../src/infrastructure/models/VesselVisitExecutionModel.js';

describe('Unit Test - VesselVisitExecutionModel', () => {
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
    await VesselVisitExecutionModel.deleteMany({});
  });

  describe('Model Creation', () => {
    test('should create a valid VVE with all required fields', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'In Progress'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve._id).toBeDefined();
      expect(savedVve.vveId).toBe('VVE-20260103-001');
      expect(savedVve.vvnId).toBe('VVN-20260103-001');
      expect(savedVve.vesselIdentifier).toBe('IMO1234567');
      expect(savedVve.creatorEmail).toBe('test@example.com');
      expect(savedVve.status).toBe('In Progress');
      expect(savedVve.createdAt).toBeInstanceOf(Date);
      expect(savedVve.updatedAt).toBeInstanceOf(Date);
    });

    test('should auto-generate createdAt and updatedAt timestamps', async () => {
      const vveData = {
        vveId: 'VVE-20260103-002',
        vvnId: 'VVN-20260103-002',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.createdAt).toBeInstanceOf(Date);
      expect(savedVve.updatedAt).toBeInstanceOf(Date);
      expect(savedVve.createdAt.getTime()).toBeLessThanOrEqual(savedVve.updatedAt.getTime());
    });

    test('should default status to "In Progress"', async () => {
      const vveData = {
        vveId: 'VVE-20260103-003',
        vvnId: 'VVN-20260103-003',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
        // status not provided
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.status).toBe('In Progress');
    });

    test('should default notes to empty string', async () => {
      const vveData = {
        vveId: 'VVE-20260103-004',
        vvnId: 'VVN-20260103-004',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.notes).toBe('');
    });

    test('should default actualDepartureTime to null', async () => {
      const vveData = {
        vveId: 'VVE-20260103-005',
        vvnId: 'VVN-20260103-005',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.actualDepartureTime).toBeNull();
    });

    test('should default actualBerthTime to null', async () => {
      const vveData = {
        vveId: 'VVE-20260103-006',
        vvnId: 'VVN-20260103-006',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.actualBerthTime).toBeNull();
      expect(savedVve.berthDockId).toBeNull();
    });

    test('should initialize executedOperations as empty array', async () => {
      const vveData = {
        vveId: 'VVE-20260103-007',
        vvnId: 'VVN-20260103-007',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.executedOperations).toEqual([]);
    });

    test('should initialize auditLogs as empty array', async () => {
      const vveData = {
        vveId: 'VVE-20260103-008',
        vvnId: 'VVN-20260103-008',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.auditLogs).toEqual([]);
    });
  });

  describe('Required Fields Validation', () => {
    test('should fail validation when vveId is missing', async () => {
      const vveData = {
        // vveId missing
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);

      await expect(vve.save()).rejects.toThrow();
    });

    test('should fail validation when vvnId is missing', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        // vvnId missing
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);

      await expect(vve.save()).rejects.toThrow();
    });

    test('should fail validation when vesselIdentifier is missing', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        // vesselIdentifier missing
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);

      await expect(vve.save()).rejects.toThrow();
    });

    test('should fail validation when actualArrivalTime is missing', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        // actualArrivalTime missing
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);

      await expect(vve.save()).rejects.toThrow();
    });

    test('should fail validation when creatorEmail is missing', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date()
        // creatorEmail missing
      };

      const vve = new VesselVisitExecutionModel(vveData);

      await expect(vve.save()).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    test('should accept valid status values', async () => {
      const validStatuses = ['In Progress', 'Completed', 'Cancelled'];

      for (const status of validStatuses) {
        const vveData = {
          vveId: `VVE-20260103-${status}`,
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: new Date(),
          creatorEmail: 'test@example.com',
          status: status
        };

        const vve = new VesselVisitExecutionModel(vveData);
        const savedVve = await vve.save();

        expect(savedVve.status).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        status: 'Invalid Status'
      };

      const vve = new VesselVisitExecutionModel(vveData);

      await expect(vve.save()).rejects.toThrow();
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique vveId constraint', async () => {
      const vveData1 = {
        vveId: 'VVE-20260103-DUPLICATE',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vveData2 = {
        vveId: 'VVE-20260103-DUPLICATE', // Same vveId
        vvnId: 'VVN-20260103-002',
        vesselIdentifier: 'IMO7654321',
        actualArrivalTime: new Date(),
        creatorEmail: 'test2@example.com'
      };

      const vve1 = new VesselVisitExecutionModel(vveData1);
      await vve1.save();

      const vve2 = new VesselVisitExecutionModel(vveData2);
      await expect(vve2.save()).rejects.toThrow();
    });
  });

  describe('Pre-save Hook - Update Timestamp', () => {
    test('should update updatedAt timestamp on save', async () => {
      const vveData = {
        vveId: 'VVE-20260103-HOOK',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();
      const firstUpdatedAt = savedVve.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      savedVve.notes = 'Updated notes';
      const updatedVve = await savedVve.save();

      expect(updatedVve.updatedAt.getTime()).toBeGreaterThan(firstUpdatedAt.getTime());
    });
  });

  describe('Executed Operations Sub-schema', () => {
    test('should create VVE with executed operations', async () => {
      const vveData = {
        vveId: 'VVE-20260103-OPS',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            operationId: 'OP-001',
            name: 'Container Loading',
            type: 'LOADING',
            status: 'PENDING'
          },
          {
            operationId: 'OP-002',
            name: 'Safety Check',
            type: 'Inspection',
            status: 'COMPLETED',
            startTime: new Date('2026-01-03T10:00:00Z'),
            endTime: new Date('2026-01-03T11:00:00Z'),
            startedBy: 'USER-001',
            completedBy: 'USER-001'
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.executedOperations).toHaveLength(2);
      expect(savedVve.executedOperations[0].operationId).toBe('OP-001');
      expect(savedVve.executedOperations[0].status).toBe('PENDING');
      expect(savedVve.executedOperations[1].operationId).toBe('OP-002');
      expect(savedVve.executedOperations[1].status).toBe('COMPLETED');
      expect(savedVve.executedOperations[1]._id).toBeDefined();
    });

    test('should validate required operationId in executed operations', async () => {
      const vveData = {
        vveId: 'VVE-20260103-INVALID-OP',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            // operationId missing
            name: 'Container Loading',
            status: 'PENDING'
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      await expect(vve.save()).rejects.toThrow();
    });

    test('should default operation status to PENDING', async () => {
      const vveData = {
        vveId: 'VVE-20260103-DEFAULT-STATUS',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            operationId: 'OP-001',
            name: 'Loading Operation'
            // status not provided
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.executedOperations[0].status).toBe('PENDING');
    });

    test('should accept valid operation status values', async () => {
      const validStatuses = ['PENDING', 'STARTED', 'COMPLETED', 'SUSPENDED'];

      for (const status of validStatuses) {
        const vveData = {
          vveId: `VVE-20260103-${status}`,
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: new Date(),
          creatorEmail: 'test@example.com',
          executedOperations: [
            {
              operationId: 'OP-001',
              status: status
            }
          ]
        };

        const vve = new VesselVisitExecutionModel(vveData);
        const savedVve = await vve.save();

        expect(savedVve.executedOperations[0].status).toBe(status);
      }
    });

    test('should reject invalid operation status', async () => {
      const vveData = {
        vveId: 'VVE-20260103-INVALID-STATUS',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            operationId: 'OP-001',
            status: 'INVALID'
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      await expect(vve.save()).rejects.toThrow();
    });

    test('should accept valid operation types', async () => {
      const validTypes = ['WAITING', 'LOADING', 'UNLOADING', 'Other', 'Loading', 'Unloading', 'Preparation', 'Completion', 'Inspection'];

      for (const type of validTypes) {
        const vveData = {
          vveId: `VVE-TYPE-${type}`,
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: new Date(),
          creatorEmail: 'test@example.com',
          executedOperations: [
            {
              operationId: 'OP-001',
              type: type,
              status: 'PENDING'
            }
          ]
        };

        const vve = new VesselVisitExecutionModel(vveData);
        const savedVve = await vve.save();

        expect(savedVve.executedOperations[0].type).toBe(type);
      }
    });

    test('should default operation type to "Other"', async () => {
      const vveData = {
        vveId: 'VVE-20260103-DEFAULT-TYPE',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            operationId: 'OP-001',
            status: 'PENDING'
            // type not provided
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.executedOperations[0].type).toBe('Other');
    });

    test('should store operation tracking timestamps', async () => {
      const startTime = new Date('2026-01-03T10:00:00Z');
      const endTime = new Date('2026-01-03T12:00:00Z');

      const vveData = {
        vveId: 'VVE-20260103-TIMES',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            operationId: 'OP-001',
            status: 'COMPLETED',
            startTime: startTime,
            endTime: endTime,
            startedBy: 'USER-001',
            completedBy: 'USER-001'
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.executedOperations[0].startTime).toEqual(startTime);
      expect(savedVve.executedOperations[0].endTime).toEqual(endTime);
      expect(savedVve.executedOperations[0].startedBy).toBe('USER-001');
      expect(savedVve.executedOperations[0].completedBy).toBe('USER-001');
    });

    test('should store operation notes and actualResource', async () => {
      const vveData = {
        vveId: 'VVE-20260103-DETAILS',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        executedOperations: [
          {
            operationId: 'OP-001',
            status: 'COMPLETED',
            actualResource: 'Crane-02',
            notes: 'Used different crane due to maintenance'
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.executedOperations[0].actualResource).toBe('Crane-02');
      expect(savedVve.executedOperations[0].notes).toBe('Used different crane due to maintenance');
    });
  });

  describe('Audit Logs Sub-schema', () => {
    test('should create VVE with audit logs', async () => {
      const vveData = {
        vveId: 'VVE-20260103-AUDIT',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        auditLogs: [
          {
            userId: 'USER-001',
            action: 'created',
            timestamp: new Date(),
            details: { initialStatus: 'In Progress' }
          },
          {
            userId: 'USER-002',
            action: 'updated',
            timestamp: new Date(),
            details: { changedField: 'status', newValue: 'Completed' }
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.auditLogs).toHaveLength(2);
      expect(savedVve.auditLogs[0].userId).toBe('USER-001');
      expect(savedVve.auditLogs[0].action).toBe('created');
      expect(savedVve.auditLogs[1].userId).toBe('USER-002');
      expect(savedVve.auditLogs[1].action).toBe('updated');
    });

    test('should require userId and action in audit logs', async () => {
      const vveData = {
        vveId: 'VVE-20260103-INVALID-AUDIT',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        auditLogs: [
          {
            // userId and action missing
            timestamp: new Date()
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      await expect(vve.save()).rejects.toThrow();
    });

    test('should default audit log timestamp to current date', async () => {
      const beforeCreate = new Date();

      const vveData = {
        vveId: 'VVE-20260103-TIMESTAMP',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        auditLogs: [
          {
            userId: 'USER-001',
            action: 'created'
            // timestamp not provided
          }
        ]
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.auditLogs[0].timestamp).toBeInstanceOf(Date);
      expect(savedVve.auditLogs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });
  });

  describe('Optional Fields', () => {
    test('should save VVE with actualBerthTime and berthDockId', async () => {
      const berthTime = new Date('2026-01-03T09:00:00Z');
      const vveData = {
        vveId: 'VVE-20260103-BERTH',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        actualBerthTime: berthTime,
        berthDockId: 'DOCK-A1',
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.actualBerthTime).toEqual(berthTime);
      expect(savedVve.berthDockId).toBe('DOCK-A1');
    });

    test('should save VVE with actualDepartureTime when completed', async () => {
      const departureTime = new Date('2026-01-03T20:00:00Z');
      const vveData = {
        vveId: 'VVE-20260103-DEPARTURE',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        actualDepartureTime: departureTime,
        status: 'Completed',
        creatorEmail: 'test@example.com'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.actualDepartureTime).toEqual(departureTime);
      expect(savedVve.status).toBe('Completed');
    });

    test('should save VVE with notes', async () => {
      const vveData = {
        vveId: 'VVE-20260103-NOTES',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date(),
        creatorEmail: 'test@example.com',
        notes: 'Vessel experienced minor delays due to weather'
      };

      const vve = new VesselVisitExecutionModel(vveData);
      const savedVve = await vve.save();

      expect(savedVve.notes).toBe('Vessel experienced minor delays due to weather');
    });
  });

  describe('Indexes', () => {
    test('should have index on vveId', async () => {
      const indexes = VesselVisitExecutionModel.schema.indexes();
      const vveIdIndex = indexes.find(idx => idx[0].vveId);
      
      expect(vveIdIndex).toBeDefined();
    });

    test('should have index on vvnId', async () => {
      const indexes = VesselVisitExecutionModel.schema.indexes();
      const vvnIdIndex = indexes.find(idx => idx[0].vvnId);
      
      expect(vvnIdIndex).toBeDefined();
    });

    test('should have index on status', async () => {
      const indexes = VesselVisitExecutionModel.schema.indexes();
      const statusIndex = indexes.find(idx => idx[0].status);
      
      expect(statusIndex).toBeDefined();
    });

    test('should have index on berthDockId', async () => {
      const indexes = VesselVisitExecutionModel.schema.indexes();
      const berthDockIdIndex = indexes.find(idx => idx[0].berthDockId);
      
      expect(berthDockIdIndex).toBeDefined();
    });
  });
});

