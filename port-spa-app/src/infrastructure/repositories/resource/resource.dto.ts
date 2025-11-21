// These DTOs (Data Transfer Objects) define the *exact shape*
// of the data we send to and receive from the API.

export interface ResourceCreateDto {
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

export interface ResourceUpdateDto {
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

export interface ResourceUpdateStatusDto {
    NewStatus: string;
}

