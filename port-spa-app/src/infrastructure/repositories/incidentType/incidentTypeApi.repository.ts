// File: `port-spa-app/src/infrastructure/repositories/incidentType/incidentTypeApi.repository.ts`
import { apiClient } from '../../../services/apiService';
import type { IncidentType } from '../../../domain/incidentType/incidentType.model';
import type {
    CreateIncidentTypeDto,
    UpdateIncidentTypeDto,
    IncidentTypeResponseDto,
} from './incidentType.dto';
import { IncidentTypeMapper } from './incidentType.mapper';
import type { IIncidentTypeRepository, IncidentTypeFilters } from '../../../app/incidentType/incidentType.repository';

/**
 * Base URL for the OEM API, configurable via environment variable
 * Falls back to local development server if not set
 */
const OEM_BASE = import.meta.env.VITE_OEM_API_URL || 'http://localhost:3001/api';

/**
 * API repository implementation for Incident Types
 */
class IncidentTypeApiRepository implements IIncidentTypeRepository {
    public async create(dto: CreateIncidentTypeDto): Promise<IncidentType> {
        const url = `${OEM_BASE}/incident-type`;
        const response = await apiClient.post<{ success: boolean; data: IncidentTypeResponseDto }>(url, dto);
        return IncidentTypeMapper.toDomain(response.data.data);
    }

    public async getAll(filters?: IncidentTypeFilters): Promise<IncidentType[]> {
        const url = `${OEM_BASE}/incident-type`;
        const params = new URLSearchParams();

        if (filters?.parentId) params.append('parentId', filters.parentId);
        if (filters?.severity) params.append('severity', filters.severity);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.tree) params.append('tree', 'true');

        const queryString = params.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const response = await apiClient.get<{ success: boolean; data: IncidentTypeResponseDto[] }>(fullUrl);
        return IncidentTypeMapper.toDomainList(response.data.data);
    }

    public async getById(id: string): Promise<IncidentType> {
        const url = `${OEM_BASE}/incident-type/${encodeURIComponent(id)}`;
        const response = await apiClient.get<{ success: boolean; data: IncidentTypeResponseDto }>(url);
        return IncidentTypeMapper.toDomain(response.data.data);
    }

    /**
     * Try to retrieve an incident type by its code.
     * First attempts a dedicated endpoint `/incident-type/code/:code`.
     * If the endpoint does not exist or returns 404, falls back to searching via `getAll`.
     */
    public async getByCode(code: string): Promise<IncidentType | null> {
        const codeUrl = `${OEM_BASE}/incident-type/code/${encodeURIComponent(code)}`;
        try {
            const response = await apiClient.get<{ success: boolean; data: IncidentTypeResponseDto }>(codeUrl);
            return IncidentTypeMapper.toDomain(response.data.data);
        } catch (err: any) {
            // If not found or endpoint missing, fallback to search
            if (err?.response?.status === 404) return null;

            // Fallback: try search by code via query (safer for APIs without the dedicated endpoint)
            try {
                const results = await this.getAll({ search: code });
                return results.find(r => (r as any).code === code) || null;
            } catch {
                // última tentativa falhou -> rethrow original error
                throw err;
            }
        }
    }

    public async update(id: string, dto: UpdateIncidentTypeDto): Promise<IncidentType> {
        const url = `${OEM_BASE}/incident-type/${encodeURIComponent(id)}`;
        const response = await apiClient.put<{ success: boolean; data: IncidentTypeResponseDto }>(url, dto);
        return IncidentTypeMapper.toDomain(response.data.data);
    }

    public async delete(id: string): Promise<boolean> {
        const url = `${OEM_BASE}/incident-type/${encodeURIComponent(id)}`;
        await apiClient.delete(url);
        return true;
    }

    public async hasChildren(id: string): Promise<boolean> {
        const children = await this.getAll({ parentId: id });
        return children.length > 0;
    }
}

/**
 * Singleton instance exported for dependency injection
 */
export const incidentTypeApiRepository = new IncidentTypeApiRepository();