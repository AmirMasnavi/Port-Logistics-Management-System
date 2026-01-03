/**
 * Integration Tests for IncidentService
 * 
 * Type: Functional Testing with SUT = aggregate
 * Goal: Test the Service interacting with a Mock Repository
 * Tool: Jest with manual mocking
 */

import { IncidentService } from '../../../src/services/incidentService.js';
import { CreateIncidentDto, UpdateIncidentDto } from '../../../src/application/dtos/IncidentDto.js';

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

describe('Integration Test - IncidentService with Mock Repository', () => {
    
    let service;
    let mockRepository;
    let mockTypeRepository;

    beforeEach(() => {
        mockRepository = {
            create: createMockFn(),
            findById: createMockFn(),
            update: createMockFn(),
            search: createMockFn(),
            delete: createMockFn()
        };

        mockTypeRepository = {
            exists: createMockFn()
        };

        // Create service instance and manually inject mocks
        service = new IncidentService();
        service.repository = mockRepository;
        service.incidentTypeRepository = mockTypeRepository;
    });

    describe('createIncident', () => {
        test('should create incident when type exists', async () => {
            // Arrange
            const dto = new CreateIncidentDto({
                title: 'Fire',
                incidentTypeId: 'T1',
                severity: 'Critical',
                startTime: new Date(),
                description: 'Desc'
            });
            
            mockTypeRepository.exists.mockResolvedValue(true);
            mockRepository.create.mockResolvedValue({
                incidentId: 'INC-1',
                ...dto
            });

            // Act
            const result = await service.createIncident(dto);

            // Assert
            expect(result.incidentId).toBe('INC-1');
            expect(mockRepository.create.mock.calls.length).toBe(1);
        });

        test('should throw error if type does not exist', async () => {
            // Arrange
            const dto = new CreateIncidentDto({
                title: 'Fire',
                incidentTypeId: 'T1',
                severity: 'Critical',
                startTime: new Date()
            });
            
            mockTypeRepository.exists.mockResolvedValue(false);

            // Act & Assert
            await expect(service.createIncident(dto))
                .rejects.toThrow("Incident Type 'T1' not found");
        });
    });

    describe('updateIncident', () => {
        test('should calculate duration when resolved', async () => {
            // Arrange
            const startTime = new Date('2025-01-01T10:00:00Z');
            const endTime = new Date('2025-01-01T11:00:00Z');
            
            const existing = {
                incidentId: 'INC-1',
                startTime: startTime,
                status: 'Active'
            };

            const dto = new UpdateIncidentDto({
                status: 'Resolved',
                endTime: endTime
            });

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.update.mockResolvedValue({
                ...existing,
                status: 'Resolved',
                endTime: endTime,
                durationMinutes: 60
            });

            // Act
            const result = await service.updateIncident('INC-1', dto);

            // Assert
            expect(result.durationMinutes).toBe(60);
            expect(mockRepository.update.mock.calls[0][1].durationMinutes).toBe(60);
        });
    });
});

