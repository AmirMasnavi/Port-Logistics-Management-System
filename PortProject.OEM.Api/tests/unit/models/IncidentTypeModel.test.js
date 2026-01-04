/**
 * Unit Tests for IncidentTypeModel
 * 
 * Type: Functional Black-Box Testing with SUT = Mongoose Model
 * Goal: Test Mongoose schema validation, defaults, and constraints
 * Tool: Jest + mongodb-memory-server
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { IncidentTypeModel } from '../../../src/infrastructure/models/IncidentTypeModel.js';

describe('Unit Test - IncidentTypeModel', () => {
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
    await IncidentTypeModel.deleteMany({});
  });

  describe('Model Creation', () => {
    test('should create a valid incident type with all required fields', async () => {
      const incidentTypeData = {
        code: 'T-INC001',
        name: 'Mechanical Failure',
        description: 'Equipment mechanical failure',
        severity: 'Major'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();

      expect(savedIncidentType._id).toBeDefined();
      expect(savedIncidentType.code).toBe('T-INC001');
      expect(savedIncidentType.name).toBe('Mechanical Failure');
      expect(savedIncidentType.description).toBe('Equipment mechanical failure');
      expect(savedIncidentType.severity).toBe('Major');
    });

    test('should create incident type with minimal required fields', async () => {
      const incidentTypeData = {
        code: 'T-INC002',
        name: 'Safety Issue'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();

      expect(savedIncidentType._id).toBeDefined();
      expect(savedIncidentType.code).toBe('T-INC002');
      expect(savedIncidentType.name).toBe('Safety Issue');
      expect(savedIncidentType.severity).toBe('Minor'); // Default value
    });

    test('should default severity to Minor', async () => {
      const incidentTypeData = {
        code: 'T-INC003',
        name: 'Minor Issue'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();

      expect(savedIncidentType.severity).toBe('Minor');
    });

    test('should create incident type with parentId', async () => {
      const incidentTypeData = {
        code: 'T-INC004',
        name: 'Sub-type Issue',
        parentId: 'parent-guid-123',
        severity: 'Critical'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();

      expect(savedIncidentType.parentId).toBe('parent-guid-123');
    });

    test('should create incident type with audit fields', async () => {
      const incidentTypeData = {
        code: 'T-INC005',
        name: 'Test Issue',
        createdBy: 'user1@example.com',
        updatedBy: 'user2@example.com'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();

      expect(savedIncidentType.createdBy).toBe('user1@example.com');
      expect(savedIncidentType.updatedBy).toBe('user2@example.com');
    });

    test('should set createdAt timestamp automatically', async () => {
      const beforeCreation = new Date();
      
      const incidentTypeData = {
        code: 'T-INC006',
        name: 'Timestamp Test'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();
      
      const afterCreation = new Date();

      expect(savedIncidentType.createdAt).toBeDefined();
      expect(savedIncidentType.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(savedIncidentType.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    test('should update updatedAt on save via pre-save hook', async () => {
      const incidentTypeData = {
        code: 'T-INC007',
        name: 'Update Test'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);
      const savedIncidentType = await incidentType.save();
      
      const originalUpdatedAt = savedIncidentType.updatedAt;
      
      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      savedIncidentType.name = 'Updated Name';
      const updatedIncidentType = await savedIncidentType.save();

      expect(updatedIncidentType.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Validation', () => {
    test('should fail validation when code is missing', async () => {
      const incidentTypeData = {
        name: 'Test Issue'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);

      await expect(incidentType.save()).rejects.toThrow();
    });

    test('should fail validation when name is missing', async () => {
      const incidentTypeData = {
        code: 'T-INC008'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);

      await expect(incidentType.save()).rejects.toThrow();
    });

    test('should fail validation with invalid severity', async () => {
      const incidentTypeData = {
        code: 'T-INC009',
        name: 'Test Issue',
        severity: 'InvalidSeverity'
      };

      const incidentType = new IncidentTypeModel(incidentTypeData);

      await expect(incidentType.save()).rejects.toThrow();
    });

    test('should accept valid severity values', async () => {
      const validSeverities = ['Minor', 'Major', 'Critical'];
      
      for (let i = 0; i < validSeverities.length; i++) {
        const severity = validSeverities[i];
        const incidentTypeData = {
          code: `T-INC-SEV-${i}`,
          name: `${severity} Issue`,
          severity: severity
        };

        const incidentType = new IncidentTypeModel(incidentTypeData);
        const savedIncidentType = await incidentType.save();

        expect(savedIncidentType.severity).toBe(severity);
      }
    });

    test('should enforce unique code constraint', async () => {
      const incidentTypeData1 = {
        code: 'T-INC-UNIQUE',
        name: 'First Issue'
      };

      const incidentTypeData2 = {
        code: 'T-INC-UNIQUE',
        name: 'Second Issue'
      };

      const incidentType1 = new IncidentTypeModel(incidentTypeData1);
      await incidentType1.save();

      const incidentType2 = new IncidentTypeModel(incidentTypeData2);

      await expect(incidentType2.save()).rejects.toThrow();
    });
  });

  describe('Indexing', () => {
    test('should have unique index on code', async () => {
      const indexes = await IncidentTypeModel.collection.getIndexes();
      
      const codeIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'code')
      );
      
      expect(codeIndex).toBeDefined();
    });

    test('should have index on severity', async () => {
      const indexes = await IncidentTypeModel.collection.getIndexes();
      
      const severityIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'severity')
      );
      
      expect(severityIndex).toBeDefined();
    });

    test('should have index on parentId', async () => {
      const indexes = await IncidentTypeModel.collection.getIndexes();
      
      const parentIdIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'parentId')
      );
      
      expect(parentIdIndex).toBeDefined();
    });

    test('should have index on createdAt', async () => {
      const indexes = await IncidentTypeModel.collection.getIndexes();
      
      const createdAtIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'createdAt')
      );
      
      expect(createdAtIndex).toBeDefined();
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Create some test data
      await IncidentTypeModel.create([
        {
          code: 'T-INC-Q1',
          name: 'Mechanical Issue',
          severity: 'Major',
          parentId: 'parent-1'
        },
        {
          code: 'T-INC-Q2',
          name: 'Safety Issue',
          severity: 'Critical',
          parentId: 'parent-1'
        },
        {
          code: 'T-INC-Q3',
          name: 'Minor Delay',
          severity: 'Minor',
          parentId: 'parent-2'
        }
      ]);
    });

    test('should find incident type by code', async () => {
      const incidentType = await IncidentTypeModel.findOne({ code: 'T-INC-Q1' });
      
      expect(incidentType).toBeDefined();
      expect(incidentType.code).toBe('T-INC-Q1');
      expect(incidentType.name).toBe('Mechanical Issue');
    });

    test('should find incident types by severity', async () => {
      const incidentTypes = await IncidentTypeModel.find({ severity: 'Major' });
      
      expect(incidentTypes.length).toBeGreaterThanOrEqual(1);
      expect(incidentTypes.every(it => it.severity === 'Major')).toBe(true);
    });

    test('should find incident types by parentId', async () => {
      const incidentTypes = await IncidentTypeModel.find({ parentId: 'parent-1' });
      
      expect(incidentTypes.length).toBe(2);
      expect(incidentTypes.every(it => it.parentId === 'parent-1')).toBe(true);
    });

    test('should find incident types without parentId (root types)', async () => {
      await IncidentTypeModel.create({
        code: 'T-INC-ROOT',
        name: 'Root Type',
        severity: 'Minor'
      });

      const rootTypes = await IncidentTypeModel.find({ parentId: null });
      
      expect(rootTypes.length).toBeGreaterThanOrEqual(1);
      expect(rootTypes.every(it => it.parentId === null)).toBe(true);
    });

    test('should sort incident types by severity', async () => {
      const incidentTypes = await IncidentTypeModel.find().sort({ severity: 1 });
      
      expect(incidentTypes.length).toBeGreaterThanOrEqual(3);
      // Verify they're sorted (alphabetically: Critical, Major, Minor)
      const severities = incidentTypes.map(it => it.severity);
      const sortedSeverities = [...severities].sort();
      expect(severities).toEqual(sortedSeverities);
    });

    test('should update incident type', async () => {
      const incidentType = await IncidentTypeModel.findOne({ code: 'T-INC-Q1' });
      
      incidentType.severity = 'Critical';
      incidentType.updatedBy = 'updater@example.com';
      
      const updated = await incidentType.save();
      
      expect(updated.severity).toBe('Critical');
      expect(updated.updatedBy).toBe('updater@example.com');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(updated.createdAt.getTime());
    });

    test('should delete incident type', async () => {
      const result = await IncidentTypeModel.deleteOne({ code: 'T-INC-Q3' });
      
      expect(result.deletedCount).toBe(1);
      
      const deleted = await IncidentTypeModel.findOne({ code: 'T-INC-Q3' });
      expect(deleted).toBeNull();
    });
  });
});

