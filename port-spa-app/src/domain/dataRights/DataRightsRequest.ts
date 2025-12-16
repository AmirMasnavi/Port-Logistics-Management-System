export const DataRequestType = {
    Access: 'DataAccess',
    Rectification: 'DataRectification',
    Erasure: 'DataDeletion'
} as const;

export type DataRequestType = typeof DataRequestType[keyof typeof DataRequestType];

export const DataRequestStatus = {
    Pending: 'Pending',
    Processed: 'Processed',
    Rejected: 'Rejected'
} as const;

export type DataRequestStatus = typeof DataRequestStatus[keyof typeof DataRequestStatus];

export interface DataRightsRequest {
    id: string;
    userEmail: string;
    requestType: DataRequestType;
    status: DataRequestStatus;
    details?: string;
    response?: string;
    requestedAt: string;
    processedAt?: string;
    processedBy?: string;
}

export interface CreateDataRightsRequest {
    requestType: DataRequestType;
    details?: string;
}

export interface UpdateDataRightsRequest {
    status: DataRequestStatus;
    response?: string;
}
