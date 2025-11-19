import type { Dock } from '../../domain/dock/dock.model';
import type {
    DockCreateDto,
    UpdateDockDto
} from '../../infrastructure/repositories/dock/dock.dto';
import type { IDockRepository } from './dock.repository';
import { DockValidationError } from '../../domain/dock/dock.errors';

// This is the "Chef". It contains the business logic.
// It uses the repository (Shopping List) to get data,
// but doesn't know *how* the repository gets it.

export class DockService {
    private repository: IDockRepository;
    
    constructor(repository: IDockRepository) {
        this.repository = repository;
    }

    public async getAllDocks(): Promise<Dock[]> {
        return await this.repository.getAll();
    }

    public async getDockById(id: string): Promise<Dock> {
        if (!id || id.trim() === '') {
            throw new DockValidationError('Dock ID is required');
        }
        return await this.repository.getById(id);
    }

    public async createDock(dto: DockCreateDto): Promise<Dock> {
        // Business validation logic
        this.validateCreateDto(dto);
        return await this.repository.create(dto);
    }

    public async updateDock(id: string, dto: UpdateDockDto): Promise<Dock> {
        if (!id || id.trim() === '') {
            throw new DockValidationError('Dock ID is required');
        }
        this.validateUpdateDto(dto);
        return await this.repository.update(id, dto);
    }

    public async deleteDock(id: string): Promise<void> {
        if (!id || id.trim() === '') {
            throw new DockValidationError('Dock ID is required');
        }
        await this.repository.delete(id);
    }

    // Private validation methods
    private validateCreateDto(dto: DockCreateDto): void {
        if (!dto.name || dto.name.trim() === '') {
            throw new DockValidationError('Vessel Type name is required');
        }
        if (!dto.locationZone || dto.locationZone.trim() === '') {
            throw new DockValidationError('Location Zone is required');
        }
        if (!dto.locationSection|| dto.locationSection.trim() === '') {
            throw new DockValidationError('Location Section is required');
        }
        // Numeric validations
        if (dto.lengthInMeters <= 0) {
            throw new DockValidationError('Length must be greater than 0');
        }
        if (dto.depthInMeters <= 0) {
            throw new DockValidationError('Depth must be greater than 0');
        }
        if (dto.maxDraftInMeters <= 0) {
            throw new DockValidationError('Max Draft must be greater than 0');
        }
        if (dto.numberOfSTSCranes < 0) {
            throw new DockValidationError('Number of STS Cranes cannot be negative');
        }
    }

    private validateUpdateDto(dto: UpdateDockDto): void {
        // Optional validations (checks only if the property is present)

        if (dto.name !== undefined && dto.name.trim() === '') {
            throw new DockValidationError('Dock name cannot be empty');
        }

        if (dto.locationZone !== undefined && dto.locationZone.trim() === '') {
            throw new DockValidationError('Location Zone cannot be empty');
        }

        if (dto.locationSection !== undefined && dto.locationSection.trim() === '') {
            throw new DockValidationError('Location Section cannot be empty');
        }

        if (dto.lengthInMeters !== undefined && dto.lengthInMeters <= 0) {
            throw new DockValidationError('Length must be greater than 0');
        }

        if (dto.depthInMeters !== undefined && dto.depthInMeters <= 0) {
            throw new DockValidationError('Depth must be greater than 0');
        }

        if (dto.maxDraftInMeters !== undefined && dto.maxDraftInMeters <= 0) {
            throw new DockValidationError('Max Draft must be greater than 0');
        }

        if (dto.numberOfSTSCranes !== undefined && dto.numberOfSTSCranes < 0) {
            throw new DockValidationError('Number of STS Cranes cannot be negative');
        }
    }
}