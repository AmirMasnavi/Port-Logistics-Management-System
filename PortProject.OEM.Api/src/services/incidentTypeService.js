// javascript
import { CreateIncidentTypeDto, UpdateIncidentTypeDto } from '../application/dtos/IncidentTypeDto.js';
import { IncidentTypeMapper } from '../application/mappers/IncidentTypeMapper.js';
import { IncidentTypeRepository } from '../infrastructure/repositories/IncidentTypeRepository.js';

/**
 * Service para IncidentType - contém regras de negócio e usa o repositório MongoDB.
 */
export class IncidentTypeService {
    constructor(masterDataGateway) {
        this.masterDataGateway = masterDataGateway;
        this.incidentTypeRepository = new IncidentTypeRepository();
    }

    /**
     * Cria um novo IncidentType
     * @param {CreateIncidentTypeDto} dto
     * @param {string} performedBy
     * @returns {Promise<Object>} modelo criado (Mongoose document / plain)
     */
    async createIncidentType(dto, performedBy = 'system') {
        const validation = dto.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Verifica parent se fornecido
        if (dto.parentId) {
            const parentExists = await this.incidentTypeRepository.exists(dto.parentId);
            if (!parentExists) {
                throw new Error(`Parent IncidentType '${dto.parentId}' not found`);
            }
        }

        // Verifica unicidade do code
        const existsCode = await this.incidentTypeRepository.existsByCode(dto.code);
        if (existsCode) {
            throw new Error(`IncidentType with code '${dto.code}' already exists`);
        }

        const data = {
            code: dto.code,
            name: dto.name,
            description: dto.description || null,
            severity: dto.severity,
            parentId: dto.parentId || null,
            createdBy: performedBy,
            updatedBy: performedBy,
        };

        const saved = await this.incidentTypeRepository.create(data);
        return saved;
    }

    /**
     * Retorna todos IncidentTypes conforme filtros.
     * @param {Object} filters - { parentId, severity, q }
     * @returns {Promise<Array<Object>>}
     */
    async getAllIncidentTypes(filters = {}) {
        const items = await this.incidentTypeRepository.findAll(filters);

        for (const item of items) {
            if (item.parentId) {
                const parent = await this.incidentTypeRepository.findById(item.parentId);
                if (parent) {
                    item.parent = parent;
                }
            }
        }
        return items;
    }

    /**
     * Retorna um IncidentType por id-like value.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getIncidentTypeById(id) {
        const item = await this.incidentTypeRepository.findById(id);
        if (!item) return null;

        // Tenta popular parent metadata para facilitar o mapper
        if (item.parentId) {
            const parent = await this.incidentTypeRepository.findById(item.parentId);
            if (parent) {
                item.parent = parent;
            }
        }

        return item;
    }

    /**
     * Atualiza um IncidentType
     * @param {string} id
     * @param {UpdateIncidentTypeDto} dto
     * @param {string} performedBy
     * @returns {Promise<Object>} objeto atualizado
     */
    async updateIncidentType(id, dto, performedBy = 'system') {
        const validation = dto.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const existing = await this.incidentTypeRepository.findById(id);
        if (!existing) {
            throw new Error(`IncidentType '${id}' not found`);
        }

        // Se mudou o code, garante unicidade
        if (dto.code && dto.code !== existing.code) {
            const codeTaken = await this.incidentTypeRepository.existsByCode(dto.code);
            if (codeTaken) {
                throw new Error(`IncidentType with code '${dto.code}' already exists`);
            }
        }

        // Verifica parent
        if (dto.parentId) {
            // não permitir parent = self
            const idLike = id;
            if (dto.parentId === idLike || dto.parentId === (existing.id || existing._id || existing.Id)) {
                throw new Error('ParentId cannot be the same as the IncidentType id');
            }
            const parentExists = await this.incidentTypeRepository.exists(dto.parentId);
            if (!parentExists) {
                throw new Error(`Parent IncidentType '${dto.parentId}' not found`);
            }
        }

        const updateData = {
            code: dto.code,
            name: dto.name,
            description: dto.description || null,
            severity: dto.severity,
            parentId: dto.parentId || null,
            updatedBy: performedBy,
        };

        const updated = await this.incidentTypeRepository.update(id, updateData);
        return updated;
    }

    /**
     * Remove um IncidentType (não permite remoção se tiver filhos)
     * @param {string} id
     * @param {string} performedBy
     * @returns {Promise<boolean>}
     */
    async deleteIncidentType(id, performedBy = 'system') {
        // Verificar existência
        const existing = await this.incidentTypeRepository.findById(id);
        if (!existing) {
            throw new Error(`IncidentType '${id}' not found`);
        }

        // Impedir remoção quando houver filhos
        const children = await this.incidentTypeRepository.findAll({ parentId: id });
        if (children && children.length > 0) {
            throw new Error(`Cannot delete IncidentType '${id}' because it has child incident types`);
        }

        const result = await this.incidentTypeRepository.delete(id);
        return result;
    }

    /**
     * Contagem total
     * @returns {Promise<number>}
     */
    async countIncidentTypes() {
        return await this.incidentTypeRepository.countAll();
    }
}