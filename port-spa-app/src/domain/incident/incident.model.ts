export type IncidentSeverity = 'Minor' | 'Major' | 'Critical';
export type IncidentStatus = 'Active' | 'Resolved';

export interface Incident {
    incidentId: string; // Business ID (INC-...)
    title: string;
    description?: string;
    incidentTypeId: string; // Link to the Type Catalog
    incidentTypeName?: string; // Optional: if backend populates it, otherwise we look it up
    severity: IncidentSeverity;
    status: IncidentStatus;
    startTime: string; // ISO Date
    endTime?: string | null; // ISO Date
    durationMinutes?: number;
    affectedVves: string[]; // List of VVE Business IDs
    createdBy: string;
    createdAt?: string;
}

