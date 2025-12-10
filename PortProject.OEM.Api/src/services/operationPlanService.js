import { OperationPlanRepository } from '../infrastructure/repositories/OperationPlanRepository.js';
import { OperationPlanMapper } from '../application/mappers/OperationPlanMapper.js';

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
     * Lists all plans (Now accepts filters and includes scheduledTasks)
     */
    async getAllPlans(filters = {}) {
        const plans = await this.repository.findAll(filters);

        // Manual mapping to include scheduled tasks details for the frontend
        return plans.map(p => ({
            planId: p.planId,
            date: p.date,
            algorithm: p.algorithm,
            status: p.status,
            geneticParams: p.geneticParams, // Added for completeness, although not used in FE table summary
            metrics: p.metrics || { totalDelay: 0, executionTimeMs: 0 },
            scheduledTasksCount: p.scheduledTasks ? p.scheduledTasks.length : 0,
            createdBy: p.createdBy,
            createdAt: p.createdAt,
            // Including full tasks array for the detailed view in the FE table
            scheduledTasks: p.scheduledTasks || []
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

    /**
     * US 4.1.4 - Update a specific task within a plan
     */
    async updateTask(planId, taskId, updateData, userEmail) {
        // 1. Fetch the plan
        const plan = await this.repository.findById(planId);
        if (!plan) throw new Error("Plan not found");

        // 2. Find the specific task (subdocument)
        // Mongoose arrays work like normal JS arrays but have an .id() method if using proper subdocs,
        // or we can just find it by _id.
        const taskIndex = plan.scheduledTasks.findIndex(t => t._id.toString() === taskId);
        if (taskIndex === -1) throw new Error("Task not found in this plan");

        const task = plan.scheduledTasks[taskIndex];
        const oldResource = task.resourceId;
        const oldStart = new Date(task.startTime);

        // 3. Prepare new values (use new if provided, else keep old)
        const newResource = updateData.resourceId || task.resourceId;
        const newStart = updateData.startTime ? new Date(updateData.startTime) : new Date(task.startTime);
        const newEnd = updateData.endTime ? new Date(updateData.endTime) : new Date(task.endTime);

        // 4. VALIDATION: Check for overlaps (The "Alert" requirement)
        const warnings = [];

        // Check every OTHER task in the list
        plan.scheduledTasks.forEach(otherTask => {
            if (otherTask._id.toString() === taskId) return; // Skip self

            // If using the same resource...
            if (otherTask.resourceId === newResource) {
                const otherStart = new Date(otherTask.startTime);
                const otherEnd = new Date(otherTask.endTime);

                // Check time overlap: (StartA < EndB) and (EndA > StartB)
                if (newStart < otherEnd && newEnd > otherStart) {
                    warnings.push(`Conflict: Resource ${newResource} is already busy with VVN ${otherTask.vesselVisitId} from ${otherStart.toISOString()} to ${otherEnd.toISOString()}`);
                }
            }
        });

        // 5. Apply Updates
        task.resourceId = newResource;
        task.startTime = newStart;
        task.endTime = newEnd;
        if (updateData.staffId) task.staffId = updateData.staffId;

        // 6. Log the change (The "Audit" requirement)
        plan.changeLogs.push({
            author: userEmail,
            reason: updateData.reason || "Manual update",
            details: `Updated Task for VVN ${task.vesselVisitId}. Resource: ${oldResource}->${newResource}. Start: ${oldStart.toISOString()}->${newStart.toISOString()}`
        });

        // 7. Save (Mongoose tracks the changes in the subdoc)
        // The plan object is already a Mongoose document, so we can save it directly
        await plan.save();

        return {
            success: true,
            warnings: warnings,
            plan: OperationPlanMapper.toResponseDto(plan)
        };
    }
}