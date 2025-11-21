import { describe, it, expect } from 'vitest';
import type {
    StorageAreaCreateDto,
    StorageAreaUpdateDto,
} from '../../infrastructure/repositories/storageArea/storageArea.dto';

describe('StorageArea DTOs', () => {
    describe('StorageAreaCreateDto', () => {
        it('should create a valid StorageAreaCreateDto with all required fields', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(createDto.type).toBe('Yard');
            expect(createDto.location).toBe('10, 10');
            expect(createDto.capacity).toBe(100);
            expect(createDto.currentOccupancy).toBe(50);
        });

        it('should create a DTO with zero occupancy', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 0,
            };

            expect(createDto.currentOccupancy).toBe(0);
        });

        it('should create a DTO with full capacity', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '30, 30',
                capacity: 150,
                currentOccupancy: 150,
            };

            expect(createDto.capacity).toBe(150);
            expect(createDto.currentOccupancy).toBe(150);
        });

        it('should accept different location formats', () => {
            const createDto1: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const createDto2: StorageAreaCreateDto = {
                type: 'Warehouse',
                location: '(20, 20)',
                capacity: 200,
                currentOccupancy: 100,
            };

            expect(createDto1.location).toBe('10, 10');
            expect(createDto2.location).toBe('(20, 20)');
        });

        it('should accept different storage area types', () => {
            const yardDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const warehouseDto: StorageAreaCreateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 100,
            };

            expect(yardDto.type).toBe('Yard');
            expect(warehouseDto.type).toBe('Warehouse');
        });

        it('should handle large capacity values', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '50, 50',
                capacity: 10000,
                currentOccupancy: 5000,
            };

            expect(createDto.capacity).toBe(10000);
            expect(createDto.currentOccupancy).toBe(5000);
        });

        it('should not include code field', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(createDto).not.toHaveProperty('code');
        });
    });

    describe('StorageAreaUpdateDto', () => {
        it('should create a valid StorageAreaUpdateDto with all required fields', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '15, 15',
                capacity: 150,
                currentOccupancy: 75,
            };

            expect(updateDto.type).toBe('Warehouse');
            expect(updateDto.location).toBe('15, 15');
            expect(updateDto.capacity).toBe(150);
            expect(updateDto.currentOccupancy).toBe(75);
        });

        it('should update occupancy to zero', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 0,
            };

            expect(updateDto.currentOccupancy).toBe(0);
        });

        it('should update to full capacity', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 200,
            };

            expect(updateDto.capacity).toBe(200);
            expect(updateDto.currentOccupancy).toBe(200);
        });

        it('should allow updating location', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '(50, 50)',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(updateDto.location).toBe('(50, 50)');
        });

        it('should allow updating type', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(updateDto.type).toBe('Warehouse');
        });

        it('should allow updating capacity', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 300,
                currentOccupancy: 150,
            };

            expect(updateDto.capacity).toBe(300);
        });

        it('should not include code field', () => {
            const updateDto: StorageAreaUpdateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            expect(updateDto).not.toHaveProperty('code');
        });
    });

    describe('DTO Compatibility', () => {
        it('should have same structure between CreateDto and UpdateDto', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const updateDto: StorageAreaUpdateDto = {
                type: 'Warehouse',
                location: '20, 20',
                capacity: 200,
                currentOccupancy: 100,
            };

            expect(Object.keys(createDto).sort()).toEqual(Object.keys(updateDto).sort());
        });

        it('should be able to copy CreateDto to UpdateDto', () => {
            const createDto: StorageAreaCreateDto = {
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const updateDto: StorageAreaUpdateDto = { ...createDto };

            expect(updateDto.type).toBe(createDto.type);
            expect(updateDto.location).toBe(createDto.location);
            expect(updateDto.capacity).toBe(createDto.capacity);
            expect(updateDto.currentOccupancy).toBe(createDto.currentOccupancy);
        });
    });
});

