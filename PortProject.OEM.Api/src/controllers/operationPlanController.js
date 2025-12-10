import { Router } from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { OperationPlanService } from '../services/operationPlanService.js';

export const createOperationPlanRouter = () => {
    const router = Router();
    const service = new OperationPlanService();

    /**
     * 1. LIST PLAN HISTORY (GET /api/plans)
     */
    router.get('/', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('[OEM] Fetching plan history...');
            // Capture all possible filters from query
            const { date, vesselVisitId } = req.query;

            const filters = {};
            // Garantimos que filtramos apenas se o valor não for vazio/undefined
            if (date) filters.date = date;
            if (vesselVisitId) filters.vesselVisitId = vesselVisitId;

            const plans = await service.getAllPlans(filters);

            res.json({
                success: true,
                count: plans.length,
                data: plans
            });
        } catch (error) {
            console.error('[OEM GET ERROR]:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    
    /**
     * 2. CRIAR PLANO (POST /api/plans)
     */
    router.post('/', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('[OEM] Saving plan request received');

            const userId = req.user?.email || req.user?.uid || 'unknown';

            // Preparar dados 
            const planData = {
                date: req.body.date,
                algorithm: req.body.algorithm,
                geneticParams: req.body.geneticParams,
                scheduledTasks: req.body.scheduledTasks,
                totalDelay: req.body.totalDelay,
                executionTimeMs: req.body.executionTimeMs
            };

            const result = await service.createPlan(planData, userId);

            console.log('[OEM] Plan saved with ID:', result.planId);

            res.status(201).json({
                success: true,
                message: 'Operation Plan saved successfully',
                data: result
            });

        } catch (error) {
            console.error('[OEM SAVE ERROR]:', error);

            // Erro de validação do Mongoose
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation Failed',
                    details: error.errors
                });
            }

            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * 3. ELIMINAR PLANO (DELETE /api/plans/:id)
     */
    router.delete('/:id', verifyFirebaseToken, async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`[OEM] Deleting plan: ${id}`);

            await service.deletePlan(id);

            res.status(200).json({
                success: true,
                message: `Plan ${id} deleted successfully`
            });
        } catch (error) {
            console.error('[OEM DELETE ERROR]:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.delete('/debug/reset', async (req, res) => {
        try {
            await service.repository.model.deleteMany({});
            res.json({ message: "Base de dados limpa com sucesso!" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    /**
     * US 4.1.4 - Update a Task
     * PATCH /api/plans/:planId/tasks/:taskId
     */
    router.patch('/:planId/tasks/:taskId', verifyFirebaseToken, async (req, res) => {
        try {
            const { planId, taskId } = req.params;
            const userId = req.user?.email || 'unknown';

            // req.body should contain: { resourceId, startTime, endTime, reason }
            const result = await service.updateTask(planId, taskId, req.body, userId);

            res.json({
                success: true,
                message: "Task updated successfully",
                warnings: result.warnings, // Frontend will display these
                data: result.plan
            });
        } catch (error) {
            console.error('[OEM UPDATE ERROR]:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};