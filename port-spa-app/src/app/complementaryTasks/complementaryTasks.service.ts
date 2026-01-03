import type { ComplementaryTask } from '../../domain/complementaryTasks/complementaryTasks.model';
import { ComplementaryTaskValidationError } from '../../domain/complementaryTasks/complementaryTasks.error';
import type {
    IComplementaryTaskRepository,
    ComplementaryTaskFilters,
} from '../../infrastructure/repositories/complementaryTasks/complementaryTasks.repository';
import type {
    CreateComplementaryTaskDto,
    UpdateComplementaryTaskDto,
} from '../../infrastructure/repositories/complementaryTasks/complementaryTasks.dto';

export class ComplementaryTaskService {
    private readonly repo: IComplementaryTaskRepository;

    constructor(repo: IComplementaryTaskRepository) {
        this.repo = repo;
    }

    /**
     * Fetch tasks with optional filters
     */
    async fetchAllTasks(filters?: ComplementaryTaskFilters): Promise<ComplementaryTask[]> {
        const items = await this.repo.getAll(filters);
        // Sort by start time descending (most recent first)
        return items.sort((a, b) => {
            const da = new Date(a.startTime).getTime();
            const db = new Date(b.startTime).getTime();
            return db - da;
        });
    }

    /**
     * Get task by ID
     */
    async getTaskById(id: string): Promise<ComplementaryTask> {
        if (!id || id.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Task ID is required');
        }
        return this.repo.getById(id);
    }

    /**
     * Get tasks by VVE ID
     */
    async getTasksByVveId(vveId: string): Promise<ComplementaryTask[]> {
        if (!vveId || vveId.trim().length === 0) {
            throw new ComplementaryTaskValidationError('VVE ID is required');
        }
        const items = await this.repo.getByVveId(vveId);
        return items.sort((a, b) => {
            const da = new Date(a.startTime).getTime();
            const db = new Date(b.startTime).getTime();
            return db - da;
        });
    }

    /**
     * Get ongoing tasks that suspend operations
     */
    async getImpactingTasks(): Promise<ComplementaryTask[]> {
        return this.repo.getImpacting();
    }

    /**
     * Create new task
     */
    async createTask(dto: CreateComplementaryTaskDto): Promise<ComplementaryTask> {
        this.validateCreateDto(dto);
        return this.repo.create(dto);
    }

    /**
     * Update existing task
     */
    async updateTask(id: string, dto: UpdateComplementaryTaskDto): Promise<ComplementaryTask> {
        if (!id || id.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Task ID is required');
        }
        this.validateUpdateDto(dto);
        return this.repo.update(id, dto);
    }

    /**
     * Delete task
     */
    async deleteTask(id: string): Promise<void> {
        if (!id || id.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Task ID is required');
        }
        return this.repo.delete(id);
    }

    /**
     * Validate create DTO
     */
    private validateCreateDto(dto: CreateComplementaryTaskDto): void {
        if (!dto.categoryId || dto.categoryId.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Category ID is required');
        }
        if (!dto.vveId || dto.vveId.trim().length === 0) {
            throw new ComplementaryTaskValidationError('VVE ID is required');
        }
        if (!dto.responsibleTeam || dto.responsibleTeam.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Responsible team is required');
        }
        if (!dto.startTime || dto.startTime.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Start time is required');
        }

        // Validate date
        const start = new Date(dto.startTime);
        if (isNaN(start.getTime())) {
            throw new ComplementaryTaskValidationError('Invalid start time');
        }

        // If endTime is provided, validate it
        if (dto.endTime) {
            const end = new Date(dto.endTime);
            if (isNaN(end.getTime())) {
                throw new ComplementaryTaskValidationError('Invalid end time');
            }
            if (end <= start) {
                throw new ComplementaryTaskValidationError('End time must be after start time');
            }
        }
    }

    /**
     * Validate update DTO
     */
    private validateUpdateDto(dto: UpdateComplementaryTaskDto): void {
        if (dto.categoryId !== undefined && dto.categoryId.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Category ID cannot be empty');
        }
        if (dto.responsibleTeam !== undefined && dto.responsibleTeam.trim().length === 0) {
            throw new ComplementaryTaskValidationError('Responsible team cannot be empty');
        }

        // Validate dates if provided
        if (dto.startTime) {
            const start = new Date(dto.startTime);
            if (isNaN(start.getTime())) {
                throw new ComplementaryTaskValidationError('Invalid start time');
            }
        }

        if (dto.endTime) {
            const end = new Date(dto.endTime);
            if (isNaN(end.getTime())) {
                throw new ComplementaryTaskValidationError('Invalid end time');
            }
        }
    }
}

