export interface OperationPlan {
    planId?: string;
    date: string;
    algorithm: string;
    geneticParams?: any;
    scheduledTasks: ScheduledTask[];
    totalDelay: number;
    executionTimeMs: number;
}

export interface ScheduledTask {
    vesselVisitId: string;
    vesselVisitBusinessId: string;
    dockName: string;
    resourceKind: string;
    staffShortName: string;
    startTime: string;
    endTime: string;
}