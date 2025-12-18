// API Repository Implementation - Infrastructure Layer
import { apiClient } from '../../../services/apiService';
import type { IVveRepository, VveFilters } from '../../../app/vve/vve.repository';
import type { VesselVisitExecution } from '../../../domain/vve/vve.model';
import type { CreateVveDto, UpdateVveDto, VveResponseDto } from './vve.dto';
import { VveMapper } from './vve.mapper';

const OEM_BASE = import.meta.env.VITE_OEM_API_BASE || 'http://localhost:5274/api';

class VveApiRepository implements IVveRepository {
    public async create(dto: CreateVveDto): Promise<VesselVisitExecution> {
        const url = `${OEM_BASE}/vve`;
        const response = await apiClient.post<{ success: boolean; data: VveResponseDto }>(url, dto);
        return VveMapper.toDomain(response.data.data);
    }

    public async getAll(filters?: VveFilters): Promise<VesselVisitExecution[]> {
        const url = `${OEM_BASE}/vve`;
        const params = new URLSearchParams();
        
        if (filters?.status) params.append('status', filters.status);
        if (filters?.vvnId) params.append('vvnId', filters.vvnId);
        if (filters?.vesselIdentifier) params.append('vesselIdentifier', filters.vesselIdentifier);
        if (filters?.berthDockId) params.append('berthDockId', filters.berthDockId);
        if (filters?.fromDate) params.append('fromDate', filters.fromDate);
        if (filters?.toDate) params.append('toDate', filters.toDate);
        if (filters?.includeMetrics) params.append('includeMetrics', 'true');
        
        const queryString = params.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        const response = await apiClient.get<{ success: boolean; data: VveResponseDto[] }>(fullUrl);
        return VveMapper.toDomainList(response.data.data);
    }

    public async getById(vveId: string): Promise<VesselVisitExecution> {
        const url = `${OEM_BASE}/vve/${encodeURIComponent(vveId)}`;
        const response = await apiClient.get<{ success: boolean; data: VveResponseDto }>(url);
        return VveMapper.toDomain(response.data.data);
    }

    public async update(vveId: string, dto: UpdateVveDto): Promise<VesselVisitExecution> {
        const url = `${OEM_BASE}/vve/${encodeURIComponent(vveId)}`;
        const response = await apiClient.put<{ success: boolean; data: VveResponseDto }>(url, dto);
        return VveMapper.toDomain(response.data.data);
    }

    public async delete(vveId: string): Promise<boolean> {
        const url = `${OEM_BASE}/vve/${encodeURIComponent(vveId)}`;
        await apiClient.delete(url);
        return true;
    }
}

export const vveApiRepository = new VveApiRepository();
