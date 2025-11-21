import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourceService } from '../../app/resource/resource.service';
import type { IResourceRepository } from '../../app/resource/resource.repository';
import type { Resource } from '../../domain/resource/resource.model';
import type {
    ResourceCreateDto,
    ResourceUpdateDto,
} from '../../infrastructure/repositories/resource/resource.dto';

describe('ResourceService', () => {
    let mockRepository: IResourceRepository;
    let service: ResourceService;

    beforeEach(() => {
        // Create a mock repository
        mockRepository = {
            getAll: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateStatus: vi.fn(),
        };

        service = new ResourceService(mockRepository);
    });

    describe('fetchAllResources', () => {
        it('should fetch and sort resources by code', async () => {
            const mockResources: Resource[] = [
                { code: 'RES-003', description: 'Resource 3', kind: 'Truck', status: 'Active', setupTimeMinutes: 30, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'RES-001', description: 'Resource 1', kind: 'Forklift', status: 'Active', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'RES-002', description: 'Resource 2', kind: 'Crane', status: 'Active', setupTimeMinutes: 20, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
            ];

            vi.mocked(mockRepository.getAll).mockResolvedValue(mockResources);

            const result = await service.fetchAllResources();

            expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(3);
            expect(result[0].code).toBe('RES-001');
            expect(result[1].code).toBe('RES-002');
            expect(result[2].code).toBe('RES-003');
        });

        it('should return empty array when no resources exist', async () => {
            vi.mocked(mockRepository.getAll).mockResolvedValue([]);

            const result = await service.fetchAllResources();

            expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        it('should sort resources alphabetically by code', async () => {
            const mockResources: Resource[] = [
                { code: 'Z-1', description: 'Resource Z', kind: 'Forklift', status: 'Active', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'A-1', description: 'Resource A', kind: 'Forklift', status: 'Active', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'M-1', description: 'Resource M', kind: 'Forklift', status: 'Active', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
            ];

            vi.mocked(mockRepository.getAll).mockResolvedValue(mockResources);

            const result = await service.fetchAllResources();

            expect(result[0].code).toBe('A-1');
            expect(result[1].code).toBe('M-1');
            expect(result[2].code).toBe('Z-1');
        });

        it('should handle repository errors', async () => {
            const error = new Error('Database connection failed');
            vi.mocked(mockRepository.getAll).mockRejectedValue(error);

            await expect(service.fetchAllResources()).rejects.toThrow('Database connection failed');
        });
    });

    describe('createResource', () => {
        it('should create a valid resource', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Forklift A1',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License'],
            };

            const createdResource: Resource = {
                code: 'RES-001',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdResource);

            const result = await service.createResource(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(createdResource);
        });

        it('should throw error when description is empty', async () => {
            const createDto: ResourceCreateDto = {
                description: '',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Description is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when description is only whitespace', async () => {
            const createDto: ResourceCreateDto = {
                description: '   ',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Description is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when kind is empty', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: '',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Resource kind is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when kind is only whitespace', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: '   ',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Resource kind is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when status is empty', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: '',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Status is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when status is only whitespace', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: '   ',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Status is required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when setup time is negative', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: -10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Setup time cannot be negative.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when operational window start is missing', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Operational window start and end times are required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when operational window end is missing', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Operational window start and end times are required.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when operational window start has invalid format', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '25:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Invalid operational window start time format. Expected HH:mm.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when operational window end has invalid format', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '25:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Invalid operational window end time format. Expected HH:mm.'
            );

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should accept resource with zero setup time', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Quick Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 0,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const createdResource: Resource = {
                code: 'RES-001',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdResource);

            const result = await service.createResource(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result.setupTimeMinutes).toBe(0);
        });

        it('should accept valid time formats', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '8:00',
                operationalWindowEnd: '18:30',
            };

            const createdResource: Resource = {
                code: 'RES-001',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdResource);

            const result = await service.createResource(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(result.operationalWindowStart).toBe('8:00');
            expect(result.operationalWindowEnd).toBe('18:30');
        });
    });

    describe('updateResource', () => {
        it('should update a valid resource', async () => {
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

            const updatedResource: Resource = {
                code,
                ...updateDto,
            };

            vi.mocked(mockRepository.update).mockResolvedValue(updatedResource);

            const result = await service.updateResource(code, updateDto);

            expect(mockRepository.update).toHaveBeenCalledWith(code, updateDto);
            expect(result).toEqual(updatedResource);
        });

        it('should throw error when description is empty', async () => {
            const updateDto: ResourceUpdateDto = {
                description: '',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.updateResource('RES-001', updateDto)).rejects.toThrow(
                'Description is required.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when kind is empty', async () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: '',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.updateResource('RES-001', updateDto)).rejects.toThrow(
                'Resource kind is required.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when status is empty', async () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: '',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.updateResource('RES-001', updateDto)).rejects.toThrow(
                'Status is required.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when setup time is negative', async () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: -10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.updateResource('RES-001', updateDto)).rejects.toThrow(
                'Setup time cannot be negative.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when operational window times are invalid', async () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: 'invalid',
                operationalWindowEnd: '18:00',
            };

            await expect(service.updateResource('RES-001', updateDto)).rejects.toThrow(
                'Invalid operational window start time format. Expected HH:mm.'
            );

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should accept update with zero setup time', async () => {
            const code = 'RES-001';
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 0,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const updatedResource: Resource = {
                code,
                ...updateDto,
            };

            vi.mocked(mockRepository.update).mockResolvedValue(updatedResource);

            const result = await service.updateResource(code, updateDto);

            expect(mockRepository.update).toHaveBeenCalledWith(code, updateDto);
            expect(result.setupTimeMinutes).toBe(0);
        });

        it('should validate before calling repository', async () => {
            const updateDto: ResourceUpdateDto = {
                description: '',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.updateResource('RES-001', updateDto)).rejects.toThrow();

            expect(mockRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('updateResourceStatus', () => {
        it('should update resource status to Active', async () => {
            const code = 'RES-001';
            const newStatus = 'Active';

            vi.mocked(mockRepository.updateStatus).mockResolvedValue();

            await service.updateResourceStatus(code, newStatus);

            expect(mockRepository.updateStatus).toHaveBeenCalledWith(code, { NewStatus: newStatus });
        });

        it('should update resource status to Inactive', async () => {
            const code = 'RES-001';
            const newStatus = 'Inactive';

            vi.mocked(mockRepository.updateStatus).mockResolvedValue();

            await service.updateResourceStatus(code, newStatus);

            expect(mockRepository.updateStatus).toHaveBeenCalledWith(code, { NewStatus: newStatus });
        });

        it('should update resource status to UnderMaintenance', async () => {
            const code = 'RES-001';
            const newStatus = 'UnderMaintenance';

            vi.mocked(mockRepository.updateStatus).mockResolvedValue();

            await service.updateResourceStatus(code, newStatus);

            expect(mockRepository.updateStatus).toHaveBeenCalledWith(code, { NewStatus: newStatus });
        });

        it('should throw error when status is empty', async () => {
            await expect(service.updateResourceStatus('RES-001', '')).rejects.toThrow(
                'Status is required.'
            );

            expect(mockRepository.updateStatus).not.toHaveBeenCalled();
        });

        it('should throw error when status is only whitespace', async () => {
            await expect(service.updateResourceStatus('RES-001', '   ')).rejects.toThrow(
                'Status is required.'
            );

            expect(mockRepository.updateStatus).not.toHaveBeenCalled();
        });

        it('should throw error when status is invalid', async () => {
            await expect(service.updateResourceStatus('RES-001', 'InvalidStatus')).rejects.toThrow(
                'Invalid status. Must be one of: Active, Inactive, UnderMaintenance'
            );

            expect(mockRepository.updateStatus).not.toHaveBeenCalled();
        });

        it('should reject status with wrong casing', async () => {
            await expect(service.updateResourceStatus('RES-001', 'active')).rejects.toThrow(
                'Invalid status. Must be one of: Active, Inactive, UnderMaintenance'
            );

            expect(mockRepository.updateStatus).not.toHaveBeenCalled();
        });
    });

    describe('Validation Edge Cases', () => {
        it('should accept valid time format with single digit hours', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '8:00',
                operationalWindowEnd: '18:00',
            };

            const createdResource: Resource = {
                code: 'RES-001',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdResource);

            const result = await service.createResource(createDto);

            expect(result.operationalWindowStart).toBe('8:00');
        });

        it('should accept valid time format at midnight', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '00:00',
                operationalWindowEnd: '23:59',
            };

            const createdResource: Resource = {
                code: 'RES-001',
                ...createDto,
            };

            vi.mocked(mockRepository.create).mockResolvedValue(createdResource);

            const result = await service.createResource(createDto);

            expect(result.operationalWindowStart).toBe('00:00');
            expect(result.operationalWindowEnd).toBe('23:59');
        });

        it('should reject time format with invalid hours', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '24:00',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Invalid operational window start time format. Expected HH:mm.'
            );
        });

        it('should reject time format with invalid minutes', async () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:60',
                operationalWindowEnd: '18:00',
            };

            await expect(service.createResource(createDto)).rejects.toThrow(
                'Invalid operational window start time format. Expected HH:mm.'
            );
        });
    });
});

