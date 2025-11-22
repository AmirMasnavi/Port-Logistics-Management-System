import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VesselService } from '../../../app/vessel/vessel.service';
import { VesselValidationError } from '../../../domain/vessel/vessel.errors';
import type { IVesselRepository } from '../../../app/vessel/vessel.repository';
import type { Vessel } from '../../../domain/vessel/vessel.model';
import type {
    CreateVesselDto,
    UpdateVesselDto
} from '../../../infrastructure/repositories/vessel/vessel.dto';

// Mock repository implementation for testing
class MockVesselRepository implements IVesselRepository {
    getAll = vi.fn();
    getById = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
}

describe('VesselService', () => {
    let service: VesselService;
    let mockRepo: MockVesselRepository;

    const mockVessel: Vessel = {
        id: '1',
        imoNumber: '1234567',
        name: 'MSC Gülsün',
        operator: 'Mediterranean Shipping Company',
        vesselTypeId: 'vt-001',
        createdAt: '2025-11-20T10:00:00Z'
    };

    beforeEach(() => {
        mockRepo = new MockVesselRepository();
        service = new VesselService(mockRepo);
    });

    describe('constructor', () => {
        it('should initialize with repository', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(VesselService);
        });
    });

    describe('getAllVessels', () => {
        it('should fetch and return all vessels', async () => {
            const mockVessels = [mockVessel];
            mockRepo.getAll.mockResolvedValue(mockVessels);

            const result = await service.getAllVessels();

            expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVessels);
        });

        it('should return empty array when no vessels exist', async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.getAllVessels();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should handle repository errors', async () => {
            mockRepo.getAll.mockRejectedValue(new Error('Database error'));

            await expect(service.getAllVessels()).rejects.toThrow('Database error');
        });

        it('should return multiple vessels', async () => {
            const mockVessels = [
                mockVessel,
                { ...mockVessel, id: '2', imoNumber: '7654321', name: 'Ever Given' },
                { ...mockVessel, id: '3', imoNumber: '1111111', name: 'OOCL Hong Kong' }
            ];
            mockRepo.getAll.mockResolvedValue(mockVessels);

            const result = await service.getAllVessels();

            expect(result).toHaveLength(3);
            expect(result).toEqual(mockVessels);
        });
    });

    describe('getVesselById', () => {
        it('should fetch vessel by ID', async () => {
            mockRepo.getById.mockResolvedValue(mockVessel);

            const result = await service.getVesselById('1');

            expect(mockRepo.getById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockVessel);
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.getVesselById('')).rejects.toThrow(VesselValidationError);
            await expect(service.getVesselById('')).rejects.toThrow('Vessel ID is required');
            expect(mockRepo.getById).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.getVesselById('   ')).rejects.toThrow(VesselValidationError);
            await expect(service.getVesselById('   ')).rejects.toThrow('Vessel ID is required');
            expect(mockRepo.getById).not.toHaveBeenCalled();
        });

        it('should handle non-existent vessel', async () => {
            mockRepo.getById.mockRejectedValue(new Error('Not found'));

            await expect(service.getVesselById('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('createVessel', () => {
        const validDto: CreateVesselDto = {
            imoNumber: '1234567',
            name: 'MSC Gülsün',
            operator: 'Mediterranean Shipping Company',
            vesselTypeId: 'vt-001'
        };

        it('should create vessel with valid data', async () => {
            mockRepo.create.mockResolvedValue(mockVessel);

            const result = await service.createVessel(validDto);

            expect(mockRepo.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(mockVessel);
        });

        it('should throw error when IMO number is missing', async () => {
            const invalidDto = { ...validDto, imoNumber: '' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('A valid 7-digit IMO Number is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when IMO number is not 7 digits', async () => {
            const invalidDto = { ...validDto, imoNumber: '12345' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('A valid 7-digit IMO Number is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when IMO number is too long', async () => {
            const invalidDto = { ...validDto, imoNumber: '123456789' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('A valid 7-digit IMO Number is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when IMO number contains non-digits', async () => {
            const invalidDto = { ...validDto, imoNumber: 'ABC1234' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('A valid 7-digit IMO Number is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should accept IMO number with leading/trailing whitespace', async () => {
            const dtoWithWhitespace = { ...validDto, imoNumber: '  1234567  ' };
            mockRepo.create.mockResolvedValue(mockVessel);

            const result = await service.createVessel(dtoWithWhitespace);

            expect(mockRepo.create).toHaveBeenCalledWith(dtoWithWhitespace);
            expect(result).toBeDefined();
        });

        it('should throw error when vessel name is missing', async () => {
            const invalidDto = { ...validDto, name: '' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('Vessel name is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when vessel name is only whitespace', async () => {
            const invalidDto = { ...validDto, name: '   ' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('Vessel name is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when operator is missing', async () => {
            const invalidDto = { ...validDto, operator: '' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('Operator is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when operator is only whitespace', async () => {
            const invalidDto = { ...validDto, operator: '   ' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('Operator is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when vesselTypeId is missing', async () => {
            const invalidDto = { ...validDto, vesselTypeId: '' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('A Vessel Type must be selected.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when vesselTypeId is only whitespace', async () => {
            const invalidDto = { ...validDto, vesselTypeId: '   ' };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.createVessel(invalidDto)).rejects.toThrow('A Vessel Type must be selected.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should accept vessel with all valid fields', async () => {
            const completeDto: CreateVesselDto = {
                imoNumber: '9876543',
                name: 'Ever Given',
                operator: 'Evergreen Marine',
                vesselTypeId: 'vt-002'
            };
            mockRepo.create.mockResolvedValue({ ...mockVessel, ...completeDto });

            const result = await service.createVessel(completeDto);

            expect(mockRepo.create).toHaveBeenCalledWith(completeDto);
            expect(result).toBeDefined();
        });

        it('should handle repository errors during creation', async () => {
            mockRepo.create.mockRejectedValue(new Error('Creation failed'));

            await expect(service.createVessel(validDto)).rejects.toThrow('Creation failed');
        });
    });

    describe('updateVessel', () => {
        const validDto: UpdateVesselDto = {
            name: 'MSC Gülsün Updated',
            operator: 'MSC Updated',
            vesselTypeId: 'vt-002'
        };

        it('should update vessel with valid data', async () => {
            const updatedVessel = { ...mockVessel, ...validDto };
            mockRepo.update.mockResolvedValue(updatedVessel);

            const result = await service.updateVessel('1', validDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', validDto);
            expect(result).toEqual(updatedVessel);
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.updateVessel('', validDto)).rejects.toThrow(VesselValidationError);
            await expect(service.updateVessel('', validDto)).rejects.toThrow('Vessel ID is required');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.updateVessel('   ', validDto)).rejects.toThrow(VesselValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when name is empty string', async () => {
            const invalidDto = { ...validDto, name: '' };

            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow('Vessel name cannot be empty.');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when name is only whitespace', async () => {
            const invalidDto = { ...validDto, name: '   ' };

            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow('Vessel name cannot be empty.');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when operator is empty string', async () => {
            const invalidDto = { ...validDto, operator: '' };

            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow('Operator cannot be empty.');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error when operator is only whitespace', async () => {
            const invalidDto = { ...validDto, operator: '   ' };

            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow(VesselValidationError);
            await expect(service.updateVessel('1', invalidDto)).rejects.toThrow('Operator cannot be empty.');
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should allow partial updates with only name', async () => {
            const partialDto: UpdateVesselDto = { name: 'New Vessel Name' };
            mockRepo.update.mockResolvedValue({ ...mockVessel, name: 'New Vessel Name' });

            const result = await service.updateVessel('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow partial updates with only operator', async () => {
            const partialDto: UpdateVesselDto = { operator: 'New Operator' };
            mockRepo.update.mockResolvedValue({ ...mockVessel, operator: 'New Operator' });

            const result = await service.updateVessel('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow partial updates with only vesselTypeId', async () => {
            const partialDto: UpdateVesselDto = { vesselTypeId: 'vt-003' };
            mockRepo.update.mockResolvedValue({ ...mockVessel, vesselTypeId: 'vt-003' });

            const result = await service.updateVessel('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow partial updates with multiple fields', async () => {
            const partialDto: UpdateVesselDto = { 
                name: 'Updated Name',
                operator: 'Updated Operator'
            };
            mockRepo.update.mockResolvedValue({ ...mockVessel, ...partialDto });

            const result = await service.updateVessel('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result).toBeDefined();
        });

        it('should allow update with undefined fields', async () => {
            const partialDto: UpdateVesselDto = { 
                name: 'Only Name Updated'
            };
            mockRepo.update.mockResolvedValue({ ...mockVessel, name: 'Only Name Updated' });

            const result = await service.updateVessel('1', partialDto);

            expect(mockRepo.update).toHaveBeenCalledWith('1', partialDto);
            expect(result.name).toBe('Only Name Updated');
        });

        it('should handle repository errors during update', async () => {
            mockRepo.update.mockRejectedValue(new Error('Update failed'));

            await expect(service.updateVessel('1', validDto)).rejects.toThrow('Update failed');
        });
    });

    describe('deleteVessel', () => {
        it('should delete vessel by ID', async () => {
            mockRepo.delete.mockResolvedValue(undefined);

            await service.deleteVessel('1');

            expect(mockRepo.delete).toHaveBeenCalledWith('1');
        });

        it('should throw error when ID is empty', async () => {
            await expect(service.deleteVessel('')).rejects.toThrow(VesselValidationError);
            await expect(service.deleteVessel('')).rejects.toThrow('Vessel ID is required');
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });

        it('should throw error when ID is only whitespace', async () => {
            await expect(service.deleteVessel('   ')).rejects.toThrow(VesselValidationError);
            await expect(service.deleteVessel('   ')).rejects.toThrow('Vessel ID is required');
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });

        it('should handle deletion errors', async () => {
            mockRepo.delete.mockRejectedValue(new Error('Cannot delete'));

            await expect(service.deleteVessel('1')).rejects.toThrow('Cannot delete');
        });

        it('should handle non-existent vessel deletion', async () => {
            mockRepo.delete.mockRejectedValue(new Error('Not found'));

            await expect(service.deleteVessel('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete CRUD lifecycle', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: '1234567',
                name: 'Test Vessel',
                operator: 'Test Operator',
                vesselTypeId: 'vt-001'
            };
            const updateDto: UpdateVesselDto = {
                name: 'Updated Vessel'
            };

            mockRepo.create.mockResolvedValue(mockVessel);
            mockRepo.getById.mockResolvedValue(mockVessel);
            mockRepo.update.mockResolvedValue({ ...mockVessel, name: 'Updated Vessel' });
            mockRepo.delete.mockResolvedValue(undefined);

            // Create
            await service.createVessel(createDto);
            expect(mockRepo.create).toHaveBeenCalled();

            // Read
            await service.getVesselById('1');
            expect(mockRepo.getById).toHaveBeenCalled();

            // Update
            await service.updateVessel('1', updateDto);
            expect(mockRepo.update).toHaveBeenCalled();

            // Delete
            await service.deleteVessel('1');
            expect(mockRepo.delete).toHaveBeenCalled();
        });

        it('should validate all fields during creation', async () => {
            const invalidDto: CreateVesselDto = {
                imoNumber: '123',
                name: '',
                operator: '',
                vesselTypeId: ''
            };

            await expect(service.createVessel(invalidDto)).rejects.toThrow(VesselValidationError);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should handle multiple vessels with different IMO numbers', async () => {
            const vessels = [
                { ...mockVessel, id: '1', imoNumber: '1234567', name: 'Vessel A' },
                { ...mockVessel, id: '2', imoNumber: '7654321', name: 'Vessel B' },
                { ...mockVessel, id: '3', imoNumber: '9999999', name: 'Vessel C' }
            ];
            mockRepo.getAll.mockResolvedValue(vessels);

            const result = await service.getAllVessels();

            expect(result).toHaveLength(3);
            expect(result[0].imoNumber).toBe('1234567');
            expect(result[1].imoNumber).toBe('7654321');
            expect(result[2].imoNumber).toBe('9999999');
        });

        it('should handle update after creation', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: '1234567',
                name: 'Initial Name',
                operator: 'Initial Operator',
                vesselTypeId: 'vt-001'
            };
            const updateDto: UpdateVesselDto = {
                name: 'Updated Name',
                operator: 'Updated Operator'
            };

            mockRepo.create.mockResolvedValue(mockVessel);
            mockRepo.update.mockResolvedValue({ ...mockVessel, ...updateDto });

            // Create vessel
            const created = await service.createVessel(createDto);
            expect(created).toBeDefined();

            // Update vessel
            const updated = await service.updateVessel('1', updateDto);
            expect(updated.name).toBe('Updated Name');
            expect(updated.operator).toBe('Updated Operator');
        });
    });
});

