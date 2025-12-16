import { DataRightsService } from '../app/dataRights';
import { DataRightsRepository } from '../infrastructure/dataRights';
import type {
    CreateDataRightsRequest,
    UpdateDataRightsRequest,
    DataRightsRequest
} from '../domain/dataRights';

export class DataRightsController {
    private service: DataRightsService;

    constructor() {
        const repository = new DataRightsRepository();
        this.service = new DataRightsService(repository);
    }

    async createRequest(request: CreateDataRightsRequest): Promise<DataRightsRequest> {
        try {
            return await this.service.createRequest(request);
        } catch (error) {
            console.error('Error creating data rights request:', error);
            throw error;
        }
    }

    async getMyRequests(): Promise<DataRightsRequest[]> {
        try {
            return await this.service.getMyRequests();
        } catch (error) {
            console.error('Error fetching my requests:', error);
            throw error;
        }
    }

    async getRequestById(id: string): Promise<DataRightsRequest> {
        try {
            return await this.service.getRequestById(id);
        } catch (error) {
            console.error('Error fetching request by id:', error);
            throw error;
        }
    }

    async downloadMyData(): Promise<Blob> {
        try {
            return await this.service.downloadMyData();
        } catch (error) {
            console.error('Error downloading data:', error);
            throw error;
        }
    }

    async getAllRequests(): Promise<DataRightsRequest[]> {
        try {
            return await this.service.getAllRequests();
        } catch (error) {
            console.error('Error fetching all requests:', error);
            throw error;
        }
    }

    async processRequest(id: string, update: UpdateDataRightsRequest): Promise<DataRightsRequest> {
        try {
            return await this.service.processRequest(id, update);
        } catch (error) {
            console.error('Error processing request:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const dataRightsController = new DataRightsController();
