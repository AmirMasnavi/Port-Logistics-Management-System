import { IIncidentTypeRepository } from '../../domain/repositories/IIncidentTypeRepository.js';
import { IncidentTypeModel } from '../models/IncidentTypeModel.js';

/**
 * MongoDB implementation of Incident Type Repository
 * Camada de Infraestrutura - Implementa o contrato definido no Domínio
 */
export class IncidentTypeRepository extends IIncidentTypeRepository {
    constructor() {
        super();
        this.model = IncidentTypeModel;
    }

    /**
     * Cria um novo Tipo de Incidente
     * @param {Object} data - Dados do tipo (code, name, severity, parentId, etc.)
     */
    async create(data) {
        const document = new this.model(data);
        return await document.save();
    }

    /**
     * Procura por ID interno do MongoDB
     */
    async findById(id) {
        return await this.model.findById(id).lean();
    }

    /**
     * Procura por código único de negócio (ex: T-INC001)
     */
    async findByCode(code) {
        return await this.model.findOne({ code }).lean();
    }

    /**
     * Lista tipos com filtros (Hierarquia, Severidade e Pesquisa)
     * US Requirement: "grouping and filtering by parent type"
     * @param {Object} filters - { parentId, severity, q }
     */
    async findAll(filters = {}) {
        const query = {};

        // Suporte à Estrutura Hierárquica
        if (filters.parentId !== undefined) {
            query.parentId = (filters.parentId === 'null' || filters.parentId === null)
                ? null
                : filters.parentId;
        }

        // Filtro por Severidade (Minor, Major, Critical)
        if (filters.severity) {
            query.severity = filters.severity;
        }

        // Pesquisa textual intuitiva (Nome ou Código)
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } }
            ];
        }

        console.log(`[IncidentType Repository] MongoDB query:`, JSON.stringify(query, null, 2));

        // Retorna ordenado por nome para a SPA
        return await this.model.find(query).sort({ name: 1 }).lean();
    }

    /**
     * Atualiza os dados do tipo
     */
    async update(id, data) {
        const updated = await this.model.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            throw new Error(`Incident Type with ID '${id}' not found`);
        }

        return updated;
    }

    /**
     * Elimina um tipo (Nota: O service deve validar se tem filhos antes de chamar isto)
     */
    async delete(id) {
        const result = await this.model.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    /**
     * Verifica existência por ID
     */
    async exists(id) {
        const count = await this.model.countDocuments({ _id: id });
        return count > 0;
    }

    /**
     * Verifica se o código já está em uso
     */
    async existsByCode(code) {
        const count = await this.model.countDocuments({ code });
        return count > 0;
    }

    /**
     * Conta total de tipos no catálogo
     */
    async countAll() {
        return await this.model.countDocuments();
    }

    /**
     * Verifica se um tipo tem "filhos" (subtipos)
     * Essencial para a lógica de "Cannot delete if has children"
     */
    async hasChildren(id) {
        const count = await this.model.countDocuments({ parentId: id });
        return count > 0;
    }
}