export interface Resource {
    code: string;
    description: string;
    kind: string;
    assignedArea?: string | null;
    status: string;
    setupTimeMinutes: number;
    operationalWindowStart: string;
    operationalWindowEnd: string;
    qualificationRequirements?: string[] | null;
    averageContainersPerHour?: number | null;
    containersPerTrip?: number | null;
    averageSpeedKmh?: number | null;
    otherUnit?: string | null;
    otherGenericValue?: number | null;
}
