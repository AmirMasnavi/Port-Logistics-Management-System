/**
 * US 4.1.6 - Resource Metrics Controller
 * Exposes endpoints to query resource allocation metrics from saved Operation Plans
 */
import { Router } from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { ResourceMetricsService } from '../services/resourceMetricsService.js';

export const createResourceMetricsRouter = () => {
    const router = Router();
    const service = new ResourceMetricsService();

    /**
     * @swagger
     * /api/oem/metrics/resources/{resourceType}/{resourceId}:
     *   get:
     *     summary: Get resource allocation summary for a period
     *     description: Returns total allocated time and number of operations for a resource within a time period. Only considers saved Operation Plans.
     *     tags: [Resource Metrics]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: resourceType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [crane, dock, staff]
     *         description: Type of resource
     *       - in: path
     *         name: resourceId
     *         required: true
     *         schema:
     *           type: string
     *         description: Resource identifier (e.g., CR-01, DOCK-A, MEC001)
     *       - in: query
     *         name: from
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Start of period (ISO 8601 format)
     *       - in: query
     *         name: to
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *         description: End of period (ISO 8601 format)
     *     responses:
     *       200:
     *         description: Resource allocation summary
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     resourceType:
     *                       type: string
     *                     resourceId:
     *                       type: string
     *                     period:
     *                       type: object
     *                       properties:
     *                         from:
     *                           type: string
     *                         to:
     *                           type: string
     *                     totalAllocatedMinutes:
     *                       type: number
     *                     totalAllocatedHours:
     *                       type: number
     *                     numberOfOperations:
     *                       type: number
     *       400:
     *         description: Invalid request parameters
     *       401:
     *         description: Unauthorized
     */
    router.get('/:resourceType/:resourceId', verifyFirebaseToken, async (req, res) => {
        try {
            const { resourceType, resourceId } = req.params;
            const { from, to } = req.query;

            // Validate resource type
            const validTypes = ['crane', 'dock', 'staff'];
            if (!validTypes.includes(resourceType.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid resource type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            // Validate date parameters
            if (!from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required query parameters: from, to'
                });
            }

            const fromDate = new Date(from);
            const toDate = new Date(to);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Use ISO 8601 format (e.g., 2025-12-01T00:00:00Z)'
                });
            }

            console.log(`[OEM Metrics] Querying ${resourceType}/${resourceId} from ${from} to ${to}`);

            const summary = await service.getResourceAllocationSummary(
                resourceType,
                resourceId,
                fromDate,
                toDate
            );

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('[OEM Metrics ERROR]:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    /**
     * @swagger
     * /api/oem/metrics/resources/{resourceType}/{resourceId}/breakdown:
     *   get:
     *     summary: Get daily breakdown of resource allocation
     *     description: Returns day-by-day allocation breakdown for a resource within a time period
     *     tags: [Resource Metrics]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: resourceType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [crane, dock, staff]
     *       - in: path
     *         name: resourceId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: from
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: to
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *     responses:
     *       200:
     *         description: Daily breakdown of allocations
     */
    router.get('/:resourceType/:resourceId/breakdown', verifyFirebaseToken, async (req, res) => {
        try {
            const { resourceType, resourceId } = req.params;
            const { from, to } = req.query;

            // Validate resource type
            const validTypes = ['crane', 'dock', 'staff'];
            if (!validTypes.includes(resourceType.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid resource type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            // Validate date parameters
            if (!from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required query parameters: from, to'
                });
            }

            const fromDate = new Date(from);
            const toDate = new Date(to);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Use ISO 8601 format'
                });
            }

            console.log(`[OEM Metrics] Querying breakdown for ${resourceType}/${resourceId}`);

            const breakdown = await service.getResourceAllocationBreakdown(
                resourceType,
                resourceId,
                fromDate,
                toDate
            );

            res.json({
                success: true,
                data: breakdown
            });

        } catch (error) {
            console.error('[OEM Metrics ERROR]:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    /**
     * @swagger
     * /api/oem/metrics/resources/summary:
     *   post:
     *     summary: Get resource allocation summary (POST version for complex queries)
     *     tags: [Resource Metrics]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - resourceType
     *               - resourceId
     *               - from
     *               - to
     *             properties:
     *               resourceType:
     *                 type: string
     *                 enum: [crane, dock, staff]
     *               resourceId:
     *                 type: string
     *               from:
     *                 type: string
     *                 format: date-time
     *               to:
     *                 type: string
     *                 format: date-time
     *     responses:
     *       200:
     *         description: Resource allocation summary
     */
    router.post('/summary', verifyFirebaseToken, async (req, res) => {
        try {
            const { resourceType, resourceId, from, to } = req.body;

            // Validate required fields
            if (!resourceType || !resourceId || !from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: resourceType, resourceId, from, to'
                });
            }

            // Validate resource type
            const validTypes = ['crane', 'dock', 'staff'];
            if (!validTypes.includes(resourceType.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid resource type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            const fromDate = new Date(from);
            const toDate = new Date(to);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Use ISO 8601 format'
                });
            }

            console.log(`[OEM Metrics] POST summary for ${resourceType}/${resourceId}`);

            const summary = await service.getResourceAllocationSummary(
                resourceType,
                resourceId,
                fromDate,
                toDate
            );

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('[OEM Metrics ERROR]:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
};

