import { Router } from 'express';
import { body, validationResult, query, param } from 'express-validator';
import { verifyFirebaseToken } from '../config/firebase.js';
import { IncidentService } from '../services/incidentService.js';
import { CreateIncidentDto, UpdateIncidentDto } from '../application/dtos/IncidentDto.js';
import { IncidentMapper } from '../application/mappers/IncidentMapper.js';

export const createIncidentRouter = (masterDataGateway) => {
    const router = Router();
    const incidentService = new IncidentService();

    /**
     * GET /api/incidents
     * Search/filter incidents
     * Query params: status, severity, startDate, endDate, vveId
     */
    router.get(
        '/',
        verifyFirebaseToken,
        [
            query('status').optional().isIn(['Active', 'Resolved']),
            query('severity').optional().isIn(['Minor', 'Major', 'Critical']),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601(),
            query('vveId').optional().isString(),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ success: false, errors: errors.array() });
                }

                const filters = {
                    status: req.query.status,
                    severity: req.query.severity,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                    vveId: req.query.vveId
                };

                const incidents = await incidentService.searchIncidents(filters);
                const dtos = IncidentMapper.toListDto(incidents);
                
                return res.json({ 
                    success: true, 
                    count: dtos.length, 
                    data: dtos 
                });
            } catch (error) {
                console.error('[INCIDENT GET ALL] Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * POST /api/incidents
     * Create a new incident
     */
    router.post(
        '/',
        verifyFirebaseToken,
        [
            body('title').notEmpty().withMessage('Title is required'),
            body('incidentTypeId').notEmpty().withMessage('Incident Type ID is required'),
            body('severity').notEmpty().isIn(['Minor', 'Major', 'Critical']).withMessage('Invalid severity'),
            body('startTime').notEmpty().isISO8601().withMessage('Valid start time is required'),
            body('description').optional().isString(),
            body('affectedVves').optional().isArray(),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ success: false, errors: errors.array() });
                }

                const { title, incidentTypeId, severity, startTime, description, affectedVves } = req.body;
                const performedBy = req.user?.uid || req.user?.email || 'unknown';

                const dto = new CreateIncidentDto({ 
                    title, 
                    incidentTypeId, 
                    severity, 
                    startTime, 
                    description, 
                    affectedVves 
                });

                const created = await incidentService.createIncident(dto, performedBy);
                const response = IncidentMapper.toDto(created);

                return res.status(201).json({ 
                    success: true, 
                    data: response 
                });
            } catch (error) {
                console.error('[INCIDENT CREATE] Error:', error);
                if (error.message && error.message.includes('not found')) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Not found', 
                        message: error.message 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * GET /api/incidents/:id
     * Get a specific incident by ID
     */
    router.get(
        '/:id',
        verifyFirebaseToken,
        [param('id').isString()],
        async (req, res) => {
            try {
                const { id } = req.params;
                const incident = await incidentService.getIncidentById(id);
                const dto = IncidentMapper.toDto(incident);
                
                return res.json({ 
                    success: true, 
                    data: dto 
                });
            } catch (error) {
                console.error('[INCIDENT GET] Error:', error);
                if (error.message && error.message.includes('not found')) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Not found', 
                        message: error.message 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * PATCH /api/incidents/:id
     * Update an incident (including auto-calculation of duration when resolved)
     */
    router.patch(
        '/:id',
        verifyFirebaseToken,
        [
            param('id').isString(),
            body('title').optional().isString(),
            body('description').optional().isString(),
            body('severity').optional().isIn(['Minor', 'Major', 'Critical']),
            body('status').optional().isIn(['Active', 'Resolved']),
            body('endTime').optional().isISO8601(),
            body('affectedVves').optional().isArray(),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ success: false, errors: errors.array() });
                }

                const { id } = req.params;
                const { title, description, severity, status, endTime, affectedVves } = req.body;
                const performedBy = req.user?.uid || req.user?.email || 'unknown';

                const dto = new UpdateIncidentDto({ 
                    title, 
                    description, 
                    severity, 
                    status, 
                    endTime, 
                    affectedVves 
                });

                const updated = await incidentService.updateIncident(id, dto, performedBy);
                const response = IncidentMapper.toDto(updated);

                return res.json({ 
                    success: true, 
                    message: 'Updated successfully', 
                    data: response 
                });
            } catch (error) {
                console.error('[INCIDENT UPDATE] Error:', error);
                if (error.message && error.message.includes('not found')) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Not found', 
                        message: error.message 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * DELETE /api/incidents/:id
     * Delete an incident
     */
    router.delete(
        '/:id',
        verifyFirebaseToken,
        [param('id').isString()],
        async (req, res) => {
            try {
                const { id } = req.params;
                const performedBy = req.user?.uid || req.user?.email || 'unknown';

                await incidentService.deleteIncident(id, performedBy);

                return res.json({ 
                    success: true, 
                    message: 'Deleted successfully' 
                });
            } catch (error) {
                console.error('[INCIDENT DELETE] Error:', error);
                if (error.message && error.message.includes('not found')) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Not found', 
                        message: error.message 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    return router;
};

