import type { VesselType } from '../../domain/vesselType/vesselType.model';
import type {
    CreateVesselTypeDto,
    UpdateVesselTypeDto
} from '../../infrastructure/repositories/vesselType/vesselType.dto';

// This is the "contract" or "interface".
// The Service uses this, but doesn't know *how* it's implemented.
export interface IVesselTypeRepository {
    getAll: () => Promise<VesselType[]>;
    getById: (id: string) => Promise<VesselType>;
    create: (dto: CreateVesselTypeDto) => Promise<VesselType>;
    update: (id: string, dto: UpdateVesselTypeDto) => Promise<VesselType>;
    delete: (id: string) => Promise<void>;
}

