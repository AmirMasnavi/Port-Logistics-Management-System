import { OperationPlanRepository } from '../infrastructure/repositories/OperationPlanRepository.js';

export class OperationPlanService {
    constructor() {
        this.repository = new OperationPlanRepository();
    }

    /**
     * Cria um novo plano
     */
    async createPlan(data, userId) {
        // 1. Gerar o ID único (ex: PLAN-20241208-0001)
        const planId = await this.repository.generateNextId();

        // 2. Preparar objeto para salvar
        const planData = {
            planId: planId,
            date: data.date,
            algorithm: data.algorithm,
            geneticParams: data.geneticParams,
            createdBy: userId,
            status: 'Confirmed',
            // Garante valores default para evitar erros
            metrics: {
                totalDelay: data.totalDelay || 0,
                executionTimeMs: data.executionTimeMs || 0
            },
            scheduledTasks: data.scheduledTasks || []
        };

        // 3. Guardar na base de dados
        return await this.repository.create(planData);
    }

    /**
     * Lista todos os planos (Correção do erro 500)
     */
    async getAllPlans(filters = {}) {
        const plans = await this.repository.findAll(filters);

        // Mapeamento manual simples para evitar erros com DTOs externos
        return plans.map(p => ({
            planId: p.planId,
            date: p.date,
            algorithm: p.algorithm,
            status: p.status,
            metrics: p.metrics || { totalDelay: 0, executionTimeMs: 0 },
            scheduledTasksCount: p.scheduledTasks ? p.scheduledTasks.length : 0,
            createdBy: p.createdBy,
            createdAt: p.createdAt
        }));
    }

    /**
     * Elimina um plano
     */
    async deletePlan(planId) {
        const deleted = await this.repository.delete(planId);
        if (!deleted) {
            // Apenas loga, não rebenta erro se já não existir
            console.warn(`Plan ${planId} not found to delete or already deleted`);
        }
        return true;
    }
}