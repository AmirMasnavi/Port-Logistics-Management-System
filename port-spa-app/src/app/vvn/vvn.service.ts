import type {
    VesselVisitNotification,
} from '../../domain/vvn/vvn.model';
import { VvnValidationError } from '../../domain/vvn/vvn.errors';
import type {IVvnRepository} from './vvn.repository';
import type {
    CreateVvnDto,
    ApproveVvnDto,
    RejectVvnDto
} from '../../infrastructure/repositories/vvn/vvn.dto';

// This is our "Chef" or "Use Case" layer.
// It contains all business logic.
// It depends on the INTERFACE (IVvnRepository), not the implementation.

export class VvnService {
    // We "inject" the repository (the "Delivery Driver")
    private readonly vvnRepo: IVvnRepository;

    // We "inject" the repository (the "Delivery Driver")
    constructor(vvnRepo: IVvnRepository) {
        this.vvnRepo = vvnRepo;
    }

    // Example of business logic:
    async fetchAllVvns(): Promise<VesselVisitNotification[]> {
        const vvns = await this.vvnRepo.getAll();
        // Business rule: Always show the newest visits first.
        return vvns.sort((a, b) =>
            new Date(b.estimatedArrival).getTime() - new Date(a.estimatedArrival).getTime()
        );
    }

    async getVvnById(businessId: string): Promise<VesselVisitNotification> {
        return this.vvnRepo.getById(businessId);
    }

    // Example of business logic:
    private validateVvnDto(dto: CreateVvnDto) {
        if (!dto.vesselImo) {
            throw new VvnValidationError('Vessel IMO is required.');
        }
        if (dto.estimatedDeparture <= dto.estimatedArrival) {
            throw new VvnValidationError('Departure date must be after arrival date.');
        }
        if (dto.cargo.containers.length > 0) {
            const hasInvalidCode = dto.cargo.containers.some(c => !c.containerCode || c.containerCode.length < 11);
            if (hasInvalidCode) {
                throw new VvnValidationError('All containers must have a valid container code.');
            }
        }
    }

    async createVvn(dto: CreateVvnDto): Promise<VesselVisitNotification> {
        this.validateVvnDto(dto); // Run business validation
        return this.vvnRepo.create(dto);
    }

    async updateVvn(businessId: string, dto: CreateVvnDto): Promise<VesselVisitNotification> {
        this.validateVvnDto(dto); // Run business validation
        return this.vvnRepo.update(businessId, dto);
    }

    async submitVvn(businessId: string): Promise<void> {
        return this.vvnRepo.submit(businessId);
    }

    async approveVvn(businessId: string, dto: ApproveVvnDto): Promise<void> {
        if (!dto.dockId) {
            throw new VvnValidationError('A dock must be assigned for approval.');
        }
        return this.vvnRepo.approve(businessId, dto);
    }

    async rejectVvn(businessId: string, dto: RejectVvnDto): Promise<void> {
        if (!dto.reason || dto.reason.trim().length < 5) {
            throw new VvnValidationError('A valid reason is required for rejection.');
        }
        return this.vvnRepo.reject(businessId, dto);
    }

    async reopenVvn(businessId: string): Promise<void> {
        return this.vvnRepo.reopen(businessId);
    }
}