import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Vessel } from '../../../../domain/vessel/vessel.model';
import type {
    CreateVesselDto,
    UpdateVesselDto
} from '../../../../infrastructure/repositories/vessel/vessel.dto';

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
import { vesselApiRepository } from '../../../../infrastructure/repositories/vessel/vesselApi.repository';
import { apiClient } from '../../../../services/apiService';

describe('VesselApiRepository', () => {
    const mockVessel: Vessel = {
        id: 'vessel-001',
        imoNumber: 'IMO1234567',
        name: 'Cargo Ship Alpha',
        operator: 'Maritime Transport Co.',
        vesselTypeId: 'vtype-001',
        createdAt: '2024-01-15T10:30:00Z'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getAll', () => {
        it('should fetch all vessels from API', async () => {
            const mockResponse = { data: [mockVessel] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getAll();

            expect(apiClient.get).toHaveBeenCalledWith('/Vessel/search');
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual([mockVessel]);
        });

        it('should return empty array when no vessels exist', async () => {
            const mockResponse = { data: [] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getAll();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should return multiple vessels', async () => {
            const mockVessels = [
                mockVessel,
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO9876543',
                    name: 'Container Vessel Beta',
                    operator: 'Global Shipping Lines',
                    vesselTypeId: 'vtype-002',
                    createdAt: '2024-03-20T14:45:30Z'
                },
                {
                    id: 'vessel-003',
                    imoNumber: 'IMO5555555',
                    name: 'Bulk Carrier Delta',
                    operator: 'Ocean Freight Inc.',
                    vesselTypeId: 'vtype-003',
                    createdAt: '2024-05-10T09:00:00Z'
                }
            ];
            const mockResponse = { data: mockVessels };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getAll();

            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Cargo Ship Alpha');
            expect(result[1].name).toBe('Container Vessel Beta');
            expect(result[2].name).toBe('Bulk Carrier Delta');
        });

        it('should handle API errors', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

            await expect(vesselApiRepository.getAll()).rejects.toThrow('Network error');
        });

        it('should map API response to domain models', async () => {
            const apiResponse = {
                data: [
                    {
                        id: 'vessel-001',
                        imoNumber: 'IMO1234567',
                        name: 'Cargo Ship Alpha',
                        operator: 'Maritime Transport Co.',
                        vesselTypeId: 'vtype-001',
                        createdAt: '2024-01-15T10:30:00Z'
                    },
                    {
                        id: 'vessel-002',
                        imoNumber: 'IMO9876543',
                        name: 'Container Vessel Beta',
                        operator: 'Global Shipping Lines',
                        vesselTypeId: 'vtype-002',
                        createdAt: '2024-03-20T14:45:30Z'
                    }
                ]
            };
            vi.mocked(apiClient.get).mockResolvedValue(apiResponse);

            const result = await vesselApiRepository.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('vessel-001');
            expect(result[0].imoNumber).toBe('IMO1234567');
            expect(result[1].id).toBe('vessel-002');
            expect(result[1].imoNumber).toBe('IMO9876543');
        });

        it('should preserve all properties from API response', async () => {
            const mockResponse = { data: [mockVessel] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getAll();

            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('imoNumber');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('operator');
            expect(result[0]).toHaveProperty('vesselTypeId');
            expect(result[0]).toHaveProperty('createdAt');
        });
    });

    describe('getById', () => {
        it('should fetch vessel by ID', async () => {
            const mockResponse = { data: mockVessel };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getById('vessel-001');

            expect(apiClient.get).toHaveBeenCalledWith('/Vessel/vessel-001');
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVessel);
        });

        it('should fetch vessel by IMO number', async () => {
            const mockResponse = { data: mockVessel };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getById('IMO1234567');

            expect(apiClient.get).toHaveBeenCalledWith('/Vessel/IMO1234567');
            expect(result.imoNumber).toBe('IMO1234567');
        });

        it('should fetch vessel with UUID id', async () => {
            const vesselWithUuid: Vessel = {
                ...mockVessel,
                id: '550e8400-e29b-41d4-a716-446655440000'
            };
            const mockResponse = { data: vesselWithUuid };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getById('550e8400-e29b-41d4-a716-446655440000');

            expect(apiClient.get).toHaveBeenCalledWith('/Vessel/550e8400-e29b-41d4-a716-446655440000');
            expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        });

        it('should handle API errors when fetching by ID', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Vessel not found'));

            await expect(vesselApiRepository.getById('vessel-999')).rejects.toThrow('Vessel not found');
        });

        it('should map API response to domain model', async () => {
            const apiResponse = {
                data: {
                    id: 'vessel-001',
                    imoNumber: 'IMO1234567',
                    name: 'Cargo Ship Alpha',
                    operator: 'Maritime Transport Co.',
                    vesselTypeId: 'vtype-001',
                    createdAt: '2024-01-15T10:30:00Z'
                }
            };
            vi.mocked(apiClient.get).mockResolvedValue(apiResponse);

            const result = await vesselApiRepository.getById('vessel-001');

            expect(result.id).toBe('vessel-001');
            expect(result.name).toBe('Cargo Ship Alpha');
            expect(result.imoNumber).toBe('IMO1234567');
        });

        it('should preserve all properties when fetching by ID', async () => {
            const mockResponse = { data: mockVessel };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.getById('vessel-001');

            expect(result.id).toBe('vessel-001');
            expect(result.imoNumber).toBe('IMO1234567');
            expect(result.name).toBe('Cargo Ship Alpha');
            expect(result.operator).toBe('Maritime Transport Co.');
            expect(result.vesselTypeId).toBe('vtype-001');
            expect(result.createdAt).toBe('2024-01-15T10:30:00Z');
        });
    });

    describe('create', () => {
        it('should create a new vessel', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: 'IMO7777777',
                name: 'New Cargo Ship',
                operator: 'New Maritime Company',
                vesselTypeId: 'vtype-new'
            };
            const createdVessel: Vessel = {
                id: 'vessel-new',
                ...createDto,
                createdAt: '2024-11-22T10:00:00Z'
            };
            const mockResponse = { data: createdVessel };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.create(createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/Vessel', createDto);
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(result.id).toBe('vessel-new');
            expect(result.imoNumber).toBe('IMO7777777');
            expect(result.name).toBe('New Cargo Ship');
        });

        it('should create vessel with all properties', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: 'IMO8888888',
                name: 'Complete Vessel',
                operator: 'Complete Operator',
                vesselTypeId: 'vtype-complete'
            };
            const createdVessel: Vessel = {
                id: 'vessel-complete',
                ...createDto,
                createdAt: '2024-11-22T11:00:00Z'
            };
            const mockResponse = { data: createdVessel };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.create(createDto);

            expect(result.id).toBe('vessel-complete');
            expect(result.imoNumber).toBe('IMO8888888');
            expect(result.name).toBe('Complete Vessel');
            expect(result.operator).toBe('Complete Operator');
            expect(result.vesselTypeId).toBe('vtype-complete');
            expect(result.createdAt).toBe('2024-11-22T11:00:00Z');
        });

        it('should handle API errors during creation', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: 'IMO9999999',
                name: 'Error Vessel',
                operator: 'Error Operator',
                vesselTypeId: 'vtype-error'
            };
            vi.mocked(apiClient.post).mockRejectedValue(new Error('Creation failed'));

            await expect(vesselApiRepository.create(createDto)).rejects.toThrow('Creation failed');
        });

        it('should send correct data structure to API', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: 'IMO1010101',
                name: 'Test Vessel',
                operator: 'Test Operator',
                vesselTypeId: 'vtype-test'
            };
            const mockResponse = {
                data: {
                    id: 'vessel-test',
                    ...createDto,
                    createdAt: '2024-11-22T12:00:00Z'
                }
            };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            await vesselApiRepository.create(createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/Vessel', {
                imoNumber: 'IMO1010101',
                name: 'Test Vessel',
                operator: 'Test Operator',
                vesselTypeId: 'vtype-test'
            });
        });

        it('should create vessel with special characters', async () => {
            const createDto: CreateVesselDto = {
                imoNumber: 'IMO1212121',
                name: 'Vessel "Special" & Co.',
                operator: "O'Brien Maritime Ltd.",
                vesselTypeId: 'vtype-special'
            };
            const mockResponse = {
                data: {
                    id: 'vessel-special',
                    ...createDto,
                    createdAt: '2024-11-22T13:00:00Z'
                }
            };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.create(createDto);

            expect(result.name).toContain('"Special"');
            expect(result.operator).toContain("O'Brien");
        });
    });

    describe('update', () => {
        it('should update vessel with partial data', async () => {
            const updateDto: UpdateVesselDto = {
                name: 'Updated Name'
            };
            const updatedVessel: Vessel = {
                ...mockVessel,
                name: 'Updated Name'
            };
            const mockResponse = { data: updatedVessel };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.update('IMO1234567', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Vessel/IMO1234567', {
                ...updateDto,
                imoNumber: 'IMO1234567'
            });
            expect(apiClient.put).toHaveBeenCalledTimes(1);
            expect(result.name).toBe('Updated Name');
        });

        it('should update vessel with all fields', async () => {
            const updateDto: UpdateVesselDto = {
                name: 'Fully Updated Name',
                operator: 'Fully Updated Operator',
                vesselTypeId: 'vtype-updated'
            };
            const updatedVessel: Vessel = {
                id: 'vessel-001',
                imoNumber: 'IMO1234567',
                name: 'Fully Updated Name',
                operator: 'Fully Updated Operator',
                vesselTypeId: 'vtype-updated',
                createdAt: '2024-01-15T10:30:00Z'
            };
            const mockResponse = { data: updatedVessel };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.update('IMO1234567', updateDto);

            expect(result.name).toBe('Fully Updated Name');
            expect(result.operator).toBe('Fully Updated Operator');
            expect(result.vesselTypeId).toBe('vtype-updated');
        });

        it('should update only name', async () => {
            const updateDto: UpdateVesselDto = {
                name: 'Only Name Updated'
            };
            const updatedVessel: Vessel = {
                ...mockVessel,
                name: 'Only Name Updated'
            };
            const mockResponse = { data: updatedVessel };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.update('IMO1234567', updateDto);

            expect(result.name).toBe('Only Name Updated');
            expect(result.operator).toBe('Maritime Transport Co.');
        });

        it('should update only operator', async () => {
            const updateDto: UpdateVesselDto = {
                operator: 'New Operator Company'
            };
            const updatedVessel: Vessel = {
                ...mockVessel,
                operator: 'New Operator Company'
            };
            const mockResponse = { data: updatedVessel };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.update('IMO1234567', updateDto);

            expect(result.operator).toBe('New Operator Company');
            expect(result.name).toBe('Cargo Ship Alpha');
        });

        it('should update only vessel type', async () => {
            const updateDto: UpdateVesselDto = {
                vesselTypeId: 'vtype-new-type'
            };
            const updatedVessel: Vessel = {
                ...mockVessel,
                vesselTypeId: 'vtype-new-type'
            };
            const mockResponse = { data: updatedVessel };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.update('IMO1234567', updateDto);

            expect(result.vesselTypeId).toBe('vtype-new-type');
        });

        it('should handle API errors during update', async () => {
            const updateDto: UpdateVesselDto = {
                name: 'Error Update'
            };
            vi.mocked(apiClient.put).mockRejectedValue(new Error('Update failed'));

            await expect(vesselApiRepository.update('IMO1234567', updateDto)).rejects.toThrow('Update failed');
        });

        it('should send IMO number in the request body', async () => {
            const updateDto: UpdateVesselDto = {
                name: 'Test Update'
            };
            const mockResponse = { data: { ...mockVessel, ...updateDto } };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            await vesselApiRepository.update('IMO1234567', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Vessel/IMO1234567', {
                name: 'Test Update',
                imoNumber: 'IMO1234567'
            });
        });

        it('should handle empty update DTO', async () => {
            const updateDto: UpdateVesselDto = {};
            const mockResponse = { data: mockVessel };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await vesselApiRepository.update('IMO1234567', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Vessel/IMO1234567', {
                imoNumber: 'IMO1234567'
            });
            expect(result).toEqual(mockVessel);
        });
    });

    describe('delete', () => {
        it('should delete vessel by IMO number', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await vesselApiRepository.delete('IMO1234567');

            expect(apiClient.delete).toHaveBeenCalledWith('/Vessel/IMO1234567');
            expect(apiClient.delete).toHaveBeenCalledTimes(1);
        });

        it('should delete vessel by ID', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await vesselApiRepository.delete('vessel-001');

            expect(apiClient.delete).toHaveBeenCalledWith('/Vessel/vessel-001');
        });

        it('should delete vessel with UUID id', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await vesselApiRepository.delete('550e8400-e29b-41d4-a716-446655440000');

            expect(apiClient.delete).toHaveBeenCalledWith('/Vessel/550e8400-e29b-41d4-a716-446655440000');
        });

        it('should handle API errors during deletion', async () => {
            vi.mocked(apiClient.delete).mockRejectedValue(new Error('Deletion failed'));

            await expect(vesselApiRepository.delete('IMO1234567')).rejects.toThrow('Deletion failed');
        });

        it('should not return any value', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            const result = await vesselApiRepository.delete('IMO1234567');

            expect(result).toBeUndefined();
        });

        it('should handle non-existent vessel', async () => {
            vi.mocked(apiClient.delete).mockRejectedValue(new Error('Vessel not found'));

            await expect(vesselApiRepository.delete('IMO9999999')).rejects.toThrow('Vessel not found');
        });
    });
});

