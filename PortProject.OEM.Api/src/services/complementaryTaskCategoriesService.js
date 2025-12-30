import { ComplementaryTaskCategoryRepository } from '../infrastructure/repositories/ComplementaryTaskCategoriesRepository.js';

export class ComplementaryTaskCategoryService {
    constructor() {
        this.repository = new ComplementaryTaskCategoryRepository();
    }

    /**
     * Creates a new complementary task category
     */
    async createCategory(dto, performedBy = 'system') {
        if (!dto || typeof dto !== 'object') {
            throw new Error('Invalid payload');
        }

        const code = String(dto.code || '').trim();
        const name = String(dto.name || '').trim();
        if (!code || !name) {
            throw new Error('Code and Name are required');
        }

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
            createdBy: performedBy, // if the model doesn't have this field, it can be omitted
            group: dto.group ?? 'Other'
        };

        return await this.repository.create(newCategory);
    }

    /**
     * Gets a category by ID
     */
    async getCategoryById(categoryId) {
        const id = String(categoryId ?? '').trim();
        if (!id) {
            throw new Error('CategoryId is required');
        }

        const category = await this.repository.findById(id);
        if (!category) {
            throw new Error(`Complementary Task Category '${id}' not found`);
        }
        return category;
    }

    /**
     * Updates a category
     */
    async updateCategory(categoryId, dto, performedBy = 'system') {
        const id = String(categoryId ?? '').trim();
        if (!id) {
            throw new Error('CategoryId is required');
        }
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Complementary Task Category '${id}' not found`);
        }

        // Validate fields if provided
        const updatePayload = {};

        if (dto.name !== undefined) {
            const name = String(dto.name).trim();
            if (name.length === 0) {
                throw new Error('Name cannot be empty');
            }
            updatePayload.name = name;
        }

        if (dto.description !== undefined) {
            updatePayload.description = String(dto.description || '').trim();
        }

        if (dto.defaultDurationMinutes !== undefined) {
            const v = dto.defaultDurationMinutes;
            if (v !== null && (!Number.isInteger(v) || v < 0)) {
                throw new Error('defaultDurationMinutes must be a non-negative integer');
            }
            updatePayload.defaultDurationMinutes = v === null ? null : Number(v);
        }

        if (dto.expectedImpactMinutes !== undefined) {
            const v = dto.expectedImpactMinutes;
            if (v !== null && (!Number.isInteger(v) || v < 0)) {
                throw new Error('expectedImpactMinutes must be a non-negative integer');
            }
            updatePayload.expectedImpactMinutes = v === null ? null : Number(v);
        }

        if (dto.isActive !== undefined) {
            updatePayload.isActive = !!dto.isActive;
        }

        if (dto.group !== undefined) {
            updatePayload.group = dto.group;
        }

        const updated = await this.repository.update(id, updatePayload);
        if (!updated) {
            throw new Error('Failed to update Complementary Task Category');
        }

        return updated;
    }
    
    /**
     * Searches categories with filters
     */
    async searchCategories(filters = {}) {
        return await this.repository.search(filters);
    }
    
    /**
     * Deletes a category
     */
    async deleteCategory(categoryId) {
        const id = String(categoryId ?? '').trim();
        if (!id) {
            throw new Error('CategoryId is required');
        }

        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Complementary Task Category '${id}' not found`);
        }
        return await this.repository.delete(id);
    }
}