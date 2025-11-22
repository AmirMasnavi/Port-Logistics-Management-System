import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VesselTypeService } from '../../../app/vesselType/vesselType.service';
import { VesselTypeValidationError } from '../../../domain/vesselType/vesselType.errors';
import type { IVesselTypeRepository } from '../../../app/vesselType/vesselType.repository';
import type { VesselType } from '../../../domain/vesselType/vesselType.model';
import type {
    CreateVesselTypeDto,
    UpdateVesselTypeDto
} from '../../../infrastructure/repositories/vesselType/vesselType.dto';

// Mock repository implementation for testing
class MockVesselTypeRepository implements IVesselTypeRepository {
    getAll = vi.fn();
    getById = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
}

describe('VesselTypeService', () => {
    let service: VesselTypeService;
    let mockRepo: MockVesselTypeRepository;

    const mockVesselType: VesselType = {
        id: '1',
        name: 'Container Ship',
        description: 'Large container vessel for cargo transport',
        capacity: 5000,
        maxRows: 10,
        maxBays: 20,
        maxTiers: 8
    };

    beforeEach(() => {
        mockRepo = new MockVesselTypeRepository();
        service = new VesselTypeService(mockRepo);
    });

    describe('constructor', () => {
        it('should initialize with repository', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(VesselTypeService);
        });
    });

    describe('getAllVesselTypes', () => {
        it('should fetch and return all vessel types', async () => {
            const mockVesselTypes = [mockVesselType];
            mockRepo.getAll.mockResolvedValue(mockVesselTypes);

            const result = await service.getAllVesselTypes();

            expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVesselTypes);
        });

        it('should return empty array when no vessel types exist', async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.getAllVesselTypes();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should handle repository errors', async () => {
            mockRepo.getAll.mockRejectedValue(new Error('Database error'));

            await expect(service.getAllVesselTypes()).rejects.toThrow('Database error');
        });

        it('should return multiple vessel types', async () => {
            const mockVesselTypes = [
                mockVesselType,
                { ...mockVesselType, id: '2', name: 'Tanker', capacity: 3000 },
                { ...mockVesselType, id: '3', name: 'Bulk Carrier', capacity: 7000 }
            ];
            mockRepo.getAll.mockResolvedValue(mockVesselTypes);

            const result = await service.getAllVesselTypes();

            expect(result).toHaveLength(3);
            expect(result).toEqual(mockVesselTypes);
        });
    });

    describe('getVesselTypeById', () => {
        it('should fetch vessel type by ID', async () => {
            mockRepo.getById.mockResolvedValue(mockVesselType);

            const result = await service.getVesselTypeById('1');

            expect(mockRepo.getById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockVesselType);
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.getVesselTypeById('')).rejects.toThrow(VesselTypeValidationError);
            await expect(service.getVesselTypeById('')).rejects.toThrow('Vessel Type ID is required');
            expect(mockRepo.getById).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.getVesselTypeById('   ')).rejects.toThrow(VesselTypeValidationError);
            await expect(service.getVesselTypeById('   ')).rejects.toThrow('Vessel Type ID is required');
            expect(mockRepo.getById).not.toHaveBeenCalled();
        });

        it('should handle non-existent vessel type', async () => {
            mockRepo.getById.mockRejectedValue(new Error('Not found'));

            await expect(service.getVesselTypeById('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('createVesselType', () => {
        const validDto: CreateVesselTypeDto = {
            id: 'vt-001',
            name: 'Container Ship',
            description: 'Large container vessel for cargo transport',
            capacity: 5000,
            maxRows: 10,
            maxBays: 20,
            maxTiers: 8
        };

        it('should create vessel type with valid data', async () => {
            mockRepo.create.mockResolvedValue(mockVesselType);

            const result = await service.createVesselType(validDto);

            expect(mockRepo.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(mockVesselType);
        });

        it('should throw error when name is missing', async () => {
            const invalidDto = { ...validDto, name: '' };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Vessel Type name is required');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when name is only whitespace', async () => {
            const invalidDto = { ...validDto, name: '   ' };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Vessel Type name is required');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when capacity is zero', async () => {
            const invalidDto = { ...validDto, capacity: 0 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Capacity must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when capacity is negative', async () => {
            const invalidDto = { ...validDto, capacity: -100 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Capacity must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when maxRows is zero', async () => {
            const invalidDto = { ...validDto, maxRows: 0 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Max Rows must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when maxRows is negative', async () => {
            const invalidDto = { ...validDto, maxRows: -5 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Max Rows must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when maxBays is zero', async () => {
            const invalidDto = { ...validDto, maxBays: 0 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Max Bays must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when maxBays is negative', async () => {
            const invalidDto = { ...validDto, maxBays: -10 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Max Bays must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when maxTiers is zero', async () => {
            const invalidDto = { ...validDto, maxTiers: 0 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Max Tiers must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when maxTiers is negative', async () => {
            const invalidDto = { ...validDto, maxTiers: -3 };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.createVesselType(invalidDto)).rejects.toThrow('Max Tiers must be greater than 0');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should accept vessel type with minimum valid values', async () => {
            const minimalDto: CreateVesselTypeDto = {
                id: 'vt-002',
                name: 'Small Ship',
                description: 'Small vessel',
                capacity: 1,
                maxRows: 1,
                maxBays: 1,
                maxTiers: 1
            };
            mockRepo.create.mockResolvedValue({ ...mockVesselType, ...minimalDto });

            const result = await service.createVesselType(minimalDto);

            expect(mockRepo.create).toHaveBeenCalledWith(minimalDto);
            expect(result).toBeDefined();
        });

        it('should accept vessel type with large values', async () => {
            const largeDto: CreateVesselTypeDto = {
                id: 'vt-003',
                name: 'Ultra Large Container Ship',
                description: 'Ultra large container vessel with maximum capacity',
                capacity: 24000,
                maxRows: 30,
                maxBays: 50,
                maxTiers: 15
            };
            mockRepo.create.mockResolvedValue({ ...mockVesselType, ...largeDto });

            const result = await service.createVesselType(largeDto);

            expect(mockRepo.create).toHaveBeenCalledWith(largeDto);
            expect(result).toBeDefined();
        });

        it('should handle repository errors during creation', async () => {
            mockRepo.create.mockRejectedValue(new Error('Creation failed'));

            await expect(service.createVesselType(validDto)).rejects.toThrow('Creation failed');
        });
    });

    describe('updateVesselType', () => {
        const validDto: UpdateVesselTypeDto = {
            name: 'Updated Container Ship',
            capacity: 6000,
            maxRows: 12,
            maxBays: 22,
            maxTiers: 10
        };

        it('should update vessel type with valid data', async () => {
            const updatedVesselType = { ...mockVesselType, ...validDto };
            mockRepo.update.mockResolvedValue(updatedVesselType);

            const result = await service.updateVesselType('1', validDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', validDto);
            expect(result).toEqual(updatedVesselType);
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.updateVesselType('', validDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('', validDto)).rejects.toThrow('Vessel Type ID is required');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.updateVesselType('   ', validDto)).rejects.toThrow(VesselTypeValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when name is empty string', async () => {
            const invalidDto = { ...validDto, name: '' };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow('Vessel Type name cannot be empty');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when name is only whitespace', async () => {
            const invalidDto = { ...validDto, name: '   ' };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow('Vessel Type name cannot be empty');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when capacity is zero', async () => {
            const invalidDto = { ...validDto, capacity: 0 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow('Capacity must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when capacity is negative', async () => {
            const invalidDto = { ...validDto, capacity: -500 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when maxRows is zero', async () => {
            const invalidDto = { ...validDto, maxRows: 0 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow('Max Rows must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when maxRows is negative', async () => {
            const invalidDto = { ...validDto, maxRows: -2 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when maxBays is zero', async () => {
            const invalidDto = { ...validDto, maxBays: 0 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow('Max Bays must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when maxBays is negative', async () => {
            const invalidDto = { ...validDto, maxBays: -15 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when maxTiers is zero', async () => {
            const invalidDto = { ...validDto, maxTiers: 0 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow('Max Tiers must be greater than 0');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when maxTiers is negative', async () => {
            const invalidDto = { ...validDto, maxTiers: -4 };

            await expect(service.updateVesselType('1', invalidDto)).rejects.toThrow(VesselTypeValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should allow partial updates with only name', async () => {
            const partialDto: UpdateVesselTypeDto = { name: 'New Name' };
            mockRepo.update.mockResolvedValue({ ...mockVesselType, name: 'New Name' });

            const result = await service.updateVesselType('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow partial updates with only capacity', async () => {
            const partialDto: UpdateVesselTypeDto = { capacity: 7000 };
            mockRepo.update.mockResolvedValue({ ...mockVesselType, capacity: 7000 });

            const result = await service.updateVesselType('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow partial updates with multiple fields', async () => {
            const partialDto: UpdateVesselTypeDto = { 
                capacity: 8000, 
                maxRows: 15 
            };
            mockRepo.update.mockResolvedValue({ ...mockVesselType, ...partialDto });

            const result = await service.updateVesselType('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should handle repository errors during update', async () => {
            mockRepo.update.mockRejectedValue(new Error('Update failed'));

            await expect(service.updateVesselType('1', validDto)).rejects.toThrow('Update failed');
        });
    });

    describe('deleteVesselType', () => {
        it('should delete vessel type by ID', async () => {
            mockRepo.delete.mockResolvedValue(undefined);

            await service.deleteVesselType('1');

            expect(mockRepo.delete).toHaveBeenCalledWith('1');
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.deleteVesselType('')).rejects.toThrow(VesselTypeValidationError);
            await expect(service.deleteVesselType('')).rejects.toThrow('Vessel Type ID is required');
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.deleteVesselType('   ')).rejects.toThrow(VesselTypeValidationError);
            await expect(service.deleteVesselType('   ')).rejects.toThrow('Vessel Type ID is required');
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });

        it('should handle deletion errors', async () => {
            mockRepo.delete.mockRejectedValue(new Error('Cannot delete'));

            await expect(service.deleteVesselType('1')).rejects.toThrow('Cannot delete');
        });

        it('should handle non-existent vessel type deletion', async () => {
            mockRepo.delete.mockRejectedValue(new Error('Not found'));

            await expect(service.deleteVesselType('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete CRUD lifecycle', async () => {
            const createDto: CreateVesselTypeDto = {
                id: 'vt-004',
                name: 'Test Ship',
                description: 'Test vessel for lifecycle',
                capacity: 3000,
                maxRows: 8,
                maxBays: 16,
                maxTiers: 6
            };
            const updateDto: UpdateVesselTypeDto = {
                capacity: 3500
            };

            mockRepo.create.mockResolvedValue(mockVesselType);
            mockRepo.getById.mockResolvedValue(mockVesselType);
            mockRepo.update.mockResolvedValue({ ...mockVesselType, capacity: 3500 });
            mockRepo.delete.mockResolvedValue(undefined);

            // Create
            await service.createVesselType(createDto);
            expect(mockRepo.create).toHaveBeenCalled();

            // Read
            await service.getVesselTypeById('1');
            expect(mockRepo.getById).toHaveBeenCalled();

            // Update
            await service.updateVesselType('1', updateDto);
            expect(mockRepo.update).toHaveBeenCalled();

            // Delete
            await service.deleteVesselType('1');
            expect(mockRepo.delete).toHaveBeenCalled();
        });

        it('should validate all fields during creation', async () => {
            const invalidDto: CreateVesselTypeDto = {
                id: 'vt-005',
                name: '',
                description: '',
                capacity: -1,
                maxRows: 0,
                maxBays: -5,
                maxTiers: 0
            };

            await expect(service.createVesselType(invalidDto)).rejects.toThrow(VesselTypeValidationError);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should handle multiple vessel types with different configurations', async () => {
            const vesselTypes = [
                { ...mockVesselType, id: '1', name: 'Small', capacity: 1000 },
                { ...mockVesselType, id: '2', name: 'Medium', capacity: 5000 },
                { ...mockVesselType, id: '3', name: 'Large', capacity: 15000 }
            ];
            mockRepo.getAll.mockResolvedValue(vesselTypes);

            const result = await service.getAllVesselTypes();

            expect(result).toHaveLength(3);
            expect(result[0].capacity).toBe(1000);
            expect(result[1].capacity).toBe(5000);
            expect(result[2].capacity).toBe(15000);
        });
    });
});
