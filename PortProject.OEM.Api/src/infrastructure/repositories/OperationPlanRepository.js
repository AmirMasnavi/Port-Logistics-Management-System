import { OperationPlanModel } from '../models/OperationPlanModel.js';

export class OperationPlanRepository {
    constructor() {
        this.model = OperationPlanModel;
    }

    // 1. Criar
    async create(data) {
        const document = new this.model(data);
        return await document.save();
    }

    // 2. Find by ID (planId or _id)
    async findById(planId) {
        // Try to find by planId (business ID) first
        let plan = await this.model.findOne({ planId: planId });
        
        // If not found and the ID looks like a MongoDB ObjectId, try _id
        if (!plan && planId.match(/^[0-9a-fA-F]{24}$/)) {
            plan = await this.model.findById(planId);
        }
        
        return plan;
    }

    // 3. Listar Tudo (Expandido para suportar filtragem avançada por data e navio)
    async findAll(filters = {}) {
        const query = {};

        // Filter 1: Plan Date
        if (filters.date) {
            // Busca a string exata (YYYY-MM-DD), o que deve funcionar se o input for exato.
            query.date = filters.date;
        }

        // Filter 2: Vessel Identifier
        if (filters.vesselVisitId) {
            query['scheduledTasks.vesselVisitId'] = filters.vesselVisitId;
        }

        // Ordena por data de criação decrescente
        return await this.model.find(query).sort({ createdAt: -1 }).lean();
    }

    // 4. Eliminar
    async delete(planId) {
        const result = await this.model.deleteOne({ planId: planId });
        return result.deletedCount > 0;
    }

    // 5. Gerar ID
    async generateNextId() {
        const now = new Date();
        const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, ''); // 20241208

        const latest = await this.model.findOne({
            planId: new RegExp(`^PLAN-${datePrefix}-`)
        }).sort({ planId: -1 });

        let sequence = 1;
        if (latest) {
            const parts = latest.planId.split('-');
            // Se o ID for PLAN-20241208-0001, pega o '0001'
            if (parts.length >= 3) {
                sequence = parseInt(parts[2]) + 1;
            }
        }

        return `PLAN-${datePrefix}-${String(sequence).padStart(4, '0')}`;
    }
}