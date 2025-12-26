import {ComplementaryTaskCategoryDto } from '../dtos/ComplementaryTaskCategoriesDto.js';

export class ComplementaryTaskCategoryMapper {
    static toDto(model) {
        return new ComplementaryTaskCategoryDto({
            id: model.categoryId ?? model.id,
            code: model.code,
            name: model.name,
            description: model.description,
            defaultDurationMinutes: model.defaultDurationMinutes ?? null,
            expectedImpactMinutes: model.expectedImpactMinutes ?? null,
            isActive: model.isActive ?? true,
            createdAt: model.createdAt
        });
    }

    static toListDto(models) {
        return models.map(model => this.toDto(model));
    }
}