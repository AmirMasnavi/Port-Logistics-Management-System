// Types for VVE Operation Execution (US 4.1.9)
// These types match the backend DTOs and response structure

/**
 * Status of an operation execution
 */
export type OperationExecutionStatus = 'PENDING' | 'STARTED' | 'COMPLETED' | 'SUSPENDED' | 'DELAYED';

/**
 * Merged operation data (planned + executed)
 * This is what the backend returns from /operations-detailed endpoint
 */
export interface OperationComparison {
    operationId: string;
    
    // Operation details
    name?: string;  // Operation name (e.g., "Lift Cargo from Vessel")
    type?: 'Loading' | 'Unloading' | 'Preparation' | 'Completion' | 'Inspection' | 'Other';  // Operation type
    
    // Planned data
    plannedStartTime?: string;
    plannedEndTime?: string;
    plannedResource?: string;
    plannedStaff?: string;
    vesselVisitId?: string;
    vesselImo?: string;
    dockName?: string;
    
    // Execution data
    executedStatus?: OperationExecutionStatus;
    actualStartTime?: string;
    actualEndTime?: string;
    startedBy?: string;
    completedBy?: string;
    actualResource?: string;
    
    // Computed fields
    computedStatus: OperationExecutionStatus;
    delayMinutes?: number | null;
    notes?: string;
}

/**
 * Response from GET /vve/:vveId/operations-detailed
 */
export interface VveOperationsDetailedResponse {
    vveId: string;
    vvnId: string;
    vesselIdentifier: string;
    status: string;
    actualArrivalTime: string;
    planExists: boolean;
    planId?: string;
    operations: OperationComparison[];
}

/**
 * Payload for updating operation status
 */
export interface UpdateOperationStatusDto {
    status: 'STARTED' | 'COMPLETED' | 'SUSPENDED';
    timestamp?: string;    // ISO datetime, defaults to now on backend
    resourceId?: string;   // Optional: different resource used
    notes?: string;
}