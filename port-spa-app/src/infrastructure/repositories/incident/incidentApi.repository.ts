import { apiClient } from '../../../services/apiService';
import type { Incident } from '../../../domain/incident/incident.model';
import type {
    CreateIncidentDto,
    UpdateIncidentDto,
    IncidentResponseDto,
} from './incident.dto';
import { IncidentMapper } from './incident.mapper';
import type { IIncidentRepository, IncidentFilters } from '../../../app/incident/incident.repository';

/**
 * Base URL for the OEM API, configurable via environment variable
 * Falls back to local development server if not set
 */
const OEM_BASE = import.meta.env.VITE_OEM_API_URL || 'http://localhost:5274/api';

/**
 * API repository implementation for Incidents
 */
class IncidentApiRepository implements IIncidentRepository {
    public async create(dto: CreateIncidentDto): Promise<Incident> {
        const url = `${OEM_BASE}/incidents`;
        const response = await apiClient.post<{ success: boolean; data: IncidentResponseDto }>(url, dto);
        return IncidentMapper.toDomain(response.data.data);
    }

    public async getAll(filters?: IncidentFilters): Promise<Incident[]> {
        const url = `${OEM_BASE}/incidents`;
        const params = new URLSearchParams();

        if (filters?.status) params.append('status', filters.status);
        if (filters?.severity) params.append('severity', filters.severity);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.vveId) params.append('vveId', filters.vveId);

        const queryString = params.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const response = await apiClient.get<{ success: boolean; count: number; data: IncidentResponseDto[] }>(fullUrl);
        return IncidentMapper.toDomainList(response.data.data);
    }

    public async getById(id: string): Promise<Incident> {
        const url = `${OEM_BASE}/incidents/${encodeURIComponent(id)}`;
        const response = await apiClient.get<{ success: boolean; data: IncidentResponseDto }>(url);
        return IncidentMapper.toDomain(response.data.data);
    }

    public async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
        const url = `${OEM_BASE}/incidents/${encodeURIComponent(id)}`;
        const response = await apiClient.patch<{ success: boolean; data: IncidentResponseDto }>(url, dto);
        return IncidentMapper.toDomain(response.data.data);
    }

    public async delete(id: string): Promise<boolean> {
        const url = `${OEM_BASE}/incidents/${encodeURIComponent(id)}`;
        await apiClient.delete(url);
        return true;
    }
}

/**
 * Singleton instance exported for dependency injection
 */
export const incidentApiRepository = new IncidentApiRepository();

