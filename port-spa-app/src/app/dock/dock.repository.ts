import type { Dock } from '../../domain/dock/dock.model';
import type {
    DockCreateDto,
    UpdateDockDto
} from '../../infrastructure/repositories/dock/dock.dto';

// This is the "contract" or "interface".
// The Service uses this, but doesn't know *how* it's implemented.
export interface IDockRepository {
    getAll: () => Promise<Dock[]>;
    getById: (id: string) => Promise<Dock>;
    create: (dto: DockCreateDto) => Promise<Dock>;
    update: (id: string, dto: UpdateDockDto) => Promise<Dock>;
    delete: (id: string) => Promise<void>;
}

