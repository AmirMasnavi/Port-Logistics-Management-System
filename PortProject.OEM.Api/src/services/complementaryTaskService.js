import { ComplementaryTaskRepository } from '../infrastructure/repositories/ComplementaryTaskRepository.js';

/**
 * Service for Complementary Task business logic
 */
export class ComplementaryTaskService {
    constructor() {
        this.repository = new ComplementaryTaskRepository();
    }

    /**
     * Creates a new complementary task
     */
    async createTask(dto, performedBy = 'system') {
        // Validation
        if (!dto || typeof dto !== 'object') {
            throw new Error('Invalid payload');
        }

        const { categoryId, vveId, responsibleTeam, startTime } = dto;

        if (!categoryId || String(categoryId).trim().length === 0) {
            throw new Error('Category ID is required');
        }

        if (!vveId || String(vveId).trim().length === 0) {
            throw new Error('VVE ID is required');
        }

        if (!responsibleTeam || String(responsibleTeam).trim().length === 0) {
            throw new Error('Responsible team is required');
        }

        if (!startTime) {
            throw new Error('Start time is required');
        }

        // Validate start and end times
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
            throw new Error('Invalid start time');
        }

        if (dto.endTime) {
            const end = new Date(dto.endTime);
            if (isNaN(end.getTime())) {
                throw new Error('Invalid end time');
            }
            if (end <= start) {
                throw new Error('End time must be after start time');
            }
        }

        // Validate status
        const validStatuses = ['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
        const status = dto.status || 'PENDING';
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Generate Business ID (CT-YYYY-TIMESTAMP_SUFFIX)
        const idSuffix = Date.now().toString().substr(-6);
        const generatedId = `CT-${new Date().getFullYear()}-${idSuffix}`;

        const newTask = {
            taskId: generatedId,
            categoryId: String(categoryId).trim(),
            vveId: String(vveId).trim(),
            description: dto.description?.trim() || '',
            responsibleTeam: String(responsibleTeam).trim(),
            startTime: start,
            endTime: dto.endTime ? new Date(dto.endTime) : null,
            status: status,
            suspendsOperations: dto.suspendsOperations !== undefined ? !!dto.suspendsOperations : false,
            createdBy: performedBy
        };

        return await this.repository.create(newTask);
    }

    /**
     * Gets a task by ID
     */
    async getTaskById(taskId) {
        const id = String(taskId ?? '').trim();
        if (!id) {
            throw new Error('Task ID is required');
        }

        const task = await this.repository.findById(id);
        if (!task) {
            throw new Error(`Complementary Task '${id}' not found`);
        }
        return task;
    }

    /**
     * Updates a task
     */
    async updateTask(taskId, dto, performedBy = 'system') {
        const id = String(taskId ?? '').trim();
        if (!id) {
            throw new Error('Task ID is required');
        }

        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Complementary Task '${id}' not found`);
        }

        const updatePayload = {
            updatedBy: performedBy
        };

        if (dto.categoryId !== undefined) {
            const categoryId = String(dto.categoryId).trim();
            if (categoryId.length === 0) {
                throw new Error('Category ID cannot be empty');
            }
            updatePayload.categoryId = categoryId;
        }

        if (dto.description !== undefined) {
            updatePayload.description = String(dto.description || '').trim();
        }

        if (dto.responsibleTeam !== undefined) {
            const team = String(dto.responsibleTeam).trim();
            if (team.length === 0) {
                throw new Error('Responsible team cannot be empty');
            }
            updatePayload.responsibleTeam = team;
        }

        if (dto.startTime !== undefined) {
            const start = new Date(dto.startTime);
            if (isNaN(start.getTime())) {
                throw new Error('Invalid start time');
            }
            updatePayload.startTime = start;
        }

        if (dto.endTime !== undefined) {
            if (dto.endTime === null) {
                updatePayload.endTime = null;
            } else {
                const end = new Date(dto.endTime);
                if (isNaN(end.getTime())) {
                    throw new Error('Invalid end time');
                }
                const startTime = updatePayload.startTime || existing.startTime;
                if (end <= new Date(startTime)) {
                    throw new Error('End time must be after start time');
                }
                updatePayload.endTime = end;
            }
        }

        if (dto.status !== undefined) {
            const validStatuses = ['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
            if (!validStatuses.includes(dto.status)) {
                throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }
            updatePayload.status = dto.status;
        }

        if (dto.suspendsOperations !== undefined) {
            updatePayload.suspendsOperations = !!dto.suspendsOperations;
        }

        return await this.repository.update(id, updatePayload);
    }

    /**
     * Deletes a task
     */
    async deleteTask(taskId) {
        const id = String(taskId ?? '').trim();
        if (!id) {
            throw new Error('Task ID is required');
        }

        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Complementary Task '${id}' not found`);
        }

        const deleted = await this.repository.delete(id);
        return deleted;
    }

    /**
     * Searches for tasks based on filters
     */
    async searchTasks(filters) {
        return await this.repository.search(filters);
    }

    /**
     * Gets all tasks for a specific VVE
     */
    async getTasksByVveId(vveId) {
        const id = String(vveId ?? '').trim();
        if (!id) {
            throw new Error('VVE ID is required');
        }

        return await this.repository.findByVveId(id);
    }

    /**
     * Gets ongoing tasks that are currently impacting operations
     */
    async getOngoingImpactingTasks() {
        return await this.repository.findOngoingTasksSuspendingOperations();
    }

    /**
     * Gets all tasks
     */
    async getAllTasks() {
        return await this.repository.getAll();
    }
}

