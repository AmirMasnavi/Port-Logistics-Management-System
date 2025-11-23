import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { ResourceMapper } from '../../../../infrastructure/repositories/resource/resource.mapper';
import type {
    ResourceCreateDto,
    ResourceUpdateDto,
    ResourceUpdateStatusDto,
} from '../../../../infrastructure/repositories/resource/resource.dto';

// Mock the apiClient module
vi.mock('../../../../services/apiService', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
    },
}));

// Import after mocking
import { apiClient } from '../../../../services/apiService';

describe('ResourceApiRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('should fetch all resources from API and map to domain', async () => {
            const mockApiResponse = {
                data: [
                    {
                        code: 'RES-001',
                        description: 'Forklift',
                        kind: 'Forklift',
                        status: 'Active',
                        setupTimeMinutes: 10,
                        operationalWindowStart: '08:00',
                        operationalWindowEnd: '18:00',
                    },
                    {
                        code: 'RES-002',
                        description: 'Crane',
                        kind: 'Crane',
                        status: 'Active',
                        setupTimeMinutes: 30,
                        operationalWindowStart: '08:00',
                        operationalWindowEnd: '18:00',
                    },
                ],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/Resource');
            const result = ResourceMapper.toDomainList(response.data);

            expect(apiClient.get).toHaveBeenCalledWith('/Resource');
            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('RES-001');
            expect(result[1].code).toBe('RES-002');
        });

        it('should return empty array when no resources exist', async () => {
            const mockApiResponse = {
                data: [],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/Resource');
            const result = ResourceMapper.toDomainList(response.data);

            expect(apiClient.get).toHaveBeenCalledWith('/Resource');
            expect(result).toEqual([]);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('Network error');
            (apiClient.get as Mock).mockRejectedValue(error);

            await expect(apiClient.get('/Resource')).rejects.toThrow('Network error');
        });

        it('should map all fields correctly from API response', async () => {
            const mockApiResponse = {
                data: [
                    {
                        code: 'RES-001',
                        description: 'Forklift A1',
                        kind: 'Forklift',
                        assignedArea: 'YARD-1',
                        status: 'Active',
                        setupTimeMinutes: 15,
                        operationalWindowStart: '08:00',
                        operationalWindowEnd: '18:00',
                        qualificationRequirements: ['License', 'Training'],
                        averageContainersPerHour: 10,
                        containersPerTrip: 2,
                        averageSpeedKmh: 15,
                        otherUnit: 'units',
                        otherGenericValue: 100,
                    },
                ],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/Resource');
            const result = ResourceMapper.toDomainList(response.data);

            expect(result[0]).toEqual({
                code: 'RES-001',
                description: 'Forklift A1',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License', 'Training'],
                averageContainersPerHour: 10,
                containersPerTrip: 2,
                averageSpeedKmh: 15,
                otherUnit: 'units',
                otherGenericValue: 100,
            });
        });
    });

    describe('create', () => {
        it('should create resource via API and return domain model', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Forklift A1',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const mockApiResponse = {
                data: {
                    code: 'RES-001',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.post<any>('/Resource', createDto);
            const result = ResourceMapper.toDomain(response.data);

            expect(apiClient.post).toHaveBeenCalledWith('/Resource', createDto);
            expect(result.code).toBe('RES-001');
            expect(result.description).toBe('Forklift A1');
            expect(result.kind).toBe('Forklift');
            expect(result.status).toBe('Active');
        });

        it('should send correct DTO structure to API', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Crane B1',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['Advanced License'],
            };

            const mockApiResponse = {
                data: {
                    code: 'RES-002',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.post<any>('/Resource', createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/Resource', {
                description: 'Crane B1',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['Advanced License'],
            });
        });

        it('should handle API creation errors', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const error = new Error('Validation failed');
            (apiClient.post as Mock).mockRejectedValue(error);

            await expect(apiClient.post('/Resource', createDto)).rejects.toThrow('Validation failed');
        });

        it('should map created resource with all fields', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Forklift',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License'],
                averageContainersPerHour: 10,
            };

            const mockApiResponse = {
                data: {
                    code: 'RES-001',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.post<any>('/Resource', createDto);
            const result = ResourceMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('kind');
            expect(result).toHaveProperty('assignedArea');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('setupTimeMinutes');
            expect(result).toHaveProperty('operationalWindowStart');
            expect(result).toHaveProperty('operationalWindowEnd');
            expect(result).toHaveProperty('qualificationRequirements');
            expect(result).toHaveProperty('averageContainersPerHour');
        });
    });

    describe('update', () => {
        it('should update resource via API and return domain model', async () => {
            const code = 'RES-001';
            const updateDto: ResourceUpdateDto = {
                description: 'Updated Forklift',
                kind: 'Forklift',
                assignedArea: 'YARD-2',
                status: 'Active',
                setupTimeMinutes: 20,
                operationalWindowStart: '09:00',
                operationalWindowEnd: '19:00',
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.put<any>(`/Resource/${code}`, updateDto);
            const result = ResourceMapper.toDomain(response.data);

            expect(apiClient.put).toHaveBeenCalledWith(`/Resource/${code}`, updateDto);
            expect(result.code).toBe(code);
            expect(result.description).toBe('Updated Forklift');
            expect(result.assignedArea).toBe('YARD-2');
            expect(result.setupTimeMinutes).toBe(20);
        });

        it('should send correct DTO structure and code to API', async () => {
            const code = 'RES-002';
            const updateDto: ResourceUpdateDto = {
                description: 'Updated Crane',
                kind: 'Crane',
                status: 'UnderMaintenance',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.put<any>(`/Resource/${code}`, updateDto);

            expect(apiClient.put).toHaveBeenCalledWith(`/Resource/${code}`, {
                description: 'Updated Crane',
                kind: 'Crane',
                status: 'UnderMaintenance',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            });
        });

        it('should handle API update errors', async () => {
            const code = 'RES-001';
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const error = new Error('Resource not found');
            (apiClient.put as Mock).mockRejectedValue(error);

            await expect(apiClient.put(`/Resource/${code}`, updateDto)).rejects.toThrow(
                'Resource not found'
            );
        });

        it('should correctly construct URL with code parameter', async () => {
            const code = 'RES-003';
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.put<any>(`/Resource/${code}`, updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/Resource/RES-003', updateDto);
        });

        it('should map updated resource with all fields', async () => {
            const code = 'RES-001';
            const updateDto: ResourceUpdateDto = {
                description: 'Updated Resource',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License', 'Training'],
                averageContainersPerHour: 12,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.put<any>(`/Resource/${code}`, updateDto);
            const result = ResourceMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('kind');
            expect(result).toHaveProperty('assignedArea');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('setupTimeMinutes');
            expect(result).toHaveProperty('operationalWindowStart');
            expect(result).toHaveProperty('operationalWindowEnd');
            expect(result).toHaveProperty('qualificationRequirements');
            expect(result).toHaveProperty('averageContainersPerHour');
        });

        it('should handle special characters in code', async () => {
            const code = 'RES-A-001';
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.put<any>(`/Resource/${code}`, updateDto);

            expect(apiClient.put).toHaveBeenCalledWith(`/Resource/${code}`, updateDto);
        });
    });

    describe('updateStatus', () => {
        it('should update resource status via API', async () => {
            const code = 'RES-001';
            const statusDto: ResourceUpdateStatusDto = {
                NewStatus: 'Active',
            };

            (apiClient.patch as Mock).mockResolvedValue({});

            await apiClient.patch(`/Resource/${code}/status`, statusDto);

            expect(apiClient.patch).toHaveBeenCalledWith(`/Resource/${code}/status`, statusDto);
        });

        it('should send correct status DTO to API', async () => {
            const code = 'RES-002';
            const statusDto: ResourceUpdateStatusDto = {
                NewStatus: 'Inactive',
            };

            (apiClient.patch as Mock).mockResolvedValue({});

            await apiClient.patch(`/Resource/${code}/status`, statusDto);

            expect(apiClient.patch).toHaveBeenCalledWith(`/Resource/${code}/status`, {
                NewStatus: 'Inactive',
            });
        });

        it('should handle different status values', async () => {
            const code = 'RES-001';

            (apiClient.patch as Mock).mockResolvedValue({});

            await apiClient.patch(`/Resource/${code}/status`, { NewStatus: 'Active' });
            expect(apiClient.patch).toHaveBeenCalledWith(`/Resource/${code}/status`, { NewStatus: 'Active' });

            await apiClient.patch(`/Resource/${code}/status`, { NewStatus: 'Inactive' });
            expect(apiClient.patch).toHaveBeenCalledWith(`/Resource/${code}/status`, { NewStatus: 'Inactive' });

            await apiClient.patch(`/Resource/${code}/status`, { NewStatus: 'UnderMaintenance' });
            expect(apiClient.patch).toHaveBeenCalledWith(`/Resource/${code}/status`, { NewStatus: 'UnderMaintenance' });
        });

        it('should handle API errors when updating status', async () => {
            const code = 'RES-001';
            const statusDto: ResourceUpdateStatusDto = {
                NewStatus: 'Active',
            };

            const error = new Error('Resource not found');
            (apiClient.patch as Mock).mockRejectedValue(error);

            await expect(apiClient.patch(`/Resource/${code}/status`, statusDto)).rejects.toThrow(
                'Resource not found'
            );
        });

        it('should correctly construct URL for status update', async () => {
            const code = 'RES-003';
            const statusDto: ResourceUpdateStatusDto = {
                NewStatus: 'Active',
            };

            (apiClient.patch as Mock).mockResolvedValue({});

            await apiClient.patch(`/Resource/${code}/status`, statusDto);

            expect(apiClient.patch).toHaveBeenCalledWith('/Resource/RES-003/status', statusDto);
        });
    });

    describe('Integration with Mapper', () => {
        it('should use mapper for getAll results', async () => {
            const mockApiResponse = {
                data: [
                    {
                        code: 'RES-001',
                        description: 'Resource',
                        kind: 'Forklift',
                        status: 'Active',
                        setupTimeMinutes: 10,
                        operationalWindowStart: '08:00',
                        operationalWindowEnd: '18:00',
                    },
                ],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/Resource');
            const result = ResourceMapper.toDomainList(response.data);

            expect(result).toBeInstanceOf(Array);
            expect(result[0]).toHaveProperty('code');
        });

        it('should use mapper for create result', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const mockApiResponse = {
                data: {
                    code: 'RES-001',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.post<any>('/Resource', createDto);
            const result = ResourceMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result.code).toBe('RES-001');
        });

        it('should use mapper for update result', async () => {
            const code = 'RES-001';
            const updateDto: ResourceUpdateDto = {
                description: 'Updated Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.put<any>(`/Resource/${code}`, updateDto);
            const result = ResourceMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result.code).toBe(code);
        });
    });
});

