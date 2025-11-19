import { apiClient } from '../../http/apiClient';
import type { IVesselTypeRepository } from '../../../app/vesselType/vesselType.repository';
import type { VesselType } from '../../../domain/vesselType/vesselType.model';
import type { CreateVesselTypeDto, UpdateVesselTypeDto } from './vesselType.dto';
import { VesselTypeMapper } from './vesselType.mapper';

// This is the "Delivery Driver". It implements the "Shopping List" (IVesselTypeRepository).
// It knows *how* to get the data (by using the apiClient).
// It also translates the API DTOs into Domain Models using the Mapper.

class VesselTypeApiRepository implements IVesselTypeRepository {
    public async getAll(): Promise<VesselType[]> {
        const response = await apiClient.get<any[]>('/VesselType');
        return VesselTypeMapper.toDomainList(response.data);
    }

    public async getById(id: string): Promise<VesselType> {
        const response = await apiClient.get<any>(`/VesselType/${id}`);
        return VesselTypeMapper.toDomain(response.data);
    }

    public async create(dto: CreateVesselTypeDto): Promise<VesselType> {
        const response = await apiClient.post<any>('/VesselType', dto);
        return VesselTypeMapper.toDomain(response.data);
    }

    public async update(id: string, dto: UpdateVesselTypeDto): Promise<VesselType> {
        const response = await apiClient.put<any>(`/VesselType/${id}`, dto);
        return VesselTypeMapper.toDomain(response.data);
    }

    public async delete(id: string): Promise<void> {
        await apiClient.delete(`/VesselType/${id}`);
    }
}

// We export a single instance of this repository
export const vesselTypeApiRepository = new VesselTypeApiRepository();
