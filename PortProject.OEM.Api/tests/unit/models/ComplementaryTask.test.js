/**
 * Unit Tests for ComplementaryTask Model
 * 
 * Type: Unit Testing
 * Goal: Test Mongoose Schema Validation
 * Tool: Jest + Mongoose
 */

import mongoose from 'mongoose';
import ComplementaryTask from '../../../src/domain/models/ComplementaryTask.js';

describe('Unit Test - ComplementaryTask Model', () => {
    
    test('should validate a valid complementary task', () => {
        const task = new ComplementaryTask({
            taskId: 'CT-2026-001',
            categoryId: 'CAT-001',
            vveId: 'VVE-001',
            responsibleTeam: 'Safety Team',
            startTime: new Date(),
            status: 'PENDING',
            suspendsOperations: false,
            createdBy: 'User'
        });

        const error = task.validateSync();
        expect(error).toBeUndefined();
    });

    test('should fail when required fields are missing', () => {
        const task = new ComplementaryTask({});
        const error = task.validateSync();
        
        expect(error.errors.taskId).toBeDefined();
        expect(error.errors.categoryId).toBeDefined();
        expect(error.errors.vveId).toBeDefined();
        expect(error.errors.responsibleTeam).toBeDefined();
        expect(error.errors.startTime).toBeDefined();
        expect(error.errors.createdBy).toBeDefined();
    });

    test('should fail when status is invalid', () => {
        const task = new ComplementaryTask({
            taskId: 'CT-2026-001',
            categoryId: 'CAT-001',
            vveId: 'VVE-001',
            responsibleTeam: 'Safety Team',
            startTime: new Date(),
            status: 'INVALID_STATUS',
            createdBy: 'User'
        });

        const error = task.validateSync();
        expect(error.errors.status).toBeDefined();
    });

    test('should default status to PENDING when not provided', () => {
        const task = new ComplementaryTask({
            taskId: 'CT-2026-001',
            categoryId: 'CAT-001',
            vveId: 'VVE-001',
            responsibleTeam: 'Safety Team',
            startTime: new Date(),
            createdBy: 'User'
        });

        expect(task.status).toBe('PENDING');
    });

    test('should default suspendsOperations to false when not provided', () => {
        const task = new ComplementaryTask({
            taskId: 'CT-2026-001',
            categoryId: 'CAT-001',
            vveId: 'VVE-001',
            responsibleTeam: 'Safety Team',
            startTime: new Date(),
            createdBy: 'User'
        });

        expect(task.suspendsOperations).toBe(false);
    });

    test('should accept valid status values', () => {
        const validStatuses = ['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
        
        validStatuses.forEach(status => {
            const task = new ComplementaryTask({
                taskId: `CT-2026-${status}`,
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                status: status,
                createdBy: 'User'
            });

            const error = task.validateSync();
            expect(error).toBeUndefined();
        });
    });

    test('should allow suspendsOperations to be true', () => {
        const task = new ComplementaryTask({
            taskId: 'CT-2026-001',
            categoryId: 'CAT-001',
            vveId: 'VVE-001',
            responsibleTeam: 'Maintenance Crew',
            startTime: new Date(),
            suspendsOperations: true,
            createdBy: 'User'
        });

        const error = task.validateSync();
        expect(error).toBeUndefined();
        expect(task.suspendsOperations).toBe(true);
    });

    test('should allow optional fields to be empty', () => {
        const task = new ComplementaryTask({
            taskId: 'CT-2026-001',
            categoryId: 'CAT-001',
            vveId: 'VVE-001',
            responsibleTeam: 'Safety Team',
            startTime: new Date(),
            createdBy: 'User',
            description: '',
            endTime: null
        });

        const error = task.validateSync();
        expect(error).toBeUndefined();
    });
});

