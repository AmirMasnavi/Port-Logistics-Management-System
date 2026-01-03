import ComplementaryTask from '../../domain/models/ComplementaryTask.js';
import { IComplementaryTaskRepository } from '../../domain/repositories/IComplementaryTaskRepository.js';

/**
 * MongoDB implementation of IComplementaryTaskRepository
 */
export class ComplementaryTaskRepository extends IComplementaryTaskRepository {
    /**
     * Creates a new complementary task
     */
    async create(taskData) {
        try {
            const task = new ComplementaryTask(taskData);
            await task.save();
            return task.toObject();
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('A task with this ID already exists');
            }
            throw error;
        }
    }

    /**
     * Finds a task by its taskId (business ID)
     */
    async findById(taskId) {
        try {
            const task = await ComplementaryTask.findOne({ taskId }).lean();
            return task;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] findById error:', error);
            throw error;
        }
    }

    /**
     * Finds a task by MongoDB _id
     */
    async findByMongoId(id) {
        try {
            const task = await ComplementaryTask.findById(id).lean();
            return task;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] findByMongoId error:', error);
            throw error;
        }
    }

    /**
     * Updates a task
     */
    async update(taskId, updateData) {
        try {
            updateData.updatedAt = new Date();
            const task = await ComplementaryTask.findOneAndUpdate(
                { taskId },
                { $set: updateData },
                { new: true, runValidators: true }
            ).lean();
            return task;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] update error:', error);
            throw error;
        }
    }

    /**
     * Deletes a task
     */
    async delete(taskId) {
        try {
            const result = await ComplementaryTask.deleteOne({ taskId });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] delete error:', error);
            throw error;
        }
    }

    /**
     * Searches for tasks based on filters
     */
    async search(filters = {}) {
        try {
            const query = {};

            if (filters.taskId) {
                query.taskId = filters.taskId;
            }

            if (filters.categoryId) {
                query.categoryId = filters.categoryId;
            }

            if (filters.vveId) {
                query.vveId = filters.vveId;
            }

            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    query.status = { $in: filters.status };
                } else {
                    query.status = filters.status;
                }
            }

            if (filters.suspendsOperations !== undefined) {
                query.suspendsOperations = filters.suspendsOperations;
            }

            if (filters.responsibleTeam) {
                query.responsibleTeam = { $regex: filters.responsibleTeam, $options: 'i' };
            }

            // Date range filters
            if (filters.startTimeFrom || filters.startTimeTo) {
                query.startTime = {};
                if (filters.startTimeFrom) {
                    query.startTime.$gte = new Date(filters.startTimeFrom);
                }
                if (filters.startTimeTo) {
                    query.startTime.$lte = new Date(filters.startTimeTo);
                }
            }

            if (filters.endTimeFrom || filters.endTimeTo) {
                query.endTime = {};
                if (filters.endTimeFrom) {
                    query.endTime.$gte = new Date(filters.endTimeFrom);
                }
                if (filters.endTimeTo) {
                    query.endTime.$lte = new Date(filters.endTimeTo);
                }
            }

            const tasks = await ComplementaryTask.find(query)
                .sort({ startTime: -1 })
                .lean();
            
            return tasks;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] search error:', error);
            throw error;
        }
    }

    /**
     * Finds all tasks for a specific VVE
     */
    async findByVveId(vveId) {
        try {
            const tasks = await ComplementaryTask.find({ vveId })
                .sort({ startTime: -1 })
                .lean();
            return tasks;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] findByVveId error:', error);
            throw error;
        }
    }

    /**
     * Finds ongoing tasks that suspend operations
     */
    async findOngoingTasksSuspendingOperations() {
        try {
            const tasks = await ComplementaryTask.find({
                status: 'ONGOING',
                suspendsOperations: true
            })
                .sort({ startTime: -1 })
                .lean();
            return tasks;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] findOngoingTasksSuspendingOperations error:', error);
            throw error;
        }
    }

    /**
     * Gets all tasks
     */
    async getAll() {
        try {
            const tasks = await ComplementaryTask.find({})
                .sort({ startTime: -1 })
                .lean();
            return tasks;
        } catch (error) {
            console.error('[ComplementaryTaskRepository] getAll error:', error);
            throw error;
        }
    }
}

