import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp.js';
import ComplementaryTask from '../../src/domain/models/ComplementaryTask.js';

describe('Complementary Tasks API - Integration Tests', () => {
    let mongoServer;
    let app;
    let mockToken;
    let testCategoryId = 'CTC-2026-001';
    let testVveId = 'VVE-2026-001';
    let createdTaskId;

    beforeAll(async () => {
        // Start MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Connect to the in-memory database
        await mongoose.connect(mongoUri);
        
        app = createTestApp();
        mockToken = 'mock-firebase-token'; // Mocked in testApp setup
    });

    beforeEach(async () => {
        // Clean up tasks before each test
        await ComplementaryTask.deleteMany({});
    });

    afterAll(async () => {
        // Clean up after all tests
        await ComplementaryTask.deleteMany({});
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('POST /api/complementary-tasks', () => {
        it('should create a new complementary task with minimum required fields', async () => {
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-10T10:00:00Z').toISOString(),
                suspendsOperations: false
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.taskId).toMatch(/^CT-\d{4}-\d{6}$/);
            expect(response.body.data.categoryId).toBe(testCategoryId);
            expect(response.body.data.vveId).toBe(testVveId);
            expect(response.body.data.responsibleTeam).toBe('Safety Team');
            expect(response.body.data.status).toBe('PENDING');
            expect(response.body.data.suspendsOperations).toBe(false);

            createdTaskId = response.body.data.taskId;
        });

        it('should create a task with all fields including description and end time', async () => {
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                description: 'Routine safety inspection of cargo handling equipment',
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-10T10:00:00Z').toISOString(),
                endTime: new Date('2026-01-10T12:00:00Z').toISOString(),
                status: 'ONGOING',
                suspendsOperations: true
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe(taskData.description);
            expect(response.body.data.status).toBe('ONGOING');
            expect(response.body.data.suspendsOperations).toBe(true);
            expect(response.body.data.durationMinutes).toBe(120); // 2 hours
        });

        it('should reject task creation without required fields', async () => {
            const taskData = {
                description: 'Missing required fields'
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject task with invalid status', async () => {
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-10T10:00:00Z').toISOString(),
                status: 'INVALID_STATUS'
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject task with end time before start time', async () => {
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                responsibleTeam: 'Safety Team',
                startTime: new Date('2026-01-10T12:00:00Z').toISOString(),
                endTime: new Date('2026-01-10T10:00:00Z').toISOString()
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('End time must be after start time');
        });
    });

    describe('GET /api/complementary-tasks/:id', () => {
        beforeEach(async () => {
            // Create a task for testing
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                responsibleTeam: 'Maintenance Crew',
                startTime: new Date('2026-01-10T10:00:00Z').toISOString()
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData);

            createdTaskId = response.body.data.taskId;
        });

        it('should retrieve a task by ID', async () => {
            const response = await request(app)
                .get(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.taskId).toBe(createdTaskId);
            expect(response.body.data.responsibleTeam).toBe('Maintenance Crew');
        });

        it('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks/CT-2026-999999')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/complementary-tasks/:id', () => {
        beforeEach(async () => {
            // Create a task for testing
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                responsibleTeam: 'Initial Team',
                startTime: new Date('2026-01-10T10:00:00Z').toISOString(),
                status: 'PENDING'
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData);

            createdTaskId = response.body.data.taskId;
        });

        it('should update task status', async () => {
            const updateData = {
                status: 'ONGOING'
            };

            const response = await request(app)
                .put(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('ONGOING');
        });

        it('should update task responsible team', async () => {
            const updateData = {
                responsibleTeam: 'Updated Team'
            };

            const response = await request(app)
                .put(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.responsibleTeam).toBe('Updated Team');
        });

        it('should add end time to complete a task', async () => {
            const updateData = {
                endTime: new Date('2026-01-10T14:00:00Z').toISOString(),
                status: 'COMPLETED'
            };

            const response = await request(app)
                .put(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('COMPLETED');
            expect(response.body.data.endTime).toBeDefined();
        });

        it('should reject update with invalid status', async () => {
            const updateData = {
                status: 'INVALID'
            };

            const response = await request(app)
                .put(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for updating non-existent task', async () => {
            const response = await request(app)
                .put('/api/complementary-tasks/CT-2026-999999')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ status: 'ONGOING' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/complementary-tasks/:id', () => {
        beforeEach(async () => {
            // Create a task for testing
            const taskData = {
                categoryId: testCategoryId,
                vveId: testVveId,
                responsibleTeam: 'Test Team',
                startTime: new Date('2026-01-10T10:00:00Z').toISOString()
            };

            const response = await request(app)
                .post('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(taskData);

            createdTaskId = response.body.data.taskId;
        });

        it('should delete a task', async () => {
            const response = await request(app)
                .delete(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Task deleted successfully');

            // Verify task is deleted
            await request(app)
                .get(`/api/complementary-tasks/${createdTaskId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);
        });

        it('should return 404 for deleting non-existent task', async () => {
            const response = await request(app)
                .delete('/api/complementary-tasks/CT-2026-999999')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/complementary-tasks - Filtering', () => {
        beforeEach(async () => {
            // Create multiple tasks for filtering tests
            const tasks = [
                {
                    categoryId: testCategoryId,
                    vveId: 'VVE-2026-001',
                    responsibleTeam: 'Safety Team',
                    startTime: new Date('2026-01-10T10:00:00Z').toISOString(),
                    status: 'ONGOING',
                    suspendsOperations: true
                },
                {
                    categoryId: testCategoryId,
                    vveId: 'VVE-2026-001',
                    responsibleTeam: 'Maintenance Crew',
                    startTime: new Date('2026-01-10T14:00:00Z').toISOString(),
                    status: 'PENDING',
                    suspendsOperations: false
                },
                {
                    categoryId: 'CTC-2026-002',
                    vveId: 'VVE-2026-002',
                    responsibleTeam: 'Cleaning Team',
                    startTime: new Date('2026-01-11T10:00:00Z').toISOString(),
                    status: 'COMPLETED',
                    suspendsOperations: false
                }
            ];

            for (const task of tasks) {
                await request(app)
                    .post('/api/complementary-tasks')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send(task);
            }
        });

        it('should retrieve all tasks', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(3);
            expect(response.body.data).toHaveLength(3);
        });

        it('should filter tasks by VVE ID', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks?vveId=VVE-2026-001')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.data.every(t => t.vveId === 'VVE-2026-001')).toBe(true);
        });

        it('should filter tasks by status', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks?status=ONGOING')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.data[0].status).toBe('ONGOING');
        });

        it('should filter tasks by suspendsOperations', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks?suspendsOperations=true')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.data[0].suspendsOperations).toBe(true);
        });

        it('should filter tasks by date range', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks?startTimeFrom=2026-01-11T00:00:00Z')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
        });

        it('should filter tasks by responsible team', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks?responsibleTeam=Safety')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.data[0].responsibleTeam).toBe('Safety Team');
        });
    });

    describe('GET /api/complementary-tasks/impacting', () => {
        beforeEach(async () => {
            // Create tasks with different suspension states
            const tasks = [
                {
                    categoryId: testCategoryId,
                    vveId: testVveId,
                    responsibleTeam: 'Safety Team',
                    startTime: new Date('2026-01-10T10:00:00Z').toISOString(),
                    status: 'ONGOING',
                    suspendsOperations: true
                },
                {
                    categoryId: testCategoryId,
                    vveId: testVveId,
                    responsibleTeam: 'Inspection Team',
                    startTime: new Date('2026-01-10T14:00:00Z').toISOString(),
                    status: 'ONGOING',
                    suspendsOperations: false
                },
                {
                    categoryId: testCategoryId,
                    vveId: testVveId,
                    responsibleTeam: 'Maintenance',
                    startTime: new Date('2026-01-10T16:00:00Z').toISOString(),
                    status: 'COMPLETED',
                    suspendsOperations: true
                }
            ];

            for (const task of tasks) {
                await request(app)
                    .post('/api/complementary-tasks')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send(task);
            }
        });

        it('should retrieve only ongoing tasks that suspend operations', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks/impacting')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1);
            expect(response.body.data[0].status).toBe('ONGOING');
            expect(response.body.data[0].suspendsOperations).toBe(true);
        });
    });

    describe('GET /api/complementary-tasks/vve/:vveId', () => {
        beforeEach(async () => {
            // Create tasks for different VVEs
            const tasks = [
                {
                    categoryId: testCategoryId,
                    vveId: 'VVE-TEST-001',
                    responsibleTeam: 'Team A',
                    startTime: new Date('2026-01-10T10:00:00Z').toISOString()
                },
                {
                    categoryId: testCategoryId,
                    vveId: 'VVE-TEST-001',
                    responsibleTeam: 'Team B',
                    startTime: new Date('2026-01-10T14:00:00Z').toISOString()
                },
                {
                    categoryId: testCategoryId,
                    vveId: 'VVE-TEST-002',
                    responsibleTeam: 'Team C',
                    startTime: new Date('2026-01-10T16:00:00Z').toISOString()
                }
            ];

            for (const task of tasks) {
                await request(app)
                    .post('/api/complementary-tasks')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send(task);
            }
        });

        it('should retrieve all tasks for a specific VVE', async () => {
            const response = await request(app)
                .get('/api/complementary-tasks/vve/VVE-TEST-001')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.data.every(t => t.vveId === 'VVE-TEST-001')).toBe(true);
        });
    });
});

