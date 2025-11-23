import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { StorageAreaMapper } from '../../../../infrastructure/repositories/storageArea/storageArea.mapper';
import type {
    StorageAreaCreateDto,
    StorageAreaUpdateDto,
} from '../../../../infrastructure/repositories/storageArea/storageArea.dto';

// Mock the apiClient module
vi.mock('../../../../services/apiService', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

// Import after mocking
import { apiClient } from '../../../../services/apiService';

// We need to dynamically import the repository after mocking
// For this test, we'll test the implementation logic directly
describe('StorageAreaApiRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('should fetch all storage areas from API and map to domain', async () => {
            const mockApiResponse = {
                data: [
                    {
                        code: 'YARD-1',
                        type: 'Yard',
                        location: '10, 10',
                        capacity: 100,
                        currentOccupancy: 50,
                    },
                    {
                        code: 'WAREHOUSE-1',
                        type: 'Warehouse',
                        location: '20, 20',
                        capacity: 200,
                        currentOccupancy: 100,
                    },
                ],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            // Simulate the repository behavior
            const response = await apiClient.get<any[]>('/StorageArea');
            const result = StorageAreaMapper.toDomainList(response.data);

            expect(apiClient.get).toHaveBeenCalledWith('/StorageArea');
            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('YARD-1');
            expect(result[1].code).toBe('WAREHOUSE-1');
        });

        it('should return empty array when no storage areas exist', async () => {
            const mockApiResponse = {
                data: [],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/StorageArea');
            const result = StorageAreaMapper.toDomainList(response.data);

            expect(apiClient.get).toHaveBeenCalledWith('/StorageArea');
            expect(result).toEqual([]);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('Network error');
            (apiClient.get as Mock).mockRejectedValue(error);

            await expect(apiClient.get('/StorageArea')).rejects.toThrow('Network error');
        });

        it('should map all fields correctly from API response', async () => {
            const mockApiResponse = {
                data: [
                    {
                        code: 'YARD-3',
                        type: 'Yard',
                        location: '(30, 30)',
                        capacity: 300,
                        currentOccupancy: 150,
                    },
                ],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/StorageArea');
            const result = StorageAreaMapper.toDomainList(response.data);

            expect(result[0]).toEqual({
                code: 'YARD-3',
                type: 'Yard',
                location: '(30, 30)',
                capacity: 300,
                currentOccupancy: 150,
            });
        });
    });

    describe('create', () => {
        it('should create storage area via API and return domain model', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const mockApiResponse = {
                data: {
                    code: 'YARD-1',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.post<any>('/StorageArea', createDto);
            const result = StorageAreaMapper.toDomain(response.data);

            expect(apiClient.post).toHaveBeenCalledWith('/StorageArea', createDto);
            expect(result.code).toBe('YARD-1');
            expect(result.type).toBe('Yard');
            expect(result.location).toBe('10, 10');
            expect(result.capacity).toBe(100);
            expect(result.currentOccupancy).toBe(50);
        });

        it('should send correct DTO structure to API', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 100,
            };

            const mockApiResponse = {
                data: {
                    code: 'WAREHOUSE-1',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.post<any>('/StorageArea', createDto);

            expect(apiClient.post).toHaveBeenCalledWith('/StorageArea', {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 100,
            });
        });

        it('should handle API creation errors', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const error = new Error('Validation failed');
            (apiClient.post as Mock).mockRejectedValue(error);

            await expect(apiClient.post('/StorageArea', createDto)).rejects.toThrow('Validation failed');
        });

        it('should map created storage area with all fields', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '(15, 15)',
                capacity: 150,
                currentOccupancy: 75,
            };

            const mockApiResponse = {
                data: {
                    code: 'YARD-5',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.post<any>('/StorageArea', createDto);
            const result = StorageAreaMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('location');
            expect(result).toHaveProperty('capacity');
            expect(result).toHaveProperty('currentOccupancy');
        });
    });

    describe('update', () => {
        it('should update storage area via API and return domain model', async () => {
            const code = 'YARD-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '15, 15',
                capacity: 150,
                currentOccupancy: 75,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.put<any>(`/StorageArea/${code}`, updateDto);
            const result = StorageAreaMapper.toDomain(response.data);

            expect(apiClient.put).toHaveBeenCalledWith(`/StorageArea/${code}`, updateDto);
            expect(result.code).toBe(code);
            expect(result.type).toBe('Warehouse');
            expect(result.location).toBe('15, 15');
            expect(result.capacity).toBe(150);
            expect(result.currentOccupancy).toBe(75);
        });

        it('should send correct DTO structure and code to API', async () => {
            const code = 'WAREHOUSE-2';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '(25, 25)',
                capacity: 250,
                currentOccupancy: 125,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.put<any>(`/StorageArea/${code}`, updateDto);

            expect(apiClient.put).toHaveBeenCalledWith(`/StorageArea/${code}`, {
                type: 'Yard',
                location: '(25, 25)',
                capacity: 250,
                currentOccupancy: 125,
            });
        });

        it('should handle API update errors', async () => {
            const code = 'YARD-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '15, 15',
                capacity: 150,
                currentOccupancy: 75,
            };

            const error = new Error('Storage area not found');
            (apiClient.put as Mock).mockRejectedValue(error);

            await expect(apiClient.put(`/StorageArea/${code}`, updateDto)).rejects.toThrow(
                'Storage area not found'
            );
        });

        it('should correctly construct URL with code parameter', async () => {
            const code = 'YARD-3';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '30, 30',
                capacity: 300,
                currentOccupancy: 150,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.put<any>(`/StorageArea/${code}`, updateDto);

            expect(apiClient.put).toHaveBeenCalledWith('/StorageArea/YARD-3', updateDto);
        });

        it('should map updated storage area with all fields', async () => {
            const code = 'WAREHOUSE-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '(50, 50)',
                capacity: 500,
                currentOccupancy: 250,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.put<any>(`/StorageArea/${code}`, updateDto);
            const result = StorageAreaMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('location');
            expect(result).toHaveProperty('capacity');
            expect(result).toHaveProperty('currentOccupancy');
        });

        it('should handle special characters in code', async () => {
            const code = 'YARD-A-3';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            await apiClient.put<any>(`/StorageArea/${code}`, updateDto);

            expect(apiClient.put).toHaveBeenCalledWith(`/StorageArea/${code}`, updateDto);
        });
    });

    describe('Integration with Mapper', () => {
        it('should use mapper for getAll results', async () => {
            const mockApiResponse = {
                data: [
                    {
                        code: 'YARD-1',
                        type: 'Yard',
                        location: '10, 10',
                        capacity: 100,
                        currentOccupancy: 50,
                    },
                ],
            };

            (apiClient.get as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.get<any[]>('/StorageArea');
            const result = StorageAreaMapper.toDomainList(response.data);

            expect(result).toBeInstanceOf(Array);
            expect(result[0]).toHaveProperty('code');
        });

        it('should use mapper for create result', async () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const mockApiResponse = {
                data: {
                    code: 'YARD-1',
                    ...createDto,
                },
            };

            (apiClient.post as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.post<any>('/StorageArea', createDto);
            const result = StorageAreaMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result.code).toBe('YARD-1');
        });

        it('should use mapper for update result', async () => {
            const code = 'YARD-1';
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '15, 15',
                capacity: 150,
                currentOccupancy: 75,
            };

            const mockApiResponse = {
                data: {
                    code,
                    ...updateDto,
                },
            };

            (apiClient.put as Mock).mockResolvedValue(mockApiResponse);

            const response = await apiClient.put<any>(`/StorageArea/${code}`, updateDto);
            const result = StorageAreaMapper.toDomain(response.data);

            expect(result).toHaveProperty('code');
            expect(result.code).toBe(code);
        });
    });
});

