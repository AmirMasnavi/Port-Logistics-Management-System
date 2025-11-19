//import { apiClient } from '../../http/apiClient';
import { apiClient } from '../../../services/apiService.ts';
import type { IVesselRepository } from '../../../app/vessel/vessel.repository';
import type { Vessel } from '../../../domain/vessel/vessel.model';
import type { CreateVesselDto, UpdateVesselDto } from './vessel.dto';
import { VesselMapper } from './vessel.mapper';

// This is the "Delivery Driver". It implements the "Shopping List" (IVesselRepository).
// It knows *how* to get the data (by using the apiClient).
// It also translates the API DTOs into Domain Models using the Mapper.

class VesselApiRepository implements IVesselRepository {
    public async getAll(): Promise<Vessel[]> {
        console.log('Calling GET /Vessel/search');
        const response = await apiClient.get<any[]>('/Vessel/search');
        console.log('Response from /Vessel/search:', response.data);
        return VesselMapper.toDomainList(response.data);
    }

    public async getById(id: string): Promise<Vessel> {
        console.log('Calling GET /Vessel/' + id);
        const response = await apiClient.get<any>(`/Vessel/${id}`);
        return VesselMapper.toDomain(response.data);
    }

    public async create(dto: CreateVesselDto): Promise<Vessel> {
        console.log('Calling POST /Vessel with data:', dto);
        const response = await apiClient.post<any>('/Vessel', dto);
        console.log('Response from POST /Vessel:', response.data);
        return VesselMapper.toDomain(response.data);
    }

    public async update(id: string, dto: UpdateVesselDto): Promise<Vessel> {
        console.log('Calling PUT /Vessel/' + id, dto);
        // Backend uses IMO in the URL, but we need to send the full object
        const fullDto = { ...dto, imoNumber: id };
        const response = await apiClient.put<any>(`/Vessel/${id}`, fullDto);
        return VesselMapper.toDomain(response.data);
    }

    public async delete(id: string): Promise<void> {
        console.log('Calling DELETE /Vessel/' + id);
        // Backend uses IMO as identifier
        await apiClient.delete(`/Vessel/${id}`);
    }
}

// We export a single instance of this repository
export const vesselApiRepository = new VesselApiRepository();
