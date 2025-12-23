import type { IncidentType } from '../../domain/incidentType/incidentType.model';
import type {
    CreateIncidentTypeDto,
    UpdateIncidentTypeDto,
} from '../../infrastructure/repositories/incidentType/incidentType.dto';

export interface IncidentTypeFilters {
    severity?: string;
    parentId?: string;
    search?: string;
    tree?: boolean;
}

export interface IIncidentTypeRepository {
    getAll(filters?: IncidentTypeFilters): Promise<IncidentType[]>;
    getById(id: string): Promise<IncidentType>;
    getByCode(code: string): Promise<IncidentType | null>;
    create(dto: CreateIncidentTypeDto): Promise<IncidentType>;
    update(id: string, dto: UpdateIncidentTypeDto): Promise<IncidentType>;
    delete(id: string): Promise<boolean>;

    // Business support
    hasChildren(id: string): Promise<boolean>;
}

