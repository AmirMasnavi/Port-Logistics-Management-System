import { ComplementaryTaskCategoryRepository } from '../infrastructure/repositories/ComplementaryTaskCategoriesRepository.js';

export class ComplementaryTaskCategoryService {
    constructor() {
        this.repository = new ComplementaryTaskCategoryRepository();
    }

    /**
     * Creates a new complementary task category
     */
    async createCategory(dto, performedBy = 'system') {
        // Validate unique code
        const existingByCode = await this.repository.search({ code: dto.code });
        if (existingByCode && existingByCode.length > 0) {
            throw new Error(`Complementary Task Category with code '${dto.code}' already exists`);
        }

        // Generate Business ID (CTC-YYYY-TIMESTAMP_SUFFIX)
        const idSuffix = new Date().getTime().toString().substr(-6);
        const generatedId = `CTC-${new Date().getFullYear()}-${idSuffix}`;

        const newCategory = {
            categoryId: generatedId,
            code: dto.code.trim(),
            name: dto.name.trim(),
            description: dto.description?.trim() || '',
            defaultDurationMinutes: dto.defaultDurationMinutes ?? null,
            expectedImpactMinutes: dto.expectedImpactMinutes ?? null,
            isActive: dto.isActive !== undefined ? !!dto.isActive : true,
            createdBy: performedBy // if the model doesn't have this field, it can be omitted
        };

        return await this.repository.create(newCategory);
    }

    /**
     * Gets a category by ID
     */
    async getCategoryById(categoryId) {
        const category = await this.repository.findById(categoryId);
        if (!category) {
            throw new Error(`Complementary Task Category '${categoryId}' not found`);
        }
        return category;
    }

    /**
     * Updates a category
     */
    async updateCategory(categoryId, dto, performedBy = 'system') {
        const existing = await this.repository.findById(categoryId);
        if (!existing) {
            throw new Error(`Complementary Task Category '${categoryId}' not found`);
        }

        const updates = {
            name: dto.name !== undefined ? dto.name?.trim() : existing.name,
            description: dto.description !== undefined ? (dto.description?.trim() || '') : existing.description,
            defaultDurationMinutes: dto.defaultDurationMinutes !== undefined ? dto.defaultDurationMinutes : existing.defaultDurationMinutes,
            expectedImpactMinutes: dto.expectedImpactMinutes !== undefined ? dto.expectedImpactMinutes : existing.expectedImpactMinutes,
            isActive: dto.isActive !== undefined ? !!dto.isActive : existing.isActive,
            updatedBy: performedBy // if it doesn't exist in the schema, it can be ignored
        };

        return await this.repository.update(categoryId, updates);
    }

    /**
     * Searches categories with filters
     * Supports: code, nameContains, active, minImpactMinutes, maxImpactMinutes
     */
    async searchCategories(filters) {
        return await this.repository.search(filters);
    }

    /**
     * Deletes a category
     */
    async deleteCategory(categoryId, performedBy = 'system') {
        const existing = await this.repository.findById(categoryId);
        if (!existing) {
            throw new Error(`Complementary Task Category '${categoryId}' not found`);
        }
        return await this.repository.delete(categoryId);
    }
}