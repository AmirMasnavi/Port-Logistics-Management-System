/**
 * Repository Interface for ComplementaryTaskCategory
 * Define o contrato para operações de acesso a dados
 */
export class IComplementaryTaskCategoryRepository {
    async create(entity) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findByCode(code) {
        throw new Error('Method not implemented');
    }

    /**
     * findAll(filters) - filters: { code, nameContains, active, minImpactMinutes, maxImpactMinutes }
     */
    async findAll(filters) {
        throw new Error('Method not implemented');
    }

    async update(id, entity) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }

    async exists(id) {
        throw new Error('Method not implemented');
    }

    async existsByCode(code) {
        throw new Error('Method not implemented');
    }

    async countAll() {
        throw new Error('Method not implemented');
    }
}