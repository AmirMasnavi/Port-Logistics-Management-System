import type {
    StorageArea,
} from '../../domain/storageArea/storageArea.model';
import type { IStorageAreaRepository } from './storageArea.repository';
import type {
    StorageAreaCreateDto,
    StorageAreaUpdateDto
} from '../../infrastructure/repositories/storageArea/storageArea.dto';

// This is our "Service" or "Use Case" layer.
// It contains business logic.
// It depends on the INTERFACE (IStorageAreaRepository), not the implementation.

export class StorageAreaService {
    // We "inject" the repository
    private readonly storageAreaRepo: IStorageAreaRepository;

    constructor(storageAreaRepo: IStorageAreaRepository) {
        this.storageAreaRepo = storageAreaRepo;
    }

    async fetchAllStorageAreas(): Promise<StorageArea[]> {
        const areas = await this.storageAreaRepo.getAll();
        // Business rule: Sort by code
        return areas.sort((a, b) => a.code.localeCompare(b.code));
    }

    private validateStorageAreaDto(dto: StorageAreaCreateDto | StorageAreaUpdateDto) {
        // Business validation
        if (dto.capacity <= 0) {
            throw new Error('Capacity must be greater than 0.');
        }
        if (dto.currentOccupancy < 0) {
            throw new Error('Current occupancy cannot be negative.');
        }
        if (dto.currentOccupancy > dto.capacity) {
            throw new Error('Current occupancy cannot exceed capacity.');
        }
        if (!dto.type || dto.type.trim().length === 0) {
            throw new Error('Storage area type is required.');
        }
        if (!dto.location || dto.location.trim().length === 0) {
            throw new Error('Location is required.');
        }
    }

    async createStorageArea(dto: StorageAreaCreateDto): Promise<StorageArea> {
        this.validateStorageAreaDto(dto);
        return this.storageAreaRepo.create(dto);
    }

    async updateStorageArea(code: string, dto: StorageAreaUpdateDto): Promise<StorageArea> {
        this.validateStorageAreaDto(dto);
        return this.storageAreaRepo.update(code, dto);
    }
}

