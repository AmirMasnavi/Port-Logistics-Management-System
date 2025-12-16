import { apiClient } from '../../services/apiService';
import type { IDataRightsRepository } from '../../domain/dataRights/IDataRightsRepository';
import type {
    DataRightsRequest,
    CreateDataRightsRequest,
    UpdateDataRightsRequest
} from '../../domain/dataRights/DataRightsRequest';

export class DataRightsRepository implements IDataRightsRepository {
    async createRequest(request: CreateDataRightsRequest): Promise<DataRightsRequest> {
        const response = await apiClient.post(
            '/data-rights/requests',
            request
        );
        return response.data.request;
    }

    async getMyRequests(): Promise<DataRightsRequest[]> {
        const response = await apiClient.get('/data-rights/my-requests');
        return response.data;
    }

    async getRequestById(id: string): Promise<DataRightsRequest> {
        const response = await apiClient.get(`/data-rights/${id}`);
        return response.data;
    }

    async downloadMyData(): Promise<Blob> {
        const response = await apiClient.get(
            '/data-rights/my-data/download/json',
            {
                responseType: 'blob'
            }
        );
        return response.data;
    }

    async getAllRequests(): Promise<DataRightsRequest[]> {
        const response = await apiClient.get('/data-rights');
        return response.data;
    }

    async processRequest(id: string, update: UpdateDataRightsRequest): Promise<DataRightsRequest> {
        const response = await apiClient.put(
            `/data-rights/${id}/process`,
            update
        );
        return response.data;
    }
}
