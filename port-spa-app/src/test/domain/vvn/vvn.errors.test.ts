import { describe, it, expect } from 'vitest';
import { VvnServiceError, VvnValidationError } from '../../../domain/vvn/vvn.errors';

describe('VVN Domain Errors', () => {
    describe('VvnServiceError', () => {
        it('should create error with correct message', () => {
            const error = new VvnServiceError('Test error message');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VvnServiceError);
            expect(error.message).toBe('Test error message');
            expect(error.name).toBe('VvnServiceError');
        });

        it('should be throwable and catchable', () => {
            expect(() => {
                throw new VvnServiceError('Something went wrong');
            }).toThrow(VvnServiceError);

            expect(() => {
                throw new VvnServiceError('Something went wrong');
            }).toThrow('Something went wrong');
        });

        it('should preserve stack trace', () => {
            const error = new VvnServiceError('Test error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('VvnValidationError', () => {
        it('should create validation error with correct message', () => {
            const error = new VvnValidationError('Validation failed');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VvnServiceError);
            expect(error).toBeInstanceOf(VvnValidationError);
            expect(error.message).toBe('Validation failed');
            expect(error.name).toBe('VvnValidationError');
        });

        it('should be throwable and catchable as VvnValidationError', () => {
            expect(() => {
                throw new VvnValidationError('Invalid input');
            }).toThrow(VvnValidationError);
        });

        it('should be catchable as parent VvnServiceError', () => {
            expect(() => {
                throw new VvnValidationError('Invalid input');
            }).toThrow(VvnServiceError);
        });

        it('should be catchable as generic Error', () => {
            expect(() => {
                throw new VvnValidationError('Invalid input');
            }).toThrow(Error);
        });

        it('should support different validation messages', () => {
            const messages = [
                'Vessel IMO is required.',
                'Departure date must be after arrival date.',
                'All containers must have a valid container code.',
                'A dock must be assigned for approval.',
                'A valid reason is required for rejection.'
            ];

            messages.forEach(msg => {
                const error = new VvnValidationError(msg);
                expect(error.message).toBe(msg);
                expect(error.name).toBe('VvnValidationError');
            });
        });

        it('should preserve stack trace', () => {
            const error = new VvnValidationError('Test validation error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('Error hierarchy', () => {
        it('should maintain proper inheritance chain', () => {
            const validationError = new VvnValidationError('Test');
            const serviceError = new VvnServiceError('Test');

            expect(validationError instanceof VvnValidationError).toBe(true);
            expect(validationError instanceof VvnServiceError).toBe(true);
            expect(validationError instanceof Error).toBe(true);

            expect(serviceError instanceof VvnServiceError).toBe(true);
            expect(serviceError instanceof Error).toBe(true);
            expect(serviceError instanceof VvnValidationError).toBe(false);
        });
    });
});

