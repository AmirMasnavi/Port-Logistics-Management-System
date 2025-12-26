import ComplementaryTaskCategory from '../../domain/models/ComplementaryTaskCategories.js';

export class ComplementaryTaskCategoryRepository {
    async create(data) {
        try {
            const category = new ComplementaryTaskCategory(data);
            return await category.save();
        } catch (err) {
            // Mongo duplicate key error
            if (err && err.code === 11000) {
                const field = Object.keys(err.keyPattern || {})[0] || 'unique field';
                throw new Error(`Complementary Task Category with the same ${field} already exists`);
            }
            throw err;
        }
    }

    async findById(categoryId) {
        const id = String(categoryId || '').trim();
        return await ComplementaryTaskCategory.findOne({ categoryId: id });
    }

    async update(categoryId, data) {
        const id = String(categoryId || '').trim();
        return await ComplementaryTaskCategory.findOneAndUpdate(
            { categoryId: id },
            data,
            { new: true }
        );
    }

    // Supports: filter by code, nameContains, isActive, expectedImpactMinutes range
    async search(filters = {}) {
        const query = {};

        if (filters.code !== undefined && filters.code !== null) {
            query.code = String(filters.code).trim();
        }

        if (filters.nameContains !== undefined && filters.nameContains !== null) {
            query.name = { $regex: String(filters.nameContains).trim(), $options: 'i' };
        }

        if (filters.active !== undefined) {
            query.isActive = !!filters.active;
        }

        // Expected impact minutes range
        if (filters.minImpactMinutes !== undefined || filters.maxImpactMinutes !== undefined) {
            query.expectedImpactMinutes = {};
            if (filters.minImpactMinutes !== undefined) {
                query.expectedImpactMinutes.$gte = Number(filters.minImpactMinutes);
            }
            if (filters.maxImpactMinutes !== undefined) {
                query.expectedImpactMinutes.$lte = Number(filters.maxImpactMinutes);
            }
        }

        return await ComplementaryTaskCategory.find(query).sort({ createdAt: -1 });
    }

    async delete(categoryId) {
        const id = String(categoryId || '').trim();
        return await ComplementaryTaskCategory.findOneAndDelete({ categoryId: id });
    }
}

export default ComplementaryTaskCategoryRepository;