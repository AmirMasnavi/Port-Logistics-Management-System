/**
 * Repository Interface for Operation Plan
 * Defines the contract for data access operations
 */
export class IOperationPlanRepository {
    async create(entity) {
        throw new Error('Method not implemented');
    }

    async findById(planId) {
        throw new Error('Method not implemented');
    }

    async findAll(filters) {
        throw new Error('Method not implemented');
    }

    async generateNextId() {
        throw new Error('Method not implemented');
    }
}