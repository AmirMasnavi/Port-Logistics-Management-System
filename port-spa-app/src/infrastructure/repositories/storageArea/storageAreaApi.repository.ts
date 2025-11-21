import { apiClient } from '../../../services/apiService';
import type { IStorageAreaRepository } from '../../../app/storageArea/storageArea.repository';
import type { StorageArea } from '../../../domain/storageArea/storageArea.model';
import type { StorageAreaCreateDto, StorageAreaUpdateDto } from './storageArea.dto';
import { StorageAreaMapper } from './storageArea.mapper';

// This is the concrete implementation of IStorageAreaRepository.
// It knows *how* to get the data (by using the apiClient).
// It also translates the API DTOs into Domain Models using the Mapper.

class StorageAreaApiRepository implements IStorageAreaRepository {
    public async getAll(): Promise<StorageArea[]> {
        const response = await apiClient.get<any[]>('/StorageArea');
        return StorageAreaMapper.toDomainList(response.data);
    }

    public async create(dto: StorageAreaCreateDto): Promise<StorageArea> {
        const response = await apiClient.post<any>('/StorageArea', dto);
        return StorageAreaMapper.toDomain(response.data);
    }

    public async update(code: string, dto: StorageAreaUpdateDto): Promise<StorageArea> {
        const response = await apiClient.put<any>(`/StorageArea/${code}`, dto);
        return StorageAreaMapper.toDomain(response.data);
    }
}

// We export a single instance of this repository
export const storageAreaApiRepository = new StorageAreaApiRepository();

