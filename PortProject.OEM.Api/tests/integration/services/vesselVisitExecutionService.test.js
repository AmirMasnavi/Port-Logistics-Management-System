/**
 * Integration Tests for VesselVisitExecutionService
 * 
 * Type: Functional Testing with SUT = aggregate
 * Goal: Test the Service interacting with Mock Repository and Gateway
 * Tool: Jest with manual mocking
 */

import { VesselVisitExecutionService } from '../../../src/services/vesselVisitExecutionService.js';
import { CreateVveDto, UpdateVveDto } from '../../../src/application/dtos/VveDto.js';
import { UpdateOperationStatusDto } from '../../../src/application/dtos/ExecutedOperationDto.js';

// Helper to create mock functions
const createMockFn = () => {
  const calls = [];
  const mockFn = (...args) => {
    calls.push(args);
    return mockFn._returnValue;
  };
  mockFn.mockResolvedValue = (value) => {
    mockFn._returnValue = Promise.resolve(value);
    return mockFn;
  };
  mockFn.mockRejectedValue = (value) => {
    mockFn._returnValue = Promise.reject(value);
    return mockFn;
  };
  mockFn.mock = { calls };
  return mockFn;
};

describe('Integration Test - VesselVisitExecutionService with Mock Repository', () => {
  
  let service;
  let mockVveRepository;
  let mockOperationPlanRepository;
  let mockMasterDataGateway;

  beforeEach(() => {
    // Setup Mock VVE Repository
    mockVveRepository = {
      generateNextId: createMockFn(),
      create: createMockFn(),
      findById: createMockFn(),
      findAll: createMockFn(),
      update: createMockFn(),
      existsByVvnId: createMockFn(),
      findByVvnId: createMockFn(),
      delete: createMockFn()
    };

    // Setup Mock Operation Plan Repository
    mockOperationPlanRepository = {
      findByVesselVisitId: createMockFn(),
      findByDate: createMockFn()
    };

    // Setup Mock Master Data Gateway
    mockMasterDataGateway = {
      getVvnAsync: createMockFn(),
      setAuthToken: createMockFn(),
      getOperationPlan: createMockFn()
    };

    // Initialize service and manually inject mocks
    service = new VesselVisitExecutionService(mockMasterDataGateway);
    service.vveRepository = mockVveRepository;
    service.operationPlanRepository = mockOperationPlanRepository;
  });

  afterEach(() => {
    // Reset mocks
    mockVveRepository = null;
    mockOperationPlanRepository = null;
    mockMasterDataGateway = null;
  });

  describe('createVve', () => {
    test('should create VVE when VVN exists and no duplicate', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z',
        notes: 'Test notes',
        generateInitialOperations: false
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-001',
        vesselImo: 'IMO1234567',
        vesselName: 'Test Vessel',
        estimatedArrival: '2026-01-03T08:00:00Z',
        status: 'Approved'
      };

      const mockVveId = 'VVE-20260103-0001';
      
      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(false);
      mockVveRepository.generateNextId.mockResolvedValue(mockVveId);
      mockVveRepository.create.mockResolvedValue({
        vveId: mockVveId,
        vvnId: dto.vvnId,
        vesselIdentifier: dto.vesselIdentifier,
        actualArrivalTime: new Date(dto.actualArrivalTime),
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        notes: dto.notes,
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await service.createVve(dto, 'test@example.com');

      // Assert
      expect(mockMasterDataGateway.getVvnAsync.mock.calls.length).toBe(1);
      expect(mockMasterDataGateway.getVvnAsync.mock.calls[0][0]).toBe('VVN-20260103-001');
      expect(mockVveRepository.existsByVvnId.mock.calls.length).toBe(1);
      expect(mockVveRepository.generateNextId.mock.calls.length).toBe(1);
      expect(mockVveRepository.create.mock.calls.length).toBe(1);
      
      expect(result.vveId).toBe(mockVveId);
      expect(result.vvnId).toBe('VVN-20260103-001');
      expect(result.status).toBe('In Progress');
      expect(result.creatorEmail).toBe('test@example.com');
    });

    test('should throw error when VVN not found in Master Data', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-NOT-FOUND',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createVve(dto, 'test@example.com'))
        .rejects.toThrow("VVN 'VVN-NOT-FOUND' not found in Master Data system");
      
      expect(mockVveRepository.create.mock.calls.length).toBe(0);
    });

    test('should throw error when VVE already exists for VVN', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-001',
        vesselImo: 'IMO1234567'
      };

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(true);

      // Act & Assert
      await expect(service.createVve(dto, 'test@example.com'))
        .rejects.toThrow("A VVE already exists for VVN 'VVN-20260103-001'");
      
      expect(mockVveRepository.create.mock.calls.length).toBe(0);
    });

    test('should throw validation error when DTO is invalid', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: '',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      // Act & Assert
      await expect(service.createVve(dto, 'test@example.com'))
        .rejects.toThrow('Validation failed');
      
      expect(mockMasterDataGateway.getVvnAsync.mock.calls.length).toBe(0);
      expect(mockVveRepository.create.mock.calls.length).toBe(0);
    });

    test('should create VVE with minimal fields (no notes)', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-002',
        vesselIdentifier: 'IMO7654321',
        actualArrivalTime: '2026-01-03T10:00:00Z'
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-002',
        vesselImo: 'IMO7654321'
      };

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(false);
      mockVveRepository.generateNextId.mockResolvedValue('VVE-20260103-0002');
      mockVveRepository.create.mockResolvedValue({
        vveId: 'VVE-20260103-0002',
        vvnId: dto.vvnId,
        vesselIdentifier: dto.vesselIdentifier,
        actualArrivalTime: new Date(dto.actualArrivalTime),
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        notes: '',
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await service.createVve(dto, 'test@example.com');

      // Assert
      expect(result.notes).toBe('');
      
      const createCallArg = mockVveRepository.create.mock.calls[0][0];
      expect(createCallArg.notes).toBe('');
    });

    test('should initialize executedOperations as empty array', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-003',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-003',
        vesselImo: 'IMO1234567'
      };

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(false);
      mockVveRepository.generateNextId.mockResolvedValue('VVE-20260103-0003');
      mockVveRepository.create.mockResolvedValue({
        vveId: 'VVE-20260103-0003',
        vvnId: dto.vvnId,
        vesselIdentifier: dto.vesselIdentifier,
        actualArrivalTime: new Date(dto.actualArrivalTime),
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        notes: '',
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await service.createVve(dto, 'test@example.com');

      // Assert
      expect(Array.isArray(result.executedOperations)).toBe(true);
      expect(result.executedOperations).toEqual([]);
      
      const createCallArg = mockVveRepository.create.mock.calls[0][0];
      expect(createCallArg.executedOperations).toEqual([]);
    });

    test('should pass creator email to repository', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-004',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-004',
        vesselImo: 'IMO1234567'
      };

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(false);
      mockVveRepository.generateNextId.mockResolvedValue('VVE-20260103-0004');
      mockVveRepository.create.mockResolvedValue({
        vveId: 'VVE-20260103-0004',
        vvnId: dto.vvnId,
        vesselIdentifier: dto.vesselIdentifier,
        actualArrivalTime: new Date(dto.actualArrivalTime),
        creatorEmail: 'admin@example.com',
        status: 'In Progress',
        notes: '',
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await service.createVve(dto, 'admin@example.com');

      // Assert
      const createCallArg = mockVveRepository.create.mock.calls[0][0];
      expect(createCallArg.creatorEmail).toBe('admin@example.com');
    });

    test('should set status to "In Progress" by default', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-005',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-005',
        vesselImo: 'IMO1234567'
      };

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(false);
      mockVveRepository.generateNextId.mockResolvedValue('VVE-20260103-0005');
      mockVveRepository.create.mockResolvedValue({
        vveId: 'VVE-20260103-0005',
        vvnId: dto.vvnId,
        vesselIdentifier: dto.vesselIdentifier,
        actualArrivalTime: new Date(dto.actualArrivalTime),
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        notes: '',
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await service.createVve(dto, 'test@example.com');

      // Assert
      expect(result.status).toBe('In Progress');
      
      const createCallArg = mockVveRepository.create.mock.calls[0][0];
      expect(createCallArg.status).toBe('In Progress');
    });

    test('should convert actualArrivalTime to Date object', async () => {
      // Arrange
      const dto = new CreateVveDto({
        vvnId: 'VVN-20260103-006',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      });

      const mockVvn = {
        vvnId: 'VVN-20260103-006',
        vesselImo: 'IMO1234567'
      };

      mockMasterDataGateway.getVvnAsync.mockResolvedValue(mockVvn);
      mockVveRepository.existsByVvnId.mockResolvedValue(false);
      mockVveRepository.generateNextId.mockResolvedValue('VVE-20260103-0006');
      mockVveRepository.create.mockResolvedValue({
        vveId: 'VVE-20260103-0006',
        vvnId: dto.vvnId,
        vesselIdentifier: dto.vesselIdentifier,
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        notes: '',
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await service.createVve(dto, 'test@example.com');

      // Assert
      const createCallArg = mockVveRepository.create.mock.calls[0][0];
      expect(createCallArg.actualArrivalTime).toBeInstanceOf(Date);
      expect(createCallArg.actualArrivalTime.toISOString()).toBe('2026-01-03T08:00:00.000Z');
    });
  });

  describe('getVveById', () => {
    test('should return VVE when found', async () => {
      // Arrange
      const mockVve = {
        vveId: 'VVE-20260103-0001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        notes: '',
        executedOperations: [],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockVveRepository.findById.mockResolvedValue(mockVve);

      // Act
      const result = await service.getVveById('VVE-20260103-0001');

      // Assert
      expect(mockVveRepository.findById.mock.calls.length).toBe(1);
      expect(mockVveRepository.findById.mock.calls[0][0]).toBe('VVE-20260103-0001');
      expect(result.vveId).toBe('VVE-20260103-0001');
      expect(result.vvnId).toBe('VVN-20260103-001');
    });

    test('should return null when VVE not found', async () => {
      // Arrange
      mockVveRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getVveById('VVE-NONEXISTENT');

      // Assert
      expect(mockVveRepository.findById.mock.calls.length).toBe(1);
      expect(result).toBeNull();
    });
  });

  describe('getAllVves', () => {
    test('should return all VVEs with no filters', async () => {
      // Arrange
      const mockVves = [
        {
          vveId: 'VVE-20260103-0001',
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          status: 'In Progress',
          actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
          createdAt: new Date(),
          creatorEmail: 'test@example.com'
        },
        {
          vveId: 'VVE-20260103-0002',
          vvnId: 'VVN-20260103-002',
          vesselIdentifier: 'IMO7654321',
          status: 'Completed',
          actualArrivalTime: new Date('2026-01-03T10:00:00Z'),
          createdAt: new Date(),
          creatorEmail: 'test@example.com'
        }
      ];

      mockVveRepository.findAll.mockResolvedValue(mockVves);

      // Act
      const result = await service.getAllVves();

      // Assert
      expect(mockVveRepository.findAll.mock.calls.length).toBe(1);
      expect(result).toHaveLength(2);
      expect(result[0].vveId).toBe('VVE-20260103-0001');
      expect(result[1].vveId).toBe('VVE-20260103-0002');
    });

    test('should pass filters to repository', async () => {
      // Arrange
      mockVveRepository.findAll.mockResolvedValue([]);

      const filters = {
        status: 'In Progress',
        vvnId: 'VVN-20260103-001',
        fromDate: '2026-01-01',
        toDate: '2026-01-31'
      };

      // Act
      await service.getAllVves(filters);

      // Assert
      expect(mockVveRepository.findAll.mock.calls.length).toBe(1);
      expect(mockVveRepository.findAll.mock.calls[0][0]).toEqual(filters);
    });

    test('should return empty array when no VVEs found', async () => {
      // Arrange
      mockVveRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getAllVves();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateVve', () => {
    test('should update VVE when found', async () => {
      // Arrange
      const existingVve = {
        vveId: 'VVE-20260103-0001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: new Date('2026-01-03T08:00:00Z'),
        status: 'In Progress',
        notes: 'Original notes',
        creatorEmail: 'test@example.com',
        executedOperations: [],
        auditLogs: []
      };

      const updateDto = new UpdateVveDto({
        status: 'Completed',
        actualDepartureTime: '2026-01-03T20:00:00Z',
        notes: 'Updated notes'
      });

      const updatedVve = {
        ...existingVve,
        status: 'Completed',
        actualDepartureTime: new Date('2026-01-03T20:00:00Z'),
        notes: 'Updated notes',
        updatedAt: new Date()
      };

      mockVveRepository.findById.mockResolvedValue(existingVve);
      mockVveRepository.update.mockResolvedValue(updatedVve);

      // Act
      const result = await service.updateVve('VVE-20260103-0001', updateDto, 'test@example.com');

      // Assert
      expect(mockVveRepository.findById.mock.calls.length).toBe(1);
      expect(mockVveRepository.update.mock.calls.length).toBe(1);
      expect(result.status).toBe('Completed');
      expect(result.notes).toBe('Updated notes');
    });

    test('should throw error when VVE not found', async () => {
      // Arrange
      const updateDto = new UpdateVveDto({
        status: 'Completed'
      });

      mockVveRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateVve('VVE-NONEXISTENT', updateDto, 'test@example.com'))
        .rejects.toThrow("VVE 'VVE-NONEXISTENT' not found");
      
      expect(mockVveRepository.update.mock.calls.length).toBe(0);
    });
  });

  describe('deleteVve', () => {
    test('should call repository delete method', async () => {
      // Arrange
      mockVveRepository.delete.mockResolvedValue(true);

      // Act
      const result = await service.deleteVve('VVE-20260103-0001');

      // Assert
      expect(mockVveRepository.delete.mock.calls.length).toBe(1);
      expect(mockVveRepository.delete.mock.calls[0][0]).toBe('VVE-20260103-0001');
      expect(result).toBe(true);
    });

    test('should return false when VVE does not exist', async () => {
      // Arrange
      mockVveRepository.delete.mockResolvedValue(false);

      // Act
      const result = await service.deleteVve('VVE-NONEXISTENT');

      // Assert
      expect(mockVveRepository.delete.mock.calls.length).toBe(1);
      expect(result).toBe(false);
    });
  });
});

