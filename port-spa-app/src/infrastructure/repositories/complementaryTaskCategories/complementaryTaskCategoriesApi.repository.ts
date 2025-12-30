import { apiClient } from '../../../services/apiService';
import type { ComplementaryTaskCategory } from '../../../domain/complementaryTaskCategories/complementaryTaskCategories.model';
import type {
    CreateComplementaryTaskCategoryDto,
    UpdateComplementaryTaskCategoryDto,
    ComplementaryTaskCategoryResponseDto,
} from './complementaryTaskCategories.dto';
import { ComplementaryTaskCategoryMapper } from './complementaryTaskCategories.mapper';
import type {
    IComplementaryTaskCategoryRepository,
    ComplementaryTaskCategoryFilters,
} from '../../../app/complementaryTaskCategories/complementaryTaskCategories.repository';

/**
 * Base URL for the OEM API, configurable via environment variable
 * Falls back to local development server if not set
 */
const OEM_BASE = import.meta.env.VITE_OEM_API_URL || 'http://localhost:5274/api';

/**
 * API repository implementation for Complementary Task Categories
 */
class ComplementaryTaskCategoryApiRepository implements IComplementaryTaskCategoryRepository {
    public async create(dto: CreateComplementaryTaskCategoryDto): Promise<ComplementaryTaskCategory> {
        const url = `${OEM_BASE}/complementary-task-categories`;
        const response = await apiClient.post<{ success: boolean; data: ComplementaryTaskCategoryResponseDto }>(url, dto);
        return ComplementaryTaskCategoryMapper.toDomain(response.data.data);
    }

    public async getAll(filters?: ComplementaryTaskCategoryFilters): Promise<ComplementaryTaskCategory[]> {
        const url = `${OEM_BASE}/complementary-task-categories`;
        const params = new URLSearchParams();

        if (filters?.code) params.append('code', filters.code);
        if (filters?.nameContains) params.append('nameContains', filters.nameContains);
        if (filters?.active !== undefined) params.append('active', String(filters.active));
        if (filters?.defaultDurationMinutes !== undefined) {
            params.append('defaultDurationMinutes', String(filters.defaultDurationMinutes));
        }
        if (filters?.expectedImpactMinutes !== undefined) {
            params.append('expectedImpactMinutes', String(filters.expectedImpactMinutes));
        }
        if (filters?.group) params.append('group', filters.group);

        const queryString = params.toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const response = await apiClient.get<{ success: boolean; count: number; data: ComplementaryTaskCategoryResponseDto[] }>(fullUrl);
        return ComplementaryTaskCategoryMapper.toDomainList(response.data.data);
    }

    public async getById(id: string): Promise<ComplementaryTaskCategory> {
        const url = `${OEM_BASE}/complementary-task-categories/${encodeURIComponent(id)}`;
        const response = await apiClient.get<{ success: boolean; data: ComplementaryTaskCategoryResponseDto }>(url);
        return ComplementaryTaskCategoryMapper.toDomain(response.data.data);
    }

    public async update(id: string, dto: UpdateComplementaryTaskCategoryDto): Promise<ComplementaryTaskCategory> {
        const url = `${OEM_BASE}/complementary-task-categories/${encodeURIComponent(id)}`;
        const response = await apiClient.patch<{ success: boolean; data: ComplementaryTaskCategoryResponseDto }>(url, dto);
        return ComplementaryTaskCategoryMapper.toDomain(response.data.data);
    }

    public async delete(id: string): Promise<boolean> {
        const url = `${OEM_BASE}/complementary-task-categories/${encodeURIComponent(id)}`;
        await apiClient.delete(url);
        return true;
    }
}

/**
 * Singleton instance exported for dependency injection
 */
export const complementaryTaskCategoryApiRepository = new ComplementaryTaskCategoryApiRepository();