/**
 * Integration Tests for VveRepository
 * 
 * Type: Integration Testing with SUT = Repository + MongoDB
 * Goal: Test repository operations with real MongoDB (in-memory)
 * Tool: Jest + mongodb-memory-server
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { VveRepository } from '../../../src/infrastructure/repositories/VveRepository.js';

describe('Integration Test - VveRepository', () => {
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
    repository = new VveRepository();
  });

  afterEach(async () => {
    await repository.model.deleteMany({});
  });

  describe('create', () => {
    test('should create a new VVE successfully', async () => {
      const vveData = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'In Progress'
      };

      const result = await repository.create(vveData);

      expect(result).toBeDefined();
      expect(result.vveId).toBe('VVE-20260103-001');
      expect(result.vvnId).toBe('VVN-20260103-001');
      expect(result.vesselIdentifier).toBe('IMO1234567');
    });

    test('should create VVE with operations', async () => {
      const vveData = {
        vveId: 'VVE-20260103-002',
        vvnId: 'VVN-20260103-002',
        vesselIdentifier: 'IMO7654321',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        operations: [
          {
            operationId: 'OP-001',
            name: 'Loading',
            type: 'LOADING',
            status: 'PENDING'
          }
        ]
      };

      const result = await repository.create(vveData);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].operationId).toBe('OP-001');
    });

    test('should fail to create VVE with duplicate vveId', async () => {
      const vveData1 = {
        vveId: 'VVE-DUPLICATE',
        vvnId: 'VVN-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com'
      };

      const vveData2 = {
        vveId: 'VVE-DUPLICATE',
        vvnId: 'VVN-002',
        vesselIdentifier: 'IMO7654321',
        actualArrivalTime: new Date('2026-01-04T08:00:00Z'),
        creatorEmail: 'test2@example.com'
      };

      await repository.create(vveData1);

      await expect(repository.create(vveData2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    test('should find VVE by vveId', async () => {
      const vveData = {
        vveId: 'VVE-20260103-003',
        vvnId: 'VVN-20260103-003',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com'
      };

      await repository.create(vveData);

      const result = await repository.findById('VVE-20260103-003');

      expect(result).toBeDefined();
      expect(result.vveId).toBe('VVE-20260103-003');
      expect(result.vvnId).toBe('VVN-20260103-003');
    });

    test('should return null when VVE not found', async () => {
      const result = await repository.findById('VVE-NOTFOUND');

      expect(result).toBeNull();
    });

    test('should return lean object (plain JavaScript)', async () => {
      const vveData = {
        vveId: 'VVE-20260103-004',
        vvnId: 'VVN-20260103-004',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com'
      };

      await repository.create(vveData);

      const result = await repository.findById('VVE-20260103-004');

      // Lean objects don't have Mongoose document methods
      expect(result.save).toBeUndefined();
    });
  });

  describe('findByVvnId', () => {
    test('should find VVE by vvnId', async () => {
      const vveData = {
        vveId: 'VVE-20260103-005',
        vvnId: 'VVN-20260103-005',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com'
      };

      await repository.create(vveData);

      const result = await repository.findByVvnId('VVN-20260103-005');

      expect(result).toBeDefined();
      expect(result.vveId).toBe('VVE-20260103-005');
      expect(result.vvnId).toBe('VVN-20260103-005');
    });

    test('should return null when VVN not found', async () => {
      const result = await repository.findByVvnId('VVN-NOTFOUND');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({
        vveId: 'VVE-20260103-006',
        vvnId: 'VVN-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'In Progress'
      });

      await repository.create({
        vveId: 'VVE-20260104-007',
        vvnId: 'VVN-002',
        vesselIdentifier: 'IMO7654321',
        actualArrivalTime: new Date('2026-01-04T10:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'Completed'
      });

      await repository.create({
        vveId: 'VVE-20260103-008',
        vvnId: 'VVN-003',
        vesselIdentifier: 'IMO1111111',
        actualArrivalTime: new Date('2026-01-03T14:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'Pending'
      });
    });

    test('should return all VVEs when no filters provided', async () => {
      const result = await repository.findAll();

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should filter VVEs by date', async () => {
      const result = await repository.findAll({ date: '2026-01-03' });

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(vve => {
        const vveDate = new Date(vve.actualArrivalTime).toISOString().split('T')[0];
        expect(vveDate).toBe('2026-01-03');
      });
    });

    test('should filter VVEs by status', async () => {
      const result = await repository.findAll({ status: 'In Progress' });

      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach(vve => {
        expect(vve.status).toBe('In Progress');
      });
    });

    test('should filter VVEs by vessel identifier', async () => {
      const result = await repository.findAll({ vesselIdentifier: 'IMO1234567' });

      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach(vve => {
        expect(vve.vesselIdentifier).toBe('IMO1234567');
      });
    });

    test('should sort VVEs by actualArrivalTime descending', async () => {
      const result = await repository.findAll();

      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].actualArrivalTime);
        const next = new Date(result[i + 1].actualArrivalTime);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe('update', () => {
    test('should update VVE successfully', async () => {
      const vveData = {
        vveId: 'VVE-20260103-009',
        vvnId: 'VVN-009',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'In Progress'
      };

      await repository.create(vveData);

      const updateData = {
        status: 'Completed',
        notes: 'Updated notes'
      };

      const result = await repository.update('VVE-20260103-009', updateData);

      expect(result).toBeDefined();
      expect(result.status).toBe('Completed');
      expect(result.notes).toBe('Updated notes');
    });

    test('should return null when updating non-existent VVE', async () => {
      const updateData = {
        status: 'Completed'
      };

      const result = await repository.update('VVE-NOTFOUND', updateData);

      expect(result).toBeNull();
    });

    test('should update operations in VVE', async () => {
      const vveData = {
        vveId: 'VVE-20260103-010',
        vvnId: 'VVN-010',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        operations: [
          {
            operationId: 'OP-001',
            name: 'Loading',
            type: 'LOADING',
            status: 'PENDING'
          }
        ]
      };

      await repository.create(vveData);

      const updateData = {
        operations: [
          {
            operationId: 'OP-001',
            name: 'Loading',
            type: 'LOADING',
            status: 'COMPLETED'
          },
          {
            operationId: 'OP-002',
            name: 'Unloading',
            type: 'UNLOADING',
            status: 'STARTED'
          }
        ]
      };

      const result = await repository.update('VVE-20260103-010', updateData);

      expect(result.operations).toHaveLength(2);
      expect(result.operations[0].status).toBe('COMPLETED');
      expect(result.operations[1].operationId).toBe('OP-002');
    });
  });

  describe('delete', () => {
    test('should delete VVE successfully', async () => {
      const vveData = {
        vveId: 'VVE-20260103-011',
        vvnId: 'VVN-011',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com'
      };

      await repository.create(vveData);

      const result = await repository.delete('VVE-20260103-011');

      expect(result).toBe(true);

      const deleted = await repository.findById('VVE-20260103-011');
      expect(deleted).toBeNull();
    });

    test('should return false when deleting non-existent VVE', async () => {
      const result = await repository.delete('VVE-NOTFOUND');

      expect(result).toBe(false);
    });
  });

  describe('existsByVvnId', () => {
    test('should return true when VVE with vvnId exists', async () => {
      const vveData = {
        vveId: 'VVE-20260103-012',
        vvnId: 'VVN-012',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com'
      };

      await repository.create(vveData);

      const result = await repository.existsByVvnId('VVN-012');

      expect(result).toBe(true);
    });

    test('should return false when VVE with vvnId does not exist', async () => {
      const result = await repository.existsByVvnId('VVN-NOTFOUND');

      expect(result).toBe(false);
    });
  });
});

