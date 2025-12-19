/**
 * Repository Interface for VVE
 * Defines the contract for data access operations
 * Following Repository Pattern and Dependency Inversion Principle
 */
export class IVveRepository {
  async create(entity) {
    throw new Error('Method not implemented');
  }

  async findById(vveId) {
    throw new Error('Method not implemented');
  }

  async findByVvnId(vvnId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters) {
    throw new Error('Method not implemented');
  }

  async update(vveId, entity) {
    throw new Error('Method not implemented');
  }

  async delete(vveId) {
    throw new Error('Method not implemented');
  }

  async exists(vveId) {
    throw new Error('Method not implemented');
  }

  async existsByVvnId(vvnId) {
    throw new Error('Method not implemented');
  }

  async countByStatus(status) {
    throw new Error('Method not implemented');
  }

  async countAll() {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }

  async updateOperationStatus(vveId, operationId, statusData) {
    throw new Error('Method not implemented');
  }
}

