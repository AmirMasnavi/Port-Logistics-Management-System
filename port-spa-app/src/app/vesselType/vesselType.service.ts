import type { VesselType } from '../../domain/vesselType/vesselType.model';
import type {
    CreateVesselTypeDto,
    UpdateVesselTypeDto
} from '../../infrastructure/repositories/vesselType/vesselType.dto';
import type { IVesselTypeRepository } from './vesselType.repository';
import { VesselTypeValidationError } from '../../domain/vesselType/vesselType.errors';

// This is the "Chef". It contains the business logic.
// It uses the repository (Shopping List) to get data,
// but doesn't know *how* the repository gets it.

export class VesselTypeService {
    private repository: IVesselTypeRepository;
    
    constructor(repository: IVesselTypeRepository) {
        this.repository = repository;
    }

    public async getAllVesselTypes(): Promise<VesselType[]> {
        return await this.repository.getAll();
    }

    public async getVesselTypeById(id: string): Promise<VesselType> {
        if (!id || id.trim() === '') {
            throw new VesselTypeValidationError('Vessel Type ID is required');
        }
        return await this.repository.getById(id);
    }

    public async createVesselType(dto: CreateVesselTypeDto): Promise<VesselType> {
        // Business validation logic
        this.validateCreateDto(dto);
        return await this.repository.create(dto);
    }

    public async updateVesselType(id: string, dto: UpdateVesselTypeDto): Promise<VesselType> {
        if (!id || id.trim() === '') {
            throw new VesselTypeValidationError('Vessel Type ID is required');
        }
        this.validateUpdateDto(dto);
        return await this.repository.update(id, dto);
    }

    public async deleteVesselType(id: string): Promise<void> {
        if (!id || id.trim() === '') {
            throw new VesselTypeValidationError('Vessel Type ID is required');
        }
        await this.repository.delete(id);
    }

    // Private validation methods
    private validateCreateDto(dto: CreateVesselTypeDto): void {
        if (!dto.name || dto.name.trim() === '') {
            throw new VesselTypeValidationError('Vessel Type name is required');
        }
        if (dto.capacity <= 0) {
            throw new VesselTypeValidationError('Capacity must be greater than 0');
        }
        if (dto.maxRows <= 0) {
            throw new VesselTypeValidationError('Max Rows must be greater than 0');
        }
        if (dto.maxBays <= 0) {
            throw new VesselTypeValidationError('Max Bays must be greater than 0');
        }
        if (dto.maxTiers <= 0) {
            throw new VesselTypeValidationError('Max Tiers must be greater than 0');
        }
    }

    private validateUpdateDto(dto: UpdateVesselTypeDto): void {
        if (dto.name !== undefined && dto.name.trim() === '') {
            throw new VesselTypeValidationError('Vessel Type name cannot be empty');
        }
        if (dto.capacity !== undefined && dto.capacity <= 0) {
            throw new VesselTypeValidationError('Capacity must be greater than 0');
        }
        if (dto.maxRows !== undefined && dto.maxRows <= 0) {
            throw new VesselTypeValidationError('Max Rows must be greater than 0');
        }
        if (dto.maxBays !== undefined && dto.maxBays <= 0) {
            throw new VesselTypeValidationError('Max Bays must be greater than 0');
        }
        if (dto.maxTiers !== undefined && dto.maxTiers <= 0) {
            throw new VesselTypeValidationError('Max Tiers must be greater than 0');
        }
    }
}
