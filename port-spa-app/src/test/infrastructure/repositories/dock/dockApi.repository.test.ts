import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Dock } from '../../../../domain/dock/dock.model';
import type {
    DockCreateDto,
    UpdateDockDto
} from '../../../../infrastructure/repositories/dock/dock.dto';

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
import { dockApiRepository } from '../../../../infrastructure/repositories/dock/dockApi.repository';
import { apiClient } from '../../../../services/apiService';

describe('DockApiRepository', () => {
    const mockDock: Dock = {
        id: 'dock-001',
        name: 'Main Terminal',
        locationZone: 'North Port',
        locationSection: 'Section A',
        lengthInMeters: 300,
        depthInMeters: 15,
        maxDraftInMeters: 14,
        numberOfSTSCranes: 3,
        allowedVesselTypeIds: ['vt-001']
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getAll', () => {
        it('should fetch all docks from API', async () => {
            const mockResponse = { data: [mockDock] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.getAll();

            expect(apiClient.get).toHaveBeenCalledWith('/Dock');
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual([mockDock]);
        });

        it('should return empty array when no docks exist', async () => {
            const mockResponse = { data: [] };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.getAll();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should return multiple docks', async () => {
            const mockDocks = [
                mockDock,
                {
                    id: 'dock-002',
                    name: 'Pier 2',
                    locationZone: 'West',
                    locationSection: 'W2',
                    lengthInMeters: 200,
                    depthInMeters: 12,
                    maxDraftInMeters: 10,
                    numberOfSTSCranes: 2
                },
                {
                    id: 'dock-003',
                    name: 'RoRo Terminal',
                    locationZone: 'South',
                    locationSection: 'S1',
                    lengthInMeters: 150,
                    depthInMeters: 10,
                    maxDraftInMeters: 8,
                    numberOfSTSCranes: 1
                }
            ];
            const mockResponse = { data: mockDocks };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.getAll();

            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Main Terminal');
            expect(result[1].name).toBe('Pier 2');
            expect(result[2].name).toBe('RoRo Terminal');
        });

        it('should handle API errors', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

            await expect(dockApiRepository.getAll()).rejects.toThrow('Network error');
        });

        it('should map API response to domain models', async () => {
            const apiResponse = {
                data: [
                    {
                        id: 'dock-001',
                        name: 'Main Terminal',
                        locationZone: 'North',
                        locationSection: 'A',
                        lengthInMeters: 300,
                        depthInMeters: 15,
                        maxDraftInMeters: 14,
                        numberOfSTSCranes: 3
                    },
                    {
                        id: 'dock-002',
                        name: 'Small Pier',
                        locationZone: 'South',
                        locationSection: 'B',
                        lengthInMeters: 100,
                        depthInMeters: 8,
                        maxDraftInMeters: 7,
                        numberOfSTSCranes: 1
                    }
                ]
            };
            vi.mocked(apiClient.get).mockResolvedValue(apiResponse);

            const result = await dockApiRepository.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('dock-001');
            expect(result[0].lengthInMeters).toBe(300);
            expect(result[1].id).toBe('dock-002');
            expect(result[1].lengthInMeters).toBe(100);
        });
    });

    describe('getById', () => {
        it('should fetch dock by ID', async () => {
            const mockResponse = { data: mockDock };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.getById('dock-001');

            expect(apiClient.get).toHaveBeenCalledWith('/Dock/dock-001');
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockDock);
        });

        it('should fetch dock with UUID id', async () => {
            const dockWithUuid: Dock = {
                ...mockDock,
                id: '550e8400-e29b-41d4-a716-446655440000'
            };
            const mockResponse = { data: dockWithUuid };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.getById('550e8400-e29b-41d4-a716-446655440000');

            expect(apiClient.get).toHaveBeenCalledWith('/Dock/550e8400-e29b-41d4-a716-446655440000');
            expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        });

        it('should handle API errors when fetching by ID', async () => {
            vi.mocked(apiClient.get).mockRejectedValue(new Error('Dock not found'));

            await expect(dockApiRepository.getById('dock-999')).rejects.toThrow('Dock not found');
        });

        it('should map API response to domain model', async () => {
            const apiResponse = {
                data: {
                    id: 'dock-001',
                    name: 'Main Terminal',
                    locationZone: 'North Port',
                    locationSection: 'Section A',
                    lengthInMeters: 300,
                    depthInMeters: 15,
                    maxDraftInMeters: 14,
                    numberOfSTSCranes: 3
                }
            };
            vi.mocked(apiClient.get).mockResolvedValue(apiResponse);

            const result = await dockApiRepository.getById('dock-001');

            expect(result.id).toBe('dock-001');
            expect(result.name).toBe('Main Terminal');
            expect(result.lengthInMeters).toBe(300);
        });
    });

    describe('create', () => {
        it('should create a new dock', async () => {
            const createDto: DockCreateDto = {
                id: 'dock-new',
                name: 'New Dock',
                locationZone: 'New Zone',
                locationSection: 'New Section',
                lengthInMeters: 400,
                depthInMeters: 18,
                maxDraftInMeters: 16,
                numberOfSTSCranes: 4,
                allowedVesselTypeIds: ['vt-001']
            };
            const mockResponse = { data: { ...createDto } };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.create(createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/Dock', createDto);
            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(result.id).toBe('dock-new');
            expect(result.name).toBe('New Dock');
        });

        it('should create dock with all properties', async () => {
            const createDto: DockCreateDto = {
                id: 'dock-complete',
                name: 'Complete Dock',
                locationZone: 'Central Hub',
                locationSection: 'H1',
                lengthInMeters: 500,
                depthInMeters: 20,
                maxDraftInMeters: 18,
                numberOfSTSCranes: 5,
                allowedVesselTypeIds: ['vt-1', 'vt-2']
            };
            const mockResponse = { data: createDto };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.create(createDto);

            expect(result.id).toBe('dock-complete');
            expect(result.name).toBe('Complete Dock');
            expect(result.locationZone).toBe('Central Hub');
            expect(result.lengthInMeters).toBe(500);
            expect(result.numberOfSTSCranes).toBe(5);
        });

        it('should handle API errors during creation', async () => {
            const createDto: DockCreateDto = {
                id: 'dock-error',
                name: 'Error Dock',
                locationZone: 'Error Zone',
                locationSection: 'E1',
                lengthInMeters: 100,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 1
            };
            vi.mocked(apiClient.post).mockRejectedValue(new Error('Creation failed'));

            await expect(dockApiRepository.create(createDto)).rejects.toThrow('Creation failed');
        });

        it('should send correct data structure to API', async () => {
            const createDto: DockCreateDto = {
                id: 'dock-test',
                name: 'Test Dock',
                locationZone: 'Test Zone',
                locationSection: 'T1',
                lengthInMeters: 200,
                depthInMeters: 12,
                maxDraftInMeters: 10,
                numberOfSTSCranes: 2
            };
            const mockResponse = { data: createDto };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            await dockApiRepository.create(createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/Dock', createDto);
        });
    });

    describe('update', () => {
        it('should update dock with partial data', async () => {
            const updateDto: UpdateDockDto = {
                name: 'Updated Dock Name'
            };
            const updatedDock: Dock = {
                ...mockDock,
                name: 'Updated Dock Name'
            };
            const mockResponse = { data: updatedDock };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.update('dock-001', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Dock/dock-001', updateDto);
            expect(apiClient.put).toHaveBeenCalledTimes(1);
            expect(result.name).toBe('Updated Dock Name');
        });

        it('should update dock with all fields', async () => {
            const updateDto: UpdateDockDto = {
                name: 'Fully Updated Dock',
                locationZone: 'New Zone',
                locationSection: 'New Section',
                lengthInMeters: 600,
                depthInMeters: 25,
                maxDraftInMeters: 22,
                numberOfSTSCranes: 6,
                allowedVesselTypeIds: ['vt-new-1', 'vt-new-2']
            };
            const updatedDock: Dock = {
                id: 'dock-001',
                name: 'Fully Updated Dock',
                locationZone: 'New Zone',
                locationSection: 'New Section',
                lengthInMeters: 600,
                depthInMeters: 25,
                maxDraftInMeters: 22,
                numberOfSTSCranes: 6,
                allowedVesselTypeIds: ['vt-new-1', 'vt-new-2']
            };
            const mockResponse = { data: updatedDock };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.update('dock-001', updateDto);

            expect(result.name).toBe('Fully Updated Dock');
            expect(result.locationZone).toBe('New Zone');
            expect(result.lengthInMeters).toBe(600);
            expect(result.numberOfSTSCranes).toBe(6);
            expect(result.allowedVesselTypeIds).toContain('vt-new-1');
        });

        it('should update only length', async () => {
            const updateDto: UpdateDockDto = {
                lengthInMeters: 350
            };
            const updatedDock: Dock = {
                ...mockDock,
                lengthInMeters: 350
            };
            const mockResponse = { data: updatedDock };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.update('dock-001', updateDto);

            expect(result.lengthInMeters).toBe(350);
            expect(result.name).toBe('Main Terminal');
        });

        it('should update only cranes', async () => {
            const updateDto: UpdateDockDto = {
                numberOfSTSCranes: 5
            };
            const updatedDock: Dock = {
                ...mockDock,
                numberOfSTSCranes: 5
            };
            const mockResponse = { data: updatedDock };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.update('dock-001', updateDto);

            expect(result.numberOfSTSCranes).toBe(5);
        });

        it('should handle API errors during update', async () => {
            const updateDto: UpdateDockDto = {
                name: 'Error Update'
            };
            vi.mocked(apiClient.put).mockRejectedValue(new Error('Update failed'));

            await expect(dockApiRepository.update('dock-001', updateDto)).rejects.toThrow('Update failed');
        });

        it('should send correct ID and data to API', async () => {
            const updateDto: UpdateDockDto = {
                name: 'Test Update',
                lengthInMeters: 250
            };
            const mockResponse = { data: { ...mockDock, ...updateDto } };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            await dockApiRepository.update('dock-test-id', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Dock/dock-test-id', updateDto);
        });

        it('should handle empty update DTO', async () => {
            const updateDto: UpdateDockDto = {};
            const mockResponse = { data: mockDock };
            vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

            const result = await dockApiRepository.update('dock-001', updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Dock/dock-001', {});
            expect(result).toEqual(mockDock);
        });
    });

    describe('delete', () => {
        it('should delete dock by ID', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await dockApiRepository.delete('dock-001');

            expect(apiClient.delete).toHaveBeenCalledWith('/Dock/dock-001');
            expect(apiClient.delete).toHaveBeenCalledTimes(1);
        });

        it('should delete dock with UUID id', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            await dockApiRepository.delete('550e8400-e29b-41d4-a716-446655440000');

            expect(apiClient.delete).toHaveBeenCalledWith('/Dock/550e8400-e29b-41d4-a716-446655440000');
        });

        it('should handle API errors during deletion', async () => {
            vi.mocked(apiClient.delete).mockRejectedValue(new Error('Deletion failed'));

            await expect(dockApiRepository.delete('dock-001')).rejects.toThrow('Deletion failed');
        });

        it('should not return any value', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({});

            const result = await dockApiRepository.delete('dock-001');

            expect(result).toBeUndefined();
        });

        it('should handle non-existent dock ID', async () => {
            vi.mocked(apiClient.delete).mockRejectedValue(new Error('Dock not found'));

            await expect(dockApiRepository.delete('dock-nonexistent')).rejects.toThrow('Dock not found');
        });
    });
});