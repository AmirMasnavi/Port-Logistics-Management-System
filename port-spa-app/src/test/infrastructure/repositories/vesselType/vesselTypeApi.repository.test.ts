import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { VesselType } from '../../../../domain/vesselType/vesselType.model';
import type {
    CreateVesselTypeDto,
    UpdateVesselTypeDto
} from '../../../../infrastructure/repositories/vesselType/vesselType.dto';

// Mock the apiClient module FIRST, before any imports that use it
vi.mock('../../../../services/apiService', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

// Now import the repository (which uses apiClient)
import { vesselTypeApiRepository } from '../../../../infrastructure/repositories/vesselType/vesselTypeApi.repository';
import { apiClient } from '../../../../services/apiService';

describe('VesselTypeApiRepository', () => {
    const mockVesselType: VesselType = {
        id: 'vtype-001',
        name: 'Container Ship',
        description: 'Large cargo container vessel',
        capacity: 5000,
        maxRows: 10,
        maxBays: 20,
        maxTiers: 8
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getAll', () => {
        it('should fetch all vessel types from API', async () => {
            const mockResponse = { data: [mockVesselType] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getAll();

            expect(apiClient.get).toHaveBeenCalledWith('/VesselType');
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual([mockVesselType]);
        });

        it('should return empty array when no vessel types exist', async () => {
            const mockResponse = { data: [] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getAll();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should return multiple vessel types', async () => {
            const mockVesselTypes = [
                mockVesselType,
                {
                    id: 'vtype-002',
                    name: 'Bulk Carrier',
                    description: 'Bulk cargo vessel',
                    capacity: 8000,
                    maxRows: 12,
                    maxBays: 24,
                    maxTiers: 10
                },
                {
                    id: 'vtype-003',
                    name: 'Tanker',
                    description: 'Oil tanker',
                    capacity: 15000,
                    maxRows: 1,
                    maxBays: 1,
                    maxTiers: 1
                }
            ];
            const mockResponse = { data: mockVesselTypes };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getAll();

            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Container Ship');
            expect(result[1].name).toBe('Bulk Carrier');
            expect(result[2].name).toBe('Tanker');
        });

        it('should handle API errors', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

            await expect(vesselTypeApiRepository.getAll()).rejects.toThrow('Network error');
        });

        it('should map API response to domain models', async () => {
            const apiResponse = {
                data: [
                    {
                        id: 'vtype-001',
                        name: 'Container Ship',
                        description: 'Large cargo container vessel',
                        capacity: 5000,
                        maxRows: 10,
                        maxBays: 20,
                        maxTiers: 8
                    },
                    {
                        id: 'vtype-002',
                        name: 'Bulk Carrier',
                        description: 'Bulk cargo vessel',
                        capacity: 8000,
                        maxRows: 12,
                        maxBays: 24,
                        maxTiers: 10
                    }
                ]
            };
            vi.mocked(apiClient.get).mockResolvedValue(apiResponse);

            const result = await vesselTypeApiRepository.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('vtype-001');
            expect(result[0].capacity).toBe(5000);
            expect(result[1].id).toBe('vtype-002');
            expect(result[1].capacity).toBe(8000);
        });

        it('should preserve all properties from API response', async () => {
            const mockResponse = { data: [mockVesselType] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getAll();

            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('description');
            expect(result[0]).toHaveProperty('capacity');
            expect(result[0]).toHaveProperty('maxRows');
            expect(result[0]).toHaveProperty('maxBays');
            expect(result[0]).toHaveProperty('maxTiers');
        });
    });

    describe('getById', () => {
        it('should fetch vessel type by ID', async () => {
            const mockResponse = { data: mockVesselType };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getById('vtype-001');

            expect(apiClient.get).toHaveBeenCalledWith('/VesselType/vtype-001');
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVesselType);
        });

        it('should fetch vessel type with UUID id', async () => {
            const vesselTypeWithUuid: VesselType = {
                ...mockVesselType,
                id: '550e8400-e29b-41d4-a716-446655440000'
            };
            const mockResponse = { data: vesselTypeWithUuid };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getById('550e8400-e29b-41d4-a716-446655440000');

            expect(apiClient.get).toHaveBeenCalledWith('/VesselType/550e8400-e29b-41d4-a716-446655440000');
            expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        });

        it('should handle API errors when fetching by ID', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Vessel type not found'));

            await expect(vesselTypeApiRepository.getById('vtype-999')).rejects.toThrow('Vessel type not found');
        });

        it('should map API response to domain model', async () => {
            const apiResponse = {
                data: {
                    id: 'vtype-001',
                    name: 'Container Ship',
                    description: 'Large cargo container vessel',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                }
            };
            vi.mocked(apiClient.get).mockResolvedValue(apiResponse);

            const result = await vesselTypeApiRepository.getById('vtype-001');

            expect(result.id).toBe('vtype-001');
            expect(result.name).toBe('Container Ship');
            expect(result.capacity).toBe(5000);
        });

        it('should preserve all properties when fetching by ID', async () => {
            const mockResponse = { data: mockVesselType };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.getById('vtype-001');

            expect(result.id).toBe('vtype-001');
            expect(result.name).toBe('Container Ship');
            expect(result.description).toBe('Large cargo container vessel');
            expect(result.capacity).toBe(5000);
            expect(result.maxRows).toBe(10);
            expect(result.maxBays).toBe(20);
            expect(result.maxTiers).toBe(8);
        });
    });

    describe('create', () => {
        it('should create a new vessel type', async () => {
            const createDto: CreateVesselTypeDto = {
                id: 'vtype-new',
                name: 'New Container Ship',
                description: 'Newly created vessel type',
                capacity: 6000,
                maxRows: 11,
                maxBays: 22,
                maxTiers: 9
            };
            const mockResponse = { data: { ...createDto } };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.create(createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/VesselType', createDto);
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(result.id).toBe('vtype-new');
            expect(result.name).toBe('New Container Ship');
        });

        it('should create vessel type with all properties', async () => {
            const createDto: CreateVesselTypeDto = {
                id: 'vtype-complete',
                name: 'Complete Vessel',
                description: 'Vessel with all properties',
                capacity: 7500,
                maxRows: 13,
                maxBays: 26,
                maxTiers: 11
            };
            const mockResponse = { data: createDto };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.create(createDto);

            expect(result.id).toBe('vtype-complete');
            expect(result.name).toBe('Complete Vessel');
            expect(result.description).toBe('Vessel with all properties');
            expect(result.capacity).toBe(7500);
            expect(result.maxRows).toBe(13);
            expect(result.maxBays).toBe(26);
            expect(result.maxTiers).toBe(11);
        });

        it('should handle API errors during creation', async () => {
            const createDto: CreateVesselTypeDto = {
                id: 'vtype-error',
                name: 'Error Vessel',
                description: 'This will fail',
                capacity: 1000,
                maxRows: 5,
                maxBays: 10,
                maxTiers: 5
            };
            vi.mocked(apiClient.post).mockRejectedValue(new Error('Creation failed'));

            await expect(vesselTypeApiRepository.create(createDto)).rejects.toThrow('Creation failed');
        });

        it('should send correct data structure to API', async () => {
            const createDto: CreateVesselTypeDto = {
                id: 'vtype-test',
                name: 'Test Vessel',
                description: 'Test description',
                capacity: 3000,
                maxRows: 8,
                maxBays: 16,
                maxTiers: 6
            };
            const mockResponse = { data: createDto };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            await vesselTypeApiRepository.create(createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/VesselType', {
                id: 'vtype-test',
                name: 'Test Vessel',
                description: 'Test description',
                capacity: 3000,
                maxRows: 8,
                maxBays: 16,
                maxTiers: 6
            });
        });
    });

    describe('update', () => {
        it('should update vessel type with partial data', async () => {
            const updateDto: UpdateVesselTypeDto = {
                name: 'Updated Name'
            };
            const updatedVesselType: VesselType = {
                ...mockVesselType,
                name: 'Updated Name'
            };
            const mockResponse = { data: updatedVesselType };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.update('vtype-001', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/VesselType/vtype-001', updateDto);
            expect(apiClient.put).toHaveBeenCalledTimes(1);
            expect(result.name).toBe('Updated Name');
        });

        it('should update vessel type with all fields', async () => {
            const updateDto: UpdateVesselTypeDto = {
                name: 'Fully Updated Name',
                description: 'Fully updated description',
                capacity: 9000,
                maxRows: 14,
                maxBays: 28,
                maxTiers: 12
            };
            const updatedVesselType: VesselType = {
                id: 'vtype-001',
                name: 'Fully Updated Name',
                description: 'Fully updated description',
                capacity: 9000,
                maxRows: 14,
                maxBays: 28,
                maxTiers: 12
            };
            const mockResponse = { data: updatedVesselType };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.update('vtype-001', updateDto);

            expect(result.name).toBe('Fully Updated Name');
            expect(result.description).toBe('Fully updated description');
            expect(result.capacity).toBe(9000);
            expect(result.maxRows).toBe(14);
            expect(result.maxBays).toBe(28);
            expect(result.maxTiers).toBe(12);
        });

        it('should update only capacity', async () => {
            const updateDto: UpdateVesselTypeDto = {
                capacity: 12000
            };
            const updatedVesselType: VesselType = {
                ...mockVesselType,
                capacity: 12000
            };
            const mockResponse = { data: updatedVesselType };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.update('vtype-001', updateDto);

            expect(result.capacity).toBe(12000);
            expect(result.name).toBe('Container Ship');
        });

        it('should update only dimensions', async () => {
            const updateDto: UpdateVesselTypeDto = {
                maxRows: 15,
                maxBays: 30,
                maxTiers: 13
            };
            const updatedVesselType: VesselType = {
                ...mockVesselType,
                maxRows: 15,
                maxBays: 30,
                maxTiers: 13
            };
            const mockResponse = { data: updatedVesselType };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.update('vtype-001', updateDto);

            expect(result.maxRows).toBe(15);
            expect(result.maxBays).toBe(30);
            expect(result.maxTiers).toBe(13);
        });

        it('should handle API errors during update', async () => {
            const updateDto: UpdateVesselTypeDto = {
                name: 'Error Update'
            };
            vi.mocked(apiClient.put).mockRejectedValue(new Error('Update failed'));

            await expect(vesselTypeApiRepository.update('vtype-001', updateDto)).rejects.toThrow('Update failed');
        });

        it('should send correct ID and data to API', async () => {
            const updateDto: UpdateVesselTypeDto = {
                name: 'Test Update',
                capacity: 5500
            };
            const mockResponse = { data: { ...mockVesselType, ...updateDto } };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            await vesselTypeApiRepository.update('vtype-test-id', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/VesselType/vtype-test-id', updateDto);
        });

        it('should handle empty update DTO', async () => {
            const updateDto: UpdateVesselTypeDto = {};
            const mockResponse = { data: mockVesselType };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselTypeApiRepository.update('vtype-001', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/VesselType/vtype-001', {});
            expect(result).toEqual(mockVesselType);
        });
    });

    describe('delete', () => {
        it('should delete vessel type by ID', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await vesselTypeApiRepository.delete('vtype-001');

            expect(apiClient.delete).toHaveBeenCalledWith('/VesselType/vtype-001');
            expect(apiClient.delete).toHaveBeenCalledTimes(1);
        });

        it('should delete vessel type with UUID id', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await vesselTypeApiRepository.delete('550e8400-e29b-41d4-a716-446655440000');

            expect(apiClient.delete).toHaveBeenCalledWith('/VesselType/550e8400-e29b-41d4-a716-446655440000');
        });

        it('should handle API errors during deletion', async () => {
            vi.mocked(apiClient.delete).mockRejectedValue(new Error('Deletion failed'));

            await expect(vesselTypeApiRepository.delete('vtype-001')).rejects.toThrow('Deletion failed');
        });

        it('should not return any value', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            const result = await vesselTypeApiRepository.delete('vtype-001');

            expect(result).toBeUndefined();
        });

        it('should handle non-existent vessel type ID', async () => {
            vi.mocked(apiClient.delete).mockRejectedValue(new Error('Vessel type not found'));

            await expect(vesselTypeApiRepository.delete('vtype-nonexistent')).rejects.toThrow('Vessel type not found');
        });
    });
});

