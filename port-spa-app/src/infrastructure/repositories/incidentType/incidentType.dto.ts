// File: port-spa-app/src/infrastructure/repositories/incidentType/incidentType.dto.ts

/**
 * Severity levels for incident types
 */
export type IncidentTypeSeverity = 'Minor' | 'Major' | 'Critical';

/**
 * Audit log entry transferred over the network
 */
export interface AuditLogEntryDto {
    userId: string;
    action: 'create' | 'update' | 'delete';
    timestamp: string; // ISO 8601 datetime string
    details?: Record<string, unknown>;
}

/**
 * DTO used when creating a new incident type
 */
export interface CreateIncidentTypeDto {
    code: string;
    name: string;
    description: string;
    severity: IncidentTypeSeverity;
    parentId?: string | null;
}

/**
 * DTO used when updating an existing incident type
 * (same shape as create, but applied via PUT/PATCH)
 */
export interface UpdateIncidentTypeDto {
    code: string;
    name: string;
    description: string;
    severity: IncidentTypeSeverity;
    parentId?: string | null;
}

/**
 * Full response DTO returned by the API for a single incident type
 */
export interface IncidentTypeResponseDto {
    id: string;
    code: string;
    name: string;
    description: string;
    severity: IncidentTypeSeverity;
    parentId?: string | null;
    parentCode?: string | null;
    parentName?: string | null;
    createdBy?: string | null;
    createdAt?: string | null; // ISO 8601 datetime
    updatedAt?: string | null; // ISO 8601 datetime
    auditLogs?: AuditLogEntryDto[];
}

/**
 * Lightweight DTO used for listing incident types in tables or dropdowns
 */
export interface IncidentTypeListItemDto {
    id: string;
    code: string;
    name: string;
    severity: IncidentTypeSeverity;
    parentId?: string | null;
    parentName?: string | null;
    createdAt?: string | null; // ISO 8601 datetime
    description: string;
}