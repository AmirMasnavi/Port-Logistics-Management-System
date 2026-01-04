/**
 * Unit Tests for OperationPlanService.getMissingPlans()
 * 
 * Type: Unit Testing (Service Layer)
 * Goal: Test the business logic of comparing VVNs with existing plans
 * Mocks: Both database repository and gateway
 * 
 * Why these tests are valuable:
 * - Test the comparison logic in isolation
 * - Verify edge cases without database overhead
 * - Test error handling scenarios
 * - Document expected behavior of the service method
 */

import { OperationPlanService } from '../../src/services/operationPlanService.js';

describe('OperationPlanService - getMissingPlans() Unit Tests', () => {
    let service;
    let mockRepository;
    let mockGateway;

    // Helper to create a mock function with call tracking
    const createMock = (returnValue) => {
        const mockFn = async (...args) => {
            mockFn.calls.push(args);
            if (mockFn.returnValue instanceof Error) {
                throw mockFn.returnValue;
            }
            return mockFn.returnValue;
        };
        mockFn.calls = [];
        mockFn.returnValue = returnValue;
        mockFn.mockResolvedValue = (value) => { mockFn.returnValue = value; return mockFn; };
        mockFn.mockRejectedValue = (error) => { mockFn.returnValue = error; return mockFn; };
        return mockFn;
    };

    beforeEach(() => {
        // Create mock repository
        mockRepository = {
            findAll: createMock([])
        };

        // Create mock gateway
        mockGateway = {
            getPendingVisitsAsync: createMock([]),
            setAuthToken: createMock(undefined)
        };

        // Create service with mocked dependencies
        service = new OperationPlanService();
        service.repository = mockRepository;
        service.masterDataGateway = mockGateway;
    });

    describe('VVN Matching Logic', () => {
        test('should match VVN by GUID id', async () => {
            // Arrange
            const testDate = '2026-01-10';
            const vvnId = 'vvn-guid-123';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                {
                    id: vvnId,
                    businessId: 'VVN-2026-001',
                    vesselImo: 'IMO1234567',
                    estimatedArrival: '2026-01-10T08:00:00Z',
                    estimatedDeparture: '2026-01-10T18:00:00Z',
                    status: 'Submitted'
                }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260110-0001',
                    date: testDate,
                    scheduledTasks: [
                        { vesselVisitId: vvnId } // Matched by GUID
                    ]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert
            expect(result.missingVVNs).toHaveLength(0); // Should NOT be in missing list
            expect(result.existingPlans).toHaveLength(1);
            expect(mockGateway.setAuthToken.calls.length).toBeGreaterThan(0);
            expect(mockGateway.setAuthToken.calls[0][0]).toBe('mock-token');
        });

        test('should match VVN by businessId', async () => {
            // Arrange
            const testDate = '2026-01-11';
            const businessId = 'VVN-2026-002';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                {
                    id: 'vvn-guid-456',
                    businessId: businessId,
                    vesselImo: 'IMO7654321',
                    estimatedArrival: '2026-01-11T08:00:00Z',
                    estimatedDeparture: '2026-01-11T18:00:00Z',
                    status: 'Submitted'
                }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260111-0001',
                    date: testDate,
                    scheduledTasks: [
                        { vesselVisitBusinessId: businessId } // Matched by businessId
                    ]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert
            expect(result.missingVVNs).toHaveLength(0); // Should NOT be in missing list
        });

        test('should detect missing VVN when neither ID matches', async () => {
            // Arrange
            const testDate = '2026-01-12';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                {
                    id: 'vvn-unmatched',
                    businessId: 'VVN-2026-MISSING',
                    vesselImo: 'IMO9999999',
                    estimatedArrival: '2026-01-12T08:00:00Z',
                    estimatedDeparture: '2026-01-12T18:00:00Z',
                    status: 'Submitted'
                }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260112-0001',
                    date: testDate,
                    scheduledTasks: [
                        { 
                            vesselVisitId: 'different-id',
                            vesselVisitBusinessId: 'VVN-2026-DIFFERENT'
                        }
                    ]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert
            expect(result.missingVVNs).toHaveLength(1);
            expect(result.missingVVNs[0].businessId).toBe('VVN-2026-MISSING');
        });

        test('should handle VVN with null or undefined IDs gracefully', async () => {
            // Arrange
            const testDate = '2026-01-13';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                {
                    id: null, // No GUID
                    businessId: 'VVN-2026-003',
                    vesselImo: 'IMO1111111',
                    estimatedArrival: '2026-01-13T08:00:00Z',
                    estimatedDeparture: '2026-01-13T18:00:00Z',
                    status: 'Submitted'
                }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260113-0001',
                    date: testDate,
                    scheduledTasks: [
                        { vesselVisitBusinessId: 'VVN-2026-003' }
                    ]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert - Should still match by businessId
            expect(result.missingVVNs).toHaveLength(0);
        });
    });

    describe('Multiple VVNs Handling', () => {
        test('should correctly identify mix of missing and present VVNs', async () => {
            // Arrange
            const testDate = '2026-01-14';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                { id: 'vvn-1', businessId: 'VVN-001', vesselImo: 'IMO1', status: 'Submitted', estimatedArrival: '2026-01-14T08:00:00Z', estimatedDeparture: '2026-01-14T18:00:00Z' },
                { id: 'vvn-2', businessId: 'VVN-002', vesselImo: 'IMO2', status: 'Submitted', estimatedArrival: '2026-01-14T09:00:00Z', estimatedDeparture: '2026-01-14T19:00:00Z' },
                { id: 'vvn-3', businessId: 'VVN-003', vesselImo: 'IMO3', status: 'Submitted', estimatedArrival: '2026-01-14T10:00:00Z', estimatedDeparture: '2026-01-14T20:00:00Z' },
                { id: 'vvn-4', businessId: 'VVN-004', vesselImo: 'IMO4', status: 'Submitted', estimatedArrival: '2026-01-14T11:00:00Z', estimatedDeparture: '2026-01-14T21:00:00Z' }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260114-0001',
                    date: testDate,
                    scheduledTasks: [
                        { vesselVisitId: 'vvn-1' }, // VVN-001 has plan
                        { vesselVisitId: 'vvn-3' }  // VVN-003 has plan
                    ]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert - VVN-002 and VVN-004 should be missing
            expect(result.missingVVNs).toHaveLength(2);
            expect(result.missingVVNs.map(v => v.businessId)).toContain('VVN-002');
            expect(result.missingVVNs.map(v => v.businessId)).toContain('VVN-004');
        });

        test('should handle multiple plans covering different VVNs', async () => {
            // Arrange
            const testDate = '2026-01-15';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                { id: 'vvn-a', businessId: 'VVN-A', vesselImo: 'IMO-A', status: 'Submitted', estimatedArrival: '2026-01-15T08:00:00Z', estimatedDeparture: '2026-01-15T18:00:00Z' },
                { id: 'vvn-b', businessId: 'VVN-B', vesselImo: 'IMO-B', status: 'Submitted', estimatedArrival: '2026-01-15T09:00:00Z', estimatedDeparture: '2026-01-15T19:00:00Z' },
                { id: 'vvn-c', businessId: 'VVN-C', vesselImo: 'IMO-C', status: 'Submitted', estimatedArrival: '2026-01-15T10:00:00Z', estimatedDeparture: '2026-01-15T20:00:00Z' }
            ]);

            // Two different plans for the same date
            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260115-0001',
                    date: testDate,
                    scheduledTasks: [{ vesselVisitId: 'vvn-a' }]
                },
                {
                    planId: 'PLAN-20260115-0002',
                    date: testDate,
                    scheduledTasks: [{ vesselVisitId: 'vvn-c' }]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert - Only VVN-B is missing
            expect(result.missingVVNs).toHaveLength(1);
            expect(result.missingVVNs[0].businessId).toBe('VVN-B');
            expect(result.existingPlans).toHaveLength(2);
        });
    });

    describe('Edge Cases', () => {
        test('should return all VVNs as missing when no plans exist', async () => {
            // Arrange
            const testDate = '2026-01-16';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                { id: 'vvn-1', businessId: 'VVN-001', vesselImo: 'IMO1', status: 'Submitted', estimatedArrival: '2026-01-16T08:00:00Z', estimatedDeparture: '2026-01-16T18:00:00Z' }
            ]);

            mockRepository.findAll.mockResolvedValue([]); // No plans

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert
            expect(result.missingVVNs).toHaveLength(1);
            expect(result.existingPlans).toHaveLength(0);
        });

        test('should return empty missing list when no VVNs exist', async () => {
            // Arrange
            const testDate = '2026-01-17';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([]); // No VVNs
            mockRepository.findAll.mockResolvedValue([]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert
            expect(result.missingVVNs).toHaveLength(0);
            expect(result.existingPlans).toHaveLength(0);
        });

        test('should handle plans with tasks that have no vessel IDs', async () => {
            // Arrange
            const testDate = '2026-01-18';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                { id: 'vvn-1', businessId: 'VVN-001', vesselImo: 'IMO1', status: 'Submitted', estimatedArrival: '2026-01-18T08:00:00Z', estimatedDeparture: '2026-01-18T18:00:00Z' }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260118-0001',
                    date: testDate,
                    scheduledTasks: [
                        { /* No vesselVisitId or vesselVisitBusinessId */ }
                    ]
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert - VVN should still be missing since plan task has no IDs
            expect(result.missingVVNs).toHaveLength(1);
        });

        test('should handle plans with empty scheduledTasks array', async () => {
            // Arrange
            const testDate = '2026-01-19';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                { id: 'vvn-1', businessId: 'VVN-001', vesselImo: 'IMO1', status: 'Submitted', estimatedArrival: '2026-01-19T08:00:00Z', estimatedDeparture: '2026-01-19T18:00:00Z' }
            ]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260119-0001',
                    date: testDate,
                    scheduledTasks: [] // Empty tasks
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert - VVN should be missing since plan has no tasks
            expect(result.missingVVNs).toHaveLength(1);
        });
    });

    describe('Response Structure', () => {
        test('should map VVN fields correctly', async () => {
            // Arrange
            const testDate = '2026-01-20';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([
                {
                    id: 'vvn-full',
                    businessId: 'VVN-FULL',
                    vesselImo: 'IMO9876543',
                    estimatedArrival: '2026-01-20T14:30:00Z',
                    estimatedDeparture: '2026-01-20T22:45:00Z',
                    assignedDockId: 'dock-001',
                    assignedDockName: 'Premium Dock',
                    status: 'Submitted'
                }
            ]);

            mockRepository.findAll.mockResolvedValue([]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert - Verify all fields are mapped
            expect(result.missingVVNs[0]).toEqual({
                id: 'vvn-full',
                businessId: 'VVN-FULL',
                vesselImo: 'IMO9876543',
                estimatedArrival: '2026-01-20T14:30:00Z',
                estimatedDeparture: '2026-01-20T22:45:00Z',
                assignedDockId: 'dock-001',
                assignedDockName: 'Premium Dock',
                status: 'Submitted'
            });
        });

        test('should map existing plan summary correctly', async () => {
            // Arrange
            const testDate = '2026-01-21';
            const createdAt = new Date('2026-01-21T06:00:00Z');

            mockGateway.getPendingVisitsAsync.mockResolvedValue([]);

            mockRepository.findAll.mockResolvedValue([
                {
                    planId: 'PLAN-20260121-0001',
                    algorithm: 'genetic',
                    scheduledTasks: [{ vesselVisitId: 'v1' }, { vesselVisitId: 'v2' }],
                    createdAt: createdAt
                }
            ]);

            // Act
            const result = await service.getMissingPlans(testDate, 'mock-token');

            // Assert
            expect(result.existingPlans[0]).toEqual({
                planId: 'PLAN-20260121-0001',
                algorithm: 'genetic',
                scheduledTasksCount: 2,
                createdAt: createdAt
            });
        });
    });

    describe('Error Handling', () => {
        test('should propagate errors from gateway', async () => {
            // Arrange
            const testDate = '2026-01-22';
            mockGateway.getPendingVisitsAsync.mockRejectedValue(new Error('Gateway connection failed'));

            // Act & Assert
            await expect(service.getMissingPlans(testDate, 'mock-token'))
                .rejects
                .toThrow('Gateway connection failed');
        });

        test('should propagate errors from repository', async () => {
            // Arrange
            const testDate = '2026-01-23';
            mockGateway.getPendingVisitsAsync.mockResolvedValue([]);
            mockRepository.findAll.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(service.getMissingPlans(testDate, 'mock-token'))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('Authentication Token Handling', () => {
        test('should set auth token on gateway when provided', async () => {
            // Arrange
            const testDate = '2026-01-24';
            const authToken = 'firebase-token-xyz';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([]);
            mockRepository.findAll.mockResolvedValue([]);

            // Act
            await service.getMissingPlans(testDate, authToken);

            // Assert
            expect(mockGateway.setAuthToken.calls.length).toBe(1);
            expect(mockGateway.setAuthToken.calls[0][0]).toBe(authToken);
        });

        test('should not fail when auth token is null', async () => {
            // Arrange
            const testDate = '2026-01-25';

            mockGateway.getPendingVisitsAsync.mockResolvedValue([]);
            mockRepository.findAll.mockResolvedValue([]);

            // Act & Assert - Should not throw
            await expect(service.getMissingPlans(testDate, null))
                .resolves
                .toBeDefined();
        });
    });
});

