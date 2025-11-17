import type {
    VesselVisitNotification,
} from '../../domain/vvn/vvn.model';
import type {
    CreateVvnDto,
    ApproveVvnDto,
    RejectVvnDto
} from '../../infrastructure/repositories/vvn/vvn.dto'; // DTOs are defined in Infra
// DTOs are defined in Infra

// This is the "contract" or "interface".
// The Service (Chef) uses this, but doesn't know *how* it's implemented.
export interface IVvnRepository {
    getAll: () => Promise<VesselVisitNotification[]>;
    getById: (businessId: string) => Promise<VesselVisitNotification>;
    create: (dto: CreateVvnDto) => Promise<VesselVisitNotification>;
    update: (businessId: string, dto: CreateVvnDto) => Promise<VesselVisitNotification>;
    submit: (businessId: string) => Promise<void>;
    approve: (businessId: string, dto: ApproveVvnDto) => Promise<void>;
    reject: (businessId: string, dto: RejectVvnDto) => Promise<void>;
    reopen: (businessId: string) => Promise<void>;
}