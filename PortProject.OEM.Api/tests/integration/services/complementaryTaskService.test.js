/**
 * Integration Tests for ComplementaryTaskService
 * 
 * Type: Functional Testing with SUT = aggregate
 * Goal: Test the Service interacting with a Mock Repository
 * Tool: Jest with manual mocking
 */

import { ComplementaryTaskService } from '../../../src/services/complementaryTaskService.js';
import { CreateComplementaryTaskDto, UpdateComplementaryTaskDto } from '../../../src/application/dtos/ComplementaryTaskDto.js';

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

describe('Integration Test - ComplementaryTaskService with Mock Repository', () => {
    
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            create: createMockFn(),
            findById: createMockFn(),
            update: createMockFn(),
            search: createMockFn(),
            delete: createMockFn(),
            findByVveId: createMockFn(),
            findOngoingTasksSuspendingOperations: createMockFn(),
            getAll: createMockFn()
        };

        // Create service instance and manually inject mock
        service = new ComplementaryTaskService();
        service.repository = mockRepository;
    });

    describe('createTask', () => {
        test('should create task with valid data', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskDto({
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-15T10:00:00Z'),
                description: 'Safety inspection',
                status: 'PENDING',
                suspendsOperations: false
            });
            
            mockRepository.create.mockResolvedValue({
                taskId: 'CT-2026-123456',
                ...dto,
                createdBy: 'system',
                createdAt: new Date()
            });

            // Act
            const result = await service.createTask(dto);

            // Assert
            expect(result.taskId).toBe('CT-2026-123456');
            expect(mockRepository.create.mock.calls.length).toBe(1);
            expect(mockRepository.create.mock.calls[0][0].categoryId).toBe('CAT-001');
            expect(mockRepository.create.mock.calls[0][0].vveId).toBe('VVE-001');
        });

        test('should generate taskId with correct format', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskDto({
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            });
            
            mockRepository.create.mockResolvedValue({
                taskId: 'CT-2026-123456',
                ...dto
            });

            // Act
            await service.createTask(dto);

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.taskId).toMatch(/^CT-2026-\d{6}$/);
        });

        test('should throw error when categoryId is missing', async () => {
            // Arrange
            const dto = {
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };

            // Act & Assert
            await expect(service.createTask(dto))
                .rejects.toThrow('Category ID is required');
        });

        test('should throw error when vveId is missing', async () => {
            // Arrange
            const dto = {
                categoryId: 'CAT-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };

            // Act & Assert
            await expect(service.createTask(dto))
                .rejects.toThrow('VVE ID is required');
        });

        test('should throw error when responsibleTeam is missing', async () => {
            // Arrange
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                startTime: new Date()
            };

            // Act & Assert
            await expect(service.createTask(dto))
                .rejects.toThrow('Responsible team is required');
        });

        test('should throw error when startTime is missing', async () => {
            // Arrange
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team'
            };

            // Act & Assert
            await expect(service.createTask(dto))
                .rejects.toThrow('Start time is required');
        });

        test('should throw error when endTime is before startTime', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskDto({
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-15T10:00:00Z'),
                endTime: new Date('2026-01-15T09:00:00Z')
            });

            // Act & Assert
            await expect(service.createTask(dto))
                .rejects.toThrow('End time must be after start time');
        });

        test('should throw error when status is invalid', async () => {
            // Arrange
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'INVALID_STATUS'
            };

            // Act & Assert
            await expect(service.createTask(dto))
                .rejects.toThrow('Invalid status');
        });

        test('should default status to PENDING when not provided', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskDto({
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            });
            
            mockRepository.create.mockResolvedValue({
                taskId: 'CT-2026-123456',
                ...dto
            });

            // Act
            await service.createTask(dto);

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.status).toBe('PENDING');
        });

        test('should default suspendsOperations to false when not provided', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskDto({
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            });
            
            mockRepository.create.mockResolvedValue({
                taskId: 'CT-2026-123456',
                ...dto
            });

            // Act
            await service.createTask(dto);

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.suspendsOperations).toBe(false);
        });
    });

    describe('getTaskById', () => {
        test('should return task when it exists', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const mockTask = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'ONGOING'
            };
            
            mockRepository.findById.mockResolvedValue(mockTask);

            // Act
            const result = await service.getTaskById(taskId);

            // Assert
            expect(result).toEqual(mockTask);
            expect(mockRepository.findById.mock.calls[0][0]).toBe(taskId);
        });

        test('should throw error when task does not exist', async () => {
            // Arrange
            const taskId = 'CT-2026-999';
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getTaskById(taskId))
                .rejects.toThrow("Complementary Task 'CT-2026-999' not found");
        });

        test('should throw error when taskId is empty', async () => {
            // Act & Assert
            await expect(service.getTaskById(''))
                .rejects.toThrow('Task ID is required');
        });
    });

    describe('updateTask', () => {
        test('should update task status', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-15T10:00:00Z'),
                status: 'PENDING'
            };

            const dto = new UpdateComplementaryTaskDto({
                status: 'ONGOING'
            });

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.update.mockResolvedValue({
                ...existing,
                status: 'ONGOING',
                updatedBy: 'system'
            });

            // Act
            const result = await service.updateTask(taskId, dto);

            // Assert
            expect(result.status).toBe('ONGOING');
            expect(mockRepository.update.mock.calls[0][0]).toBe(taskId);
            expect(mockRepository.update.mock.calls[0][1].status).toBe('ONGOING');
        });

        test('should update task categoryId', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'PENDING'
            };

            const dto = new UpdateComplementaryTaskDto({
                categoryId: 'CAT-002'
            });

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.update.mockResolvedValue({
                ...existing,
                categoryId: 'CAT-002'
            });

            // Act
            const result = await service.updateTask(taskId, dto);

            // Assert
            expect(result.categoryId).toBe('CAT-002');
        });

        test('should update responsibleTeam', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'PENDING'
            };

            const dto = new UpdateComplementaryTaskDto({
                responsibleTeam: 'Hull Crew'
            });

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.update.mockResolvedValue({
                ...existing,
                responsibleTeam: 'Hull Crew'
            });

            // Act
            const result = await service.updateTask(taskId, dto);

            // Assert
            expect(result.responsibleTeam).toBe('Hull Crew');
        });

        test('should add endTime to complete a task', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const startTime = new Date('2026-01-15T10:00:00Z');
            const endTime = new Date('2026-01-15T12:00:00Z');
            
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: startTime,
                endTime: null,
                status: 'ONGOING'
            };

            const dto = new UpdateComplementaryTaskDto({
                status: 'COMPLETED',
                endTime: endTime
            });

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.update.mockResolvedValue({
                ...existing,
                status: 'COMPLETED',
                endTime: endTime
            });

            // Act
            const result = await service.updateTask(taskId, dto);

            // Assert
            expect(result.status).toBe('COMPLETED');
            expect(result.endTime).toEqual(endTime);
        });

        test('should throw error when updating with invalid status', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'PENDING'
            };

            const dto = new UpdateComplementaryTaskDto({
                status: 'INVALID_STATUS'
            });

            mockRepository.findById.mockResolvedValue(existing);

            // Act & Assert
            await expect(service.updateTask(taskId, dto))
                .rejects.toThrow('Invalid status');
        });

        test('should throw error when task does not exist', async () => {
            // Arrange
            const taskId = 'CT-2026-999';
            const dto = new UpdateComplementaryTaskDto({
                status: 'ONGOING'
            });

            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.updateTask(taskId, dto))
                .rejects.toThrow("Complementary Task 'CT-2026-999' not found");
        });

        test('should throw error when endTime is before startTime', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-15T10:00:00Z'),
                status: 'ONGOING'
            };

            const dto = new UpdateComplementaryTaskDto({
                endTime: new Date('2026-01-15T09:00:00Z')
            });

            mockRepository.findById.mockResolvedValue(existing);

            // Act & Assert
            await expect(service.updateTask(taskId, dto))
                .rejects.toThrow('End time must be after start time');
        });

        test('should update suspendsOperations flag', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'PENDING',
                suspendsOperations: false
            };

            const dto = new UpdateComplementaryTaskDto({
                suspendsOperations: true
            });

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.update.mockResolvedValue({
                ...existing,
                suspendsOperations: true
            });

            // Act
            const result = await service.updateTask(taskId, dto);

            // Assert
            expect(result.suspendsOperations).toBe(true);
        });
    });

    describe('deleteTask', () => {
        test('should delete existing task', async () => {
            // Arrange
            const taskId = 'CT-2026-001';
            const existing = {
                taskId: taskId,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: 'PENDING'
            };

            mockRepository.findById.mockResolvedValue(existing);
            mockRepository.delete.mockResolvedValue(true);

            // Act
            const result = await service.deleteTask(taskId);

            // Assert
            expect(result).toBe(true);
            expect(mockRepository.delete.mock.calls[0][0]).toBe(taskId);
        });

        test('should throw error when task does not exist', async () => {
            // Arrange
            const taskId = 'CT-2026-999';
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteTask(taskId))
                .rejects.toThrow("Complementary Task 'CT-2026-999' not found");
        });

        test('should throw error when taskId is empty', async () => {
            // Act & Assert
            await expect(service.deleteTask(''))
                .rejects.toThrow('Task ID is required');
        });
    });

    describe('searchTasks', () => {
        test('should return filtered tasks', async () => {
            // Arrange
            const filters = {
                vveId: 'VVE-001',
                status: 'ONGOING'
            };

            const mockTasks = [
                {
                    taskId: 'CT-2026-001',
                    categoryId: 'CAT-001',
                    vveId: 'VVE-001',
                    status: 'ONGOING'
                },
                {
                    taskId: 'CT-2026-002',
                    categoryId: 'CAT-002',
                    vveId: 'VVE-001',
                    status: 'ONGOING'
                }
            ];

            mockRepository.search.mockResolvedValue(mockTasks);

            // Act
            const result = await service.searchTasks(filters);

            // Assert
            expect(result).toEqual(mockTasks);
            expect(result).toHaveLength(2);
            expect(mockRepository.search.mock.calls[0][0]).toEqual(filters);
        });
    });

    describe('getTasksByVveId', () => {
        test('should return tasks for specific VVE', async () => {
            // Arrange
            const vveId = 'VVE-001';
            const mockTasks = [
                {
                    taskId: 'CT-2026-001',
                    categoryId: 'CAT-001',
                    vveId: vveId,
                    status: 'ONGOING'
                }
            ];

            mockRepository.findByVveId.mockResolvedValue(mockTasks);

            // Act
            const result = await service.getTasksByVveId(vveId);

            // Assert
            expect(result).toEqual(mockTasks);
            expect(mockRepository.findByVveId.mock.calls[0][0]).toBe(vveId);
        });

        test('should throw error when vveId is empty', async () => {
            // Act & Assert
            await expect(service.getTasksByVveId(''))
                .rejects.toThrow('VVE ID is required');
        });
    });

    describe('getOngoingImpactingTasks', () => {
        test('should return only ongoing tasks that suspend operations', async () => {
            // Arrange
            const mockTasks = [
                {
                    taskId: 'CT-2026-001',
                    categoryId: 'CAT-001',
                    vveId: 'VVE-001',
                    status: 'ONGOING',
                    suspendsOperations: true
                },
                {
                    taskId: 'CT-2026-002',
                    categoryId: 'CAT-002',
                    vveId: 'VVE-002',
                    status: 'ONGOING',
                    suspendsOperations: true
                }
            ];

            mockRepository.findOngoingTasksSuspendingOperations.mockResolvedValue(mockTasks);

            // Act
            const result = await service.getOngoingImpactingTasks();

            // Assert
            expect(result).toEqual(mockTasks);
            expect(result.every(t => t.status === 'ONGOING' && t.suspendsOperations)).toBe(true);
        });
    });

    describe('getAllTasks', () => {
        test('should return all tasks', async () => {
            // Arrange
            const mockTasks = [
                {
                    taskId: 'CT-2026-001',
                    categoryId: 'CAT-001',
                    vveId: 'VVE-001',
                    status: 'COMPLETED'
                },
                {
                    taskId: 'CT-2026-002',
                    categoryId: 'CAT-002',
                    vveId: 'VVE-002',
                    status: 'ONGOING'
                }
            ];

            mockRepository.getAll.mockResolvedValue(mockTasks);

            // Act
            const result = await service.getAllTasks();

            // Assert
            expect(result).toEqual(mockTasks);
            expect(result).toHaveLength(2);
        });
    });
});

