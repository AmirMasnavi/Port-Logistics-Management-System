/**
 * Repository Interface for Complementary Task Categories.
 * Defines the contract for data access operations.
 */

/**
 * @typedef {Object} ComplementaryTaskCategorySearchFilters
 * @property {string} [code] Exact code match.
 * @property {string} [nameContains] Case-insensitive substring on name.
 * @property {boolean} [active] Filter by active flag.
 * @property {number} [defaultDurationMinutes] Exact default duration.
 * @property {number} [expectedImpactMinutes] Exact expected impact.
 * @property {string} [group] Category group.
 */

export class IComplementaryTaskCategoryRepository {
    /**
     * Creates a new category.
     * @param {object} entity
     */
    async create(entity) {
        throw new Error('Method not implemented');
    }

    /**
     * Finds a category by business ID.
     * @param {string} categoryId
     */
    async findById(categoryId) {
        throw new Error('Method not implemented');
    }

    /**
     * Finds a category by unique code.
     * @param {string} code
     */
    async findByCode(code) {
        throw new Error('Method not implemented');
    }

    /**
     * Searches categories using filters.
     * @param {ComplementaryTaskCategorySearchFilters} filters
     */
    async search(filters) {
        throw new Error('Method not implemented');
    }

    /**
     * Updates a category by business ID.
     * @param {string} categoryId
     * @param {object} entity
     */
    async update(categoryId, entity) {
        throw new Error('Method not implemented');
    }

    /**
     * Deletes a category by business ID.
     * @param {string} categoryId
     */
    async delete(categoryId) {
        throw new Error('Method not implemented');
    }

    /**
     * Checks existence by business ID.
     * @param {string} categoryId
     */
    async exists(categoryId) {
        throw new Error('Method not implemented');
    }

    /**
     * Checks existence by unique code.
     * @param {string} code
     */
    async existsByCode(code) {
        throw new Error('Method not implemented');
    }

    /**
     * Counts total records.
     */
    async countAll() {
        throw new Error('Method not implemented');
    }
}