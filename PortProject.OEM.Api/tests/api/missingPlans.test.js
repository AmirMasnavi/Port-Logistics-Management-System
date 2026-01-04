/**
 * US 4.1.X - Missing Plans API Tests
 * 
 * Type: Functional Testing with SUT = application
 * Goal: Test GET /api/plans/missing endpoint with real database
 * Tool: supertest + mongodb-memory-server
 * 
 * Tests the following scenarios:
 * - GET /api/plans/missing - Identify VVNs without operation plans
 * - Detection of missing plans for a given date
 * - Comparison between existing plans and pending VVNs
 * - Authentication and authorization
 * - Validation errors
 * - Edge cases (no VVNs, all VVNs have plans, etc.)
 */

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createTestAppWithMocks } from '../helpers/testAppWithMocks.js';

describe('Missing Plans API Tests', () => {
    let mongoServer;
    let app;
    let mockToken;

    // Setup: Start in-memory MongoDB and create app
    beforeAll(async () => {
        // Start MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Connect to the in-memory database
        await mongoose.connect(mongoUri);

        mockToken = 'mock-firebase-token';
    });

    // Cleanup: Close database connection and stop server
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Clear database between tests
    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    describe('GET /api/plans/missing - Basic Functionality', () => {
        test('should require date parameter', async () => {
            // Arrange
            const mockPendingVVNs = [];
            app = createTestAppWithMocks(mockPendingVVNs);

            // Act - Request without date parameter
            const res = await request(app)
                .get('/api/plans/missing')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Date parameter is required');
        });

        test('should require authentication', async () => {
            // Arrange
            const mockPendingVVNs = [];
            app = createTestAppWithMocks(mockPendingVVNs);

            // Act - Request without auth token
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-15');

            // Assert
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should reject invalid authentication token', async () => {
            // Arrange
            const mockPendingVVNs = [];
            app = createTestAppWithMocks(mockPendingVVNs);

            // Act - Request with invalid token
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-15')
                .set('Authorization', 'Bearer mock-invalid-token');

            // Assert
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });
    });

    describe('GET /api/plans/missing - No Plans Scenario', () => {
        test('should return all VVNs as missing when no plans exist', async () => {
            // Arrange - Mock 3 pending VVNs and no existing plans
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-001',
                    businessId: 'VVN-2026-001',
                    vesselImo: 'IMO9876543',
                    estimatedArrival: '2026-01-15T08:00:00Z',
                    estimatedDeparture: '2026-01-15T18:00:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Dock Alpha',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-002',
                    businessId: 'VVN-2026-002',
                    vesselImo: 'IMO9876544',
                    estimatedArrival: '2026-01-15T10:00:00Z',
                    estimatedDeparture: '2026-01-15T20:00:00Z',
                    assignedDockId: 'dock-002',
                    assignedDockName: 'Dock Beta',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-003',
                    businessId: 'VVN-2026-003',
                    vesselImo: 'IMO9876545',
                    estimatedArrival: '2026-01-15T12:00:00Z',
                    estimatedDeparture: '2026-01-15T22:00:00Z',
                    assignedDockId: 'dock-003',
                    assignedDockName: 'Dock Gamma',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-15')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.date).toBe('2026-01-15');
            expect(res.body.missingCount).toBe(3);
            expect(res.body.hasExistingPlans).toBe(false);
            
            // Verify missing VVNs
            expect(res.body.data.missingVVNs).toHaveLength(3);
            expect(res.body.data.missingVVNs[0].businessId).toBe('VVN-2026-001');
            expect(res.body.data.missingVVNs[0].vesselImo).toBe('IMO9876543');
            expect(res.body.data.missingVVNs[0].assignedDockName).toBe('Dock Alpha');
            
            // Verify no existing plans
            expect(res.body.data.existingPlans).toHaveLength(0);
        });
    });

    describe('GET /api/plans/missing - With Existing Plans', () => {
        test('should return only VVNs without plans when some plans exist', async () => {
            // Arrange - 3 VVNs, but only 1 has a plan
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-001',
                    businessId: 'VVN-2026-001',
                    vesselImo: 'IMO9876543',
                    estimatedArrival: '2026-01-16T08:00:00Z',
                    estimatedDeparture: '2026-01-16T18:00:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Dock Alpha',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-002',
                    businessId: 'VVN-2026-002',
                    vesselImo: 'IMO9876544',
                    estimatedArrival: '2026-01-16T10:00:00Z',
                    estimatedDeparture: '2026-01-16T20:00:00Z',
                    assignedDockId: 'dock-002',
                    assignedDockName: 'Dock Beta',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-003',
                    businessId: 'VVN-2026-003',
                    vesselImo: 'IMO9876545',
                    estimatedArrival: '2026-01-16T12:00:00Z',
                    estimatedDeparture: '2026-01-16T22:00:00Z',
                    assignedDockId: 'dock-003',
                    assignedDockName: 'Dock Gamma',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Create a plan for VVN-2026-001 only
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    date: '2026-01-16',
                    algorithm: 'optimal',
                    scheduledTasks: [
                        {
                            vesselVisitId: 'vvn-guid-001',
                            vesselVisitBusinessId: 'VVN-2026-001',
                            dockName: 'Dock Alpha',
                            resourceKind: 'Crane-1',
                            resourceId: 'R-001',
                            staffShortName: 'John Doe',
                            staffId: 'S-001',
                            startTime: '2026-01-16T08:00:00Z',
                            endTime: '2026-01-16T10:00:00Z'
                        }
                    ],
                    totalDelay: 0,
                    executionTimeMs: 100
                });

            // Act - Check missing plans
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-16')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.missingCount).toBe(2); // VVN-002 and VVN-003 are missing
            expect(res.body.hasExistingPlans).toBe(true);
            
            // Verify only 2 VVNs are missing (002 and 003)
            expect(res.body.data.missingVVNs).toHaveLength(2);
            expect(res.body.data.missingVVNs.some(vvn => vvn.businessId === 'VVN-2026-002')).toBe(true);
            expect(res.body.data.missingVVNs.some(vvn => vvn.businessId === 'VVN-2026-003')).toBe(true);
            expect(res.body.data.missingVVNs.some(vvn => vvn.businessId === 'VVN-2026-001')).toBe(false);
            
            // Verify existing plans summary
            expect(res.body.data.existingPlans).toHaveLength(1);
            expect(res.body.data.existingPlans[0].algorithm).toBe('optimal');
            expect(res.body.data.existingPlans[0].scheduledTasksCount).toBe(1);
        });

        test('should identify plans by vesselVisitBusinessId when GUID is not available', async () => {
            // Arrange - VVN with businessId but tasks reference businessId
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-999',
                    businessId: 'VVN-2026-999',
                    vesselImo: 'IMO1234567',
                    estimatedArrival: '2026-01-17T08:00:00Z',
                    estimatedDeparture: '2026-01-17T18:00:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Dock Delta',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Create a plan using businessId instead of GUID
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    date: '2026-01-17',
                    algorithm: 'heuristic',
                    scheduledTasks: [
                        {
                            vesselVisitBusinessId: 'VVN-2026-999', // Using businessId
                            dockName: 'Dock Delta',
                            resourceKind: 'Crane-1',
                            resourceId: 'R-001',
                            staffShortName: 'Jane Smith',
                            staffId: 'S-002',
                            startTime: '2026-01-17T08:00:00Z',
                            endTime: '2026-01-17T10:00:00Z'
                        }
                    ],
                    totalDelay: 5,
                    executionTimeMs: 150
                });

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-17')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert - VVN should NOT be in missing list
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.missingCount).toBe(0);
            expect(res.body.hasExistingPlans).toBe(true);
            expect(res.body.data.missingVVNs).toHaveLength(0);
            expect(res.body.data.existingPlans).toHaveLength(1);
        });
    });

    describe('GET /api/plans/missing - All Plans Present Scenario', () => {
        test('should return empty missing list when all VVNs have plans', async () => {
            // Arrange - 2 VVNs, both with plans
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-100',
                    businessId: 'VVN-2026-100',
                    vesselImo: 'IMO1111111',
                    estimatedArrival: '2026-01-18T08:00:00Z',
                    estimatedDeparture: '2026-01-18T18:00:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Dock East',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-101',
                    businessId: 'VVN-2026-101',
                    vesselImo: 'IMO2222222',
                    estimatedArrival: '2026-01-18T10:00:00Z',
                    estimatedDeparture: '2026-01-18T20:00:00Z',
                    assignedDockId: 'dock-002',
                    assignedDockName: 'Dock West',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Create plans for both VVNs
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    date: '2026-01-18',
                    algorithm: 'optimal',
                    scheduledTasks: [
                        {
                            vesselVisitId: 'vvn-guid-100',
                            vesselVisitBusinessId: 'VVN-2026-100',
                            dockName: 'Dock East',
                            resourceKind: 'Crane-1',
                            resourceId: 'R-001',
                            staffShortName: 'John Doe',
                            staffId: 'S-001',
                            startTime: '2026-01-18T08:00:00Z',
                            endTime: '2026-01-18T10:00:00Z'
                        },
                        {
                            vesselVisitId: 'vvn-guid-101',
                            vesselVisitBusinessId: 'VVN-2026-101',
                            dockName: 'Dock West',
                            resourceKind: 'Crane-2',
                            resourceId: 'R-002',
                            staffShortName: 'Jane Smith',
                            staffId: 'S-002',
                            startTime: '2026-01-18T10:00:00Z',
                            endTime: '2026-01-18T12:00:00Z'
                        }
                    ],
                    totalDelay: 0,
                    executionTimeMs: 200
                });

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-18')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert - No missing VVNs
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.missingCount).toBe(0);
            expect(res.body.hasExistingPlans).toBe(true);
            expect(res.body.data.missingVVNs).toHaveLength(0);
            expect(res.body.data.existingPlans).toHaveLength(1);
            expect(res.body.data.existingPlans[0].scheduledTasksCount).toBe(2);
        });
    });

    describe('GET /api/plans/missing - No VVNs Scenario', () => {
        test('should return empty lists when no VVNs exist for the date', async () => {
            // Arrange - No pending VVNs
            const mockPendingVVNs = [];
            app = createTestAppWithMocks(mockPendingVVNs);

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-20')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.missingCount).toBe(0);
            expect(res.body.hasExistingPlans).toBe(false);
            expect(res.body.data.missingVVNs).toHaveLength(0);
            expect(res.body.data.existingPlans).toHaveLength(0);
        });
    });

    describe('GET /api/plans/missing - Multiple Plans for Same Date', () => {
        test('should handle multiple operation plans for the same date', async () => {
            // Arrange - 3 VVNs
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-201',
                    businessId: 'VVN-2026-201',
                    vesselImo: 'IMO3333333',
                    estimatedArrival: '2026-01-21T08:00:00Z',
                    estimatedDeparture: '2026-01-21T18:00:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Dock North',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-202',
                    businessId: 'VVN-2026-202',
                    vesselImo: 'IMO4444444',
                    estimatedArrival: '2026-01-21T10:00:00Z',
                    estimatedDeparture: '2026-01-21T20:00:00Z',
                    assignedDockId: 'dock-002',
                    assignedDockName: 'Dock South',
                    status: 'Submitted'
                },
                {
                    id: 'vvn-guid-203',
                    businessId: 'VVN-2026-203',
                    vesselImo: 'IMO5555555',
                    estimatedArrival: '2026-01-21T12:00:00Z',
                    estimatedDeparture: '2026-01-21T22:00:00Z',
                    assignedDockId: 'dock-003',
                    assignedDockName: 'Dock Center',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Create first plan with VVN-201
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    date: '2026-01-21',
                    algorithm: 'optimal',
                    scheduledTasks: [
                        {
                            vesselVisitId: 'vvn-guid-201',
                            vesselVisitBusinessId: 'VVN-2026-201',
                            dockName: 'Dock North',
                            resourceKind: 'Crane-1',
                            resourceId: 'R-001',
                            staffShortName: 'John Doe',
                            staffId: 'S-001',
                            startTime: '2026-01-21T08:00:00Z',
                            endTime: '2026-01-21T10:00:00Z'
                        }
                    ],
                    totalDelay: 0,
                    executionTimeMs: 100
                });

            // Create second plan with VVN-203 (using different algorithm)
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    date: '2026-01-21',
                    algorithm: 'genetic',
                    geneticParams: {
                        populationSize: 50,
                        generations: 100,
                        mutationRate: 0.2,
                        desiredTimeSeconds: 5,
                        craneMode: 'single'
                    },
                    scheduledTasks: [
                        {
                            vesselVisitId: 'vvn-guid-203',
                            vesselVisitBusinessId: 'VVN-2026-203',
                            dockName: 'Dock Center',
                            resourceKind: 'Crane-3',
                            resourceId: 'R-003',
                            staffShortName: 'Bob Wilson',
                            staffId: 'S-003',
                            startTime: '2026-01-21T12:00:00Z',
                            endTime: '2026-01-21T14:00:00Z'
                        }
                    ],
                    totalDelay: 10,
                    executionTimeMs: 300
                });

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-21')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert - Only VVN-202 should be missing
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.missingCount).toBe(1);
            expect(res.body.hasExistingPlans).toBe(true);
            
            // Verify VVN-202 is the missing one
            expect(res.body.data.missingVVNs).toHaveLength(1);
            expect(res.body.data.missingVVNs[0].businessId).toBe('VVN-2026-202');
            expect(res.body.data.missingVVNs[0].vesselImo).toBe('IMO4444444');
            
            // Verify both plans are listed
            expect(res.body.data.existingPlans).toHaveLength(2);
            expect(res.body.data.existingPlans.some(p => p.algorithm === 'optimal')).toBe(true);
            expect(res.body.data.existingPlans.some(p => p.algorithm === 'genetic')).toBe(true);
        });
    });

    describe('GET /api/plans/missing - Date Format Handling', () => {
        test('should handle properly formatted ISO date', async () => {
            // Arrange
            const mockPendingVVNs = [];
            app = createTestAppWithMocks(mockPendingVVNs);

            // Act - Valid ISO date format
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-25')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.date).toBe('2026-01-25');
        });
    });

    describe('GET /api/plans/missing - Response Structure Validation', () => {
        test('should return complete VVN information in response', async () => {
            // Arrange - Single VVN with all fields
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-full',
                    businessId: 'VVN-2026-FULL',
                    vesselImo: 'IMO9999999',
                    estimatedArrival: '2026-01-26T14:30:00Z',
                    estimatedDeparture: '2026-01-26T22:45:00Z',
                    assignedDockId: 'dock-premium-001',
                    assignedDockName: 'Premium Dock A1',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-26')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert - Verify complete structure
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('date', '2026-01-26');
            expect(res.body).toHaveProperty('missingCount', 1);
            expect(res.body).toHaveProperty('hasExistingPlans', false);
            expect(res.body).toHaveProperty('data');
            
            // Verify data structure
            expect(res.body.data).toHaveProperty('missingVVNs');
            expect(res.body.data).toHaveProperty('existingPlans');
            
            // Verify VVN structure
            const vvn = res.body.data.missingVVNs[0];
            expect(vvn).toHaveProperty('id', 'vvn-guid-full');
            expect(vvn).toHaveProperty('businessId', 'VVN-2026-FULL');
            expect(vvn).toHaveProperty('vesselImo', 'IMO9999999');
            expect(vvn).toHaveProperty('estimatedArrival', '2026-01-26T14:30:00Z');
            expect(vvn).toHaveProperty('estimatedDeparture', '2026-01-26T22:45:00Z');
            expect(vvn).toHaveProperty('assignedDockId', 'dock-premium-001');
            expect(vvn).toHaveProperty('assignedDockName', 'Premium Dock A1');
            expect(vvn).toHaveProperty('status', 'Submitted');
        });

        test('should return complete plan summary information', async () => {
            // Arrange
            const mockPendingVVNs = [
                {
                    id: 'vvn-guid-summary',
                    businessId: 'VVN-2026-SUMMARY',
                    vesselImo: 'IMO8888888',
                    estimatedArrival: '2026-01-27T08:00:00Z',
                    estimatedDeparture: '2026-01-27T18:00:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Test Dock',
                    status: 'Submitted'
                }
            ];

            app = createTestAppWithMocks(mockPendingVVNs);

            // Create a plan
            await request(app)
                .post('/api/plans')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    date: '2026-01-27',
                    algorithm: 'multicrane',
                    scheduledTasks: [
                        {
                            vesselVisitId: 'vvn-guid-summary',
                            vesselVisitBusinessId: 'VVN-2026-SUMMARY',
                            dockName: 'Test Dock',
                            resourceKind: 'Crane-Multi',
                            resourceId: 'R-MULTI-001',
                            staffShortName: 'Multi Operator',
                            staffId: 'S-MULTI-001',
                            startTime: '2026-01-27T08:00:00Z',
                            endTime: '2026-01-27T10:00:00Z'
                        }
                    ],
                    totalDelay: 20,
                    executionTimeMs: 500
                });

            // Act
            const res = await request(app)
                .get('/api/plans/missing?date=2026-01-27')
                .set('Authorization', `Bearer ${mockToken}`);

            // Assert - Verify plan summary structure
            expect(res.statusCode).toBe(200);
            expect(res.body.data.existingPlans).toHaveLength(1);
            
            const planSummary = res.body.data.existingPlans[0];
            expect(planSummary).toHaveProperty('planId');
            expect(planSummary).toHaveProperty('algorithm', 'multicrane');
            expect(planSummary).toHaveProperty('scheduledTasksCount', 1);
            expect(planSummary).toHaveProperty('createdAt');
            
            // Verify planId format
            expect(planSummary.planId).toMatch(/^PLAN-\d{8}-\d{4}$/);
        });
    });
});

