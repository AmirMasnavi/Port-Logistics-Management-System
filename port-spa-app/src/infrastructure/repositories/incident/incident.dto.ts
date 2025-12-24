import type { IncidentSeverity, IncidentStatus } from '../../../domain/incident/incident.model';

export interface IncidentResponseDto {
    incidentId: string;
    title: string;
    description?: string;
    incidentTypeId: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    startTime: string;
    endTime?: string | null;
    durationMinutes?: number;
    affectedVves: string[];
    createdBy: string;
    createdAt?: string;
}

export interface CreateIncidentDto {
    title: string;
    incidentTypeId: string;
    severity: IncidentSeverity;
    startTime: string;
    description?: string;
    affectedVves?: string[];
}

export interface UpdateIncidentDto {
    title?: string;
    description?: string;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    endTime?: string;
    affectedVves?: string[];
}

