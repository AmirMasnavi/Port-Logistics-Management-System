import { describe, it, expect } from 'vitest';
import { DockServiceError, DockValidationError } from '../../../domain/dock/dock.errors';

describe('Dock Domain Errors', () => {
    describe('DockServiceError', () => {
        it('should create error with correct message', () => {
            const error = new DockServiceError('Test error message');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(DockServiceError);
            expect(error.message).toBe('Test error message');
            expect(error.name).toBe('DockServiceError');
        });

        it('should be throwable and catchable', () => {
            expect(() => {
                throw new DockServiceError('Something went wrong');
            }).toThrow(DockServiceError);

            expect(() => {
                throw new DockServiceError('Something went wrong');
            }).toThrow('Something went wrong');
        });

        it('should preserve stack trace', () => {
            const error = new DockServiceError('Test error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('DockValidationError', () => {
        it('should create validation error with correct message', () => {
            const error = new DockValidationError('Validation failed');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(DockServiceError);
            expect(error).toBeInstanceOf(DockValidationError);
            expect(error.message).toBe('Validation failed');
            expect(error.name).toBe('DockValidationError');
        });

        it('should be throwable and catchable as DockValidationError', () => {
            expect(() => {
                throw new DockValidationError('Invalid input');
            }).toThrow(DockValidationError);
        });

        it('should be catchable as parent DockServiceError', () => {
            expect(() => {
                throw new DockValidationError('Invalid input');
            }).toThrow(DockServiceError);
        });

        it('should be catchable as generic Error', () => {
            expect(() => {
                throw new DockValidationError('Invalid input');
            }).toThrow(Error);
        });

        it('should support different validation messages', () => {
            const messages = [
                'Dock name is required',
                'Location Zone is required',
                'Location Section is required',
                'Length must be greater than 0',
                'Depth must be greater than 0',
                'Max Draft must be greater than 0',
                'Number of STS Cranes cannot be negative',
                'Dock ID is required'
            ];


            messages.forEach(msg => {
                const error = new DockValidationError(msg);
                expect(error.message).toBe(msg);
                expect(error.name).toBe('DockValidationError');
            });
        });

        it('should preserve stack trace', () => {
            const error = new DockValidationError('Test validation error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('Error hierarchy', () => {
        it('should maintain proper inheritance chain', () => {
            const validationError = new DockValidationError('Test');
            const serviceError = new DockServiceError('Test');

            expect(validationError instanceof DockValidationError).toBe(true);
            expect(validationError instanceof DockServiceError).toBe(true);
            expect(validationError instanceof Error).toBe(true);

            expect(serviceError instanceof DockServiceError).toBe(true);
            expect(serviceError instanceof Error).toBe(true);
            expect(serviceError instanceof DockValidationError).toBe(false);
        });
    });
});

