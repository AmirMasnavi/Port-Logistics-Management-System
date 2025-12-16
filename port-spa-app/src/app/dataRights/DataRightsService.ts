import type { IDataRightsRepository } from '../../domain/dataRights/IDataRightsRepository';
import type {
    DataRightsRequest,
    CreateDataRightsRequest,
    UpdateDataRightsRequest
} from '../../domain/dataRights/DataRightsRequest';

export class DataRightsService {
    private repository: IDataRightsRepository;
    
    constructor(repository: IDataRightsRepository) {
        this.repository = repository;
    }

    async createRequest(request: CreateDataRightsRequest): Promise<DataRightsRequest> {
        return await this.repository.createRequest(request);
    }

    async getMyRequests(): Promise<DataRightsRequest[]> {
        return await this.repository.getMyRequests();
    }

    async getRequestById(id: string): Promise<DataRightsRequest> {
        return await this.repository.getRequestById(id);
    }

    async downloadMyData(): Promise<Blob> {
        return await this.repository.downloadMyData();
    }

    async getAllRequests(): Promise<DataRightsRequest[]> {
        return await this.repository.getAllRequests();
    }

    async processRequest(id: string, update: UpdateDataRightsRequest): Promise<DataRightsRequest> {
        return await this.repository.processRequest(id, update);
    }
}
