import { apiClient } from '../../../services/apiService';
import type { IResourceRepository } from '../../../app/resource/resource.repository';
import type { Resource } from '../../../domain/resource/resource.model';
import type { ResourceCreateDto, ResourceUpdateDto, ResourceUpdateStatusDto } from './resource.dto';
import { ResourceMapper } from './resource.mapper';

// This is the concrete implementation of IResourceRepository.
// It knows *how* to get the data (by using the apiClient).
// It also translates the API DTOs into Domain Models using the Mapper.

class ResourceApiRepository implements IResourceRepository {
    public async getAll(): Promise<Resource[]> {
        const response = await apiClient.get<any[]>('/Resource');
        return ResourceMapper.toDomainList(response.data);
    }

    public async create(dto: ResourceCreateDto): Promise<Resource> {
        const response = await apiClient.post<any>('/Resource', dto);
        return ResourceMapper.toDomain(response.data);
    }

    public async update(code: string, dto: ResourceUpdateDto): Promise<Resource> {
        const response = await apiClient.put<any>(`/Resource/${code}`, dto);
        return ResourceMapper.toDomain(response.data);
    }

    public async updateStatus(code: string, dto: ResourceUpdateStatusDto): Promise<void> {
        await apiClient.patch(`/Resource/${code}/status`, dto);
    }
}

// We export a single instance of this repository
export const resourceApiRepository = new ResourceApiRepository();

