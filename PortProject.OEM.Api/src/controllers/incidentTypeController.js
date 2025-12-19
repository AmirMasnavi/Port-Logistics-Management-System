// javascript
import { Router } from 'express';
import { body, validationResult, query, param } from 'express-validator';
import { verifyFirebaseToken } from '../config/firebase.js';
import { IncidentTypeService } from '../services/incidentTypeService.js';
import { CreateIncidentTypeDto, UpdateIncidentTypeDto } from '../application/dtos/IncidentTypeDto.js';
import { IncidentTypeMapper } from '../application/mappers/IncidentTypeMapper.js';

export const createIncidentTypeRouter = (masterDataGateway) => {
    const router = Router();
    const incidentTypeService = new IncidentTypeService(masterDataGateway);

    // Create
    router.post(
        '/',
        verifyFirebaseToken,
        [
            body('code').notEmpty().withMessage('Code é obrigatório').isLength({ max: 32 }).withMessage('Code máximo 32 chars'),
            body('name').notEmpty().withMessage('Name é obrigatório').isLength({ max: 128 }).withMessage('Name máximo 128 chars'),
            body('severity').notEmpty().isIn(['Minor', 'Major', 'Critical']).withMessage('Severity inválida'),
            body('description').optional().isString(),
            body('parentId').optional().isString().withMessage('ParentId deve ser string válida'),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

                const { code, name, description, severity, parentId } = req.body;
                const performedBy = req.user?.uid || req.user?.email || 'unknown';

                const dto = new CreateIncidentTypeDto({ code, name, description, severity, parentId });
                const created = await incidentTypeService.createIncidentType(dto, performedBy);

                const response = IncidentTypeMapper.toResponseDto(created);
                return res.status(201).json({ success: true, data: response });
            } catch (error) {
                console.error('[INCIDENT TYPE CREATE] Error:', error);
                if (error.message && error.message.includes('unique')) {
                    return res.status(409).json({ success: false, error: 'Conflict', message: error.message });
                }
                return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
            }
        }
    );

    // Get all (optional filters: parentId, severity, q, tree)
    router.get(
        '/',
        verifyFirebaseToken,
        [
            query('parentId').optional().isString(),
            query('severity').optional().isIn(['Minor', 'Major', 'Critical']),
            query('q').optional().isString(),
            query('tree').optional().isIn(['true', 'false']),
        ],
        async (req, res) => {
            try {
                const { parentId, severity, q, tree } = req.query;
                const filters = {};
                if (parentId) filters.parentId = parentId;
                if (severity) filters.severity = severity;
                if (q) filters.q = q;

                const items = await incidentTypeService.getAllIncidentTypes(filters);
                if (tree && (tree === 'true' || tree === '1')) {
                    const treeDto = IncidentTypeMapper.toTreeDto(items);
                    return res.json({ success: true, count: treeDto.length, data: treeDto });
                }

                const listDto = IncidentTypeMapper.toListDto(items);
                return res.json({ success: true, count: listDto.length, data: listDto });
            } catch (error) {
                console.error('[INCIDENT TYPE GET ALL] Error:', error);
                return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
            }
        }
    );

    // Get by id
    router.get(
        '/:id',
        verifyFirebaseToken,
        [param('id').isString()],
        async (req, res) => {
            try {
                const { id } = req.params;
                const item = await incidentTypeService.getIncidentTypeById(id);
                if (!item) return res.status(404).json({ success: false, error: 'Not found', message: `IncidentType '${id}' not found` });
                const dto = IncidentTypeMapper.toResponseDto(item);
                return res.json({ success: true, data: dto });
            } catch (error) {
                console.error('[INCIDENT TYPE GET] Error:', error);
                return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
            }
        }
    );

    // Update
    router.put(
        '/:id',
        verifyFirebaseToken,
        [
            param('id').isString(),
            body('code').notEmpty().withMessage('Code é obrigatório').isLength({ max: 32 }),
            body('name').notEmpty().withMessage('Name é obrigatório').isLength({ max: 128 }),
            body('severity').notEmpty().isIn(['Minor', 'Major', 'Critical']),
            body('description').optional().isString(),
            body('parentId').optional().isString(),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

                const { id } = req.params;
                const { code, name, description, severity, parentId } = req.body;
                const performedBy = req.user?.uid || req.user?.email || 'unknown';

                const dto = new UpdateIncidentTypeDto({ code, name, description, severity, parentId });
                const updated = await incidentTypeService.updateIncidentType(id, dto, performedBy);

                const response = IncidentTypeMapper.toResponseDto(updated);
                return res.json({ success: true, message: 'Updated successfully', data: response });
            } catch (error) {
                console.error('[INCIDENT TYPE UPDATE] Error:', error);
                if (error.message && error.message.includes('not found')) {
                    return res.status(404).json({ success: false, error: 'Not found', message: error.message });
                }
                if (error.message && error.message.includes('unique')) {
                    return res.status(409).json({ success: false, error: 'Conflict', message: error.message });
                }
                return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
            }
        }
    );

    // Delete
    router.delete(
        '/:id',
        verifyFirebaseToken,
        [param('id').isString()],
        async (req, res) => {
            try {
                const { id } = req.params;
                const performedBy = req.user?.uid || req.user?.email || 'unknown';

                const result = await incidentTypeService.deleteIncidentType(id, performedBy);
                if (!result) {
                    return res.status(400).json({ success: false, error: 'Bad request', message: `Cannot delete IncidentType '${id}'` });
                }

                return res.json({ success: true, message: 'Deleted successfully' });
            } catch (error) {
                console.error('[INCIDENT TYPE DELETE] Error:', error);
                if (error.message && error.message.includes('not found')) {
                    return res.status(404).json({ success: false, error: 'Not found', message: error.message });
                }
                return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
            }
        }
    );

    return router;
};