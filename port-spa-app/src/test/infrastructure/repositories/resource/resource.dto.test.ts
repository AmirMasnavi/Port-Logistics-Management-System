import { describe, it, expect } from 'vitest';
import type {
    ResourceCreateDto,
    ResourceUpdateDto,
    ResourceUpdateStatusDto,
} from '../../../../infrastructure/repositories/resource/resource.dto';

describe('Resource DTOs', () => {
    describe('ResourceCreateDto', () => {
        it('should create a valid ResourceCreateDto with all fields', () => {
            const createDto: ResourceCreateDto = {
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

            expect(createDto.description).toBe('Forklift A1');
            expect(createDto.kind).toBe('Forklift');
            expect(createDto.assignedArea).toBe('YARD-1');
            expect(createDto.status).toBe('Active');
            expect(createDto.setupTimeMinutes).toBe(15);
            expect(createDto.operationalWindowStart).toBe('08:00');
            expect(createDto.operationalWindowEnd).toBe('18:00');
            expect(createDto.qualificationRequirements).toEqual(['License', 'Training']);
            expect(createDto.averageContainersPerHour).toBe(10);
            expect(createDto.containersPerTrip).toBe(2);
            expect(createDto.averageSpeedKmh).toBe(15);
            expect(createDto.otherUnit).toBe('units');
            expect(createDto.otherGenericValue).toBe(100);
        });

        it('should create a DTO with only required fields', () => {
            const createDto: ResourceCreateDto = {
                description: 'Minimal Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(createDto.description).toBe('Minimal Resource');
            expect(createDto.kind).toBe('Forklift');
            expect(createDto.status).toBe('Active');
        });

        it('should handle optional fields as null', () => {
            const createDto: ResourceCreateDto = {
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

            expect(createDto.assignedArea).toBeNull();
            expect(createDto.qualificationRequirements).toBeNull();
            expect(createDto.averageContainersPerHour).toBeNull();
        });

        it('should handle zero setup time', () => {
            const createDto: ResourceCreateDto = {
                description: 'Quick Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 0,
                operationalWindowStart: '00:00',
                operationalWindowEnd: '23:59',
            };

            expect(createDto.setupTimeMinutes).toBe(0);
        });

        it('should accept different resource kinds', () => {
            const forkliftDto: ResourceCreateDto = {
                description: 'Forklift',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const craneDto: ResourceCreateDto = {
                description: 'Crane',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(forkliftDto.kind).toBe('Forklift');
            expect(craneDto.kind).toBe('Crane');
        });

        it('should accept different status values', () => {
            const activeDto: ResourceCreateDto = {
                description: 'Active Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const inactiveDto: ResourceCreateDto = {
                description: 'Inactive Resource',
                kind: 'Forklift',
                status: 'Inactive',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(activeDto.status).toBe('Active');
            expect(inactiveDto.status).toBe('Inactive');
        });

        it('should not include code field', () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(createDto).not.toHaveProperty('code');
        });
    });

    describe('ResourceUpdateDto', () => {
        it('should create a valid ResourceUpdateDto with all fields', () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Updated Forklift',
                kind: 'Forklift',
                assignedArea: 'YARD-2',
                status: 'Active',
                setupTimeMinutes: 20,
                operationalWindowStart: '09:00',
                operationalWindowEnd: '19:00',
                qualificationRequirements: ['New License'],
                averageContainersPerHour: 12,
                containersPerTrip: 3,
                averageSpeedKmh: 20,
                otherUnit: 'kg',
                otherGenericValue: 200,
            };

            expect(updateDto.description).toBe('Updated Forklift');
            expect(updateDto.kind).toBe('Forklift');
            expect(updateDto.assignedArea).toBe('YARD-2');
            expect(updateDto.status).toBe('Active');
            expect(updateDto.setupTimeMinutes).toBe(20);
        });

        it('should allow updating description', () => {
            const updateDto: ResourceUpdateDto = {
                description: 'New Description',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(updateDto.description).toBe('New Description');
        });

        it('should allow updating status', () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'UnderMaintenance',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(updateDto.status).toBe('UnderMaintenance');
        });

        it('should allow updating operational window', () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '06:00',
                operationalWindowEnd: '22:00',
            };

            expect(updateDto.operationalWindowStart).toBe('06:00');
            expect(updateDto.operationalWindowEnd).toBe('22:00');
        });

        it('should allow updating setup time', () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(updateDto.setupTimeMinutes).toBe(30);
        });

        it('should not include code field', () => {
            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(updateDto).not.toHaveProperty('code');
        });
    });

    describe('ResourceUpdateStatusDto', () => {
        it('should create a valid ResourceUpdateStatusDto', () => {
            const statusDto: ResourceUpdateStatusDto = {
                NewStatus: 'Active',
            };

            expect(statusDto.NewStatus).toBe('Active');
        });

        it('should accept different status values', () => {
            const activeDto: ResourceUpdateStatusDto = {
                NewStatus: 'Active',
            };

            const inactiveDto: ResourceUpdateStatusDto = {
                NewStatus: 'Inactive',
            };

            const maintenanceDto: ResourceUpdateStatusDto = {
                NewStatus: 'UnderMaintenance',
            };

            expect(activeDto.NewStatus).toBe('Active');
            expect(inactiveDto.NewStatus).toBe('Inactive');
            expect(maintenanceDto.NewStatus).toBe('UnderMaintenance');
        });
    });

    describe('DTO Compatibility', () => {
        it('should have same structure between CreateDto and UpdateDto', () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const updateDto: ResourceUpdateDto = {
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(Object.keys(createDto).sort()).toEqual(Object.keys(updateDto).sort());
        });

        it('should be able to copy CreateDto to UpdateDto', () => {
            const createDto: ResourceCreateDto = {
                description: 'Resource',
                kind: 'Forklift',
                assignedArea: 'YARD-1',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License'],
            };

            const updateDto: ResourceUpdateDto = { ...createDto };

            expect(updateDto.description).toBe(createDto.description);
            expect(updateDto.kind).toBe(createDto.kind);
            expect(updateDto.assignedArea).toBe(createDto.assignedArea);
            expect(updateDto.qualificationRequirements).toEqual(createDto.qualificationRequirements);
        });
    });
});

