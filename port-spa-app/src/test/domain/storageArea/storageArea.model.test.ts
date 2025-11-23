import { describe, it, expect } from 'vitest';
import type { StorageArea } from '../../../domain/storageArea/storageArea.model';

describe('StorageArea Domain Model', () => {
    describe('Type Definition', () => {
        it('should create a valid StorageArea object with all required fields', () => {
            const storageArea: StorageArea = {
                code: 'YARD-3',
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(storageArea.code).toBe('YARD-3');
            expect(storageArea.type).toBe('Yard');
            expect(storageArea.location).toBe('10, 10');
            expect(storageArea.capacity).toBe(100);
            expect(storageArea.currentOccupancy).toBe(50);
        });

        it('should accept different location formats', () => {
            const area1: StorageArea = {
                code: 'WAREHOUSE-1',
                type: 'Warehouse',
                location: '(10, 10)',
                capacity: 200,
                currentOccupancy: 0,
            };

            const area2: StorageArea = {
                code: 'WAREHOUSE-2',
                type: 'Warehouse',
                location: '20, 30',
                capacity: 150,
                currentOccupancy: 75,
            };

            expect(area1.location).toBe('(10, 10)');
            expect(area2.location).toBe('20, 30');
        });

        it('should accept different storage area types', () => {
            const yard: StorageArea = {
                code: 'YARD-1',
                type: 'Yard',
                location: '5, 5',
                capacity: 50,
                currentOccupancy: 25,
            };

            const warehouse: StorageArea = {
                code: 'WAREHOUSE-1',
                type: 'Warehouse',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(yard.type).toBe('Yard');
            expect(warehouse.type).toBe('Warehouse');
        });

        it('should handle zero current occupancy', () => {
            const storageArea: StorageArea = {
                code: 'YARD-5',
                type: 'Yard',
                location: '0, 0',
                capacity: 100,
                currentOccupancy: 0,
            };

            expect(storageArea.currentOccupancy).toBe(0);
        });

        it('should handle full capacity occupancy', () => {
            const storageArea: StorageArea = {
                code: 'WAREHOUSE-3',
                type: 'Warehouse',
                location: '15, 15',
                capacity: 100,
                currentOccupancy: 100,
            };

            expect(storageArea.currentOccupancy).toBe(100);
            expect(storageArea.currentOccupancy).toBe(storageArea.capacity);
        });

        it('should handle large capacity values', () => {
            const storageArea: StorageArea = {
                code: 'YARD-10',
                type: 'Yard',
                location: '50, 50',
                capacity: 10000,
                currentOccupancy: 5000,
            };

            expect(storageArea.capacity).toBe(10000);
            expect(storageArea.currentOccupancy).toBe(5000);
        });
    });

    describe('Data Integrity', () => {
        it('should maintain immutability when creating copies', () => {
            const original: StorageArea = {
                code: 'YARD-1',
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const copy = { ...original };
            copy.currentOccupancy = 75;

            expect(original.currentOccupancy).toBe(50);
            expect(copy.currentOccupancy).toBe(75);
        });

        it('should handle special characters in code', () => {
            const storageArea: StorageArea = {
                code: 'YARD-A-3',
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(storageArea.code).toBe('YARD-A-3');
        });

        it('should handle numeric string locations', () => {
            const storageArea: StorageArea = {
                code: 'YARD-1',
                type: 'Yard',
                location: '123, 456',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(storageArea.location).toBe('123, 456');
        });
    });
});

