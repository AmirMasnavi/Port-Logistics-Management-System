// javascript
import { IncidentTypeResponseDto, IncidentTypeListItemDto } from '../dtos/IncidentTypeDto.js';

/**
 * Mapper para IncidentType — converte modelos de persistência em DTOs da camada de aplicação.
 */
export class IncidentTypeMapper {
    /**
     * Converte um modelo (objeto Mongoose / plain) para IncidentTypeResponseDto
     * @param {Object} model
     * @returns {IncidentTypeResponseDto}
     */
    static toResponseDto(model) {
        return new IncidentTypeResponseDto({
            id: model.id || model._id || model.Id || null,
            code: model.code,
            name: model.name,
            description: model.description ?? null,
            severity: model.severity,
            parentId: model.parentId ?? (model.parent ? (model.parent.id || model.parent._id) : null),
            parentCode: model.parent?.code ?? null,
            parentName: model.parent?.name ?? null,
            createdAt: model.createdAt ?? model.created_at ?? null,
            updatedAt: model.updatedAt ?? model.updated_at ?? null,
        });
    }

    /**
     * Converte um modelo para a versão simplificada usada em listas
     * @param {Object} model
     * @returns {IncidentTypeListItemDto}
     */
    static toListItemDto(model) {
        return new IncidentTypeListItemDto({
            id: model.id || model._id || model.Id || null,
            code: model.code,
            name: model.name,
            severity: model.severity,
            parentId: model.parentId ?? (model.parent ? (model.parent.id || model.parent._id) : null),
            parentName: model.parent?.name ?? null,
            createdAt: model.createdAt ?? model.created_at ?? null,
        });
    }

    /**
     * Converte um array de modelos para array de IncidentTypeListItemDto
     * @param {Array<Object>} models
     * @returns {Array<IncidentTypeListItemDto>}
     */
    static toListDto(models) {
        return (models || []).map(model => this.toListItemDto(model));
    }

    /**
     * Constrói uma árvore hierárquica a partir de uma lista plana de modelos.
     * Retorna array de nós raiz; cada nó é um IncidentTypeResponseDto com propriedade `children`.
     * @param {Array<Object>} models
     * @returns {Array<Object>}
     */
    static toTreeDto(models) {
        const items = (models || []).map(m => {
            const dto = this.toResponseDto(m);
            // transformar em objeto plain e adicionar children
            return { ...dto, children: [] };
        });

        const map = new Map(items.map(it => [it.id, it]));
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