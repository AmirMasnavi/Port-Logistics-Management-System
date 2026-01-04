/**
 * Unit Tests for ComplementaryTaskCategories Model
 * 
 * Type: Unit Testing
 * Goal: Test Mongoose Schema Validation
 * Tool: Jest + Mongoose
 */

import mongoose from 'mongoose';
import ComplementaryTaskCategory from '../../../src/domain/models/ComplementaryTaskCategories.js';

describe('Unit Test - ComplementaryTaskCategories Model', () => {
    
    test('should validate a valid complementary task category', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check',
            description: 'Pre-departure security inspection',
            defaultDurationMinutes: 30,
            expectedImpactMinutes: 45,
            isActive: true,
            group: 'Safety and Security'
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
    });

    test('should fail when required fields are missing', () => {
        const category = new ComplementaryTaskCategory({});
        const error = category.validateSync();
        
        expect(error.errors.categoryId).toBeDefined();
        expect(error.errors.code).toBeDefined();
        expect(error.errors.name).toBeDefined();
    });

    test('should fail when categoryId is missing', () => {
        const category = new ComplementaryTaskCategory({
            code: 'CTC001',
            name: 'Security Check'
        });
        const error = category.validateSync();
        
        expect(error.errors.categoryId).toBeDefined();
    });

    test('should fail when code is missing', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            name: 'Security Check'
        });
        const error = category.validateSync();
        
        expect(error.errors.code).toBeDefined();
    });

    test('should fail when name is missing', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001'
        });
        const error = category.validateSync();
        
        expect(error.errors.name).toBeDefined();
    });

    test('should default description to empty string when not provided', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check'
        });

        expect(category.description).toBe('');
    });

    test('should default isActive to true when not provided', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check'
        });

        expect(category.isActive).toBe(true);
    });

    test('should default group to Other when not provided', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check'
        });

        expect(category.group).toBe('Other');
    });

    test('should default defaultDurationMinutes to null when not provided', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check'
        });

        expect(category.defaultDurationMinutes).toBeNull();
    });

    test('should default expectedImpactMinutes to null when not provided', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check'
        });

        expect(category.expectedImpactMinutes).toBeNull();
    });

    test('should accept all valid group values', () => {
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
        
        validGroups.forEach((group, index) => {
            const category = new ComplementaryTaskCategory({
                categoryId: `CTC-2025-${index + 1}`,
                code: `CTC${String(index + 1).padStart(3, '0')}`,
                name: `Category ${index + 1}`,
                group: group
            });

            const error = category.validateSync();
            expect(error).toBeUndefined();
            expect(category.group).toBe(group);
        });
    });

    test('should fail when group is invalid', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check',
            group: 'Invalid Group'
        });

        const error = category.validateSync();
        expect(error.errors.group).toBeDefined();
    });

    test('should accept isActive as false', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Deprecated Check',
            isActive: false
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.isActive).toBe(false);
    });

    test('should accept numeric duration values', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Maintenance Task',
            defaultDurationMinutes: 120,
            expectedImpactMinutes: 180
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.defaultDurationMinutes).toBe(120);
        expect(category.expectedImpactMinutes).toBe(180);
    });

    test('should accept zero duration values', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Instant Task',
            defaultDurationMinutes: 0,
            expectedImpactMinutes: 0
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.defaultDurationMinutes).toBe(0);
        expect(category.expectedImpactMinutes).toBe(0);
    });

    test('should accept null duration values', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Variable Duration Task',
            defaultDurationMinutes: null,
            expectedImpactMinutes: null
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.defaultDurationMinutes).toBeNull();
        expect(category.expectedImpactMinutes).toBeNull();
    });

    test('should accept large duration values', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Extended Task',
            defaultDurationMinutes: 1440, // 24 hours
            expectedImpactMinutes: 2880  // 48 hours
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.defaultDurationMinutes).toBe(1440);
        expect(category.expectedImpactMinutes).toBe(2880);
    });

    test('should accept empty description', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Simple Task',
            description: ''
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.description).toBe('');
    });

    test('should accept long description', () => {
        const longDescription = 'This is a very long description that contains detailed information about the task category and its purpose. '.repeat(10);
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Detailed Task',
            description: longDescription
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.description).toBe(longDescription);
    });

    test('should automatically set createdAt timestamp', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check'
        });

        expect(category.createdAt).toBeDefined();
        expect(category.createdAt).toBeInstanceOf(Date);
    });

    test('should allow manual createdAt timestamp', () => {
        const customDate = new Date('2025-01-01T00:00:00Z');
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Security Check',
            createdAt: customDate
        });

        expect(category.createdAt).toEqual(customDate);
    });

    test('should handle all fields together', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Comprehensive Check',
            description: 'Full security and safety inspection',
            defaultDurationMinutes: 45,
            expectedImpactMinutes: 60,
            isActive: true,
            group: 'Safety and Security',
            createdAt: new Date('2025-01-01T00:00:00Z')
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.categoryId).toBe('CTC-2025-001');
        expect(category.code).toBe('CTC001');
        expect(category.name).toBe('Comprehensive Check');
        expect(category.description).toBe('Full security and safety inspection');
        expect(category.defaultDurationMinutes).toBe(45);
        expect(category.expectedImpactMinutes).toBe(60);
        expect(category.isActive).toBe(true);
        expect(category.group).toBe('Safety and Security');
    });

    test('should handle minimal valid category', () => {
        const category = new ComplementaryTaskCategory({
            categoryId: 'CTC-2025-001',
            code: 'CTC001',
            name: 'Minimal Task'
        });

        const error = category.validateSync();
        expect(error).toBeUndefined();
        expect(category.categoryId).toBe('CTC-2025-001');
        expect(category.code).toBe('CTC001');
        expect(category.name).toBe('Minimal Task');
        expect(category.description).toBe('');
        expect(category.defaultDurationMinutes).toBeNull();
        expect(category.expectedImpactMinutes).toBeNull();
        expect(category.isActive).toBe(true);
        expect(category.group).toBe('Other');
    });
});

