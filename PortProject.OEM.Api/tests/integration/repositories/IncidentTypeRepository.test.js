/**
 * Integration Tests for IncidentTypeRepository
 * 
 * Type: Integration Testing with SUT = Repository + MongoDB
 * Goal: Test repository operations with real MongoDB (in-memory)
 * Tool: Jest + mongodb-memory-server
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { IncidentTypeRepository } from '../../../src/infrastructure/repositories/IncidentTypeRepository.js';

describe('Integration Test - IncidentTypeRepository', () => {
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
    repository = new IncidentTypeRepository();
  });

  afterEach(async () => {
    await repository.model.deleteMany({});
  });

  describe('create', () => {
    test('should create a new incident type successfully', async () => {
      const incidentTypeData = {
        code: 'T-INC001',
        name: 'Mechanical Failure',
        description: 'Equipment mechanical failure',
        severity: 'Major'
      };

      const result = await repository.create(incidentTypeData);

      expect(result).toBeDefined();
      expect(result.code).toBe('T-INC001');
      expect(result.name).toBe('Mechanical Failure');
      expect(result.severity).toBe('Major');
    });

    test('should create incident type with parentId', async () => {
      const parentData = {
        code: 'T-INC-PARENT',
        name: 'Parent Type',
        severity: 'Major'
      };

      const parent = await repository.create(parentData);

      const childData = {
        code: 'T-INC-CHILD',
        name: 'Child Type',
        severity: 'Minor',
        parentId: parent._id.toString()
      };

      const result = await repository.create(childData);

      expect(result.parentId).toBe(parent._id.toString());
    });

    test('should fail to create incident type with duplicate code', async () => {
      const incidentTypeData1 = {
        code: 'T-INC-DUP',
        name: 'First Type',
        severity: 'Minor'
      };

      const incidentTypeData2 = {
        code: 'T-INC-DUP',
        name: 'Second Type',
        severity: 'Major'
      };

      await repository.create(incidentTypeData1);

      await expect(repository.create(incidentTypeData2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    test('should find incident type by MongoDB _id', async () => {
      const incidentTypeData = {
        code: 'T-INC002',
        name: 'Safety Issue',
        severity: 'Critical'
      };

      const created = await repository.create(incidentTypeData);

      const result = await repository.findById(created._id);

      expect(result).toBeDefined();
      expect(result.code).toBe('T-INC002');
      expect(result.name).toBe('Safety Issue');
    });

    test('should return null when incident type not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await repository.findById(fakeId);

      expect(result).toBeNull();
    });

    test('should return lean object (plain JavaScript)', async () => {
      const incidentTypeData = {
        code: 'T-INC003',
        name: 'Test Type',
        severity: 'Minor'
      };

      const created = await repository.create(incidentTypeData);
      const result = await repository.findById(created._id);

      // Lean objects don't have Mongoose document methods
      expect(result.save).toBeUndefined();
    });
  });

  describe('findByCode', () => {
    test('should find incident type by business code', async () => {
      const incidentTypeData = {
        code: 'T-INC004',
        name: 'Equipment Failure',
        severity: 'Major'
      };

      await repository.create(incidentTypeData);

      const result = await repository.findByCode('T-INC004');

      expect(result).toBeDefined();
      expect(result.code).toBe('T-INC004');
      expect(result.name).toBe('Equipment Failure');
    });

    test('should return null when code not found', async () => {
      const result = await repository.findByCode('T-INC-NOTFOUND');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create parent types
      const parent1 = await repository.create({
        code: 'T-INC-P1',
        name: 'Equipment Issues',
        severity: 'Major'
      });

      const parent2 = await repository.create({
        code: 'T-INC-P2',
        name: 'Safety Issues',
        severity: 'Critical'
      });

      // Create child types
      await repository.create({
        code: 'T-INC-C1',
        name: 'Crane Failure',
        severity: 'Major',
        parentId: parent1._id.toString()
      });

      await repository.create({
        code: 'T-INC-C2',
        name: 'Forklift Issue',
        severity: 'Minor',
        parentId: parent1._id.toString()
      });

      await repository.create({
        code: 'T-INC-C3',
        name: 'Fire Hazard',
        severity: 'Critical',
        parentId: parent2._id.toString()
      });

      // Create standalone type
      await repository.create({
        code: 'T-INC-S1',
        name: 'Weather Delay',
        severity: 'Minor'
      });
    });

    test('should return all incident types when no filters provided', async () => {
      const result = await repository.findAll();

      expect(result.length).toBe(6);
    });

    test('should filter incident types by parentId', async () => {
      const parent = await repository.findByCode('T-INC-P1');
      const result = await repository.findAll({ parentId: parent._id.toString() });

      expect(result.length).toBe(2);
      result.forEach(type => {
        expect(type.parentId).toBe(parent._id.toString());
      });
    });

    test('should filter root types (parentId = null)', async () => {
      const result = await repository.findAll({ parentId: null });

      expect(result.length).toBe(3); // 2 parents + 1 standalone
      result.forEach(type => {
        expect(type.parentId).toBeNull();
      });
    });

    test('should filter by severity', async () => {
      const result = await repository.findAll({ severity: 'Critical' });

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(type => {
        expect(type.severity).toBe('Critical');
      });
    });

    test('should search by name (case-insensitive)', async () => {
      const result = await repository.findAll({ search: 'failure' });

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(type => {
        expect(type.name.toLowerCase()).toContain('failure');
      });
    });

    test('should search by code (case-insensitive)', async () => {
      const result = await repository.findAll({ search: 'c1' });

      expect(result.length).toBeGreaterThanOrEqual(1);
      const codes = result.map(t => t.code);
      expect(codes.some(code => code.toLowerCase().includes('c1'))).toBe(true);
    });

    test('should combine filters (parentId + severity)', async () => {
      const parent = await repository.findByCode('T-INC-P1');
      const result = await repository.findAll({
        parentId: parent._id.toString(),
        severity: 'Minor'
      });

      expect(result.length).toBe(1);
      expect(result[0].code).toBe('T-INC-C2');
    });

    test('should sort results by name', async () => {
      const result = await repository.findAll();

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].name.localeCompare(result[i + 1].name)).toBeLessThanOrEqual(0);
      }
    });

    test('should return empty array when no matches found', async () => {
      const result = await repository.findAll({ search: 'nonexistent' });

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    test('should update incident type successfully', async () => {
      const incidentTypeData = {
        code: 'T-INC005',
        name: 'Original Name',
        severity: 'Minor'
      };

      const created = await repository.create(incidentTypeData);

      const updateData = {
        name: 'Updated Name',
        severity: 'Major',
        updatedBy: 'admin@example.com'
      };

      const result = await repository.update(created._id, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.severity).toBe('Major');
      expect(result.updatedBy).toBe('admin@example.com');
      expect(result.code).toBe('T-INC005'); // Code should not change
    });

    test('should update updatedAt timestamp', async () => {
      const incidentTypeData = {
        code: 'T-INC006',
        name: 'Test Type',
        severity: 'Minor'
      };

      const created = await repository.create(incidentTypeData);
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateData = { name: 'New Name' };
      const result = await repository.update(created._id, updateData);

      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    test('should throw error when updating non-existent incident type', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = { name: 'New Name' };

      await expect(repository.update(fakeId, updateData)).rejects.toThrow(
        'Incident Type with ID'
      );
    });

    test('should validate updated data', async () => {
      const incidentTypeData = {
        code: 'T-INC007',
        name: 'Test Type',
        severity: 'Minor'
      };

      const created = await repository.create(incidentTypeData);

      const invalidUpdateData = {
        severity: 'InvalidSeverity'
      };

      await expect(repository.update(created._id, invalidUpdateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    test('should delete incident type successfully', async () => {
      const incidentTypeData = {
        code: 'T-INC008',
        name: 'To Delete',
        severity: 'Minor'
      };

      const created = await repository.create(incidentTypeData);

      const result = await repository.delete(created._id);

      expect(result).toBe(true);

      const deleted = await repository.findById(created._id);
      expect(deleted).toBeNull();
    });

    test('should return false when deleting non-existent incident type', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const result = await repository.delete(fakeId);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    test('should return true when incident type exists', async () => {
      const incidentTypeData = {
        code: 'T-INC009',
        name: 'Existing Type',
        severity: 'Minor'
      };

      const created = await repository.create(incidentTypeData);

      const result = await repository.exists(created._id);

      expect(result).toBe(true);
    });

    test('should return false when incident type does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const result = await repository.exists(fakeId);

      expect(result).toBe(false);
    });
  });

  describe('Hierarchical Operations', () => {
    test('should create multi-level hierarchy', async () => {
      // Level 1 - Root
      const root = await repository.create({
        code: 'T-ROOT',
        name: 'Root Type',
        severity: 'Major'
      });

      // Level 2 - Child
      const child = await repository.create({
        code: 'T-CHILD',
        name: 'Child Type',
        severity: 'Major',
        parentId: root._id.toString()
      });

      // Level 3 - Grandchild
      const grandchild = await repository.create({
        code: 'T-GRANDCHILD',
        name: 'Grandchild Type',
        severity: 'Minor',
        parentId: child._id.toString()
      });

      // Verify hierarchy
      const allTypes = await repository.findAll();
      expect(allTypes.length).toBe(3);

      const childTypes = await repository.findAll({ parentId: root._id.toString() });
      expect(childTypes.length).toBe(1);
      expect(childTypes[0].code).toBe('T-CHILD');

      const grandchildTypes = await repository.findAll({ parentId: child._id.toString() });
      expect(grandchildTypes.length).toBe(1);
      expect(grandchildTypes[0].code).toBe('T-GRANDCHILD');
    });

    test('should get all children of a parent', async () => {
      const parent = await repository.create({
        code: 'T-MULTI-PARENT',
        name: 'Parent with Multiple Children',
        severity: 'Major'
      });

      // Create multiple children
      for (let i = 1; i <= 5; i++) {
        await repository.create({
          code: `T-MULTI-CHILD-${i}`,
          name: `Child ${i}`,
          severity: i % 2 === 0 ? 'Major' : 'Minor',
          parentId: parent._id.toString()
        });
      }

      const children = await repository.findAll({ parentId: parent._id.toString() });

      expect(children.length).toBe(5);
      children.forEach(child => {
        expect(child.parentId).toBe(parent._id.toString());
      });
    });
  });
});

