import { describe, it, expect } from 'vitest';
import { VesselServiceError, VesselValidationError } from '../../../domain/vessel/vessel.errors';

describe('Vessel Domain Errors', () => {
    describe('VesselServiceError', () => {
        it('should create error with correct message', () => {
            const error = new VesselServiceError('Test error message');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VesselServiceError);
            expect(error.message).toBe('Test error message');
            expect(error.name).toBe('VesselServiceError');
        });

        it('should be throwable and catchable', () => {
            expect(() => {
                throw new VesselServiceError('Something went wrong');
            }).toThrow(VesselServiceError);

            expect(() => {
                throw new VesselServiceError('Something went wrong');
            }).toThrow('Something went wrong');
        });

        it('should preserve stack trace', () => {
            const error = new VesselServiceError('Test error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('VesselValidationError', () => {
        it('should create validation error with correct message', () => {
            const error = new VesselValidationError('Validation failed');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VesselServiceError);
            expect(error).toBeInstanceOf(VesselValidationError);
            expect(error.message).toBe('Validation failed');
            expect(error.name).toBe('VesselValidationError');
        });

        it('should be throwable and catchable as VesselValidationError', () => {
            expect(() => {
                throw new VesselValidationError('Invalid input');
            }).toThrow(VesselValidationError);
        });

        it('should be catchable as parent VesselServiceError', () => {
            expect(() => {
                throw new VesselValidationError('Invalid input');
            }).toThrow(VesselServiceError);
        });

        it('should be catchable as generic Error', () => {
            expect(() => {
                throw new VesselValidationError('Invalid input');
            }).toThrow(Error);
        });

        it('should support different validation messages', () => {
            const messages = [
                'Vessel name is required',
                'IMO Number is required',
                'IMO Number must be valid',
                'Operator is required',
                'Vessel Type ID is required',
                'Vessel ID is required'
            ];

            messages.forEach(msg => {
                const error = new VesselValidationError(msg);
                expect(error.message).toBe(msg);
                expect(error.name).toBe('VesselValidationError');
            });
        });

        it('should preserve stack trace', () => {
            const error = new VesselValidationError('Test validation error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('Error hierarchy', () => {
        it('should maintain proper inheritance chain', () => {
            const validationError = new VesselValidationError('Test');
            const serviceError = new VesselServiceError('Test');

            expect(validationError instanceof VesselValidationError).toBe(true);
            expect(validationError instanceof VesselServiceError).toBe(true);
            expect(validationError instanceof Error).toBe(true);

            expect(serviceError instanceof VesselServiceError).toBe(true);
            expect(serviceError instanceof Error).toBe(true);
            expect(serviceError instanceof VesselValidationError).toBe(false);
        });
    });
});

