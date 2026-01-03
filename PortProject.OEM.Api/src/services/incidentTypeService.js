// File: src/services/incidentTypeService.js

import { CreateIncidentTypeDto, UpdateIncidentTypeDto } from '../application/dtos/IncidentTypeDto.js';
import { IncidentTypeRepository } from '../infrastructure/repositories/IncidentTypeRepository.js';
import { MasterDataGateway } from '../gateways/masterDataGateway.js';

/**
 * Service layer for IncidentType
 * Contains business logic and uses the local MongoDB repository
 */
export class IncidentTypeService {
    constructor(repository = new IncidentTypeRepository()) {
        // Local MongoDB repository for Incident Types (master data stored in OEM DB)
        this.repository = repository;

        // Gateway to external Port System API (used for other master data, e.g. vessels, berths, etc.)
        // Not used for Incident Types — they are local to OEM
        const portApiUrl = process.env.PORT_API_URL || 'http://localhost:5273';
        const portApiToken = process.env.MASTER_DATA_API_TOKEN; // optional
    }

    /**
     * Creates a new Incident Type
     */
    async createIncidentType(dto, performedBy = 'system') {
        const validation = dto.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Validate parent if provided
        if (dto.parentId) {
            const parentExists = await this.repository.exists(dto.parentId);
            if (!parentExists) {
                throw new Error(`Parent Incident Type '${dto.parentId}' not found`);
            }
        }

        // Check code uniqueness
        const codeExists = await this.repository.existsByCode(dto.code);
        if (codeExists) {
            throw new Error(`Incident Type with code '${dto.code}' already exists`);
        }

        const data = {
            code: dto.code.trim(),
            name: dto.name.trim(),
            description: dto.description?.trim() || null,
            severity: dto.severity,
            parentId: dto.parentId || null,
            createdBy: performedBy,
            updatedBy: performedBy,
        };

        const saved = await this.repository.create(data);
        return saved;
    }

    /**
     * Retrieves all Incident Types with optional filters and populates parent data
     */
    async getAllIncidentTypes(filters = {}) {
        const items = await this.repository.findAll(filters);

        // Populate parent information for hierarchy support
        for (const item of items) {
            if (item.parentId) {
                const parent = await this.repository.findById(item.parentId);
                if (parent) {
                    item.parent = parent;
                }
            }
        }

        return items;
    }

    /**
     * Gets a single Incident Type by ID with parent populated
     */
    async getIncidentTypeById(id) {
        const item = await this.repository.findById(id);
        if (!item) return null;

        if (item.parentId) {
            const parent = await this.repository.findById(item.parentId);
            if (parent) {
                item.parent = parent;
            }
        }

        return item;
    }

    /**
     * Updates an existing Incident Type
     */
    async updateIncidentType(id, dto, performedBy = 'system') {
        const validation = dto.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Incident Type '${id}' not found`);
        }

        // Check code uniqueness if changed
        if (dto.code && dto.code.trim() !== existing.code) {
            const codeTaken = await this.repository.existsByCode(dto.code.trim());
            if (codeTaken) {
                throw new Error(`Incident Type with code '${dto.code}' already exists`);
            }
        }

        // Validate parent
        if (dto.parentId) {
            if (dto.parentId === id) {
                throw new Error('An Incident Type cannot be its own parent');
            }

            const parentExists = await this.repository.exists(dto.parentId);
            if (!parentExists) {
                throw new Error(`Parent Incident Type '${dto.parentId}' not found`);
            }
        }

        const updateData = {
            code: dto.code?.trim(),
            name: dto.name.trim(),
            description: dto.description?.trim() || null,
            severity: dto.severity,
            parentId: dto.parentId || null,
            updatedBy: performedBy,
        };

        const updated = await this.repository.update(id, updateData);
        return updated;
    }

    /**
     * Deletes an Incident Type (blocks if it has children)
     */
    async deleteIncidentType(id, performedBy = 'system') {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Incident Type '${id}' not found`);
        }

        // Prevent deletion if has children
        const children = await this.repository.findAll({ parentId: id });
        if (children.length > 0) {
            throw new Error(`Cannot delete Incident Type '${id}' because it has child types`);
        }

        const success = await this.repository.delete(id);
        return success;
    }

    /**
     * Returns total count of Incident Types
     */
    async countIncidentTypes() {
        return await this.repository.countAll();
    }
}