import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DockService } from '../../../app/dock/dock.service';
import { DockValidationError } from '../../../domain/dock/dock.errors';
import type { IDockRepository } from '../../../app/dock/dock.repository';
import type { Dock } from '../../../domain/dock/dock.model';
import type {
    DockCreateDto,
    UpdateDockDto
} from '../../../infrastructure/repositories/dock/dock.dto';

// Mock repository implementation for testing
class MockDockRepository implements IDockRepository {
    getAll = vi.fn();
    getById = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
}

describe('DockService', () => {
    let service: DockService;
    let mockRepo: MockDockRepository;

    const mockDock: Dock = {
        id: 'dock-001',
        name: 'Main Terminal',
        locationZone: 'North Zone',
        locationSection: 'Section A',
        lengthInMeters: 300,
        depthInMeters: 15,
        maxDraftInMeters: 14,
        numberOfSTSCranes: 3,
        allowedVesselTypeIds: ['vt-001']
    };

    beforeEach(() => {
        mockRepo = new MockDockRepository();
        service = new DockService(mockRepo);
    });

    describe('constructor', () => {
        it('should initialize with repository', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(DockService);
        });
    });

    describe('getAllDocks', () => {
        it('should fetch and return all docks', async () => {
            const mockDocks = [mockDock];
            mockRepo.getAll.mockResolvedValue(mockDocks);

            const result = await service.getAllDocks();

            expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockDocks);
        });

        it('should return empty array when no docks exist', async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.getAllDocks();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should handle repository errors', async () => {
            mockRepo.getAll.mockRejectedValue(new Error('Database error'));

            await expect(service.getAllDocks()).rejects.toThrow('Database error');
        });

        it('should return multiple docks', async () => {
            const mockDocks = [
                mockDock,
                { ...mockDock, id: 'dock-002', name: 'Pier 2', lengthInMeters: 200 },
                { ...mockDock, id: 'dock-003', name: 'RoRo Dock', numberOfSTSCranes: 0 }
            ];
            mockRepo.getAll.mockResolvedValue(mockDocks);

            const result = await service.getAllDocks();

            expect(result).toHaveLength(3);
            expect(result).toEqual(mockDocks);
        });
    });

    describe('getDockById', () => {
        it('should fetch dock by ID', async () => {
            mockRepo.getById.mockResolvedValue(mockDock);

            const result = await service.getDockById('dock-001');

            expect(mockRepo.getById).toHaveBeenCalledWith('dock-001');
            expect(result).toEqual(mockDock);
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.getDockById('')).rejects.toThrow(DockValidationError);
            await expect(service.getDockById('')).rejects.toThrow('Dock ID is required');
            expect(mockRepo.getById).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.getDockById('   ')).rejects.toThrow(DockValidationError);
            await expect(service.getDockById('   ')).rejects.toThrow('Dock ID is required');
            expect(mockRepo.getById).not.toHaveBeenCalled();
        });

        it('should handle non-existent dock', async () => {
            mockRepo.getById.mockRejectedValue(new Error('Not found'));

            await expect(service.getDockById('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('createDock', () => {
        const validDto: DockCreateDto = {
            id: 'dock-new',
            name: 'New Dock',
            locationZone: 'New Zone',
            locationSection: 'Section X',
            lengthInMeters: 400,
            depthInMeters: 20,
            maxDraftInMeters: 18,
            numberOfSTSCranes: 4,
            allowedVesselTypeIds: ['vt-001']
        };

        it('should create dock with valid data', async () => {
            mockRepo.create.mockResolvedValue(mockDock);

            const result = await service.createDock(validDto);

            expect(mockRepo.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(mockDock);
        });

        // --- Name Validation ---
        it('should throw error when name is missing', async () => {
            const invalidDto = { ...validDto, name: '' };
            await expect(service.createDock(invalidDto)).rejects.toThrow(DockValidationError);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when name is only whitespace', async () => {
            const invalidDto = { ...validDto, name: '   ' };
            await expect(service.createDock(invalidDto)).rejects.toThrow(DockValidationError);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        // --- Location Validation ---
        it('should throw error when location zone is missing', async () => {
            const invalidDto = { ...validDto, locationZone: '' };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Location Zone is required');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when location section is missing', async () => {
            const invalidDto = { ...validDto, locationSection: '' };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Location Section is required');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        // --- Numeric Validations (Dimensions) ---
        it('should throw error when length is zero', async () => {
            const invalidDto = { ...validDto, lengthInMeters: 0 };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Length must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when length is negative', async () => {
            const invalidDto = { ...validDto, lengthInMeters: -100 };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Length must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when depth is zero', async () => {
            const invalidDto = { ...validDto, depthInMeters: 0 };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Depth must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when max draft is zero', async () => {
            const invalidDto = { ...validDto, maxDraftInMeters: 0 };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Max Draft must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        // --- Numeric Validation (Cranes) ---
        it('should accept zero cranes (e.g. simple pier)', async () => {
            const noCraneDto = { ...validDto, numberOfSTSCranes: 0 };
            mockRepo.create.mockResolvedValue({ ...mockDock, numberOfSTSCranes: 0 });

            const result = await service.createDock(noCraneDto);

            expect(mockRepo.create).toHaveBeenCalledWith(noCraneDto);
            expect(result).toBeDefined();
        });

        it('should throw error when cranes is negative', async () => {
            const invalidDto = { ...validDto, numberOfSTSCranes: -1 };
            await expect(service.createDock(invalidDto)).rejects.toThrow('Number of STS Cranes cannot be negative');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should handle repository errors during creation', async () => {
            mockRepo.create.mockRejectedValue(new Error('Creation failed'));
            await expect(service.createDock(validDto)).rejects.toThrow('Creation failed');
        });
    });

    describe('updateDock', () => {
        const validDto: UpdateDockDto = {
            name: 'Updated Dock Name',
            lengthInMeters: 350,
            numberOfSTSCranes: 5
        };

        it('should update dock with valid data', async () => {
            const updatedDock = { ...mockDock, ...validDto };
            mockRepo.update.mockResolvedValue(updatedDock);

            const result = await service.updateDock('dock-001', validDto);

            expect(mockRepo.update).toHaveBeenCalledWith('dock-001', validDto);
            expect(result).toEqual(updatedDock);
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.updateDock('', validDto)).rejects.toThrow(DockValidationError);
            await expect(service.updateDock('', validDto)).rejects.toThrow('Dock ID is required');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.updateDock('   ', validDto)).rejects.toThrow(DockValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        // --- Partial Update Validations ---
        it('should throw error when provided name is empty', async () => {
            const invalidDto = { name: '' };
            await expect(service.updateDock('dock-001', invalidDto)).rejects.toThrow('Dock name cannot be empty');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when provided location zone is empty', async () => {
            const invalidDto = { locationZone: '  ' };
            await expect(service.updateDock('dock-001', invalidDto)).rejects.toThrow('Location Zone cannot be empty');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when provided length is invalid', async () => {
            const invalidDto = { lengthInMeters: 0 };
            await expect(service.updateDock('dock-001', invalidDto)).rejects.toThrow('Length must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when provided depth is invalid', async () => {
            const invalidDto = { depthInMeters: -5 };
            await expect(service.updateDock('dock-001', invalidDto)).rejects.toThrow('Depth must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when provided draft is invalid', async () => {
            const invalidDto = { maxDraftInMeters: 0 };
            await expect(service.updateDock('dock-001', invalidDto)).rejects.toThrow('Max Draft must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when provided cranes count is negative', async () => {
            const invalidDto = { numberOfSTSCranes: -1 };
            await expect(service.updateDock('dock-001', invalidDto)).rejects.toThrow('Number of STS Cranes cannot be negative');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should allow partial updates with only name', async () => {
            const partialDto: UpdateDockDto = { name: 'New Name' };
            mockRepo.update.mockResolvedValue({ ...mockDock, name: 'New Name' });

            const result = await service.updateDock('dock-001', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('dock-001', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow partial updates with only length', async () => {
            const partialDto: UpdateDockDto = { lengthInMeters: 500 };
            mockRepo.update.mockResolvedValue({ ...mockDock, lengthInMeters: 500 });

            const result = await service.updateDock('dock-001', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('dock-001', partialDto);
            expect(result).toBeDefined();
        });

        it('should handle repository errors during update', async () => {
            mockRepo.update.mockRejectedValue(new Error('Update failed'));

            await expect(service.updateDock('dock-001', validDto)).rejects.toThrow('Update failed');
        });
    });

    describe('deleteDock', () => {
        it('should delete dock by ID', async () => {
            mockRepo.delete.mockResolvedValue(undefined);

            await service.deleteDock('dock-001');

            expect(mockRepo.delete).toHaveBeenCalledWith('dock-001');
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.deleteDock('')).rejects.toThrow(DockValidationError);
            await expect(service.deleteDock('')).rejects.toThrow('Dock ID is required');
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.deleteDock('   ')).rejects.toThrow(DockValidationError);
            await expect(service.deleteDock('   ')).rejects.toThrow('Dock ID is required');
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });

        it('should handle deletion errors', async () => {
            mockRepo.delete.mockRejectedValue(new Error('Cannot delete'));

            await expect(service.deleteDock('dock-001')).rejects.toThrow('Cannot delete');
        });

        it('should handle non-existent dock deletion', async () => {
            mockRepo.delete.mockRejectedValue(new Error('Not found'));

            await expect(service.deleteDock('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete CRUD lifecycle', async () => {
            const createDto: DockCreateDto = {
                id: 'dock-cycle',
                name: 'Lifecycle Dock',
                locationZone: 'Z',
                locationSection: 'S',
                lengthInMeters: 100,
                depthInMeters: 10,
                maxDraftInMeters: 9,
                numberOfSTSCranes: 1
            };
            const updateDto: UpdateDockDto = {
                numberOfSTSCranes: 2
            };

            mockRepo.create.mockResolvedValue(mockDock);
            mockRepo.getById.mockResolvedValue(mockDock);
            mockRepo.update.mockResolvedValue({ ...mockDock, numberOfSTSCranes: 2 });
            mockRepo.delete.mockResolvedValue(undefined);

            // Create
            await service.createDock(createDto);
            expect(mockRepo.create).toHaveBeenCalled();

            // Read
            await service.getDockById('dock-cycle');
            expect(mockRepo.getById).toHaveBeenCalled();

            // Update
            await service.updateDock('dock-cycle', updateDto);
            expect(mockRepo.update).toHaveBeenCalled();

            // Delete
            await service.deleteDock('dock-cycle');
            expect(mockRepo.delete).toHaveBeenCalled();
        });

        it('should validate all fields during creation', async () => {
            const invalidDto: DockCreateDto = {
                id: 'dock-invalid',
                name: '',
                locationZone: '',
                locationSection: '',
                lengthInMeters: -10,
                depthInMeters: 0,
                maxDraftInMeters: -5,
                numberOfSTSCranes: -1
            };

            await expect(service.createDock(invalidDto)).rejects.toThrow(DockValidationError);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });
});