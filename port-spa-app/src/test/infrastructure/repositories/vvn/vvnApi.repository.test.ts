import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { vvnApiRepository } from '../../../../infrastructure/repositories/vvn/vvnApi.repository';
import type { VesselVisitNotification } from '../../../../domain/vvn/vvn.model';
import type {
    CreateVvnDto,
    ApproveVvnDto,
    RejectVvnDto
} from '../../../../infrastructure/repositories/vvn/vvn.dto';

// Create mock functions
const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
};

// Mock the apiClient module
vi.mock('../../../services/apiService', () => ({
    apiClient: mockApiClient
}));


describe('VvnApiRepository', () => {
    const mockVvn: VesselVisitNotification = {
        id: '1',
        businessId: 'VVN-2025-001',
        status: 'InProgress',
        estimatedArrival: '2025-11-25T08:00:00Z',
        estimatedDeparture: '2025-11-26T18:00:00Z',
        vesselImo: 'IMO1234567',
        submittedBy: 'rep123',
        assignedDockId: null,
        assignedDockName: null,
        cargo: {
            id: 1,
            description: 'Test cargo',
            weight: 1000,
            containers: []
        },
        crewMembers: [],
        decisionLog: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getAll', () => {
        it('should fetch all VVNs from API', async () => {
            const mockResponse = { data: [mockVvn] };
            mockApiClient.get.mockResolvedValue(mockResponse);

            const result = await vvnApiRepository.getAll();

            expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/search');
            expect(mockApiClient.get).toHaveBeenCalledTimes(1);
            expect(result).toEqual([mockVvn]);
        });

        it('should return empty array when no VVNs exist', async () => {
            const mockResponse = { data: [] };
            mockApiClient.get.mockResolvedValue(mockResponse);

            const result = await vvnApiRepository.getAll();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should return multiple VVNs', async () => {
            const mockVvns = [
                mockVvn,
                { ...mockVvn, id: '2', businessId: 'VVN-2025-002' },
                { ...mockVvn, id: '3', businessId: 'VVN-2025-003' }
            ];
            const mockResponse = { data: mockVvns };
            mockApiClient.get.mockResolvedValue(mockResponse);

            const result = await vvnApiRepository.getAll();

            expect(result).toHaveLength(3);
            expect(result[0].businessId).toBe('VVN-2025-001');
            expect(result[1].businessId).toBe('VVN-2025-002');
            expect(result[2].businessId).toBe('VVN-2025-003');
        });

        it('should handle API errors', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Network error'));

            await expect(vvnApiRepository.getAll()).rejects.toThrow('Network error');
        });

        it('should map API response to domain models', async () => {
            const apiResponse = {
                data: [
                    {
                        id: '1',
                        businessId: 'VVN-2025-001',
                        status: 'Approved',
                        estimatedArrival: '2025-11-25T08:00:00Z',
                        estimatedDeparture: '2025-11-26T18:00:00Z',
                        vesselImo: 'IMO1234567',
                        submittedBy: 'rep123',
                        assignedDockId: 'dock1',
                        assignedDockName: 'Dock A',
                        cargo: {
                            id: 1,
                            description: 'Electronics',
                            weight: 5000,
                            containers: [
                                { id: 1, containerCode: 'MSCU1234567', position: 'A1' }
                            ]
                        },
                        crewMembers: [
                            { id: '1', name: 'Captain', nationality: 'USA', isSafetyOfficer: true }
                        ],
                        decisionLog: [
                            {
                                id: 1,
                                timestamp: '2025-11-20T12:00:00Z',
                                officerId: 'officer123',
                                outcome: 'Approved',
                                reason: null
                            }
                        ]
                    }
                ]
            };
            mockApiClient.get.mockResolvedValue(apiResponse);

            const result = await vvnApiRepository.getAll();

            expect(result[0].status).toBe('Approved');
            expect(result[0].assignedDockName).toBe('Dock A');
            expect(result[0].cargo.containers).toHaveLength(1);
            expect(result[0].crewMembers).toHaveLength(1);
            expect(result[0].decisionLog).toHaveLength(1);
        });
    });

    describe('getById', () => {
        it('should fetch VVN by business ID', async () => {
            const mockResponse = { data: mockVvn };
            mockApiClient.get.mockResolvedValue(mockResponse);

            const result = await vvnApiRepository.getById('VVN-2025-001');

            expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/VVN-2025-001');
            expect(result).toEqual(mockVvn);
        });

        it('should handle not found errors', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Not found'));

            await expect(vvnApiRepository.getById('INVALID')).rejects.toThrow('Not found');
        });

        it('should properly construct URL with business ID', async () => {
            const mockResponse = { data: mockVvn };
            mockApiClient.get.mockResolvedValue(mockResponse);

            await vvnApiRepository.getById('VVN-2025-999');

            expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/VVN-2025-999');
        });
    });

    describe('create', () => {
        const createDto: CreateVvnDto = {
            estimatedArrival: '2025-11-25T08:00:00Z',
            estimatedDeparture: '2025-11-26T18:00:00Z',
            vesselImo: 'IMO1234567',
            representativeCitizenId: 'rep123',
            cargo: {
                description: 'Test cargo',
                weight: 1000,
                containers: []
            },
            crewMembers: []
        };

        it('should create new VVN', async () => {
            const mockResponse = { data: mockVvn };
            mockApiClient.post.mockResolvedValue(mockResponse);

            const result = await vvnApiRepository.create(createDto);

            expect(mockApiClient.post).toHaveBeenCalledWith('/notifications', createDto);
            expect(result).toEqual(mockVvn);
        });

        it('should handle creation errors', async () => {
            mockApiClient.post.mockRejectedValue(new Error('Validation failed'));

            await expect(vvnApiRepository.create(createDto)).rejects.toThrow('Validation failed');
        });

        it('should send complete DTO to API', async () => {
            const completeDto: CreateVvnDto = {
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                representativeCitizenId: 'rep123',
                cargo: {
                    description: 'Electronics',
                    weight: 5000,
                    containers: [
                        { containerCode: 'MSCU1234567', position: 'A1' },
                        { containerCode: 'MSCU7654321', position: 'B2' }
                    ]
                },
                crewMembers: [
                    { name: 'Captain', nationality: 'USA', isSafetyOfficer: true },
                    { name: 'First Mate', nationality: 'UK', isSafetyOfficer: false }
                ]
            };
            const mockResponse = { data: mockVvn };
            mockApiClient.post.mockResolvedValue(mockResponse);

            await vvnApiRepository.create(completeDto);

            expect(mockApiClient.post).toHaveBeenCalledWith('/notifications', completeDto);
            const callArgs = mockApiClient.post.mock.calls[0][1];
            expect(callArgs).toHaveProperty('cargo');
            expect(callArgs).toHaveProperty('crewMembers');
            expect(callArgs.cargo.containers).toHaveLength(2);
            expect(callArgs.crewMembers).toHaveLength(2);
        });
    });

    describe('update', () => {
        const updateDto: CreateVvnDto = {
            estimatedArrival: '2025-11-25T08:00:00Z',
            estimatedDeparture: '2025-11-27T18:00:00Z',
            vesselImo: 'IMO1234567',
            representativeCitizenId: 'rep123',
            cargo: {
                description: 'Updated cargo',
                weight: 2000,
                containers: []
            },
            crewMembers: []
        };

        it('should update existing VVN', async () => {
            const updatedVvn = { ...mockVvn, cargo: { ...mockVvn.cargo, weight: 2000 } };
            const mockResponse = { data: updatedVvn };
            mockApiClient.put.mockResolvedValue(mockResponse);

            const result = await vvnApiRepository.update('VVN-2025-001', updateDto);

            expect(mockApiClient.put).toHaveBeenCalledWith('/notifications/VVN-2025-001', updateDto);
            expect(result).toEqual(updatedVvn);
        });

        it('should handle update errors', async () => {
            mockApiClient.put.mockRejectedValue(new Error('Update failed'));

            await expect(vvnApiRepository.update('VVN-2025-001', updateDto)).rejects.toThrow('Update failed');
        });

        it('should properly construct URL for update', async () => {
            const mockResponse = { data: mockVvn };
            mockApiClient.put.mockResolvedValue(mockResponse);

            await vvnApiRepository.update('VVN-2025-999', updateDto);

            expect(mockApiClient.put).toHaveBeenCalledWith('/notifications/VVN-2025-999', updateDto);
        });
    });

    describe('submit', () => {
        it('should submit VVN', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.submit('VVN-2025-001');

            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-001/submit');
        });

        it('should handle submission errors', async () => {
            mockApiClient.patch.mockRejectedValue(new Error('Cannot submit'));

            await expect(vvnApiRepository.submit('VVN-2025-001')).rejects.toThrow('Cannot submit');
        });

        it('should construct correct submit endpoint', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.submit('VVN-2025-999');

            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-999/submit');
        });
    });

    describe('approve', () => {
        const approveDto: ApproveVvnDto = {
            officerId: 'officer123',
            dockName: 'Dock A'
        };

        it('should approve VVN', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.approve('VVN-2025-001', approveDto);

            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-001/approve', approveDto);
        });

        it('should handle approval errors', async () => {
            mockApiClient.patch.mockRejectedValue(new Error('Approval failed'));

            await expect(vvnApiRepository.approve('VVN-2025-001', approveDto)).rejects.toThrow('Approval failed');
        });

        it('should send approval DTO to API', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.approve('VVN-2025-001', approveDto);

            const callArgs = mockApiClient.patch.mock.calls[0];
            expect(callArgs[1]).toEqual(approveDto);
            expect(callArgs[1]).toHaveProperty('officerId');
            expect(callArgs[1]).toHaveProperty('dockName');
        });
    });

    describe('reject', () => {
        const rejectDto: RejectVvnDto = {
            officerId: 'officer456',
            reason: 'Missing safety certificates'
        };

        it('should reject VVN', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.reject('VVN-2025-001', rejectDto);

            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-001/reject', rejectDto);
        });

        it('should handle rejection errors', async () => {
            mockApiClient.patch.mockRejectedValue(new Error('Rejection failed'));

            await expect(vvnApiRepository.reject('VVN-2025-001', rejectDto)).rejects.toThrow('Rejection failed');
        });

        it('should send rejection DTO with reason to API', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.reject('VVN-2025-001', rejectDto);

            const callArgs = mockApiClient.patch.mock.calls[0];
            expect(callArgs[1]).toEqual(rejectDto);
            expect(callArgs[1]).toHaveProperty('officerId');
            expect(callArgs[1]).toHaveProperty('reason');
            expect(callArgs[1].reason).toBe('Missing safety certificates');
        });
    });

    describe('reopen', () => {
        it('should reopen VVN', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.reopen('VVN-2025-001');

            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-001/resubmit');
        });

        it('should handle reopen errors', async () => {
            mockApiClient.patch.mockRejectedValue(new Error('Cannot reopen'));

            await expect(vvnApiRepository.reopen('VVN-2025-001')).rejects.toThrow('Cannot reopen');
        });

        it('should construct correct reopen endpoint', async () => {
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            await vvnApiRepository.reopen('VVN-2025-999');

            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-999/resubmit');
        });
    });

    describe('API endpoint integration', () => {
        it('should use correct base path for all endpoints', async () => {
            const mockResponse = { data: mockVvn };
            mockApiClient.get.mockResolvedValue(mockResponse);
            mockApiClient.post.mockResolvedValue(mockResponse);
            mockApiClient.put.mockResolvedValue(mockResponse);
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            const createDto: CreateVvnDto = {
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                representativeCitizenId: 'rep123',
                cargo: { description: 'Test', weight: 1000, containers: [] },
                crewMembers: []
            };

            await vvnApiRepository.getAll();
            expect(mockApiClient.get.mock.calls[0][0]).toContain('/notifications');

            await vvnApiRepository.getById('VVN-2025-001');
            expect(mockApiClient.get.mock.calls[1][0]).toContain('/notifications');

            await vvnApiRepository.create(createDto);
            expect(mockApiClient.post.mock.calls[0][0]).toContain('/notifications');

            await vvnApiRepository.update('VVN-2025-001', createDto);
            expect(mockApiClient.put.mock.calls[0][0]).toContain('/notifications');
        });

        it('should handle complete workflow through repository', async () => {
            const createDto: CreateVvnDto = {
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                representativeCitizenId: 'rep123',
                cargo: { description: 'Test', weight: 1000, containers: [] },
                crewMembers: []
            };
            const approveDto: ApproveVvnDto = { officerId: 'officer123', dockName: 'Dock A' };

            mockApiClient.post.mockResolvedValue({ data: mockVvn });
            mockApiClient.patch.mockResolvedValue({ data: undefined });

            // Create
            const created = await vvnApiRepository.create(createDto);
            expect(created).toBeDefined();

            // Submit
            await vvnApiRepository.submit('VVN-2025-001');
            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-001/submit');

            // Approve
            await vvnApiRepository.approve('VVN-2025-001', approveDto);
            expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/VVN-2025-001/approve', approveDto);
        });
    });
});
