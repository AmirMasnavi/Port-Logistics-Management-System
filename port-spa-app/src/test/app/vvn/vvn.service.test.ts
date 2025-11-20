import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VvnService } from '../../../app/vvn/vvn.service';
import { VvnValidationError } from '../../../domain/vvn/vvn.errors';
import type { IVvnRepository } from '../../../app/vvn/vvn.repository';
import type { VesselVisitNotification } from '../../../domain/vvn/vvn.model';
import type {
    CreateVvnDto,
    ApproveVvnDto,
    RejectVvnDto
} from '../../../infrastructure/repositories/vvn/vvn.dto';

// Mock repository implementation for testing
class MockVvnRepository implements IVvnRepository {
    getAll = vi.fn();
    getById = vi.fn();
    create = vi.fn();
    update = vi.fn();
    submit = vi.fn();
    approve = vi.fn();
    reject = vi.fn();
    reopen = vi.fn();
}

describe('VvnService', () => {
    let service: VvnService;
    let mockRepo: MockVvnRepository;

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
        mockRepo = new MockVvnRepository();
        service = new VvnService(mockRepo);
    });

    describe('constructor', () => {
        it('should initialize with repository', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(VvnService);
        });
    });

    describe('fetchAllVvns', () => {
        it('should fetch and return all VVNs', async () => {
            const mockVvns = [mockVvn];
            mockRepo.getAll.mockResolvedValue(mockVvns);

            const result = await service.fetchAllVvns();

            expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVvns);
        });

        it('should sort VVNs by estimatedArrival descending (newest first)', async () => {
            const mockVvns = [
                { ...mockVvn, id: '1', estimatedArrival: '2025-11-25T08:00:00Z' },
                { ...mockVvn, id: '2', estimatedArrival: '2025-11-27T08:00:00Z' },
                { ...mockVvn, id: '3', estimatedArrival: '2025-11-26T08:00:00Z' }
            ];
            mockRepo.getAll.mockResolvedValue(mockVvns);

            const result = await service.fetchAllVvns();

            expect(result[0].id).toBe('2'); // 2025-11-27 (newest)
            expect(result[1].id).toBe('3'); // 2025-11-26
            expect(result[2].id).toBe('1'); // 2025-11-25 (oldest)
        });

        it('should return empty array when no VVNs exist', async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.fetchAllVvns();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should handle repository errors', async () => {
            mockRepo.getAll.mockRejectedValue(new Error('Database error'));

            await expect(service.fetchAllVvns()).rejects.toThrow('Database error');
        });
    });

    describe('getVvnById', () => {
        it('should fetch VVN by business ID', async () => {
            mockRepo.getById.mockResolvedValue(mockVvn);

            const result = await service.getVvnById('VVN-2025-001');

            expect(mockRepo.getById).toHaveBeenCalledWith('VVN-2025-001');
            expect(result).toEqual(mockVvn);
        });

        it('should handle non-existent VVN', async () => {
            mockRepo.getById.mockRejectedValue(new Error('Not found'));

            await expect(service.getVvnById('INVALID')).rejects.toThrow('Not found');
        });
    });

    describe('createVvn', () => {
        const validDto: CreateVvnDto = {
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

        it('should create VVN with valid data', async () => {
            mockRepo.create.mockResolvedValue(mockVvn);

            const result = await service.createVvn(validDto);

            expect(mockRepo.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(mockVvn);
        });

        it('should throw error when vessel IMO is missing', async () => {
            const invalidDto = { ...validDto, vesselImo: '' };

            await expect(service.createVvn(invalidDto)).rejects.toThrow(VvnValidationError);
            await expect(service.createVvn(invalidDto)).rejects.toThrow('Vessel IMO is required.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when departure is before arrival', async () => {
            const invalidDto = {
                ...validDto,
                estimatedArrival: '2025-11-26T18:00:00Z',
                estimatedDeparture: '2025-11-25T08:00:00Z'
            };

            await expect(service.createVvn(invalidDto)).rejects.toThrow(VvnValidationError);
            await expect(service.createVvn(invalidDto)).rejects.toThrow('Departure date must be after arrival date.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when departure equals arrival', async () => {
            const invalidDto = {
                ...validDto,
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-25T08:00:00Z'
            };

            await expect(service.createVvn(invalidDto)).rejects.toThrow(VvnValidationError);
            await expect(service.createVvn(invalidDto)).rejects.toThrow('Departure date must be after arrival date.');
        });

        it('should throw error when container has invalid code', async () => {
            const invalidDto = {
                ...validDto,
                cargo: {
                    description: 'Test',
                    weight: 1000,
                    containers: [
                        { containerCode: 'INVALID', position: 'A1' }
                    ]
                }
            };

            await expect(service.createVvn(invalidDto)).rejects.toThrow(VvnValidationError);
            await expect(service.createVvn(invalidDto)).rejects.toThrow('All containers must have a valid container code.');
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should throw error when container code is empty', async () => {
            const invalidDto = {
                ...validDto,
                cargo: {
                    description: 'Test',
                    weight: 1000,
                    containers: [
                        { containerCode: '', position: 'A1' }
                    ]
                }
            };

            await expect(service.createVvn(invalidDto)).rejects.toThrow(VvnValidationError);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it('should accept VVN with valid containers', async () => {
            const dtoWithContainers: CreateVvnDto = {
                ...validDto,
                cargo: {
                    description: 'Electronics',
                    weight: 5000,
                    containers: [
                        { containerCode: 'MSCU1234567', position: 'A1' },
                        { containerCode: 'HLCU9876543', position: 'B2' }
                    ]
                }
            };
            mockRepo.create.mockResolvedValue(mockVvn);

            const result = await service.createVvn(dtoWithContainers);

            expect(mockRepo.create).toHaveBeenCalledWith(dtoWithContainers);
            expect(result).toBeDefined();
        });

        it('should accept VVN with crew members', async () => {
            const dtoWithCrew: CreateVvnDto = {
                ...validDto,
                crewMembers: [
                    { name: 'Captain', nationality: 'USA', isSafetyOfficer: true },
                    { name: 'First Mate', nationality: 'UK', isSafetyOfficer: false }
                ]
            };
            mockRepo.create.mockResolvedValue(mockVvn);

            const result = await service.createVvn(dtoWithCrew);

            expect(mockRepo.create).toHaveBeenCalledWith(dtoWithCrew);
            expect(result).toBeDefined();
        });
    });

    describe('updateVvn', () => {
        const validDto: CreateVvnDto = {
            estimatedArrival: '2025-11-25T08:00:00Z',
            estimatedDeparture: '2025-11-26T18:00:00Z',
            vesselImo: 'IMO1234567',
            representativeCitizenId: 'rep123',
            cargo: {
                description: 'Updated cargo',
                weight: 2000,
                containers: []
            },
            crewMembers: []
        };

        it('should update VVN with valid data', async () => {
            const updatedVvn = { ...mockVvn, cargo: { ...mockVvn.cargo, weight: 2000 } };
            mockRepo.update.mockResolvedValue(updatedVvn);

            const result = await service.updateVvn('VVN-2025-001', validDto);

            expect(mockRepo.update).toHaveBeenCalledWith('VVN-2025-001', validDto);
            expect(result).toEqual(updatedVvn);
        });

        it('should validate data before updating', async () => {
            const invalidDto = { ...validDto, vesselImo: '' };

            await expect(service.updateVvn('VVN-2025-001', invalidDto)).rejects.toThrow(VvnValidationError);
            expect(mockRepo.update).not.toHaveBeenCalled();
        });

        it('should throw error for invalid dates during update', async () => {
            const invalidDto = {
                ...validDto,
                estimatedArrival: '2025-11-26T18:00:00Z',
                estimatedDeparture: '2025-11-25T08:00:00Z'
            };

            await expect(service.updateVvn('VVN-2025-001', invalidDto)).rejects.toThrow(VvnValidationError);
        });
    });

    describe('submitVvn', () => {
        it('should submit VVN by business ID', async () => {
            mockRepo.submit.mockResolvedValue(undefined);

            await service.submitVvn('VVN-2025-001');

            expect(mockRepo.submit).toHaveBeenCalledWith('VVN-2025-001');
        });

        it('should handle submission errors', async () => {
            mockRepo.submit.mockRejectedValue(new Error('Cannot submit'));

            await expect(service.submitVvn('VVN-2025-001')).rejects.toThrow('Cannot submit');
        });
    });

    describe('approveVvn', () => {
        const validApproveDto: ApproveVvnDto = {
            officerId: 'officer123',
            dockName: 'Dock A'
        };

        it('should approve VVN with valid data', async () => {
            mockRepo.approve.mockResolvedValue(undefined);

            await service.approveVvn('VVN-2025-001', validApproveDto);

            expect(mockRepo.approve).toHaveBeenCalledWith('VVN-2025-001', validApproveDto);
        });

        it('should throw error when dock name is missing', async () => {
            const invalidDto = { ...validApproveDto, dockName: '' };

            await expect(service.approveVvn('VVN-2025-001', invalidDto)).rejects.toThrow(VvnValidationError);
            await expect(service.approveVvn('VVN-2025-001', invalidDto)).rejects.toThrow('A dock must be assigned for approval.');
            expect(mockRepo.approve).not.toHaveBeenCalled();
        });

        it('should handle approval errors from repository', async () => {
            mockRepo.approve.mockRejectedValue(new Error('Approval failed'));

            await expect(service.approveVvn('VVN-2025-001', validApproveDto)).rejects.toThrow('Approval failed');
        });
    });

    describe('rejectVvn', () => {
        const validRejectDto: RejectVvnDto = {
            officerId: 'officer456',
            reason: 'Missing safety certificates'
        };

        it('should reject VVN with valid reason', async () => {
            mockRepo.reject.mockResolvedValue(undefined);

            await service.rejectVvn('VVN-2025-001', validRejectDto);

            expect(mockRepo.reject).toHaveBeenCalledWith('VVN-2025-001', validRejectDto);
        });

        it('should throw error when reason is missing', async () => {
            const invalidDto = { ...validRejectDto, reason: '' };

            await expect(service.rejectVvn('VVN-2025-001', invalidDto)).rejects.toThrow(VvnValidationError);
            await expect(service.rejectVvn('VVN-2025-001', invalidDto)).rejects.toThrow('A valid reason is required for rejection.');
            expect(mockRepo.reject).not.toHaveBeenCalled();
        });

        it('should throw error when reason is too short', async () => {
            const invalidDto = { ...validRejectDto, reason: 'Bad' };

            await expect(service.rejectVvn('VVN-2025-001', invalidDto)).rejects.toThrow(VvnValidationError);
            expect(mockRepo.reject).not.toHaveBeenCalled();
        });

        it('should throw error when reason is only whitespace', async () => {
            const invalidDto = { ...validRejectDto, reason: '    ' };

            await expect(service.rejectVvn('VVN-2025-001', invalidDto)).rejects.toThrow(VvnValidationError);
            expect(mockRepo.reject).not.toHaveBeenCalled();
        });

        it('should accept valid reason with minimum length', async () => {
            const validDto = { ...validRejectDto, reason: 'Valid' };
            mockRepo.reject.mockResolvedValue(undefined);

            await service.rejectVvn('VVN-2025-001', validDto);

            expect(mockRepo.reject).toHaveBeenCalledWith('VVN-2025-001', validDto);
        });

        it('should handle rejection errors from repository', async () => {
            mockRepo.reject.mockRejectedValue(new Error('Rejection failed'));

            await expect(service.rejectVvn('VVN-2025-001', validRejectDto)).rejects.toThrow('Rejection failed');
        });
    });

    describe('reopenVvn', () => {
        it('should reopen VVN by business ID', async () => {
            mockRepo.reopen.mockResolvedValue(undefined);

            await service.reopenVvn('VVN-2025-001');

            expect(mockRepo.reopen).toHaveBeenCalledWith('VVN-2025-001');
        });

        it('should handle reopen errors', async () => {
            mockRepo.reopen.mockRejectedValue(new Error('Cannot reopen'));

            await expect(service.reopenVvn('VVN-2025-001')).rejects.toThrow('Cannot reopen');
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete VVN lifecycle', async () => {
            const createDto: CreateVvnDto = {
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                representativeCitizenId: 'rep123',
                cargo: { description: 'Test', weight: 1000, containers: [] },
                crewMembers: []
            };
            const approveDto: ApproveVvnDto = {
                officerId: 'officer123',
                dockName: 'Dock A'
            };

            mockRepo.create.mockResolvedValue(mockVvn);
            mockRepo.submit.mockResolvedValue(undefined);
            mockRepo.approve.mockResolvedValue(undefined);

            // Create
            await service.createVvn(createDto);
            expect(mockRepo.create).toHaveBeenCalled();

            // Submit
            await service.submitVvn('VVN-2025-001');
            expect(mockRepo.submit).toHaveBeenCalled();

            // Approve
            await service.approveVvn('VVN-2025-001', approveDto);
            expect(mockRepo.approve).toHaveBeenCalled();
        });

        it('should handle rejection and reopen workflow', async () => {
            const rejectDto: RejectVvnDto = {
                officerId: 'officer456',
                reason: 'Missing documents'
            };

            mockRepo.reject.mockResolvedValue(undefined);
            mockRepo.reopen.mockResolvedValue(undefined);

            // Reject
            await service.rejectVvn('VVN-2025-001', rejectDto);
            expect(mockRepo.reject).toHaveBeenCalled();

            // Reopen
            await service.reopenVvn('VVN-2025-001');
            expect(mockRepo.reopen).toHaveBeenCalled();
        });
    });
});

