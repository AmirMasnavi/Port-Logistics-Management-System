import { Router } from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { OperationPlanService } from '../services/operationPlanService.js';
import { CreateOperationPlanDto } from '../application/dtos/OperationPlanDto.js';

// 1. Receber masterDataGateway como argumento
export const createOperationPlanRouter = (masterDataGateway) => {
    const router = Router();

    // 2. Injetar o gateway no Serviço
    const service = new OperationPlanService(masterDataGateway);

    /**
     * @swagger
     * /api/plans:
     *   post:
     *     summary: Create and store a new Operation Plan
     *     tags: [Operation Plans]
     *     security:
     *       - BearerAuth: []
     */
    router.post('/', verifyFirebaseToken, async (req, res) => {
        try {
            const userId = req.user?.email || req.user?.uid || 'unknown';

            const createDto = new CreateOperationPlanDto(req.body);

            console.log(`[OEM PLAN] Creating plan for date: ${createDto.date}, Algorithm: ${createDto.algorithm}`);

            const result = await service.createPlan(createDto, userId);

            res.status(201).json({
                success: true,
                message: 'Operation Plan created successfully',
                data: result
            });

        } catch (error) {
            console.error('[OEM PLAN] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message
            });
        }
    });

    // ... (O resto do endpoint GET mantém-se igual)
    router.get('/', verifyFirebaseToken, async (req, res) => {
        try {
            const { date } = req.query;
            const filters = {};
            if (date) filters.date = date;

            const plans = await service.getAllPlans(filters);

            res.json({
                success: true,
                count: plans.length,
                data: plans
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message
            });
        }
    });

    return router;
};