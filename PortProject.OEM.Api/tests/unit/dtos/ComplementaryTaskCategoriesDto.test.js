/**
 * Unit Tests for ComplementaryTaskCategoriesDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO instantiation and property assignment
 * Tool: Jest
 */

import { 
    ComplementaryTaskCategoryDto,
    CreateComplementaryTaskCategoryDto, 
    UpdateComplementaryTaskCategoryDto, 
    ComplementaryTaskCategoryFilterDto 
} from '../../../src/application/dtos/ComplementaryTaskCategoriesDto.js';

describe('Unit Test - ComplementaryTaskCategoriesDto', () => {
    
    describe('ComplementaryTaskCategoryDto', () => {
        test('should correctly assign all properties', () => {
            const createdAt = new Date();
            
            const dto = new ComplementaryTaskCategoryDto({
                id: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Security Check',
                description: 'Pre-departure security inspection',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                createdAt: createdAt,
                group: 'Safety and Security'
            });
            
            expect(dto.categoryId).toBe('CTC-2025-001');
            expect(dto.code).toBe('CTC001');
            expect(dto.name).toBe('Security Check');
            expect(dto.description).toBe('Pre-departure security inspection');
            expect(dto.defaultDurationMinutes).toBe(30);
            expect(dto.expectedImpactMinutes).toBe(45);
            expect(dto.isActive).toBe(true);
            expect(dto.createdAt).toBe(createdAt);
            expect(dto.group).toBe('Safety and Security');
        });

        test('should default description to empty string when not provided', () => {
            const dto = new ComplementaryTaskCategoryDto({
                id: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Security Check'
            });
            
            expect(dto.description).toBe('');
        });

        test('should default isActive to true when not provided', () => {
            const dto = new ComplementaryTaskCategoryDto({
                id: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Security Check'
            });
            
            expect(dto.isActive).toBe(true);
        });

        test('should default group to Other when not provided', () => {
            const dto = new ComplementaryTaskCategoryDto({
                id: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Security Check'
            });
            
            expect(dto.group).toBe('Other');
        });

        test('should handle null values for optional duration fields', () => {
            const dto = new ComplementaryTaskCategoryDto({
                id: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Security Check',
                defaultDurationMinutes: null,
                expectedImpactMinutes: null
            });
            
            expect(dto.defaultDurationMinutes).toBeNull();
            expect(dto.expectedImpactMinutes).toBeNull();
        });

        test('should handle isActive as false', () => {
            const dto = new ComplementaryTaskCategoryDto({
                id: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Deprecated Check',
                isActive: false
            });
            
            expect(dto.isActive).toBe(false);
        });
    });

    describe('CreateComplementaryTaskCategoryDto', () => {
        test('should correctly assign all required properties', () => {
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check',
                description: 'Pre-departure security inspection',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Safety and Security'
            });
            
            expect(dto.code).toBe('CTC001');
            expect(dto.name).toBe('Security Check');
            expect(dto.description).toBe('Pre-departure security inspection');
            expect(dto.defaultDurationMinutes).toBe(30);
            expect(dto.expectedImpactMinutes).toBe(45);
            expect(dto.isActive).toBe(true);
            expect(dto.group).toBe('Safety and Security');
        });

        test('should default description to empty string', () => {
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            expect(dto.description).toBe('');
        });

        test('should default isActive to true', () => {
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            expect(dto.isActive).toBe(true);
        });

        test('should default group to Other', () => {
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            expect(dto.group).toBe('Other');
        });

        test('should handle null duration values', () => {
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check',
                defaultDurationMinutes: null,
                expectedImpactMinutes: null
            });
            
            expect(dto.defaultDurationMinutes).toBeNull();
            expect(dto.expectedImpactMinutes).toBeNull();
        });

        test('should accept all valid groups', () => {
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

            validGroups.forEach(group => {
                const dto = new CreateComplementaryTaskCategoryDto({
                    code: `CTC-${group}`,
                    name: 'Test Category',
                    group: group
                });

                expect(dto.group).toBe(group);
            });
        });

        test('should handle numeric duration values', () => {
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Maintenance Task',
                defaultDurationMinutes: 120,
                expectedImpactMinutes: 180
            });
            
            expect(dto.defaultDurationMinutes).toBe(120);
            expect(dto.expectedImpactMinutes).toBe(180);
        });
    });

    describe('UpdateComplementaryTaskCategoryDto', () => {
        test('should only assign provided properties', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                name: 'Updated Security Check',
                isActive: false
            });
            
            expect(dto.name).toBe('Updated Security Check');
            expect(dto.isActive).toBe(false);
            expect(dto.description).toBeUndefined();
            expect(dto.code).toBeUndefined();
        });

        test('should update name when provided', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                name: 'New Category Name' 
            });
            
            expect(dto.name).toBe('New Category Name');
        });

        test('should update description when provided', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                description: 'Updated description' 
            });
            
            expect(dto.description).toBe('Updated description');
        });

        test('should update defaultDurationMinutes when provided', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                defaultDurationMinutes: 60 
            });
            
            expect(dto.defaultDurationMinutes).toBe(60);
        });

        test('should update expectedImpactMinutes when provided', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                expectedImpactMinutes: 90 
            });
            
            expect(dto.expectedImpactMinutes).toBe(90);
        });

        test('should update isActive when provided', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                isActive: false 
            });
            
            expect(dto.isActive).toBe(false);
        });

        test('should update group when provided', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                group: 'Maintenance' 
            });
            
            expect(dto.group).toBe('Maintenance');
        });

        test('should handle empty update', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({});
            
            expect(Object.keys(dto).length).toBe(0);
        });

        test('should handle multiple properties update', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                name: 'New Name',
                description: 'New Description',
                defaultDurationMinutes: 45,
                expectedImpactMinutes: 60,
                isActive: true,
                group: 'Safety and Security'
            });
            
            expect(dto.name).toBe('New Name');
            expect(dto.description).toBe('New Description');
            expect(dto.defaultDurationMinutes).toBe(45);
            expect(dto.expectedImpactMinutes).toBe(60);
            expect(dto.isActive).toBe(true);
            expect(dto.group).toBe('Safety and Security');
        });

        test('should allow null values for duration fields', () => {
            const dto = new UpdateComplementaryTaskCategoryDto({ 
                defaultDurationMinutes: null,
                expectedImpactMinutes: null
            });
            
            expect(dto.defaultDurationMinutes).toBeNull();
            expect(dto.expectedImpactMinutes).toBeNull();
        });
    });

    describe('ComplementaryTaskCategoryFilterDto', () => {
        test('should only assign provided filter properties', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                code: 'CTC001',
                active: true 
            });
            
            expect(dto.code).toBe('CTC001');
            expect(dto.active).toBe(true);
            expect(dto.nameContains).toBeUndefined();
            expect(dto.group).toBeUndefined();
        });

        test('should filter by code', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                code: 'CTC001' 
            });
            
            expect(dto.code).toBe('CTC001');
        });

        test('should filter by nameContains', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                nameContains: 'Security' 
            });
            
            expect(dto.nameContains).toBe('Security');
        });

        test('should filter by active status', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                active: false 
            });
            
            expect(dto.active).toBe(false);
        });

        test('should filter by defaultDurationMinutes', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                defaultDurationMinutes: 30 
            });
            
            expect(dto.defaultDurationMinutes).toBe(30);
        });

        test('should filter by expectedImpactMinutes', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                expectedImpactMinutes: 45 
            });
            
            expect(dto.expectedImpactMinutes).toBe(45);
        });

        test('should filter by group', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                group: 'Maintenance' 
            });
            
            expect(dto.group).toBe('Maintenance');
        });

        test('should handle multiple filters', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({ 
                code: 'CTC001',
                nameContains: 'Security',
                active: true,
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                group: 'Safety and Security'
            });
            
            expect(dto.code).toBe('CTC001');
            expect(dto.nameContains).toBe('Security');
            expect(dto.active).toBe(true);
            expect(dto.defaultDurationMinutes).toBe(30);
            expect(dto.expectedImpactMinutes).toBe(45);
            expect(dto.group).toBe('Safety and Security');
        });

        test('should handle empty filter', () => {
            const dto = new ComplementaryTaskCategoryFilterDto({});
            
            expect(Object.keys(dto).length).toBe(0);
        });
    });
});

