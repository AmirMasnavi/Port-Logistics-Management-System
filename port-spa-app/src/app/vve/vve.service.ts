// Application Service - Business Logic Layer
// This is the "Use Case" layer that orchestrates domain logic

import type { VesselVisitExecution } from '../../domain/vve/vve.model';
import { VveValidationError } from '../../domain/vve/vve.errors';
import type { IVveRepository, VveFilters } from './vve.repository';
import type { CreateVveDto, UpdateVveDto } from '../../infrastructure/repositories/vve/vve.dto';
import type { VveOperationsDetailedResponse, UpdateOperationStatusDto } from '../../domain/vve/operation-execution.types';

export class VveService {
    private readonly vveRepo: IVveRepository;

    constructor(vveRepo: IVveRepository) {
        this.vveRepo = vveRepo;
    }

    /**
     * Fetch all VVEs with optional filters
     */
    async fetchAllVves(filters?: VveFilters): Promise<VesselVisitExecution[]> {
        const vves = await this.vveRepo.getAll(filters);
        
        // Business rule: Sort by creation date (newest first)
        return vves.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    /**
     * Get VVE by ID
     */
    async getVveById(vveId: string): Promise<VesselVisitExecution> {
        return this.vveRepo.getById(vveId);
    }

    /**
     * Create a new VVE with validation
     */
    async createVve(dto: CreateVveDto): Promise<VesselVisitExecution> {
        // Business validation
        this.validateCreateDto(dto);
        
        return this.vveRepo.create(dto);
    }

    /**
     * Update an existing VVE
     */
    async updateVve(vveId: string, dto: UpdateVveDto): Promise<VesselVisitExecution> {
        // Business validation
        this.validateUpdateDto(dto);
        
        return this.vveRepo.update(vveId, dto);
    }

    /**
     * Delete a VVE
     */
    async deleteVve(vveId: string): Promise<boolean> {
        return this.vveRepo.delete(vveId);
    }

    /**
     * Business validation for create operation
     */
    private validateCreateDto(dto: CreateVveDto): void {        
        if (!dto.vvnId || dto.vvnId.trim().length === 0) {
            throw new VveValidationError('VVN ID is required');
        }

        if (!dto.vesselIdentifier || dto.vesselIdentifier.trim().length === 0) {
            throw new VveValidationError('Vessel identifier is required');
        }

        if (!dto.actualArrivalTime) {
            throw new VveValidationError('Actual arrival time is required');
        }

        // Validate that arrival time is not in the future (more than 1 hour)
        const arrivalTime = new Date(dto.actualArrivalTime);
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        
        if (arrivalTime > oneHourFromNow) {
            throw new VveValidationError('Arrival time cannot be more than 1 hour in the future');
        }
    }

    /**
     * Business validation for update operation
     */
    private validateUpdateDto(dto: UpdateVveDto): void {
        if (dto.actualDepartureTime) {
            const departureTime = new Date(dto.actualDepartureTime);
            if (isNaN(departureTime.getTime())) {
                throw new VveValidationError('Actual departure time is not a valid date');
            }
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            
            if (departureTime > oneHourFromNow) {
                throw new VveValidationError('Departure time cannot be more than 1 hour in the future');
            }
        }
        if (dto.actualBerthTime) {
            const berthTime = new Date(dto.actualBerthTime);
            if (isNaN(berthTime.getTime())) {
                throw new VveValidationError('Actual berth time is not a valid date');
            }
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            if (berthTime > oneHourFromNow) {
                throw new VveValidationError('Berth time cannot be more than 1 hour in the future');
            }
        }

        if (dto.berthDockId && typeof dto.berthDockId !== 'string') {
            throw new VveValidationError('Berth dock ID must be a string');
        }

        if (dto.status && !['In Progress', 'Completed', 'Cancelled'].includes(dto.status)) {
            throw new VveValidationError('Invalid status value');
        }
    }

    /**
     * Get VVE with operation plan comparison (US 4.1.9)
     */
    async getVveOperationsDetailed(vveId: string): Promise<VveOperationsDetailedResponse> {
        return this.vveRepo.getOperationsDetailed(vveId);
    }

    /**
     * Update operation status (US 4.1.9)
     */
    async updateOperationStatus(
        vveId: string,
        operationId: string,
        dto: UpdateOperationStatusDto
    ): Promise<void> {
        // Business validation
        if (!dto.status || !['STARTED', 'COMPLETED', 'SUSPENDED'].includes(dto.status)) {
            throw new VveValidationError('Invalid operation status');
        }
        
        return this.vveRepo.updateOperationStatus(vveId, operationId, dto);
    }
}
