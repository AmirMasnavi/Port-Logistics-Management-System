import type {
    StorageArea,
} from '../../domain/storageArea/storageArea.model';
import type {
    StorageAreaCreateDto,
    StorageAreaUpdateDto
} from '../../infrastructure/repositories/storageArea/storageArea.dto';

// This is the "contract" or "interface".
// The Service uses this, but doesn't know *how* it's implemented.
export interface IStorageAreaRepository {
    getAll: () => Promise<StorageArea[]>;
    create: (dto: StorageAreaCreateDto) => Promise<StorageArea>;
    update: (code: string, dto: StorageAreaUpdateDto) => Promise<StorageArea>;
}

