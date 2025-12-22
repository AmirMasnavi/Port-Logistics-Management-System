export type IncidentTypeSeverity = 'Minor' | 'Major' | 'Critical';

export interface AuditLogEntry {
    userId: string;
    action: 'create' | 'update' | 'delete';
    timestamp: string; // ISO datetime
    details?: Record<string, unknown>;
}

export interface IncidentType {
    id: string;
    code: string;
    name: string;
    description: string;
    severity: IncidentTypeSeverity;
    parentId?: string | null;
    parentCode?: string | null;
    parentName?: string | null;
    createdBy?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    auditLogs?: AuditLogEntry[];
}
