import { Router } from 'express';
import { body, validationResult, query, param } from 'express-validator';
import { verifyFirebaseToken } from '../config/firebase.js';
import { ComplementaryTaskCategoryService } from '../services/complementaryTaskCategoriesService.js';
import {
    CreateComplementaryTaskCategoryDto,
    UpdateComplementaryTaskCategoryDto,
    ComplementaryTaskCategoryFilterDto,
} from '../application/dtos/ComplementaryTaskCategoriesDto.js';
import { ComplementaryTaskCategoryMapper } from '../application/mappers/ComplementaryTaskCategoriesMapper.js';

export const createComplementaryTaskCategoryRouter = () => {
    const router = Router();
    const categoryService = new ComplementaryTaskCategoryService();

    // GET /api/complementary-task-categories
    router.get(
        '/',
        verifyFirebaseToken,
        [
            query('code').optional().isString(),
            query('nameContains').optional().isString(),
            // aceita 'true'/'false' em string
            query('active').optional().isIn(['true', 'false']),
            query('minImpactMinutes').optional().isInt({ min: 0 }),
            query('maxImpactMinutes').optional().isInt({ min: 0 }),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const filters = new ComplementaryTaskCategoryFilterDto({
                    code: req.query.code,
                    nameContains: req.query.nameContains,
                    active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
                    minImpactMinutes:
                        req.query.minImpactMinutes !== undefined ? parseInt(req.query.minImpactMinutes, 10) : undefined,
                    maxImpactMinutes:
                        req.query.maxImpactMinutes !== undefined ? parseInt(req.query.maxImpactMinutes, 10) : undefined,
                });

                const categories = await categoryService.searchCategories(filters);
                const dtos = ComplementaryTaskCategoryMapper.toListDto
                    ? ComplementaryTaskCategoryMapper.toListDto(categories)
                    : categories;

                return res.json({ success: true, count: dtos.length, data: dtos });
            } catch (error) {
                console.error('[CTC GET ALL] Error:', error);
                return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
            }
        }
    );

    // POST /api/complementary-task-categories
    router.post(
        '/',
        verifyFirebaseToken,
        [
            body('code').notEmpty().isString().withMessage('Code is required'),
            body('name').notEmpty().isString().withMessage('Name is required'),
            body('description').optional().isString(),
            body('defaultDurationMinutes').optional().isInt({ min: 0 }),
            body('expectedImpactMinutes').optional().isInt({ min: 0 }),
            body('isActive').optional().isBoolean(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const dto = new CreateComplementaryTaskCategoryDto(req.body);
                const created = await categoryService.createCategory(dto, req.user?.uid || 'system');
                const data = ComplementaryTaskCategoryMapper.toDto ? ComplementaryTaskCategoryMapper.toDto(created) : created;
                return res.status(201).json({ success: true, data });
            } catch (error) {
                const isDup = (error?.message || '').toLowerCase().includes('already exists');
                return res.status(isDup ? 409 : 500).json({
                    success: false,
                    error: isDup ? 'Conflict' : 'Internal server error',
                    message: error.message,
                });
            }
        }
    );

    // GET /api/complementary-task-categories/:id
    router.get(
        '/:id',
        verifyFirebaseToken,
        [param('id').isString()],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const item = await categoryService.getCategoryById(req.params.id);
                const data = ComplementaryTaskCategoryMapper.toDto ? ComplementaryTaskCategoryMapper.toDto(item) : item;
                return res.json({ success: true, data });
            } catch (error) {
                const notFound = (error?.message || '').toLowerCase().includes('not found');
                return res.status(notFound ? 404 : 500).json({
                    success: false,
                    error: notFound ? 'Not Found' : 'Internal server error',
                    message: error.message,
                });
            }
        }
    );

    // PATCH /api/complementary-task-categories/:id
    router.patch(
        '/:id',
        verifyFirebaseToken,
        [
            param('id').isString(),
            body('name').optional().isString(),
            body('description').optional().isString(),
            body('defaultDurationMinutes').optional().isInt({ min: 0 }),
            body('expectedImpactMinutes').optional().isInt({ min: 0 }),
            body('isActive').optional().isBoolean(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const dto = new UpdateComplementaryTaskCategoryDto(req.body);
                const updated = await categoryService.updateCategory(req.params.id, dto, req.user?.uid || 'system');
                const data = ComplementaryTaskCategoryMapper.toDto ? ComplementaryTaskCategoryMapper.toDto(updated) : updated;
                return res.json({ success: true, data });
            } catch (error) {
                const notFound = (error?.message || '').toLowerCase().includes('not found');
                return res.status(notFound ? 404 : 500).json({
                    success: false,
                    error: notFound ? 'Not Found' : 'Internal server error',
                    message: error.message,
                });
            }
        }
    );

    // PUT /api/complementary-task-categories/:id 
    router.put(
        '/:id',
        verifyFirebaseToken,
        [
            param('id').isString(),
            body('name').optional().isString(),
            body('description').optional().isString(),
            body('defaultDurationMinutes').optional().isInt({ min: 0 }),
            body('expectedImpactMinutes').optional().isInt({ min: 0 }),
            body('isActive').optional().isBoolean(),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                const dto = new UpdateComplementaryTaskCategoryDto(req.body);
                const updated = await categoryService.updateCategory(req.params.id, dto, req.user?.uid || 'system');
                const data = ComplementaryTaskCategoryMapper.toDto ? ComplementaryTaskCategoryMapper.toDto(updated) : updated;
                return res.json({ success: true, data });
            } catch (error) {
                const notFound = (error?.message || '').toLowerCase().includes('not found');
                return res.status(notFound ? 404 : 500).json({
                    success: false,
                    error: notFound ? 'Not Found' : 'Internal server error',
                    message: error.message,
                });
            }
        }
    );

    // DELETE /api/complementary-task-categories/:id
    router.delete(
        '/:id',
        verifyFirebaseToken,
        [param('id').isString()],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            try {
                await categoryService.deleteCategory(req.params.id, req.user?.uid || 'system');
                return res.json({ success: true, deleted: true });
            } catch (error) {
                const notFound = (error?.message || '').toLowerCase().includes('not found');
                return res.status(notFound ? 404 : 500).json({
                    success: false,
                    error: notFound ? 'Not Found' : 'Internal server error',
                    message: error.message,
                });
            }
        }
    );

    return router;
};