// javascript
import {
    IncidentTypeResponseDto,
    IncidentTypeListItemDto,
} from '../dtos/IncidentTypeDto.js';

/**
 * Mapper for IncidentType conversions between layers
 * Follows the Onion Architecture principle of separation of concerns
 */
export class IncidentTypeMapper {

    /**
     * Convert persistence model to response DTO
     * @param {Object} model - Mongoose model instance or plain object
     * @returns {IncidentTypeResponseDto} Response DTO
     */
    static toResponseDto(model) {
        return new IncidentTypeResponseDto({
            id: model.id || model._id,
            code: model.code,
            name: model.name,
            description: model.description,
            severity: model.severity,
            parentId: model.parentId,
            parentCode: model.parent?.code || null,
            parentName: model.parent?.name || null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    /**
     * Convert persistence model to list item DTO
     * @param {Object} model - Mongoose model instance or plain object
     * @returns {IncidentTypeListItemDto} List item DTO
     */
    static toListItemDto(model) {
        return new IncidentTypeListItemDto({
            id: model.id || model._id,
            code: model.code,
            name: model.name,
            description: model.description,
            severity: model.severity,
            parentId: model.parentId,
            parentName: model.parent?.name || null,
            createdAt: model.createdAt,
        });
    }

    /**
     * Convert array of models to list of DTOs
     * @param {Array<Object>} models - Array of mongoose models
     * @returns {Array<IncidentTypeListItemDto>} Array of list item DTOs
     */
    static toListDto(models) {
        return models.map(model => this.toListItemDto(model));
    }

    /**
     * Build a hierarchical tree from a flat list
     * Each node is a plain object with a `children` property
     * @param {Array<Object>} models
     * @returns {Array<Object>}
     */
    static toTreeDto(models) {
        const items = models.map(model => ({
            ...this.toResponseDto(model),
            children: [],
        }));

        const map = new Map(items.map(item => [item.id, item]));
        const roots = [];

        for (const item of items) {
            if (item.parentId && map.has(item.parentId)) {
                map.get(item.parentId).children.push(item);
            } else {
                roots.push(item);
            }
        }

        return roots;
    }
}
