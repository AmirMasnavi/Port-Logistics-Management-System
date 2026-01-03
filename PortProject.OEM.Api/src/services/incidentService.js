import { IncidentRepository } from '../domain/repositories/IncidentRepository.js';
import { IncidentTypeRepository } from '../infrastructure/repositories/IncidentTypeRepository.js';

/**
 * Service layer for Incident
 * Contains business logic for managing incidents
 */
export class IncidentService {
    constructor(repository = new IncidentRepository(), incidentTypeRepository = new IncidentTypeRepository()) {
        this.repository = repository;
        this.incidentTypeRepository = incidentTypeRepository;
    }

    /**
     * Creates a new Incident
     */
    async createIncident(dto, performedBy = 'system') {
        // Validate that incident type exists
        const typeExists = await this.incidentTypeRepository.exists(dto.incidentTypeId);
        if (!typeExists) {
            throw new Error(`Incident Type '${dto.incidentTypeId}' not found`);
        }

        // Generate Business ID (INC-YYYY-TIMESTAMP)
        const idSuffix = new Date().getTime().toString().substr(-6);
        const generatedId = `INC-${new Date().getFullYear()}-${idSuffix}`;

        const newIncident = {
            incidentId: generatedId,
            title: dto.title.trim(),
            incidentTypeId: dto.incidentTypeId,
            severity: dto.severity,
            startTime: new Date(dto.startTime),
            description: dto.description?.trim() || '',
            affectedVves: dto.affectedVves || [],
            createdBy: performedBy,
            status: 'Active'
        };

        return await this.repository.create(newIncident);
    }

    /**
     * Gets an incident by ID
     */
    async getIncidentById(incidentId) {
        const incident = await this.repository.findById(incidentId);
        if (!incident) {
            throw new Error(`Incident '${incidentId}' not found`);
        }
        return incident;
    }

    /**
     * Updates an incident
     * AUTOMATIC DURATION CALCULATION when status changes to 'Resolved' or endTime is set
     */
    async updateIncident(incidentId, dto, performedBy = 'system') {
        const existing = await this.repository.findById(incidentId);
        if (!existing) {
            throw new Error(`Incident '${incidentId}' not found`);
        }

        const updates = { ...dto };

        // AUTOMATIC DURATION CALCULATION
        // If we are closing the incident (Resolved) or setting an End Time
        if (dto.status === 'Resolved' || dto.endTime) {
            const end = dto.endTime ? new Date(dto.endTime) : new Date();
            const start = new Date(existing.startTime);
            
            // Calculate minutes difference
            const diffMs = end - start;
            const minutes = Math.floor(diffMs / 60000);

            updates.endTime = end;
            updates.status = 'Resolved';
            updates.durationMinutes = minutes > 0 ? minutes : 0;
        }

        return await this.repository.update(incidentId, updates);
    }

    /**
     * Search incidents with filters
     * Supports: Filter by Vessel, Date, Severity, Status
     */
    async searchIncidents(filters) {
        return await this.repository.search(filters);
    }

    /**
     * Deletes an incident
     */
    async deleteIncident(incidentId, performedBy = 'system') {
        const existing = await this.repository.findById(incidentId);
        if (!existing) {
            throw new Error(`Incident '${incidentId}' not found`);
        }

        return await this.repository.delete(incidentId);
    }
}

