import { describe, it, expect } from 'vitest';
import { VesselTypeServiceError, VesselTypeValidationError } from '../../../domain/vesselType/vesselType.errors';

describe('VesselType Domain Errors', () => {
    describe('VesselTypeServiceError', () => {
        it('should create error with correct message', () => {
            const error = new VesselTypeServiceError('Test error message');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VesselTypeServiceError);
            expect(error.message).toBe('Test error message');
            expect(error.name).toBe('VesselTypeServiceError');
        });

        it('should be throwable and catchable', () => {
            expect(() => {
                throw new VesselTypeServiceError('Something went wrong');
            }).toThrow(VesselTypeServiceError);

            expect(() => {
                throw new VesselTypeServiceError('Something went wrong');
            }).toThrow('Something went wrong');
        });

        it('should preserve stack trace', () => {
            const error = new VesselTypeServiceError('Test error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('VesselTypeValidationError', () => {
        it('should create validation error with correct message', () => {
            const error = new VesselTypeValidationError('Validation failed');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VesselTypeServiceError);
            expect(error).toBeInstanceOf(VesselTypeValidationError);
            expect(error.message).toBe('Validation failed');
            expect(error.name).toBe('VesselTypeValidationError');
        });

        it('should be throwable and catchable as VesselTypeValidationError', () => {
            expect(() => {
                throw new VesselTypeValidationError('Invalid input');
            }).toThrow(VesselTypeValidationError);
        });

        it('should be catchable as parent VesselTypeServiceError', () => {
            expect(() => {
                throw new VesselTypeValidationError('Invalid input');
            }).toThrow(VesselTypeServiceError);
        });

        it('should be catchable as generic Error', () => {
            expect(() => {
                throw new VesselTypeValidationError('Invalid input');
            }).toThrow(Error);
        });

        it('should support different validation messages', () => {
            const messages = [
                'Vessel Type name is required',
                'Capacity must be greater than 0',
                'Max Rows must be greater than 0',
                'Max Bays must be greater than 0',
                'Max Tiers must be greater than 0',
                'Vessel Type ID is required'
            ];

            messages.forEach(msg => {
                const error = new VesselTypeValidationError(msg);
                expect(error.message).toBe(msg);
                expect(error.name).toBe('VesselTypeValidationError');
            });
        });

        it('should preserve stack trace', () => {
            const error = new VesselTypeValidationError('Test validation error');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('Error hierarchy', () => {
        it('should maintain proper inheritance chain', () => {
            const validationError = new VesselTypeValidationError('Test');
            const serviceError = new VesselTypeServiceError('Test');

            expect(validationError instanceof VesselTypeValidationError).toBe(true);
            expect(validationError instanceof VesselTypeServiceError).toBe(true);
            expect(validationError instanceof Error).toBe(true);

            expect(serviceError instanceof VesselTypeServiceError).toBe(true);
            expect(serviceError instanceof Error).toBe(true);
            expect(serviceError instanceof VesselTypeValidationError).toBe(false);
        });
    });
});

