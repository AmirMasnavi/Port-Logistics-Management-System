/**
 * API Tests for Complementary Task Categories Endpoints
 * 
 * Type: Functional Testing with SUT = application
 * Goal: Test HTTP Endpoints (POST, GET, PATCH, DELETE) with real database
 * Tool: supertest + mongodb-memory-server
 * 
 * Tests the following scenarios:
 * - POST /api/complementary-task-categories - Create a new category
 * - GET /api/complementary-task-categories - Retrieve all categories with filtering
 * - GET /api/complementary-task-categories/:id - Retrieve a specific category
 * - PATCH /api/complementary-task-categories/:id - Update a category
 * - PUT /api/complementary-task-categories/:id - Full update a category
 * - DELETE /api/complementary-task-categories/:id - Delete a category
 * - Authentication and authorization
 * - Validation errors
 */

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp.js';
import ComplementaryTaskCategory from '../../src/domain/models/ComplementaryTaskCategories.js';

describe('Complementary Task Categories API - Integration Tests', () => {
    let mongoServer;
    let app;
    let mockToken;
    let createdCategoryId;

    beforeAll(async () => {
        // Start MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Connect to the in-memory database
        await mongoose.connect(mongoUri);
        
        app = createTestApp();
        mockToken = 'mock-firebase-token'; // Mocked in testApp setup
    });

    afterAll(async () => {
        // Clean up after all tests
        await ComplementaryTaskCategory.deleteMany({});
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        // Clear database between tests
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    describe('POST /api/complementary-task-categories - Create Category', () => {
        test('should create a new category with minimum required fields', async () => {
            const categoryData = {
                code: 'CTC001',
                name: 'Security Check'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.categoryId).toMatch(/^CTC-\d{4}-\d+$/);
            expect(response.body.data.code).toBe('CTC001');
            expect(response.body.data.name).toBe('Security Check');
            expect(response.body.data.description).toBe('');
            expect(response.body.data.isActive).toBe(true);
            expect(response.body.data.group).toBe('Other');
            expect(response.body.data.defaultDurationMinutes).toBeNull();
            expect(response.body.data.expectedImpactMinutes).toBeNull();

            createdCategoryId = response.body.data.categoryId;
        });

        test('should create a category with all fields', async () => {
            const categoryData = {
                code: 'CTC002',
                name: 'Maintenance Task',
                description: 'Routine maintenance and inspection',
                defaultDurationMinutes: 60,
                expectedImpactMinutes: 90,
                isActive: true,
                group: 'Maintenance'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.code).toBe('CTC002');
            expect(response.body.data.name).toBe('Maintenance Task');
            expect(response.body.data.description).toBe('Routine maintenance and inspection');
            expect(response.body.data.defaultDurationMinutes).toBe(60);
            expect(response.body.data.expectedImpactMinutes).toBe(90);
            expect(response.body.data.isActive).toBe(true);
            expect(response.body.data.group).toBe('Maintenance');
        });

        test('should create a category with each valid group', async () => {
            const validGroups = [
                'Safety and Security',
                'Maintenance',
                'Cleaning and Housekeeping',
                'Bunkering and Supply',
                'Crew and Personnel',
                'Regulatory and Surveys',
                'Weather and External Delays',
                'Other'
            ];

            for (let i = 0; i < validGroups.length; i++) {
                const categoryData = {
                    code: `CTC-${i + 100}`,
                    name: `Category ${i}`,
                    group: validGroups[i]
                };

                const response = await request(app)
                    .post('/api/complementary-task-categories')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send(categoryData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.group).toBe(validGroups[i]);
            }
        });

        test('should reject category creation without required fields', async () => {
            const categoryData = {
                description: 'Missing required fields'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        test('should reject category with missing code', async () => {
            const categoryData = {
                name: 'Test Category'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        test('should reject category with missing name', async () => {
            const categoryData = {
                code: 'CTC001'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        test('should reject category with negative duration values', async () => {
            const categoryData = {
                code: 'CTC001',
                name: 'Test Category',
                defaultDurationMinutes: -10
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should reject category with duplicate code', async () => {
            const categoryData = {
                code: 'CTC-DUPLICATE',
                name: 'First Category'
            };

            // Create first category
            await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(201);

            // Try to create duplicate
            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ ...categoryData, name: 'Second Category' })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        test('should create inactive category', async () => {
            const categoryData = {
                code: 'CTC-INACTIVE',
                name: 'Inactive Category',
                isActive: false
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(false);
        });

        test('should create category with zero duration values', async () => {
            const categoryData = {
                code: 'CTC-ZERO',
                name: 'Zero Duration',
                defaultDurationMinutes: 0,
                expectedImpactMinutes: 0
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.defaultDurationMinutes).toBe(0);
            expect(response.body.data.expectedImpactMinutes).toBe(0);
        });

        test('should require authentication', async () => {
            const categoryData = {
                code: 'CTC001',
                name: 'Security Check'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .send(categoryData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/complementary-task-categories - Get All Categories', () => {
        beforeEach(async () => {
            // Create test categories
            const categories = [
                {
                    code: 'CTC001',
                    name: 'Security Check',
                    description: 'Pre-departure security',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true,
                    group: 'Safety and Security'
                },
                {
                    code: 'CTC002',
                    name: 'Maintenance Task',
                    description: 'Routine maintenance',
                    defaultDurationMinutes: 60,
                    expectedImpactMinutes: 90,
                    isActive: true,
                    group: 'Maintenance'
                },
                {
                    code: 'CTC003',
                    name: 'Inactive Category',
                    description: 'Deprecated',
                    isActive: false,
                    group: 'Other'
                }
            ];

            for (const cat of categories) {
                await request(app)
                    .post('/api/complementary-task-categories')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send(cat);
            }
        });

        test('should retrieve all categories', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(3);
            expect(response.body.data).toHaveLength(3);
        });

        test('should filter by code', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?code=CTC001')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].code).toBe('CTC001');
        });

        test('should filter by nameContains', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?nameContains=Security')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].name).toContain('Security');
        });

        test('should filter by active status', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?active=true')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            response.body.data.forEach(cat => {
                expect(cat.isActive).toBe(true);
            });
        });

        test('should filter by inactive status', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?active=false')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].isActive).toBe(false);
        });

        test('should filter by group', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?group=Maintenance')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].group).toBe('Maintenance');
        });

        test('should filter by defaultDurationMinutes', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?defaultDurationMinutes=30')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        test('should filter by expectedImpactMinutes', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?expectedImpactMinutes=45')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        test('should handle multiple filters', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?active=true&group=Maintenance')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].isActive).toBe(true);
            expect(response.body.data[0].group).toBe('Maintenance');
        });

        test('should return empty array when no categories match filter', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?code=NONEXISTENT')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(0);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/complementary-task-categories/:id - Get Category by ID', () => {
        beforeEach(async () => {
            // Create a test category
            const categoryData = {
                code: 'CTC001',
                name: 'Security Check',
                description: 'Pre-departure security inspection',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Safety and Security'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData);

            createdCategoryId = response.body.data.categoryId;
        });

        test('should retrieve a category by ID', async () => {
            const response = await request(app)
                .get(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.categoryId).toBe(createdCategoryId);
            expect(response.body.data.code).toBe('CTC001');
            expect(response.body.data.name).toBe('Security Check');
        });

        test('should return 404 for non-existent category', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories/CTC-99999999-9999')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get(`/api/complementary-task-categories/${createdCategoryId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/complementary-task-categories/:id - Update Category', () => {
        beforeEach(async () => {
            // Create a test category
            const categoryData = {
                code: 'CTC001',
                name: 'Security Check',
                description: 'Original description',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Safety and Security'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData);

            createdCategoryId = response.body.data.categoryId;
        });

        test('should update category name', async () => {
            const updateData = {
                name: 'Updated Security Check'
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Security Check');
            expect(response.body.data.description).toBe('Original description'); // Unchanged
        });

        test('should update category description', async () => {
            const updateData = {
                description: 'Updated description'
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe('Updated description');
        });

        test('should update duration values', async () => {
            const updateData = {
                defaultDurationMinutes: 45,
                expectedImpactMinutes: 60
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.defaultDurationMinutes).toBe(45);
            expect(response.body.data.expectedImpactMinutes).toBe(60);
        });

        test('should update isActive status', async () => {
            const updateData = {
                isActive: false
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(false);
        });

        test('should update group', async () => {
            const updateData = {
                group: 'Maintenance'
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.group).toBe('Maintenance');
        });

        test('should update multiple fields at once', async () => {
            const updateData = {
                name: 'Fully Updated Category',
                description: 'New description',
                defaultDurationMinutes: 120,
                expectedImpactMinutes: 150,
                isActive: false,
                group: 'Maintenance'
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Fully Updated Category');
            expect(response.body.data.description).toBe('New description');
            expect(response.body.data.defaultDurationMinutes).toBe(120);
            expect(response.body.data.expectedImpactMinutes).toBe(150);
            expect(response.body.data.isActive).toBe(false);
            expect(response.body.data.group).toBe('Maintenance');
        });

        test('should return 404 for non-existent category', async () => {
            const updateData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .patch('/api/complementary-task-categories/CTC-99999999-9999')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should reject negative duration values', async () => {
            const updateData = {
                defaultDurationMinutes: -10
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should require authentication', async () => {
            const updateData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .patch(`/api/complementary-task-categories/${createdCategoryId}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/complementary-task-categories/:id - Full Update Category', () => {
        beforeEach(async () => {
            // Create a test category
            const categoryData = {
                code: 'CTC001',
                name: 'Security Check',
                description: 'Original description',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Safety and Security'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData);

            createdCategoryId = response.body.data.categoryId;
        });

        test('should update category with PUT', async () => {
            const updateData = {
                name: 'Fully Updated via PUT'
            };

            const response = await request(app)
                .put(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Fully Updated via PUT');
        });

        test('should return 404 for non-existent category', async () => {
            const updateData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .put('/api/complementary-task-categories/CTC-99999999-9999')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/complementary-task-categories/:id - Delete Category', () => {
        beforeEach(async () => {
            // Create a test category
            const categoryData = {
                code: 'CTC001',
                name: 'Security Check',
                description: 'To be deleted',
                isActive: true,
                group: 'Safety and Security'
            };

            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(categoryData);

            createdCategoryId = response.body.data.categoryId;
        });

        test('should delete a category', async () => {
            const response = await request(app)
                .delete(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(204);

            expect(response.body).toEqual({});

            // Verify deletion
            const getResponse = await request(app)
                .get(`/api/complementary-task-categories/${createdCategoryId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);

            expect(getResponse.body.success).toBe(false);
        });

        test('should return 404 when deleting non-existent category', async () => {
            const response = await request(app)
                .delete('/api/complementary-task-categories/CTC-99999999-9999')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .delete(`/api/complementary-task-categories/${createdCategoryId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle invalid category ID format', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories/invalid-id-format')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        test('should handle malformed JSON in POST', async () => {
            const response = await request(app)
                .post('/api/complementary-task-categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);
        });

        test('should validate query parameters for GET', async () => {
            const response = await request(app)
                .get('/api/complementary-task-categories?defaultDurationMinutes=invalid')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});

