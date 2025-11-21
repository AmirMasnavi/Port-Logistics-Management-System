import type {
    Resource,
} from '../../domain/resource/resource.model';
import type { IResourceRepository } from './resource.repository';
import type {
    ResourceCreateDto,
    ResourceUpdateDto
} from '../../infrastructure/repositories/resource/resource.dto';

// This is our "Service" or "Use Case" layer.
// It contains business logic.
// It depends on the INTERFACE (IResourceRepository), not the implementation.

export class ResourceService {
    // We "inject" the repository
    private readonly resourceRepo: IResourceRepository;

    constructor(resourceRepo: IResourceRepository) {
        this.resourceRepo = resourceRepo;
    }

    async fetchAllResources(): Promise<Resource[]> {
        const resources = await this.resourceRepo.getAll();
        // Business rule: Sort by code
        return resources.sort((a, b) => a.code.localeCompare(b.code));
    }

    private validateResourceDto(dto: ResourceCreateDto | ResourceUpdateDto) {
        // Business validation
        if (!dto.description || dto.description.trim().length === 0) {
            throw new Error('Description is required.');
        }
        if (!dto.kind || dto.kind.trim().length === 0) {
            throw new Error('Resource kind is required.');
        }
        if (!dto.status || dto.status.trim().length === 0) {
            throw new Error('Status is required.');
        }
        if (dto.setupTimeMinutes < 0) {
            throw new Error('Setup time cannot be negative.');
        }
        if (!dto.operationalWindowStart || !dto.operationalWindowEnd) {
            throw new Error('Operational window start and end times are required.');
        }
        // Validate time format (HH:mm)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(dto.operationalWindowStart)) {
            throw new Error('Invalid operational window start time format. Expected HH:mm.');
        }
        if (!timeRegex.test(dto.operationalWindowEnd)) {
            throw new Error('Invalid operational window end time format. Expected HH:mm.');
        }
    }

    async createResource(dto: ResourceCreateDto): Promise<Resource> {
        this.validateResourceDto(dto);
        return this.resourceRepo.create(dto);
    }

    async updateResource(code: string, dto: ResourceUpdateDto): Promise<Resource> {
        this.validateResourceDto(dto);
        return this.resourceRepo.update(code, dto);
    }

    async updateResourceStatus(code: string, newStatus: string): Promise<void> {
        if (!newStatus || newStatus.trim().length === 0) {
            throw new Error('Status is required.');
        }
        const validStatuses = ['Active', 'Inactive', 'UnderMaintenance'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        return this.resourceRepo.updateStatus(code, { NewStatus: newStatus });
    }
}

