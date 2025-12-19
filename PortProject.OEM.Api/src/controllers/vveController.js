import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { verifyFirebaseToken } from '../config/firebase.js';
import { VesselVisitExecutionService } from '../services/vesselVisitExecutionService.js';
import { CreateVveDto, UpdateVveDto } from '../application/dtos/VveDto.js';
import { UpdateOperationStatusDto } from '../application/dtos/ExecutedOperationDto.js';

/**
 * VVE Controller - Vessel Visit Execution Management
 * Presentation Layer - Handles HTTP requests/responses
 */
export const createVveRouter = (masterDataGateway) => {
  const router = Router();
  const vveService = new VesselVisitExecutionService(masterDataGateway);

  /**
   * @swagger
   * /api/vve:
   *   post:
   *     summary: Create a new Vessel Visit Execution (VVE)
   *     description: Create a VVE record when a vessel arrives at the port
   *     tags: [Vessel Visit Execution]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateVveRequest'
   *     responses:
   *       201:
   *         description: VVE created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VveResponse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized - Missing or invalid Firebase token
   *       404:
   *         description: VVN not found in Master Data system
   *       409:
   *         description: VVE already exists for this VVN
   */
  router.post(
    '/',
    verifyFirebaseToken,
    [
      body('vvnId').notEmpty().withMessage('VVN ID is required'),
      body('vesselIdentifier').notEmpty().withMessage('Vessel identifier is required'),
      body('actualArrivalTime').isISO8601().withMessage('Valid arrival time is required'),
      body('notes').optional().isString(),
    ],
    async (req, res) => {
      try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const { vvnId, vesselIdentifier, actualArrivalTime, notes } = req.body;
        const creatorUserId = req.user?.uid || req.user?.email || 'unknown';

        console.log(`[VVE CREATE] Creating VVE for VVN: ${vvnId}, User: ${creatorUserId}`);

        // Create DTO
        const createDto = new CreateVveDto({ vvnId, vesselIdentifier, actualArrivalTime, notes });

        // Execute business logic
        const vveResponse = await vveService.createVve(createDto, creatorUserId);

        console.log(`[VVE CREATE] ✅ Created VVE: ${vveResponse.vveId}`);

        res.status(201).json({
          success: true,
          message: 'VVE created successfully',
          data: vveResponse,
        });
      } catch (error) {
        console.error('[VVE CREATE] Error:', error);
        
        if (error.message.includes('not found') || error.message.includes('non-existent')) {
          return res.status(404).json({
            success: false,
            error: 'VVN not found',
            message: error.message,
          });
        }
        
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: error.message,
          });
        }

        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  );

  /**
   * Get all VVEs with optional filters and metrics
   */
  router.get('/', verifyFirebaseToken, async (req, res) => {
    try {
      const { status, vvnId, vesselIdentifier, fromDate, toDate, berthDockId, includeMetrics } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (vvnId) filters.vvnId = vvnId;
      if (vesselIdentifier) filters.vesselIdentifier = vesselIdentifier;
      if (berthDockId) filters.berthDockId = berthDockId; 
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (includeMetrics && (includeMetrics === 'true' || includeMetrics === '1')) filters.includeMetrics = true;

      console.log(`[VVE GET ALL] Query params:`, { status, vvnId, vesselIdentifier, fromDate, toDate, berthDockId, includeMetrics });
      console.log(`[VVE GET ALL] Fetching VVEs with filters:`, filters);

      // If includeMetrics is true, fetch VVEs with execution metrics
      let vves;
      if (filters.includeMetrics) {
        // Extract Firebase token from headers
        const authToken = req.headers.authorization?.replace('Bearer ', '');

        // Set auth token in gateway for VVN lookups
        if (authToken && vveService.masterDataGateway) {
           vveService.masterDataGateway.setAuthToken(authToken);
        }
        vves = await vveService.getVvesWithMetrics(filters);
      } else {
         vves = await vveService.getAllVves(filters);
      }
      console.log(`[VVE GET ALL] Returning ${vves.length} VVEs`);

      res.json({
        success: true,
        count: vves.length,
        data: vves,
      });
    } catch (error) {
      console.error('[VVE GET ALL] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  /**
   * Get VVE by ID
   */
  router.get('/:vveId', verifyFirebaseToken, async (req, res) => {
    try {
      const { vveId } = req.params;

      console.log(`[VVE GET] Fetching VVE: ${vveId}`);

      const vve = await vveService.getVveById(vveId);

      if (!vve) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: `VVE '${vveId}' not found`,
        });
      }

      res.json({
        success: true,
        data: vve,
      });
    } catch (error) {
      console.error('[VVE GET] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  /**
   * Update VVE
   */
  router.put(
    '/:vveId',
    verifyFirebaseToken,
    [
      body('status').optional().isIn(['In Progress', 'Completed', 'Cancelled']),
      body('actualDepartureTime').optional().isISO8601(),
      body('actualBerthTime').optional().isISO8601(), 
      body('berthDockId').optional().isString(),
      body('notes').optional().isString(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const { vveId } = req.params;
          const { status, actualDepartureTime, actualBerthTime, berthDockId, notes } = req.body;

          console.log(`[VVE UPDATE] Updating VVE: ${vveId} by user ${req.user?.uid || req.user?.email}`);

        // Create DTO
        const updateDto = new UpdateVveDto({ status, actualDepartureTime, notes, actualBerthTime, berthDockId });

          // Passa userId para audit logging
          const performedBy = req.user?.uid || req.user?.email || 'unknown';
          
        // Execute business logic
        const vveResponse = await vveService.updateVve(vveId, updateDto, performedBy);

        res.json({
          success: true,
          message: 'VVE updated successfully',
          data: vveResponse,
        });
      } catch (error) {
        console.error('[VVE UPDATE] Error:', error);

        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: 'Not found',
            message: error.message,
          });
        }

          if (error.code === 'INVALID_STATE') {
              return res.status(400).json({ success: false, error: 'Invalid state', message: error.message });
          }

        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  );

  /**
   * Delete VVE
   */
  router.delete('/:vveId', verifyFirebaseToken, async (req, res) => {
    try {
      const { vveId } = req.params;

      console.log(`[VVE DELETE] Deleting VVE: ${vveId}`);

      const deleted = await vveService.deleteVve(vveId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: `VVE '${vveId}' not found`,
        });
      }

      res.json({
        success: true,
        message: 'VVE deleted successfully',
      });
    } catch (error) {
      console.error('[VVE DELETE] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  /**
   * Get VVE statistics
   */
  router.get('/statistics/summary', verifyFirebaseToken, async (req, res) => {
    try {
      console.log(`[VVE STATS] Fetching statistics`);

      const stats = await vveService.getVveStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[VVE STATS] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  /**
   * Update operation status (US 4.1.9)
   * PUT /:vveId/operations/:operationId/status
   */
  router.put(
    '/:vveId/operations/:operationId/status',
    verifyFirebaseToken,
    [
      body('status').isIn(['PENDING', 'STARTED', 'COMPLETED', 'SUSPENDED']).withMessage('Invalid status'),
      body('timestamp').optional().isISO8601().withMessage('Invalid timestamp format'),
      body('resourceId').optional().isString(),
      body('notes').optional().isString(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array(),
          });
        }

        const { vveId, operationId } = req.params;
        const { status, timestamp, resourceId, notes } = req.body;
        const operatorId = req.user?.uid || req.user?.email || 'unknown';

        console.log(`[VVE OPERATION UPDATE] Updating operation ${operationId} in VVE ${vveId} to status ${status} by ${operatorId}`);

        // Create DTO
        const updateDto = new UpdateOperationStatusDto({
          operationId,
          status,
          timestamp,
          operatorId,
          resourceId,
          notes,
        });

        // Execute business logic
        const vveResponse = await vveService.updateOperationStatus(vveId, updateDto, operatorId);

        res.json({
          success: true,
          message: 'Operation status updated successfully',
          data: vveResponse,
        });
      } catch (error) {
        console.error('[VVE OPERATION UPDATE] Error:', error);

        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: 'Not found',
            message: error.message,
          });
        }

        if (error.message.includes('Validation failed')) {
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: error.message,
          });
        }

        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  );

  /**
   * Get VVE with operation plan comparison (US 4.1.9)
   * GET /:vveId/operations-detailed
   */
  router.get('/:vveId/operations-detailed', verifyFirebaseToken, async (req, res) => {
    try {
      const { vveId } = req.params;

      console.log(`[VVE OPERATIONS DETAILED] Fetching operations for VVE: ${vveId}`);

      const vveWithOperations = await vveService.getVveWithPlanComparison(vveId);

      res.json({
        success: true,
        data: vveWithOperations,
      });
    } catch (error) {
      console.error('[VVE OPERATIONS DETAILED] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  return router;
};
