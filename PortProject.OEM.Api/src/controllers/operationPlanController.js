import { Router } from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { OperationPlanService } from '../services/operationPlanService.js';
import { generateSmartOperations } from '../application/utils/SmartOperationGenerator.js';

/**
 * Helper function to sort plans based on the sortBy parameter
 * Supported values: 'time', 'vessel', 'delay'
 */
const sortPlans = (plans, sortBy) => {
    const sorted = [...plans];
    
    switch (sortBy) {
        case 'time':
            // Sort by earliest start time of tasks within each plan
            return sorted.sort((a, b) => {
                const aStartTime = a.scheduledTasks.length > 0 
                    ? Math.min(...a.scheduledTasks.map(t => new Date(t.startTime).getTime()))
                    : Infinity;
                const bStartTime = b.scheduledTasks.length > 0 
                    ? Math.min(...b.scheduledTasks.map(t => new Date(t.startTime).getTime()))
                    : Infinity;
                return aStartTime - bStartTime;
            });
            
        case 'vessel':
            // Sort by vessel name (first task's vessel name)
            return sorted.sort((a, b) => {
                const aVessel = a.scheduledTasks.length > 0 
                    ? (a.scheduledTasks[0].vesselName || '')
                    : '';
                const bVessel = b.scheduledTasks.length > 0 
                    ? (b.scheduledTasks[0].vesselName || '')
                    : '';
                return aVessel.localeCompare(bVessel);
            });
            
        case 'delay':
            // Sort by total delay (descending - highest delay first)
            return sorted.sort((a, b) => {
                const aDelay = a.metrics?.totalDelay || 0;
                const bDelay = b.metrics?.totalDelay || 0;
                return bDelay - aDelay;
            });
            
        default:
            // If sortBy is not recognized, return unsorted
            console.warn(`[OEM] Unknown sortBy parameter: ${sortBy}`);
            return sorted;
    }
};

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
            const { date, vesselVisitId, sortBy } = req.query;

            const filters = {};
            // Garantimos que filtramos apenas se o valor não for vazio/undefined
            if (date) filters.date = date;
            if (vesselVisitId) filters.vesselVisitId = vesselVisitId;

            const plans = await service.getAllPlans(filters);

            // Enrich tasks with Smart Operations
            let enrichedPlans = plans.map(plan => ({
                ...plan,
                scheduledTasks: plan.scheduledTasks.map(task => ({
                    ...task,
                    subOperations: generateSmartOperations(task)
                }))
            }));

            // Apply sorting if requested
            if (sortBy) {
                enrichedPlans = sortPlans(enrichedPlans, sortBy);
            }

            res.json({
                success: true,
                count: enrichedPlans.length,
                data: enrichedPlans
            });
        } catch (error) {
            console.error('[OEM GET ERROR]:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    
    /**
     * 1.5. GET MISSING PLANS (GET /api/plans/missing)
     * Returns VVNs that don't have an operation plan for a given date
     */
    router.get('/missing', verifyFirebaseToken, async (req, res) => {
        try {
            const { date } = req.query;
            
            if (!date) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date parameter is required' 
                });
            }
            
            console.log(`[OEM] Fetching missing plans for date: ${date}`);
            
            // Extract the Firebase token from the request headers
            const authToken = req.headers.authorization?.replace('Bearer ', '');
            
            const result = await service.getMissingPlans(date, authToken);
            
            res.json({
                success: true,
                date: date,
                missingCount: result.missingVVNs.length,
                hasExistingPlans: result.existingPlans.length > 0,
                data: {
                    missingVVNs: result.missingVVNs,
                    existingPlans: result.existingPlans
                }
            });
        } catch (error) {
            console.error('[OEM GET MISSING PLANS ERROR]:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    
    /**
     * GET /api/plans/resources-staff
     * Returns list of available resources and staff for selection in UI
     */
    router.get('/resources-staff', verifyFirebaseToken, async (req, res) => {
        try {
            const authToken = req.headers.authorization?.replace('Bearer ', '');
            const data = await service.getAvailableResourcesAndStaff(authToken);
            res.json({ success: true, data });
        } catch (error) {
            console.error('[OEM RESOURCES ERROR]:', error);
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
            res.json({ message: "Database successfully cleaned!" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    /**
     * GET /api/plans/resources-staff
     * Returns list of available resources and staff for selection in UI
     */
    router.get('/resources-staff', verifyFirebaseToken, async (req, res) => {
        try {
            const authToken = req.headers.authorization?.replace('Bearer ', '');
            const data = await service.getAvailableResourcesAndStaff(authToken);
            res.json({ success: true, data });
        } catch (error) {
            console.error('[OEM RESOURCES ERROR]:', error);
            res.status(500).json({ success: false, message: error.message });
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