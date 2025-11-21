import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageAreaService } from '../../app/storageArea/storageArea.service';
import type { IStorageAreaRepository } from '../../app/storageArea/storageArea.repository';
import type { StorageArea } from '../../domain/storageArea/storageArea.model';
import type {
    StorageAreaCreateDto,
    StorageAreaUpdateDto,
} from '../../infrastructure/repositories/storageArea/storageArea.dto';

describe('StorageAreaService', () => {
    let mockRepository: IStorageAreaRepository;
    let service: StorageAreaService;

    beforeEach(() => {
        // Create a mock repository
        mockRepository = {
            getAll: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        };

        service = new StorageAreaService(mockRepository);
    });

    describe('fetchAllStorageAreas', () => {
        it('should fetch and sort storage areas by code', async () => {
            const mockAreas: StorageArea[] = [
                { code: 'YARD-3', type: 'Yard', location: '30, 30', capacity: 300, currentOccupancy: 150 },
                { code: 'YARD-1', type: 'Yard', location: '10, 10', capacity: 100, currentOccupancy: 50 },
                { code: 'WAREHOUSE-2', type: 'Warehouse', location: '20, 20', capacity: 200, currentOccupancy: 100 },
            ];

            vi.mocked(mockRepository.getAll).mockResolvedValue(mockAreas);

            const result = await service.fetchAllStorageAreas();

            expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(3);
            expect(result[0].code).toBe('WAREHOUSE-2');
            expect(result[1].code).toBe('YARD-1');
            expect(result[2].code).toBe('YARD-3');
        });

        it('should return empty array when no storage areas exist', async () => {
            vi.mocked(mockRepository.getAll).mockResolvedValue([]);

            const result = await service.fetchAllStorageAreas();

            expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        it('should sort storage areas alphabetically by code', async () => {
            const mockAreas: StorageArea[] = [
                { code: 'Z-1', type: 'Yard', location: '1, 1', capacity: 100, currentOccupancy: 50 },
                { code: 'A-1', type: 'Yard', location: '2, 2', capacity: 100, currentOccupancy: 50 },
                { code: 'M-1', type: 'Yard', location: '3, 3', capacity: 100, currentOccupancy: 50 },
            ];

            vi.mocked(mockRepository.getAll).mockResolvedValue(mockAreas);

            const result = await service.fetchAllStorageAreas();

            expect(result[0].code).toBe('A-1');
            expect(result[1].code).toBe('M-1');
            expect(result[2].code).toBe('Z-1');
        });

        it('should handle repository errors', async () => {
            const error = new Error('Database connection failed');
            vi.mocked(mockRepository.getAll).mockRejectedValue(error);

            await expect(service.fetchAllStorageAreas()).rejects.toThrow('Database connection failed');
        });
    });

    describe('createStorageArea', () => {
        it('should create a valid storage area', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const createdArea: StorageArea = {
                code: 'YARD-1',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdArea);

            const result = await service.createStorageArea(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(createdArea);
        });

        it('should throw error when capacity is zero', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 0,
                currentOccupancy: 0,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Capacity must be greater than 0.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when capacity is negative', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: -100,
                currentOccupancy: 0,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Capacity must be greater than 0.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when current occupancy is negative', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: -10,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Current occupancy cannot be negative.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when current occupancy exceeds capacity', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 150,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Current occupancy cannot exceed capacity.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when type is empty', async () => {
            const createDto: StorageAreaCreateDto = {
                type: '',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Storage area type is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when type is only whitespace', async () => {
            const createDto: StorageAreaCreateDto = {
                type: '   ',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Storage area type is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when location is empty', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '',
                capacity: 100,
                currentOccupancy: 50,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Location is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when location is only whitespace', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '   ',
                capacity: 100,
                currentOccupancy: 50,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Location is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should accept storage area with zero current occupancy', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 0,
            };

            const createdArea: StorageArea = {
                code: 'YARD-1',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdArea);

            const result = await service.createStorageArea(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result.currentOccupancy).toBe(0);
        });

        it('should accept storage area with full capacity', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 200,
            };

            const createdArea: StorageArea = {
                code: 'WAREHOUSE-1',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdArea);

            const result = await service.createStorageArea(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result.currentOccupancy).toBe(result.capacity);
        });
    });

    describe('updateStorageArea', () => {
        it('should update a valid storage area', async () => {
            const code = 'YARD-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '15, 15',
                capacity: 150,
                currentOccupancy: 75,
            };

            const updatedArea: StorageArea = {
                code,
                ...updateDto,
            };

            vi.mocked(mockRepository.update).mockResolvedValue(updatedArea);

            const result = await service.updateStorageArea(code, updateDto);

            expect(mockRepository.update).toHaveBeenCalledWith(code, updateDto);
            expect(result).toEqual(updatedArea);
        });

        it('should throw error when capacity is zero', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 0,
                currentOccupancy: 0,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow(
                'Capacity must be greater than 0.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when capacity is negative', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: -100,
                currentOccupancy: 0,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow(
                'Capacity must be greater than 0.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when current occupancy is negative', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: -10,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow(
                'Current occupancy cannot be negative.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when current occupancy exceeds capacity', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 150,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow(
                'Current occupancy cannot exceed capacity.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when type is empty', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: '',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow(
                'Storage area type is required.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when location is empty', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '',
                capacity: 100,
                currentOccupancy: 50,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow(
                'Location is required.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should accept update with zero current occupancy', async () => {
            const code = 'YARD-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 0,
            };

            const updatedArea: StorageArea = {
                code,
                ...updateDto,
            };

            vi.mocked(mockRepository.update).mockResolvedValue(updatedArea);

            const result = await service.updateStorageArea(code, updateDto);

            expect(mockRepository.update).toHaveBeenCalledWith(code, updateDto);
            expect(result.currentOccupancy).toBe(0);
        });

        it('should accept update with full capacity', async () => {
            const code = 'WAREHOUSE-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 200,
            };

            const updatedArea: StorageArea = {
                code,
                ...updateDto,
            };

            vi.mocked(mockRepository.update).mockResolvedValue(updatedArea);

            const result = await service.updateStorageArea(code, updateDto);

            expect(mockRepository.update).toHaveBeenCalledWith(code, updateDto);
            expect(result.currentOccupancy).toBe(result.capacity);
        });

        it('should validate before calling repository', async () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 150,
            };

            await expect(service.updateStorageArea('YARD-1', updateDto)).rejects.toThrow();

            expect(mockRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('Validation Edge Cases', () => {
        it('should validate capacity exactly at 1', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 1,
                currentOccupancy: 0,
            };

            const createdArea: StorageArea = {
                code: 'YARD-1',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdArea);

            const result = await service.createStorageArea(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result.capacity).toBe(1);
        });

        it('should allow occupancy equal to capacity', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 100,
            };

            const createdArea: StorageArea = {
                code: 'YARD-1',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdArea);

            const result = await service.createStorageArea(createDto);

            expect(result.currentOccupancy).toBe(result.capacity);
        });

        it('should reject occupancy one unit over capacity', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 101,
            };

            await expect(service.createStorageArea(createDto)).rejects.toThrow(
                'Current occupancy cannot exceed capacity.'
            );
        });
    });
});

