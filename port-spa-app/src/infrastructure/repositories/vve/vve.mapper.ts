// Mapper - Transforms DTOs to Domain Models
// Infrastructure Layer

import type { VesselVisitExecution, VveStatus } from '../../../domain/vve/vve.model';
import type { VveResponseDto } from './vve.dto';

export class VveMapper {
    /**
     * Convert API DTO to Domain Model
     */
    static toDomain(dto: VveResponseDto): VesselVisitExecution {
        return {
            vveId: dto.vveId,
            vvnId: dto.vvnId,
            vesselIdentifier: dto.vesselIdentifier,
            actualArrivalTime: dto.actualArrivalTime,
            actualDepartureTime: dto.actualDepartureTime,
            status: dto.status as VveStatus,
            createdBy: dto.createdBy,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
            notes: dto.notes,
        };
    }

    /**
     * Convert array of DTOs to Domain Models
     */
    static toDomainList(dtos: VveResponseDto[]): VesselVisitExecution[] {
        return dtos.map(dto => this.toDomain(dto));
    }

    /**
     * Convert Domain Model to DTO (if needed for requests)
     */
    static toDto(vve: VesselVisitExecution): VveResponseDto {
        return {
            vveId: vve.vveId,
            vvnId: vve.vvnId,
            vesselIdentifier: vve.vesselIdentifier,
            actualArrivalTime: vve.actualArrivalTime,
            actualDepartureTime: vve.actualDepartureTime,
            status: vve.status,
            createdBy: vve.createdBy,
            createdAt: vve.createdAt,
            updatedAt: vve.updatedAt,
            notes: vve.notes,
        };
    }
}

