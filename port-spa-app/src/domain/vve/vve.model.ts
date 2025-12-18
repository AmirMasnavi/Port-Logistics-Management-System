// Domain Model - VVE (Vessel Visit Execution)
// This represents the core business entity

export interface AuditLogEntry {
    userId: string;
    action: string; // e.g. 'create', 'update', 'delete'
    timestamp: string; // ISO datetime
    details?: Record<string, unknown>;
}

export interface VesselVisitExecution {
    vveId: string;
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string;
    actualDepartureTime?: string;
    actualBerthTime?: string; // horário de acostagem efetivo (ISO datetime)
    berthDockId?: string; // id do cais/berth utilizado
    status: VveStatus;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    auditLogs?: AuditLogEntry[]; // histórico de alterações

}

export type VveStatus = 'In Progress' | 'Completed' | 'Cancelled';

export const VveStatusValues = {
    IN_PROGRESS: 'In Progress' as VveStatus,
    COMPLETED: 'Completed' as VveStatus,
    CANCELLED: 'Cancelled' as VveStatus,
};

