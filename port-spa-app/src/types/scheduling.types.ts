
export type SchedulingAlgorithm = 'optimal' | 'heuristic' | 'multicrane' | 'genetic' | 'automatic';

export type CraneMode = 'single' | 'multiple';

export interface GeneticAlgorithmParams {
    populationSize: number;
    generations: number;
    mutationRate: number;
    desiredTimeSeconds: number;
    craneMode: CraneMode;
}

export interface DailyScheduleRequest {
    date: string; // ISO date string (YYYY-MM-DD)
    algorithm?: SchedulingAlgorithm; // Algorithm to use (default: optimal)
    geneticParams?: GeneticAlgorithmParams; // Parameters for genetic algorithm
}

export interface ScheduledTask {
    vesselVisitId: string;
    resourceId: string; // The crane
    staffId: string;    // The operator
    
    // Display names (for UI - user-friendly names instead of IDs)
    vesselImo: string;
    vesselVisitBusinessId: string;
    dockName: string;
    resourceKind: string;
    staffShortName: string;
    
    startTime: string;  // ISO datetime string
    endTime: string;    // ISO datetime string
    
    // Loading and Unloading times (in hours)
    loadingTime: number;
    unloadingTime: number;
}

export interface DailyScheduleResponse {
    date: string; // ISO date string
    scheduledTasks: ScheduledTask[];
    totalDelay: number;
    warnings: string[];
    executionTimeMs: number;
    algorithmUsed?: string; // The actual algorithm used (useful when "automatic" is selected)
}

export interface VesselVisitNotification {
    id: string;
    businessId: string;
    vesselImo: string;
    estimatedArrival: string;
    estimatedDeparture: string;
    assignedDockId?: string;
    assignedDockName?: string;
    status: string;
}

export interface ExistingPlanSummary {
    planId: string;
    algorithm: string;
    scheduledTasksCount: number;
    createdAt: string;
}

export interface MissingPlansResponse {
    missingVVNs: VesselVisitNotification[];
    existingPlans: ExistingPlanSummary[];
}

