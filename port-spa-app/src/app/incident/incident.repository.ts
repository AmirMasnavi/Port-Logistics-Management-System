import type { Incident, IncidentSeverity, IncidentStatus } from '../../domain/incident/incident.model';
import type {
    CreateIncidentDto,
    UpdateIncidentDto,
} from '../../infrastructure/repositories/incident/incident.dto';

export interface IncidentFilters {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    vveId?: string;
}

export interface IIncidentRepository {
    getAll(filters?: IncidentFilters): Promise<Incident[]>;
    getById(id: string): Promise<Incident>;
    create(dto: CreateIncidentDto): Promise<Incident>;
    update(id: string, dto: UpdateIncidentDto): Promise<Incident>;
    delete(id: string): Promise<boolean>;
}

