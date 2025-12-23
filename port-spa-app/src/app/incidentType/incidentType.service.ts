// Application Service - Business Logic Layer
// This is the "Use Case" layer that orchestrates domain logic

import type { IncidentType } from '../../domain/incidentType/incidentType.model';
import { IncidentTypeValidationError } from '../../domain/incidentType/incidentType.errors';
import type {
    IIncidentTypeRepository,
    IncidentTypeFilters,
} from './incidentType.repository';
import type {
    CreateIncidentTypeDto,
    UpdateIncidentTypeDto,
} from '../../infrastructure/repositories/incidentType/incidentType.dto';

export class IncidentTypeService {
    private readonly incidentTypeRepo: IIncidentTypeRepository;

    constructor(incidentTypeRepo: IIncidentTypeRepository) {
        this.incidentTypeRepo = incidentTypeRepo;
    }

    /**
     * Fetch all Incident Types with optional filters
     */
    async fetchAllIncidentTypes(
        filters?: IncidentTypeFilters
    ): Promise<IncidentType[]> {
        const items = await this.incidentTypeRepo.getAll(filters);

        // Business rule: sort by code (alphabetical)
        return items.sort((a, b) => a.code.localeCompare(b.code));
    }

    /**
     * Get Incident Type by ID
     */
    async getIncidentTypeById(id: string): Promise<IncidentType> {
        if (!id || id.trim().length === 0) {
            throw new IncidentTypeValidationError('Incident Type ID is required');
        }

        return this.incidentTypeRepo.getById(id);
    }

    /**
     * Create a new Incident Type with validation
     */
    async createIncidentType(
        dto: CreateIncidentTypeDto
    ): Promise<IncidentType> {
        // Business validation
        this.validateCreateDto(dto);

        // Business rule: code must be unique
        const existing = await this.incidentTypeRepo.getByCode(dto.code);
        if (existing) {
            throw new IncidentTypeValidationError(
                `Incident Type with code '${dto.code}' already exists`
            );
        }

        // Business rule: parent must exist (if provided)
        if (dto.parentId) {
            await this.incidentTypeRepo.getById(dto.parentId);
        }

        return this.incidentTypeRepo.create(dto);
    }

    /**
     * Update an existing Incident Type
     */
    async updateIncidentType(
        id: string,
        dto: UpdateIncidentTypeDto
    ): Promise<IncidentType> {
        if (!id || id.trim().length === 0) {
            throw new IncidentTypeValidationError('Incident Type ID is required');
        }

        // Business validation
        this.validateUpdateDto(dto);

        // Ensure entity exists
        const existing = await this.incidentTypeRepo.getById(id);

        // Business rule: prevent code collision
        if (dto.code && dto.code !== existing.code) {
            const conflict = await this.incidentTypeRepo.getByCode(dto.code);
            if (conflict && conflict.id !== id) {
                throw new IncidentTypeValidationError(
                    `Incident Type with code '${dto.code}' already exists`
                );
            }
        }

        // Business rule: parent cannot be itself
        if (dto.parentId && dto.parentId === id) {
            throw new IncidentTypeValidationError(
                'Incident Type cannot be its own parent'
            );
        }

        // Business rule: parent must exist
        if (dto.parentId) {
            await this.incidentTypeRepo.getById(dto.parentId);
        }

        return this.incidentTypeRepo.update(id, dto);
    }

    /**
     * Delete an Incident Type
     */
    async deleteIncidentType(id: string): Promise<boolean> {
        if (!id || id.trim().length === 0) {
            throw new IncidentTypeValidationError('Incident Type ID is required');
        }

        // Business rule: cannot delete if it has children
        const hasChildren = await this.incidentTypeRepo.hasChildren(id);
        if (hasChildren) {
            throw new IncidentTypeValidationError(
                'Cannot delete Incident Type with child types'
            );
        }

        return this.incidentTypeRepo.delete(id);
    }

    /**
     * Business validation for create operation
     */
    private validateCreateDto(dto: CreateIncidentTypeDto): void {
        if (!dto.code || dto.code.trim().length === 0) {
            throw new IncidentTypeValidationError('Code is required');
        }

        if (!dto.name || dto.name.trim().length === 0) {
            throw new IncidentTypeValidationError('Name is required');
        }

        if (!dto.severity) {
            throw new IncidentTypeValidationError('Severity is required');
        }
    }

    /**
     * Business validation for update operation
     */
    private validateUpdateDto(dto: UpdateIncidentTypeDto): void {
        if (!dto.code || dto.code.trim().length === 0) {
            throw new IncidentTypeValidationError('Code is required');
        }

        if (!dto.name || dto.name.trim().length === 0) {
            throw new IncidentTypeValidationError('Name is required');
        }

        if (!dto.severity) {
            throw new IncidentTypeValidationError('Severity is required');
        }
    }
}
