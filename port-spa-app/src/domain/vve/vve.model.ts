// Domain Model - VVE (Vessel Visit Execution)
// This represents the core business entity

export interface VesselVisitExecution {
    vveId: string;
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string;
    actualDepartureTime?: string;
    status: VveStatus;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
}

export type VveStatus = 'In Progress' | 'Completed' | 'Cancelled';

export const VveStatusValues = {
    IN_PROGRESS: 'In Progress' as VveStatus,
    COMPLETED: 'Completed' as VveStatus,
    CANCELLED: 'Cancelled' as VveStatus,
};

