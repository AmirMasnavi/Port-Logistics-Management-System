// Repository Interface (Port) - Application Layer
// This defines the contract that any VVE repository must implement

import type { VesselVisitExecution } from '../../domain/vve/vve.model';
import type { CreateVveDto, UpdateVveDto } from '../../infrastructure/repositories/vve/vve.dto';
import type { VveOperationsDetailedResponse, UpdateOperationStatusDto } from '../../domain/vve/operation-execution.types';

export interface IVveRepository {
    getAll(filters?: VveFilters): Promise<VesselVisitExecution[]>;
    getById(vveId: string): Promise<VesselVisitExecution>;
    create(dto: CreateVveDto): Promise<VesselVisitExecution>;
    update(vveId: string, dto: UpdateVveDto): Promise<VesselVisitExecution>;
    delete(vveId: string): Promise<boolean>;

    // US 4.1.9 - Operation execution tracking
    getOperationsDetailed(vveId: string): Promise<VveOperationsDetailedResponse>;
    updateOperationStatus(vveId: string, operationId: string, dto: UpdateOperationStatusDto): Promise<void>;
}

export interface VveFilters {
    status?: string;
    vvnId?: string;
    vesselIdentifier?: string;
    berthDockId?: string;   
    fromDate?: string;     
    toDate?: string;        
    includeMetrics?: boolean;
}
