// javascript
import { IIncidentTypeRepository } from '../../domain/repositories/IIncidentTypeRepository.js';
import { IncidentTypeModel } from '../models/IncidentTypeModel.js';

/**
 * MongoDB implementation of IncidentType Repository
 * Infrastructure layer - implements the repository interface
 */
export class IncidentTypeRepository extends IIncidentTypeRepository {
    constructor() {
        super();
        this.model = IncidentTypeModel;
    }

    _isObjectId(value) {
        return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
    }

    _buildIdQuery(id) {
        const ors = [];
        if (!id) return {};
        ors.push({ id }); // if a GUID/string id field exists
        // try code match too (some callers may pass code)
        ors.push({ code: id });
        // safe _id match only if looks like ObjectId
        if (this._isObjectId(id)) ors.push({ _id: id });
        return { $or: ors };
    }

    /**
     * Create a new IncidentType
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const document = new this.model(data);
        return await document.save();
    }

    /**
     * Find by id-like value (matches id field, code or _id when appropriate)
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const query = this._buildIdQuery(id);
        if (Object.keys(query).length === 0) return null;
        return await this.model.findOne(query).lean();
    }

    /**
     * Find by business code
     * @param {string} code
     * @returns {Promise<Object|null>}
     */
    async findByCode(code) {
        return await this.model.findOne({ code }).lean();
    }

    /**
     * Find all incident types with optional filters:
     * filters: { parentId, severity, q }
     * @param {Object} filters
     * @returns {Promise<Array<Object>>}
     */
    async findAll(filters = {}) {
        const query = {};

        if (filters.parentId) {
            query.parentId = filters.parentId;
        }

        if (filters.severity) {
            query.severity = filters.severity;
        }

        if (filters.q) {
            const qRegex = { $regex: filters.q, $options: 'i' };
            query.$or = [{ code: qRegex }, { name: qRegex }, { description: qRegex }];
        }

        // Default sort by createdAt desc
        return await this.model.find(query).sort({ createdAt: -1 }).lean();
    }

    /**
     * Update by id-like value
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        const query = this._buildIdQuery(id);
        if (Object.keys(query).length === 0) {
            throw new Error(`IncidentType '${id}' not found`);
        }

        const updated = await this.model.findOneAndUpdate(
            query,
            { ...data, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            throw new Error(`IncidentType '${id}' not found`);
        }

        return updated;
    }

    /**
     * Delete by id-like value
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const query = this._buildIdQuery(id);
        if (Object.keys(query).length === 0) return false;
        const result = await this.model.deleteOne(query);
        return result.deletedCount > 0;
    }

    /**
     * Exists check by id-like value
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        const query = this._buildIdQuery(id);
        if (Object.keys(query).length === 0) return false;
        const count = await this.model.countDocuments(query);
        return count > 0;
    }

    /**
     * Exists check by business code
     * @param {string} code
     * @returns {Promise<boolean>}
     */
    async existsByCode(code) {
        const count = await this.model.countDocuments({ code });
        return count > 0;
    }

    /**
     * Count all incident types
     * @returns {Promise<number>}
     */
    async countAll() {
        return await this.model.countDocuments();
    }
}