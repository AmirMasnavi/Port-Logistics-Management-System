//todo: solve this
// import { apiClient } from '../../http/apiClient';
import { apiClient } from '../../../services/apiService';
import type {IVvnRepository} from '../../../app/vvn/vvn.repository';
import type {VesselVisitNotification} from '../../../domain/vvn/vvn.model';
import type {CreateVvnDto, ApproveVvnDto, RejectVvnDto} from './vvn.dto';
import { VvnMapper } from './vvn.mapper';

// This is the "Delivery Driver". It implements the "Shopping List" (IVvnRepository).
// It knows *how* to get the data (by using the apiClient).
// It also translates the API DTOs into Domain Models using the Mapper.

class VvnApiRepository implements IVvnRepository {
    public async getAll(): Promise<VesselVisitNotification[]> {
        const response = await apiClient.get<any[]>('/notifications/search');
        return VvnMapper.toDomainList(response.data);
    }

    public async getById(businessId: string): Promise<VesselVisitNotification> {
        const response = await apiClient.get<any>(`/notifications/${businessId}`);
        return VvnMapper.toDomain(response.data);
    }

    public async create(dto: CreateVvnDto): Promise<VesselVisitNotification> {
        const response = await apiClient.post<any>('/notifications', dto);
        return VvnMapper.toDomain(response.data);
    }

    public async update(businessId: string, dto: CreateVvnDto): Promise<VesselVisitNotification> {
        const response = await apiClient.put<any>(`/notifications/${businessId}`, dto);
        return VvnMapper.toDomain(response.data);
    }

    public async submit(businessId: string): Promise<void> {
        await apiClient.patch(`/notifications/${businessId}/submit`);
    }

    public async approve(businessId: string, dto: ApproveVvnDto): Promise<void> {
        await apiClient.patch(`/notifications/${businessId}/approve`, dto);
    }

    public async reject(businessId: string, dto: RejectVvnDto): Promise<void> {
        await apiClient.patch(`/notifications/${businessId}/reject`, dto);
    }

    public async reopen(businessId: string): Promise<void> {
        await apiClient.patch(`/notifications/${businessId}/resubmit`);
    }
}

// We export a single instance of this repository
export const vvnApiRepository = new VvnApiRepository();