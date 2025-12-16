import type { DataRightsRequest, CreateDataRightsRequest, UpdateDataRightsRequest } from './DataRightsRequest';

export interface IDataRightsRepository {
    createRequest(request: CreateDataRightsRequest): Promise<DataRightsRequest>;
    getMyRequests(): Promise<DataRightsRequest[]>;
    getRequestById(id: string): Promise<DataRightsRequest>;
    downloadMyData(): Promise<Blob>;
    getAllRequests(): Promise<DataRightsRequest[]>;
    processRequest(id: string, update: UpdateDataRightsRequest): Promise<DataRightsRequest>;
}
