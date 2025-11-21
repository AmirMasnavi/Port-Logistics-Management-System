import type {
    Resource,
} from '../../domain/resource/resource.model';
import type {
    ResourceCreateDto,
    ResourceUpdateDto,
    ResourceUpdateStatusDto
} from '../../infrastructure/repositories/resource/resource.dto';

// This is the "contract" or "interface".
// The Service uses this, but doesn't know *how* it's implemented.
export interface IResourceRepository {
    getAll: () => Promise<Resource[]>;
    create: (dto: ResourceCreateDto) => Promise<Resource>;
    update: (code: string, dto: ResourceUpdateDto) => Promise<Resource>;
    updateStatus: (code: string, dto: ResourceUpdateStatusDto) => Promise<void>;
}

