import { Router } from 'express';
import { body, validationResult, query, param } from 'express-validator';
import { verifyFirebaseToken } from '../config/firebase.js';
import { ComplementaryTaskService } from '../services/complementaryTaskService.js';
import {
    CreateComplementaryTaskDto,
    UpdateComplementaryTaskDto,
    ComplementaryTaskFilterDto,
} from '../application/dtos/ComplementaryTaskDto.js';
import { ComplementaryTaskMapper } from '../application/mappers/ComplementaryTaskMapper.js';

export const createComplementaryTaskRouter = () => {
    const router = Router();
    const taskService = new ComplementaryTaskService();

    /**
     * @swagger
     * /api/complementary-tasks:
     *   get:
     *     summary: Get all complementary tasks with optional filters
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: vveId
     *         schema:
     *           type: string
     *         description: Filter by Vessel Visit Execution ID
     *       - in: query
     *         name: categoryId
     *         schema:
     *           type: string
     *         description: Filter by Category ID
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [PENDING, ONGOING, COMPLETED, CANCELLED]
     *         description: Filter by status
     *       - in: query
     *         name: suspendsOperations
     *         schema:
     *           type: string
     *           enum: [true, false]
     *         description: Filter by whether task suspends operations
     *       - in: query
     *         name: responsibleTeam
     *         schema:
     *           type: string
     *         description: Filter by responsible team (partial match)
     *       - in: query
     *         name: startTimeFrom
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Filter tasks starting from this date
     *       - in: query
     *         name: startTimeTo
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Filter tasks starting until this date
     *     responses:
     *       200:
     *         description: List of complementary tasks
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.get(
        '/',
        verifyFirebaseToken,
        [
            query('vveId').optional().isString(),
            query('categoryId').optional().isString(),
            query('status').optional().isIn(['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED']),
            query('suspendsOperations').optional().isIn(['true', 'false']),
            query('responsibleTeam').optional().isString(),
            query('startTimeFrom').optional().isISO8601(),
            query('startTimeTo').optional().isISO8601(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const filters = new ComplementaryTaskFilterDto({
                    vveId: req.query.vveId,
                    categoryId: req.query.categoryId,
                    status: req.query.status,
                    suspendsOperations: req.query.suspendsOperations !== undefined 
                        ? req.query.suspendsOperations === 'true' 
                        : undefined,
                    responsibleTeam: req.query.responsibleTeam,
                    startTimeFrom: req.query.startTimeFrom,
                    startTimeTo: req.query.startTimeTo,
                });

                const tasks = await taskService.searchTasks(filters);
                const dtos = ComplementaryTaskMapper.toListDto(tasks);

                return res.json({ success: true, count: dtos.length, data: dtos });
            } catch (error) {
                console.error('[ComplementaryTask GET ALL] Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * @swagger
     * /api/complementary-tasks/impacting:
     *   get:
     *     summary: Get ongoing tasks that are currently suspending operations
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of ongoing tasks impacting operations
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.get(
        '/impacting',
        verifyFirebaseToken,
        async (req, res) => {
            try {
                const tasks = await taskService.getOngoingImpactingTasks();
                const dtos = ComplementaryTaskMapper.toListDto(tasks);

                return res.json({ success: true, count: dtos.length, data: dtos });
            } catch (error) {
                console.error('[ComplementaryTask GET IMPACTING] Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * @swagger
     * /api/complementary-tasks:
     *   post:
     *     summary: Create a new complementary task
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - categoryId
     *               - vveId
     *               - responsibleTeam
     *               - startTime
     *             properties:
     *               categoryId:
     *                 type: string
     *               vveId:
     *                 type: string
     *               description:
     *                 type: string
     *               responsibleTeam:
     *                 type: string
     *               startTime:
     *                 type: string
     *                 format: date-time
     *               endTime:
     *                 type: string
     *                 format: date-time
     *               status:
     *                 type: string
     *                 enum: [PENDING, ONGOING, COMPLETED, CANCELLED]
     *               suspendsOperations:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Task created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.post(
        '/',
        verifyFirebaseToken,
        [
            body('categoryId').notEmpty().isString().withMessage('Category ID is required'),
            body('vveId').notEmpty().isString().withMessage('VVE ID is required'),
            body('responsibleTeam').notEmpty().isString().withMessage('Responsible team is required'),
            body('startTime').notEmpty().isISO8601().withMessage('Valid start time is required'),
            body('endTime').optional({ nullable: true, checkFalsy: false }).custom((value) => {
                if (value === null || value === undefined || value === '') return true;
                if (!isNaN(Date.parse(value))) return true;
                throw new Error('End time must be a valid date');
            }),
            body('description').optional().isString(),
            body('status').optional().isIn(['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED']),
            body('suspendsOperations').optional().isBoolean(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.error('[ComplementaryTask CREATE] Validation errors:', errors.array());
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                console.log('[ComplementaryTask CREATE] Request body:', JSON.stringify(req.body, null, 2));
                const dto = new CreateComplementaryTaskDto(req.body);
                console.log('[ComplementaryTask CREATE] DTO created:', JSON.stringify(dto, null, 2));
                const created = await taskService.createTask(dto, req.user?.uid || 'system');
                const data = ComplementaryTaskMapper.toDto(created);
                
                console.log('[ComplementaryTask CREATE] Success! Task ID:', data.taskId);
                return res.status(201).json({ success: true, data });
            } catch (error) {
                console.error('[ComplementaryTask CREATE] Error:', error);
                console.error('[ComplementaryTask CREATE] Error stack:', error.stack);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * @swagger
     * /api/complementary-tasks/{id}:
     *   get:
     *     summary: Get a complementary task by ID
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *     responses:
     *       200:
     *         description: Task found
     *       404:
     *         description: Task not found
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.get(
        '/:id',
        verifyFirebaseToken,
        [param('id').notEmpty().isString().withMessage('Task ID is required')],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const task = await taskService.getTaskById(req.params.id);
                const data = ComplementaryTaskMapper.toDto(task);
                
                return res.json({ success: true, data });
            } catch (error) {
                if (error.message.includes('not found')) {
                    return res.status(404).json({ success: false, error: 'Not found', message: error.message });
                }
                console.error('[ComplementaryTask GET BY ID] Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * @swagger
     * /api/complementary-tasks/{id}:
     *   put:
     *     summary: Update a complementary task
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               categoryId:
     *                 type: string
     *               description:
     *                 type: string
     *               responsibleTeam:
     *                 type: string
     *               startTime:
     *                 type: string
     *                 format: date-time
     *               endTime:
     *                 type: string
     *                 format: date-time
     *               status:
     *                 type: string
     *                 enum: [PENDING, ONGOING, COMPLETED, CANCELLED]
     *               suspendsOperations:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Task updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Task not found
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.put(
        '/:id',
        verifyFirebaseToken,
        [
            param('id').notEmpty().isString().withMessage('Task ID is required'),
            body('categoryId').optional().isString(),
            body('responsibleTeam').optional().isString(),
            body('startTime').optional().isISO8601().withMessage('Start time must be a valid date'),
            body('endTime').optional({ nullable: true, checkFalsy: false }).custom((value) => {
                if (value === null || value === undefined || value === '') return true;
                if (!isNaN(Date.parse(value))) return true;
                throw new Error('End time must be a valid date');
            }),
            body('description').optional().isString(),
            body('status').optional().isIn(['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED']),
            body('suspendsOperations').optional().isBoolean(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const dto = new UpdateComplementaryTaskDto(req.body);
                const updated = await taskService.updateTask(req.params.id, dto, req.user?.uid || 'system');
                const data = ComplementaryTaskMapper.toDto(updated);
                
                return res.json({ success: true, data });
            } catch (error) {
                if (error.message.includes('not found')) {
                    return res.status(404).json({ success: false, error: 'Not found', message: error.message });
                }
                console.error('[ComplementaryTask UPDATE] Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * @swagger
     * /api/complementary-tasks/{id}:
     *   delete:
     *     summary: Delete a complementary task
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *     responses:
     *       200:
     *         description: Task deleted successfully
     *       404:
     *         description: Task not found
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.delete(
        '/:id',
        verifyFirebaseToken,
        [param('id').notEmpty().isString().withMessage('Task ID is required')],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const deleted = await taskService.deleteTask(req.params.id);
                
                if (!deleted) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Not found', 
                        message: 'Task could not be deleted' 
                    });
                }
                
                return res.json({ 
                    success: true, 
                    message: 'Task deleted successfully' 
                });
            } catch (error) {
                if (error.message.includes('not found')) {
                    return res.status(404).json({ success: false, error: 'Not found', message: error.message });
                }
                console.error('[ComplementaryTask DELETE] Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        }
    );

    /**
     * @swagger
     * /api/complementary-tasks/vve/{vveId}:
     *   get:
     *     summary: Get all tasks for a specific VVE
     *     tags: [Complementary Tasks]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: vveId
     *         required: true
     *         schema:
     *           type: string
     *         description: VVE ID
     *     responses:
     *       200:
     *         description: List of tasks for the VVE
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.get(
        '/vve/:vveId',
        verifyFirebaseToken,
        [param('vveId').notEmpty().isString().withMessage('VVE ID is required')],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const tasks = await taskService.getTasksByVveId(req.params.vveId);
                const dtos = ComplementaryTaskMapper.toListDto(tasks);
                
                return res.json({ success: true, count: dtos.length, data: dtos });
            } catch (error) {
                console.error('[ComplementaryTask GET BY VVE] Error:', error);
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

