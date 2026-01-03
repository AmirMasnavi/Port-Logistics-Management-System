/**
 * Interface for Complementary Task Repository
 * Defines contract for data access operations
 */
export class IComplementaryTaskRepository {
    /**
     * Creates a new complementary task
     * @param {Object} taskData - Task data to create
     * @returns {Promise<Object>} Created task
     */
    async create(taskData) {
        throw new Error('Method not implemented');
    }

    /**
     * Finds a task by its ID
     * @param {string} taskId - The task ID to find
     * @returns {Promise<Object|null>} The task or null
     */
    async findById(taskId) {
        throw new Error('Method not implemented');
    }

    /**
     * Updates a task
     * @param {string} taskId - The task ID to update
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated task or null
     */
    async update(taskId, updateData) {
        throw new Error('Method not implemented');
    }

    /**
     * Deletes a task
     * @param {string} taskId - The task ID to delete
     * @returns {Promise<boolean>} True if deleted
     */
    async delete(taskId) {
        throw new Error('Method not implemented');
    }

    /**
     * Searches for tasks based on filters
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} Array of matching tasks
     */
    async search(filters) {
        throw new Error('Method not implemented');
    }

    /**
     * Finds all tasks for a specific VVE
     * @param {string} vveId - The VVE ID
     * @returns {Promise<Array>} Array of tasks
     */
    async findByVveId(vveId) {
        throw new Error('Method not implemented');
    }

    /**
     * Finds ongoing tasks that suspend operations
     * @returns {Promise<Array>} Array of tasks
     */
    async findOngoingTasksSuspendingOperations() {
        throw new Error('Method not implemented');
    }
}

