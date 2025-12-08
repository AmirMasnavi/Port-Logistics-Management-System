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

    // 2. Listar Tudo (Esta é a função que estava a falhar no erro 500)
    async findAll(filters = {}) {
        const query = {};
        if (filters.date) {
            query.date = filters.date;
        }
        // .lean() converte documentos Mongoose para objetos JS simples (mais rápido e evita erros de conversão)
        return await this.model.find(query).sort({ createdAt: -1 }).lean();
    }

    // 3. Eliminar
    async delete(planId) {
        const result = await this.model.deleteOne({ planId: planId });
        return result.deletedCount > 0;
    }

    // 4. Gerar ID
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