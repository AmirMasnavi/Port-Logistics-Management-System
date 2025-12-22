import type {
    IncidentType,
    AuditLogEntry,
} from '../../../domain/incidentType/incidentType.model';
import type {
    IncidentTypeResponseDto,
    AuditLogEntryDto,
} from './incidentType.dto';

/**
 * Mapper for Incident Type conversions between API DTOs and domain models
 */
export class IncidentTypeMapper {

    /**
     * Convert API response DTO to domain model
     */
    static toDomain(dto: IncidentTypeResponseDto): IncidentType {
        return {
            id: dto.id,
            code: dto.code,
            name: dto.name,
            description: dto.description,
            severity: dto.severity,
            parentId: dto.parentId ?? null,
            parentCode: dto.parentCode ?? null,
            parentName: dto.parentName ?? null,
            createdBy: dto.createdBy ?? null,
            createdAt: dto.createdAt ?? null,
            updatedAt: dto.updatedAt ?? null,
            auditLogs: dto.auditLogs as AuditLogEntry[] | undefined,
        };
    }

    /**
     * Convert array of API response DTOs to domain models
     */
    static toDomainList(
        dtos: IncidentTypeResponseDto[] = []
    ): IncidentType[] {
        return dtos.map(dto => this.toDomain(dto));
    }

    /**
     * Convert domain model back to API DTO
     */
    static toDto(incidentType: IncidentType): IncidentTypeResponseDto {
        return {
            id: incidentType.id,
            code: incidentType.code,
            name: incidentType.name,
            description: incidentType.description,
            severity: incidentType.severity,
            parentId: incidentType.parentId ?? null,
            parentCode: incidentType.parentCode ?? null,
            parentName: incidentType.parentName ?? null,
            createdBy: incidentType.createdBy ?? null,
            createdAt: incidentType.createdAt ?? null,
            updatedAt: incidentType.updatedAt ?? null,
            auditLogs: incidentType.auditLogs as AuditLogEntryDto[] | undefined,
        };
    }
}
