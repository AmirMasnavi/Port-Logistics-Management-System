import { describe, it, expect } from 'vitest';
import { ResourceMapper } from '../../infrastructure/repositories/resource/resource.mapper';

describe('ResourceMapper', () => {
    describe('toDomain', () => {
        it('should map a valid API DTO to domain model', () => {
            const apiDto = {
                code: 'RES-001',
                description: 'Forklift A1',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License', 'Training'],
                averageContainersPerHour: 10,
                containersPerTrip: 2,
                averageSpeedKmh: 15,
                otherUnit: 'units',
                otherGenericValue: 100,
            };

            const result = ResourceMapper.toDomain(apiDto);

            expect(result).toEqual({
                code: 'RES-001',
                description: 'Forklift A1',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License', 'Training'],
                averageContainersPerHour: 10,
                containersPerTrip: 2,
                averageSpeedKmh: 15,
                otherUnit: 'units',
                otherGenericValue: 100,
            });
        });

        it('should map API DTO with only required fields', () => {
            const apiDto = {
                code: 'RES-001',
                description: 'Minimal Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const result = ResourceMapper.toDomain(apiDto);

            expect(result.code).toBe('RES-001');
            expect(result.description).toBe('Minimal Resource');
            expect(result.kind).toBe('Forklift');
            expect(result.status).toBe('Active');
        });

        it('should map API DTO with null optional fields', () => {
            const apiDto = {
                code: 'RES-001',
                description: 'Resource',
                kind: 'Forklift',
                assignedArea: null,
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: null,
                averageContainersPerHour: null,
                containersPerTrip: null,
                averageSpeedKmh: null,
                otherUnit: null,
                otherGenericValue: null,
            };

            const result = ResourceMapper.toDomain(apiDto);

            expect(result.assignedArea).toBeNull();
            expect(result.qualificationRequirements).toBeNull();
            expect(result.averageContainersPerHour).toBeNull();
        });

        it('should handle different resource kinds', () => {
            const apiDto1 = {
                code: 'RES-001',
                description: 'Forklift',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const apiDto2 = {
                code: 'RES-002',
                description: 'Crane',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const result1 = ResourceMapper.toDomain(apiDto1);
            const result2 = ResourceMapper.toDomain(apiDto2);

            expect(result1.kind).toBe('Forklift');
            expect(result2.kind).toBe('Crane');
        });

        it('should handle different status values', () => {
            const apiDto1 = {
                code: 'RES-001',
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const apiDto2 = {
                code: 'RES-002',
                description: 'Resource',
                kind: 'Forklift',
                status: 'UnderMaintenance',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const result1 = ResourceMapper.toDomain(apiDto1);
            const result2 = ResourceMapper.toDomain(apiDto2);

            expect(result1.status).toBe('Active');
            expect(result2.status).toBe('UnderMaintenance');
        });

        it('should preserve all fields from API DTO', () => {
            const apiDto = {
                code: 'RES-001',
                description: 'Resource',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 15,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License'],
                averageContainersPerHour: 10,
                containersPerTrip: 2,
                averageSpeedKmh: 15,
                otherUnit: 'units',
                otherGenericValue: 100,
            };

            const result = ResourceMapper.toDomain(apiDto);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('kind');
            expect(result).toHaveProperty('assignedArea');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('setupTimeMinutes');
            expect(result).toHaveProperty('operationalWindowStart');
            expect(result).toHaveProperty('operationalWindowEnd');
            expect(result).toHaveProperty('qualificationRequirements');
            expect(result).toHaveProperty('averageContainersPerHour');
            expect(result).toHaveProperty('containersPerTrip');
            expect(result).toHaveProperty('averageSpeedKmh');
            expect(result).toHaveProperty('otherUnit');
            expect(result).toHaveProperty('otherGenericValue');
        });

        it('should handle large numeric values', () => {
            const apiDto = {
                code: 'RES-001',
                description: 'Resource',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 999,
                operationalWindowStart: '00:00',
                operationalWindowEnd: '23:59',
                averageContainersPerHour: 1000,
                containersPerTrip: 500,
                averageSpeedKmh: 100,
                otherGenericValue: 999999,
            };

            const result = ResourceMapper.toDomain(apiDto);

            expect(result.setupTimeMinutes).toBe(999);
            expect(result.averageContainersPerHour).toBe(1000);
            expect(result.containersPerTrip).toBe(500);
            expect(result.averageSpeedKmh).toBe(100);
            expect(result.otherGenericValue).toBe(999999);
        });
    });

    describe('toDomainList', () => {
        it('should map an array of API DTOs to domain models', () => {
            const apiDtoList = [
                {
                    code: 'RES-001',
                    description: 'Forklift',
                    kind: 'Forklift',
                    status: 'Active',
                    setupTimeMinutes: 10,
                    operationalWindowStart: '08:00',
                    operationalWindowEnd: '18:00',
                },
                {
                    code: 'RES-002',
                    description: 'Crane',
                    kind: 'Crane',
                    status: 'Active',
                    setupTimeMinutes: 30,
                    operationalWindowStart: '08:00',
                    operationalWindowEnd: '18:00',
                },
                {
                    code: 'RES-003',
                    description: 'Truck',
                    kind: 'Truck',
                    status: 'Inactive',
                    setupTimeMinutes: 20,
                    operationalWindowStart: '09:00',
                    operationalWindowEnd: '17:00',
                },
            ];

            const result = ResourceMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(3);
            expect(result[0].code).toBe('RES-001');
            expect(result[1].code).toBe('RES-002');
            expect(result[2].code).toBe('RES-003');
        });

        it('should handle an empty array', () => {
            const apiDtoList: any[] = [];

            const result = ResourceMapper.toDomainList(apiDtoList);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should map a single-item array', () => {
            const apiDtoList = [
                {
                    code: 'RES-001',
                    description: 'Forklift',
                    kind: 'Forklift',
                    status: 'Active',
                    setupTimeMinutes: 10,
                    operationalWindowStart: '08:00',
                    operationalWindowEnd: '18:00',
                },
            ];

            const result = ResourceMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(1);
            expect(result[0].code).toBe('RES-001');
        });

        it('should preserve order of items in the array', () => {
            const apiDtoList = [
                { code: 'RES-003', description: 'Resource 3', kind: 'Truck', status: 'Active', setupTimeMinutes: 30, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'RES-001', description: 'Resource 1', kind: 'Forklift', status: 'Active', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'RES-002', description: 'Resource 2', kind: 'Crane', status: 'Active', setupTimeMinutes: 20, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
            ];

            const result = ResourceMapper.toDomainList(apiDtoList);

            expect(result[0].code).toBe('RES-003');
            expect(result[1].code).toBe('RES-001');
            expect(result[2].code).toBe('RES-002');
        });

        it('should map all fields for each item in the array', () => {
            const apiDtoList = [
                {
                    code: 'RES-001',
                    description: 'Forklift',
                    kind: 'Forklift',
                    assignedArea: 'YARD-1',
                    status: 'Active',
                    setupTimeMinutes: 10,
                    operationalWindowStart: '08:00',
                    operationalWindowEnd: '18:00',
                    qualificationRequirements: ['License'],
                },
                {
                    code: 'RES-002',
                    description: 'Crane',
                    kind: 'Crane',
                    assignedArea: 'YARD-2',
                    status: 'Active',
                    setupTimeMinutes: 30,
                    operationalWindowStart: '08:00',
                    operationalWindowEnd: '18:00',
                    qualificationRequirements: ['Advanced License'],
                },
            ];

            const result = ResourceMapper.toDomainList(apiDtoList);

            result.forEach((item) => {
                expect(item).toHaveProperty('code');
                expect(item).toHaveProperty('description');
                expect(item).toHaveProperty('kind');
                expect(item).toHaveProperty('assignedArea');
                expect(item).toHaveProperty('status');
                expect(item).toHaveProperty('setupTimeMinutes');
                expect(item).toHaveProperty('operationalWindowStart');
                expect(item).toHaveProperty('operationalWindowEnd');
                expect(item).toHaveProperty('qualificationRequirements');
            });
        });

        it('should handle mixed resource types', () => {
            const apiDtoList = [
                { code: 'RES-001', description: 'Forklift', kind: 'Forklift', status: 'Active', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'RES-002', description: 'Crane', kind: 'Crane', status: 'Active', setupTimeMinutes: 30, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
                { code: 'RES-003', description: 'Truck', kind: 'Truck', status: 'Inactive', setupTimeMinutes: 20, operationalWindowStart: '09:00', operationalWindowEnd: '17:00' },
                { code: 'RES-004', description: 'Forklift 2', kind: 'Forklift', status: 'UnderMaintenance', setupTimeMinutes: 10, operationalWindowStart: '08:00', operationalWindowEnd: '18:00' },
            ];

            const result = ResourceMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(4);
            expect(result[0].kind).toBe('Forklift');
            expect(result[1].kind).toBe('Crane');
            expect(result[2].kind).toBe('Truck');
            expect(result[3].kind).toBe('Forklift');
        });
    });
});

