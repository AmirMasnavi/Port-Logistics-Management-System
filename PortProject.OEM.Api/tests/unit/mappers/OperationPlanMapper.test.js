/**
 * US 4.1.2 - Unit Tests for OperationPlanMapper
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test Mapper transformation logic in isolation
 * Tool: Jest
 * 
 * Tests the following scenarios:
 * - toResponseDto with complete model
 * - toResponseDto with missing optional fields
 * - toResponseDto with empty scheduledTasks
 * - toListDto with multiple models
 * - toListDto with empty array
 */

import { OperationPlanMapper } from '../../../src/application/mappers/OperationPlanMapper.js';

describe('US 4.1.2 - Unit Test - OperationPlanMapper', () => {
    
    describe('toResponseDto', () => {
        test('should map all fields correctly from a complete model', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0001',
                date: '2025-12-10',
                algorithm: 'optimal',
                geneticParams: {
                    populationSize: 50,
                    generations: 100,
                    mutationRate: 0.2,
                    desiredTimeSeconds: 5,
                    craneMode: 'single'
                },
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date('2025-12-10T10:00:00Z'),
                scheduledTasks: [
                    { vesselVisitId: 'V1', startTime: new Date(), endTime: new Date() },
                    { vesselVisitId: 'V2', startTime: new Date(), endTime: new Date() }
                ],
                metrics: {
                    totalDelay: 10,
                    executionTimeMs: 250
                }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.planId).toBe('PLAN-20251210-0001');
            expect(dto.date).toBe('2025-12-10');
            expect(dto.algorithm).toBe('optimal');
            expect(dto.geneticParams).toEqual(model.geneticParams);
            expect(dto.createdBy).toBe('user@test.com');
            expect(dto.status).toBe('Confirmed');
            expect(dto.createdAt).toEqual(model.createdAt);
            expect(dto.scheduledTasksCount).toBe(2);
            expect(dto.metrics).toEqual(model.metrics);
        });

        test('should handle model with missing scheduledTasks', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0002',
                date: '2025-12-10',
                algorithm: 'genetic',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                scheduledTasks: null, // Missing
                metrics: { totalDelay: 0, executionTimeMs: 0 }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.scheduledTasksCount).toBe(0);
        });

        test('should handle model with undefined scheduledTasks', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0003',
                date: '2025-12-10',
                algorithm: 'multicrane',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                // scheduledTasks not defined
                metrics: { totalDelay: 0, executionTimeMs: 0 }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.scheduledTasksCount).toBe(0);
        });

        test('should handle model with empty scheduledTasks array', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0004',
                date: '2025-12-10',
                algorithm: 'optimal',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                scheduledTasks: [], // Empty array
                metrics: { totalDelay: 0, executionTimeMs: 0 }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.scheduledTasksCount).toBe(0);
        });

        test('should count scheduledTasks correctly with multiple tasks', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0005',
                date: '2025-12-10',
                algorithm: 'optimal',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                scheduledTasks: [
                    { vesselVisitId: 'V1' },
                    { vesselVisitId: 'V2' },
                    { vesselVisitId: 'V3' },
                    { vesselVisitId: 'V4' },
                    { vesselVisitId: 'V5' }
                ],
                metrics: { totalDelay: 0, executionTimeMs: 0 }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.scheduledTasksCount).toBe(5);
        });

        test('should handle model without geneticParams', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0006',
                date: '2025-12-10',
                algorithm: 'optimal', // No genetic params needed
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                scheduledTasks: [{ vesselVisitId: 'V1' }],
                metrics: { totalDelay: 0, executionTimeMs: 0 }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.geneticParams).toBeUndefined();
        });

        test('should preserve all metrics fields', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0007',
                date: '2025-12-10',
                algorithm: 'genetic',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                scheduledTasks: [{ vesselVisitId: 'V1' }],
                metrics: {
                    totalDelay: 125.5,
                    executionTimeMs: 1234.56,
                    additionalMetric: 'extra' // Should be preserved
                }
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.metrics.totalDelay).toBe(125.5);
            expect(dto.metrics.executionTimeMs).toBe(1234.56);
            expect(dto.metrics.additionalMetric).toBe('extra');
        });
    });

    describe('toListDto', () => {
        test('should map array of models to array of DTOs', () => {
            // Arrange
            const models = [
                {
                    planId: 'PLAN-20251210-0001',
                    date: '2025-12-10',
                    algorithm: 'optimal',
                    createdBy: 'user1@test.com',
                    status: 'Confirmed',
                    createdAt: new Date('2025-12-10T10:00:00Z'),
                    scheduledTasks: [{ vesselVisitId: 'V1' }],
                    metrics: { totalDelay: 0, executionTimeMs: 100 }
                },
                {
                    planId: 'PLAN-20251209-0001',
                    date: '2025-12-09',
                    algorithm: 'genetic',
                    createdBy: 'user2@test.com',
                    status: 'Confirmed',
                    createdAt: new Date('2025-12-09T15:30:00Z'),
                    scheduledTasks: [
                        { vesselVisitId: 'V2' },
                        { vesselVisitId: 'V3' }
                    ],
                    metrics: { totalDelay: 5, executionTimeMs: 200 }
                },
                {
                    planId: 'PLAN-20251208-0001',
                    date: '2025-12-08',
                    algorithm: 'multicrane',
                    createdBy: 'user3@test.com',
                    status: 'Confirmed',
                    createdAt: new Date('2025-12-08T08:00:00Z'),
                    scheduledTasks: [
                        { vesselVisitId: 'V4' },
                        { vesselVisitId: 'V5' },
                        { vesselVisitId: 'V6' }
                    ],
                    metrics: { totalDelay: 10, executionTimeMs: 300 }
                }
            ];

            // Act
            const dtos = OperationPlanMapper.toListDto(models);

            // Assert
            expect(dtos).toHaveLength(3);
            expect(dtos[0].planId).toBe('PLAN-20251210-0001');
            expect(dtos[0].scheduledTasksCount).toBe(1);
            expect(dtos[1].planId).toBe('PLAN-20251209-0001');
            expect(dtos[1].scheduledTasksCount).toBe(2);
            expect(dtos[2].planId).toBe('PLAN-20251208-0001');
            expect(dtos[2].scheduledTasksCount).toBe(3);
        });

        test('should handle empty array', () => {
            // Arrange
            const models = [];

            // Act
            const dtos = OperationPlanMapper.toListDto(models);

            // Assert
            expect(dtos).toHaveLength(0);
            expect(Array.isArray(dtos)).toBe(true);
        });

        test('should handle array with single model', () => {
            // Arrange
            const models = [
                {
                    planId: 'PLAN-20251210-0001',
                    date: '2025-12-10',
                    algorithm: 'optimal',
                    createdBy: 'user@test.com',
                    status: 'Confirmed',
                    createdAt: new Date(),
                    scheduledTasks: [{ vesselVisitId: 'V1' }],
                    metrics: { totalDelay: 0, executionTimeMs: 100 }
                }
            ];

            // Act
            const dtos = OperationPlanMapper.toListDto(models);

            // Assert
            expect(dtos).toHaveLength(1);
            expect(dtos[0].planId).toBe('PLAN-20251210-0001');
        });

        test('should handle models with mixed scheduledTasks counts', () => {
            // Arrange
            const models = [
                {
                    planId: 'PLAN-20251210-0001',
                    date: '2025-12-10',
                    algorithm: 'optimal',
                    createdBy: 'user@test.com',
                    status: 'Confirmed',
                    createdAt: new Date(),
                    scheduledTasks: [], // Empty
                    metrics: { totalDelay: 0, executionTimeMs: 0 }
                },
                {
                    planId: 'PLAN-20251210-0002',
                    date: '2025-12-10',
                    algorithm: 'genetic',
                    createdBy: 'user@test.com',
                    status: 'Confirmed',
                    createdAt: new Date(),
                    scheduledTasks: null, // Null
                    metrics: { totalDelay: 0, executionTimeMs: 0 }
                },
                {
                    planId: 'PLAN-20251210-0003',
                    date: '2025-12-10',
                    algorithm: 'multicrane',
                    createdBy: 'user@test.com',
                    status: 'Confirmed',
                    createdAt: new Date(),
                    scheduledTasks: [
                        { vesselVisitId: 'V1' },
                        { vesselVisitId: 'V2' },
                        { vesselVisitId: 'V3' },
                        { vesselVisitId: 'V4' },
                        { vesselVisitId: 'V5' },
                        { vesselVisitId: 'V6' },
                        { vesselVisitId: 'V7' },
                        { vesselVisitId: 'V8' },
                        { vesselVisitId: 'V9' },
                        { vesselVisitId: 'V10' }
                    ], // Many tasks
                    metrics: { totalDelay: 50, executionTimeMs: 500 }
                }
            ];

            // Act
            const dtos = OperationPlanMapper.toListDto(models);

            // Assert
            expect(dtos[0].scheduledTasksCount).toBe(0);
            expect(dtos[1].scheduledTasksCount).toBe(0);
            expect(dtos[2].scheduledTasksCount).toBe(10);
        });
    });

    describe('Edge Cases', () => {
        test('should handle model with all optional fields missing', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0001',
                date: '2025-12-10',
                algorithm: 'optimal',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date()
                // All optional fields missing
            };

            // Act
            const dto = OperationPlanMapper.toResponseDto(model);

            // Assert
            expect(dto.planId).toBe('PLAN-20251210-0001');
            expect(dto.scheduledTasksCount).toBe(0);
            expect(dto.geneticParams).toBeUndefined();
            expect(dto.metrics).toBeUndefined();
        });

        test('should not modify the original model object', () => {
            // Arrange
            const model = {
                planId: 'PLAN-20251210-0001',
                date: '2025-12-10',
                algorithm: 'optimal',
                createdBy: 'user@test.com',
                status: 'Confirmed',
                createdAt: new Date(),
                scheduledTasks: [{ vesselVisitId: 'V1' }],
                metrics: { totalDelay: 10, executionTimeMs: 100 }
            };

            const originalModel = { ...model };

            // Act
            OperationPlanMapper.toResponseDto(model);

            // Assert - Original model should be unchanged
            expect(model.planId).toBe(originalModel.planId);
            expect(model.scheduledTasks).toEqual(originalModel.scheduledTasks);
        });
    });
});

