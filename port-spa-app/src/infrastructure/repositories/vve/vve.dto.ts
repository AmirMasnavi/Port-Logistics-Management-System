// DTOs for VVE API
export interface CreateVveDto {
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string; // ISO string
    notes?: string;
    generateInitialOperations?: boolean; // Auto-generate operations from plan
}

export interface UpdateVveDto {
    status?: string;
    actualDepartureTime?: string; // ISO string
    notes?: string;
    actualBerthTime?: string; // ISO string 
    berthDockId?: string;
}

export interface VveResponseDto {
    vveId: string;
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string;
    actualDepartureTime?: string;
    actualBerthTime?: string;
    berthDockId?: string;
    status: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    auditLogs?: AuditLogEntryDto[];
}
export interface AuditLogEntryDto {
    userId: string;
    action: string; // ex: 'create', 'update', 'delete'
    timestamp: string; // ISO datetime
    details?: Record<string, unknown>;
}
