import { IOperationPlanRepository } from '../../domain/repositories/IOperationPlanRepository.js';
import { OperationPlanModel } from '../models/OperationPlanModel.js';

export class OperationPlanRepository extends IOperationPlanRepository {
    constructor() {
        super();
        this.model = OperationPlanModel;
    }

    async create(data) {
        const document = new this.model(data);
        return await document.save();
    }

    async findById(planId) {
        return await this.model.findOne({ planId }).lean();
    }

    async findAll(filters = {}) {
        const query = {};
        if (filters.date) {
            query.date = filters.date;
        }
        return await this.model.find(query).sort({ createdAt: -1 }).lean();
    }

    /**
     * Generate next Plan ID pattern: PLAN-YYYYMMDD-XXXX
     */
    async generateNextId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;

        // Find the latest Plan for today
        const todayPattern = new RegExp(`^PLAN-${datePrefix}-`);
        const latestPlan = await this.model.findOne({
            planId: todayPattern
        }).sort({ planId: -1 }).lean();

        let sequence = 1;
        if (latestPlan) {
            const match = latestPlan.planId.match(/-(\d{4})$/);
            if (match) {
                sequence = parseInt(match[1], 10) + 1;
            }
        }

        const sequenceStr = String(sequence).padStart(4, '0');
        return `PLAN-${datePrefix}-${sequenceStr}`;
    }
}