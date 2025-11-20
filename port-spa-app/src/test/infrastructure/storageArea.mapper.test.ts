import { describe, it, expect } from 'vitest';
import { StorageAreaMapper } from '../../infrastructure/repositories/storageArea/storageArea.mapper';

describe('StorageAreaMapper', () => {
    describe('toDomain', () => {
        it('should map a valid API DTO to domain model', () => {
            const apiDto = {
                code: 'YARD-3',
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const result = StorageAreaMapper.toDomain(apiDto);

            expect(result).toEqual({
                code: 'YARD-3',
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            });
        });

        it('should map API DTO with zero occupancy', () => {
            const apiDto = {
                code: 'WAREHOUSE-1',
                type: 'Warehouse',
                location: '(5, 5)',
                capacity: 200,
                currentOccupancy: 0,
            };

            const result = StorageAreaMapper.toDomain(apiDto);

            expect(result.code).toBe('WAREHOUSE-1');
            expect(result.currentOccupancy).toBe(0);
        });

        it('should map API DTO with full capacity', () => {
            const apiDto = {
                code: 'YARD-5',
                type: 'Yard',
                location: '20, 30',
                capacity: 150,
                currentOccupancy: 150,
            };

            const result = StorageAreaMapper.toDomain(apiDto);

            expect(result.capacity).toBe(150);
            expect(result.currentOccupancy).toBe(150);
        });

        it('should handle different location formats', () => {
            const apiDto1 = {
                code: 'YARD-1',
                type: 'Yard',
                location: '10, 10',
                capacity: 100,
                currentOccupancy: 50,
            };

            const apiDto2 = {
                code: 'YARD-2',
                type: 'Yard',
                location: '(10, 10)',
                capacity: 100,
                currentOccupancy: 50,
            };

            const result1 = StorageAreaMapper.toDomain(apiDto1);
            const result2 = StorageAreaMapper.toDomain(apiDto2);

            expect(result1.location).toBe('10, 10');
            expect(result2.location).toBe('(10, 10)');
        });

        it('should preserve all fields from API DTO', () => {
            const apiDto = {
                code: 'WAREHOUSE-X',
                type: 'Warehouse',
                location: '100, 200',
                capacity: 500,
                currentOccupancy: 250,
            };

            const result = StorageAreaMapper.toDomain(apiDto);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('location');
            expect(result).toHaveProperty('capacity');
            expect(result).toHaveProperty('currentOccupancy');
        });

        it('should handle large numeric values', () => {
            const apiDto = {
                code: 'MEGA-YARD-1',
                type: 'Yard',
                location: '999, 999',
                capacity: 999999,
                currentOccupancy: 500000,
            };

            const result = StorageAreaMapper.toDomain(apiDto);

            expect(result.capacity).toBe(999999);
            expect(result.currentOccupancy).toBe(500000);
        });
    });

    describe('toDomainList', () => {
        it('should map an array of API DTOs to domain models', () => {
            const apiDtoList = [
                {
                    code: 'YARD-1',
                    type: 'Yard',
                    location: '10, 10',
                    capacity: 100,
                    currentOccupancy: 50,
                },
                {
                    code: 'WAREHOUSE-1',
                    type: 'Warehouse',
                    location: '20, 20',
                    capacity: 200,
                    currentOccupancy: 100,
                },
                {
                    code: 'YARD-2',
                    type: 'Yard',
                    location: '30, 30',
                    capacity: 150,
                    currentOccupancy: 75,
                },
            ];

            const result = StorageAreaMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(3);
            expect(result[0].code).toBe('YARD-1');
            expect(result[1].code).toBe('WAREHOUSE-1');
            expect(result[2].code).toBe('YARD-2');
        });

        it('should handle an empty array', () => {
            const apiDtoList: any[] = [];

            const result = StorageAreaMapper.toDomainList(apiDtoList);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should map a single-item array', () => {
            const apiDtoList = [
                {
                    code: 'YARD-1',
                    type: 'Yard',
                    location: '10, 10',
                    capacity: 100,
                    currentOccupancy: 50,
                },
            ];

            const result = StorageAreaMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(1);
            expect(result[0].code).toBe('YARD-1');
        });

        it('should preserve order of items in the array', () => {
            const apiDtoList = [
                { code: 'YARD-3', type: 'Yard', location: '30, 30', capacity: 300, currentOccupancy: 150 },
                { code: 'YARD-1', type: 'Yard', location: '10, 10', capacity: 100, currentOccupancy: 50 },
                { code: 'YARD-2', type: 'Yard', location: '20, 20', capacity: 200, currentOccupancy: 100 },
            ];

            const result = StorageAreaMapper.toDomainList(apiDtoList);

            expect(result[0].code).toBe('YARD-3');
            expect(result[1].code).toBe('YARD-1');
            expect(result[2].code).toBe('YARD-2');
        });

        it('should map all fields for each item in the array', () => {
            const apiDtoList = [
                {
                    code: 'YARD-1',
                    type: 'Yard',
                    location: '10, 10',
                    capacity: 100,
                    currentOccupancy: 50,
                },
                {
                    code: 'WAREHOUSE-1',
                    type: 'Warehouse',
                    location: '20, 20',
                    capacity: 200,
                    currentOccupancy: 100,
                },
            ];

            const result = StorageAreaMapper.toDomainList(apiDtoList);

            result.forEach((item) => {
                expect(item).toHaveProperty('code');
                expect(item).toHaveProperty('type');
                expect(item).toHaveProperty('location');
                expect(item).toHaveProperty('capacity');
                expect(item).toHaveProperty('currentOccupancy');
            });
        });

        it('should handle mixed storage area types', () => {
            const apiDtoList = [
                { code: 'YARD-1', type: 'Yard', location: '10, 10', capacity: 100, currentOccupancy: 50 },
                { code: 'WAREHOUSE-1', type: 'Warehouse', location: '20, 20', capacity: 200, currentOccupancy: 100 },
                { code: 'YARD-2', type: 'Yard', location: '30, 30', capacity: 150, currentOccupancy: 75 },
                { code: 'WAREHOUSE-2', type: 'Warehouse', location: '40, 40', capacity: 250, currentOccupancy: 125 },
            ];

            const result = StorageAreaMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(4);
            expect(result[0].type).toBe('Yard');
            expect(result[1].type).toBe('Warehouse');
            expect(result[2].type).toBe('Yard');
            expect(result[3].type).toBe('Warehouse');
        });
    });
});

