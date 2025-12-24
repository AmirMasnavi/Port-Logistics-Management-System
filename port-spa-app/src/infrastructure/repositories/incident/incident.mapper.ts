import type { Incident } from '../../../domain/incident/incident.model';
import type { IncidentResponseDto } from './incident.dto';

export class IncidentMapper {
    static toDomain(dto: IncidentResponseDto): Incident {
        return {
            incidentId: dto.incidentId,
            title: dto.title,
            description: dto.description,
            incidentTypeId: dto.incidentTypeId,
            severity: dto.severity,
            status: dto.status,
            startTime: dto.startTime,
            endTime: dto.endTime,
            durationMinutes: dto.durationMinutes,
            affectedVves: dto.affectedVves || [],
            createdBy: dto.createdBy,
            createdAt: dto.createdAt,
        };
    }

    static toDomainList(dtos: IncidentResponseDto[]): Incident[] {
        return dtos.map(dto => this.toDomain(dto));
    }
}

