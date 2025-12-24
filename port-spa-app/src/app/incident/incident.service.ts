// Application Service - Business Logic Layer
// This is the "Use Case" layer that orchestrates domain logic

import type { Incident } from '../../domain/incident/incident.model';
import { IncidentValidationError } from '../../domain/incident/incident.errors';
import type {
    IIncidentRepository,
    IncidentFilters,
} from './incident.repository';
import type {
    CreateIncidentDto,
    UpdateIncidentDto,
} from '../../infrastructure/repositories/incident/incident.dto';

export class IncidentService {
    private readonly incidentRepo: IIncidentRepository;

    constructor(incidentRepo: IIncidentRepository) {
        this.incidentRepo = incidentRepo;
    }

    /**
     * Fetch all Incidents with optional filters
     */
    async fetchAllIncidents(filters?: IncidentFilters): Promise<Incident[]> {
        const items = await this.incidentRepo.getAll(filters);

        // Business rule: sort by start time (most recent first)
        return items.sort((a, b) => 
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
    }

    /**
     * Get Incident by ID
     */
    async getIncidentById(id: string): Promise<Incident> {
        if (!id || id.trim().length === 0) {
            throw new IncidentValidationError('Incident ID is required');
        }

        return this.incidentRepo.getById(id);
    }

    /**
     * Create a new Incident (Report Incident)
     */
    async reportIncident(dto: CreateIncidentDto): Promise<Incident> {
        // Business validation
        this.validateCreateDto(dto);

        return this.incidentRepo.create(dto);
    }

    /**
     * Update an existing Incident
     */
    async updateIncident(id: string, dto: UpdateIncidentDto): Promise<Incident> {
        if (!id || id.trim().length === 0) {
            throw new IncidentValidationError('Incident ID is required');
        }

        // Ensure entity exists
        await this.incidentRepo.getById(id);

        return this.incidentRepo.update(id, dto);
    }

    /**
     * Resolve an incident (sets status to Resolved and endTime to now)
     */
    async resolveIncident(id: string): Promise<Incident> {
        if (!id || id.trim().length === 0) {
            throw new IncidentValidationError('Incident ID is required');
        }

        const updateDto: UpdateIncidentDto = {
            status: 'Resolved',
            endTime: new Date().toISOString(),
        };

        return this.incidentRepo.update(id, updateDto);
    }

    /**
     * Delete an incident
     */
    async deleteIncident(id: string): Promise<boolean> {
        if (!id || id.trim().length === 0) {
            throw new IncidentValidationError('Incident ID is required');
        }

        // Ensure entity exists
        await this.incidentRepo.getById(id);

        return this.incidentRepo.delete(id);
    }

    // --- Private Validation Methods ---

    private validateCreateDto(dto: CreateIncidentDto): void {
        const errors: string[] = [];

        if (!dto.title || dto.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!dto.incidentTypeId || dto.incidentTypeId.trim().length === 0) {
            errors.push('Incident Type is required');
        }

        if (!dto.severity || !['Minor', 'Major', 'Critical'].includes(dto.severity)) {
            errors.push('Valid severity is required (Minor, Major, or Critical)');
        }

        if (!dto.startTime) {
            errors.push('Start time is required');
        }

        if (errors.length > 0) {
            throw new IncidentValidationError(errors.join(', '));
        }
    }
}

