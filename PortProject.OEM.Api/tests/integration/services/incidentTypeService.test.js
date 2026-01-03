/**
 * Integration Tests for IncidentTypeService
 * 
 * Type: Functional Testing with SUT = aggregate
 * Goal: Test the Service interacting with a Mock Repository
 * Tool: Jest with manual mocking
 */

import { IncidentTypeService } from '../../../src/services/incidentTypeService.js';
import { CreateIncidentTypeDto } from '../../../src/application/dtos/IncidentTypeDto.js';

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

describe('Integration Test - IncidentTypeService with Mock Repository', () => {
    
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            create: createMockFn(),
            findAll: createMockFn(),
            findById: createMockFn(),
            exists: createMockFn(),
            existsByCode: createMockFn(),
            update: createMockFn(),
            delete: createMockFn()
        };

        service = new IncidentTypeService(mockRepository);
    });

    describe('createIncidentType', () => {
        test('should create incident type when valid', async () => {
            // Arrange
            const dto = new CreateIncidentTypeDto({
                code: 'INC-001',
                name: 'Fire',
                severity: 'Critical'
            });
            
            mockRepository.existsByCode.mockResolvedValue(false);
            mockRepository.create.mockResolvedValue({
                id: '1',
                ...dto
            });

            // Act
            const result = await service.createIncidentType(dto);

            // Assert
            expect(result.id).toBe('1');
            expect(mockRepository.create.mock.calls.length).toBe(1);
        });

        test('should throw error if code exists', async () => {
            // Arrange
            const dto = new CreateIncidentTypeDto({
                code: 'INC-001',
                name: 'Fire',
                severity: 'Critical'
            });
            
            mockRepository.existsByCode.mockResolvedValue(true);

            // Act & Assert
            await expect(service.createIncidentType(dto))
                .rejects.toThrow("Incident Type with code 'INC-001' already exists");
        });
    });

    describe('getAllIncidentTypes', () => {
        test('should return all types and populate parents', async () => {
            // Arrange
            const parent = { id: 'P1', name: 'Parent' };
            const child = { id: 'C1', parentId: 'P1', name: 'Child' };
            
            mockRepository.findAll.mockResolvedValue([child]);
            mockRepository.findById.mockResolvedValue(parent);

            // Act
            const result = await service.getAllIncidentTypes();

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].parent).toEqual(parent);
        });
    });
});

