/**
 * US 4.1.2 - Unit Tests for CreateOperationPlanDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO validation logic in isolation (no database, no API)
 * Tool: Jest
 * 
 * Tests the following scenarios:
 * - Valid DTO with all required fields
 * - Missing required fields (date, algorithm, scheduledTasks)
 * - Empty scheduledTasks array
 * - Invalid data types
 */

import { CreateOperationPlanDto } from '../../../src/application/dtos/OperationPlanDto.js';

describe('US 4.1.2 - Unit Test - CreateOperationPlanDto Validation', () => {
    
    describe('Valid DTO Creation', () => {
        test('should return valid when all required fields are present', () => {
            // Arrange
            const validData = {
                date: '2025-12-10',
                algorithm: 'optimal',
                scheduledTasks: [
                    { 
                        vesselVisitId: 'V1', 
                        startTime: new Date('2025-12-10T08:00:00Z'),
                        endTime: new Date('2025-12-10T10:00:00Z')
                    }
                ],
                totalDelay: 10,
                executionTimeMs: 100
            };

            // Act
            const dto = new CreateOperationPlanDto(validData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should accept multiple scheduled tasks', () => {
            // Arrange
            const validData = {
                date: '2025-12-10',
                algorithm: 'genetic',
                scheduledTasks: [
                    { vesselVisitId: 'V1', startTime: new Date(), endTime: new Date() },
                    { vesselVisitId: 'V2', startTime: new Date(), endTime: new Date() },
                    { vesselVisitId: 'V3', startTime: new Date(), endTime: new Date() }
                ],
                totalDelay: 0,
                executionTimeMs: 250,
                geneticParams: {
                    populationSize: 50,
                    generations: 100,
                    mutationRate: 0.2,
                    desiredTimeSeconds: 5,
                    craneMode: 'single'
                }
            };

            // Act
            const dto = new CreateOperationPlanDto(validData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(true);
            expect(dto.scheduledTasks).toHaveLength(3);
        });
    });

    describe('Missing Required Fields', () => {
        test('should fail when date is missing', () => {
            // Arrange
            const invalidData = {
                algorithm: 'optimal',
                scheduledTasks: [{ vesselVisitId: 'V1' }]
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target date is required');
        });

        test('should fail when algorithm is missing', () => {
            // Arrange
            const invalidData = {
                date: '2025-12-10',
                scheduledTasks: [{ vesselVisitId: 'V1' }]
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Algorithm type is required');
        });

        test('should fail when scheduledTasks is missing', () => {
            // Arrange
            const invalidData = {
                date: '2025-12-10',
                algorithm: 'optimal'
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Scheduled tasks are required and must be an array');
        });
    });

    describe('Invalid ScheduledTasks', () => {
        test('should fail when scheduledTasks is an empty array', () => {
            // Arrange
            const invalidData = {
                date: '2025-12-10',
                algorithm: 'optimal',
                scheduledTasks: [] // Empty array
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Scheduled tasks are required and must be an array');
        });

        test('should fail when scheduledTasks is not an array', () => {
            // Arrange
            const invalidData = {
                date: '2025-12-10',
                algorithm: 'optimal',
                scheduledTasks: 'not-an-array' // Invalid type
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Scheduled tasks are required and must be an array');
        });

        test('should fail when scheduledTasks is null', () => {
            // Arrange
            const invalidData = {
                date: '2025-12-10',
                algorithm: 'optimal',
                scheduledTasks: null
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Scheduled tasks are required and must be an array');
        });
    });

    describe('Multiple Validation Errors', () => {
        test('should return all validation errors when multiple fields are missing', () => {
            // Arrange
            const invalidData = {
                scheduledTasks: [] // Only invalid field present
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3); // date, algorithm, scheduledTasks
            expect(result.errors).toContain('Target date is required');
            expect(result.errors).toContain('Algorithm type is required');
            expect(result.errors).toContain('Scheduled tasks are required and must be an array');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty string for date', () => {
            // Arrange
            const invalidData = {
                date: '', // Empty string
                algorithm: 'optimal',
                scheduledTasks: [{ vesselVisitId: 'V1' }]
            };

            // Act
            const dto = new CreateOperationPlanDto(invalidData);
            const result = dto.validate();

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target date is required');
        });

        test('should accept whitespace-only string for algorithm as valid', () => {
            // Arrange
            const data = {
                date: '2025-12-10',
                algorithm: '   ', // Whitespace only - DTO doesn't trim, so it's considered present
                scheduledTasks: [{ vesselVisitId: 'V1' }]
            };

            // Act
            const dto = new CreateOperationPlanDto(data);
            const result = dto.validate();

            // Assert
            // The DTO validation checks for presence, not trimmed values
            // So whitespace-only strings pass validation
            expect(result.isValid).toBe(true);
        });
    });
});

