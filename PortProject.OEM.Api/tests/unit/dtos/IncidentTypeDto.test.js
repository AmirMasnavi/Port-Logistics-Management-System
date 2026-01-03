/**
 * Unit Tests for IncidentTypeDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO validation logic in isolation
 * Tool: Jest
 */

import { CreateIncidentTypeDto, UpdateIncidentTypeDto } from '../../../src/application/dtos/IncidentTypeDto.js';

describe('Unit Test - IncidentTypeDto Validation', () => {
    
    describe('CreateIncidentTypeDto', () => {
        test('should return valid when all required fields are present', () => {
            const validData = {
                code: 'INC-001',
                name: 'Fire',
                description: 'Fire incident',
                severity: 'Critical'
            };
            const dto = new CreateIncidentTypeDto(validData);
            const result = dto.validate();
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should fail when code is missing', () => {
            const invalidData = {
                name: 'Fire',
                severity: 'Critical'
            };
            const dto = new CreateIncidentTypeDto(invalidData);
            const result = dto.validate();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Code is required');
        });

        test('should fail when name is missing', () => {
            const invalidData = {
                code: 'INC-001',
                severity: 'Critical'
            };
            const dto = new CreateIncidentTypeDto(invalidData);
            const result = dto.validate();
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Name is required');
        });

        test('should fail when severity is invalid', () => {
            const invalidData = {
                code: 'INC-001',
                name: 'Fire',
                severity: 'InvalidSeverity'
            };
            const dto = new CreateIncidentTypeDto(invalidData);
            const result = dto.validate();
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toMatch(/Invalid severity/);
        });
    });

    describe('UpdateIncidentTypeDto', () => {
        test('should return valid when all required fields are present', () => {
            const validData = {
                code: 'INC-001',
                name: 'Fire',
                severity: 'Critical'
            };
            const dto = new UpdateIncidentTypeDto(validData);
            const result = dto.validate();
            expect(result.isValid).toBe(true);
        });
    });
});

