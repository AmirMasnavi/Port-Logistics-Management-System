// Repository Interface (Port) - Application Layer
// This defines the contract that any VVE repository must implement

import type { VesselVisitExecution } from '../../domain/vve/vve.model';
import type { CreateVveDto, UpdateVveDto } from '../../infrastructure/repositories/vve/vve.dto';

export interface IVveRepository {
    getAll(filters?: VveFilters): Promise<VesselVisitExecution[]>;
    getById(vveId: string): Promise<VesselVisitExecution>;
    create(dto: CreateVveDto): Promise<VesselVisitExecution>;
    update(vveId: string, dto: UpdateVveDto): Promise<VesselVisitExecution>;
    delete(vveId: string): Promise<boolean>;
}

export interface VveFilters {
    status?: string;
    vvnId?: string;
    vesselIdentifier?: string;
}

