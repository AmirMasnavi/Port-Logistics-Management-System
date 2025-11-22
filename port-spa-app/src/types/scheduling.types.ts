// Scheduling types matching the backend DTOs

export type SchedulingAlgorithm = 'optimal' | 'heuristic' | 'multicrane';

export interface DailyScheduleRequest {
    date: string; // ISO date string (YYYY-MM-DD)
    algorithm?: SchedulingAlgorithm; // Algorithm to use (default: optimal)
}

export interface ScheduledTask {
    vesselVisitId: string;
    dockId: string;
    resourceId: string; // The crane
    staffId: string;    // The operator
    
    // Display names (for UI - user-friendly names instead of IDs)
    vesselVisitBusinessId: string;
    dockName: string;
    resourceKind: string;
    staffShortName: string;
    
    startTime: string;  // ISO datetime string
    endTime: string;    // ISO datetime string
}

export interface DailyScheduleResponse {
    date: string; // ISO date string
    scheduledTasks: ScheduledTask[];
    totalDelay: number;
    warnings: string[];
    executionTimeMs: number;
}

