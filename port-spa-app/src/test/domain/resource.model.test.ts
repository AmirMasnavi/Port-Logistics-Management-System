import { describe, it, expect } from 'vitest';
import type { Resource } from '../../domain/resource/resource.model';

describe('Resource Model', () => {
    describe('Basic Structure', () => {
        it('should have all required fields', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Test Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(resource.code).toBe('RES-001');
            expect(resource.description).toBe('Test Resource');
            expect(resource.kind).toBe('Forklift');
            expect(resource.status).toBe('Active');
            expect(resource.setupTimeMinutes).toBe(10);
            expect(resource.operationalWindowStart).toBe('08:00');
            expect(resource.operationalWindowEnd).toBe('18:00');
        });

        it('should handle optional fields', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Test Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                assignedArea: 'YARD-1',
                qualificationRequirements: ['License A'],
                averageContainersPerHour: 50,
            };

            expect(resource.assignedArea).toBe('YARD-1');
            expect(resource.qualificationRequirements).toEqual(['License A']);
            expect(resource.averageContainersPerHour).toBe(50);
        });

        it('should handle zero setup time', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Instant Resource',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 0,
                operationalWindowStart: '00:00',
                operationalWindowEnd: '23:59',
            };

            expect(resource.setupTimeMinutes).toBe(0);
        });

        it('should handle 24-hour operational window', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: '24/7 Resource',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '00:00',
                operationalWindowEnd: '23:59',
            };

            expect(resource.operationalWindowStart).toBe('00:00');
            expect(resource.operationalWindowEnd).toBe('23:59');
        });

        it('should handle optional fields as null', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Minimal Resource',
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

            expect(resource.assignedArea).toBeNull();
            expect(resource.qualificationRequirements).toBeNull();
            expect(resource.averageContainersPerHour).toBeNull();
            expect(resource.containersPerTrip).toBeNull();
            expect(resource.averageSpeedKmh).toBeNull();
            expect(resource.otherUnit).toBeNull();
            expect(resource.otherGenericValue).toBeNull();
        });

        it('should handle optional fields as undefined', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Minimal Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(resource.assignedArea).toBeUndefined();
            expect(resource.qualificationRequirements).toBeUndefined();
            expect(resource.averageContainersPerHour).toBeUndefined();
        });

        it('should handle multiple qualification requirements', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Advanced Resource',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 30,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License A', 'License B', 'Safety Cert', 'Advanced Training'],
            };

            expect(resource.qualificationRequirements).toHaveLength(4);
            expect(resource.qualificationRequirements).toContain('Safety Cert');
        });

        it('should handle empty qualification requirements array', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Simple Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: [],
            };

            expect(resource.qualificationRequirements).toEqual([]);
            expect(resource.qualificationRequirements).toHaveLength(0);
        });

        it('should handle large numeric values', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'High-capacity Resource',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 120,
                operationalWindowStart: '00:00',
                operationalWindowEnd: '23:59',
                averageContainersPerHour: 100,
                containersPerTrip: 50,
                averageSpeedKmh: 80,
                otherGenericValue: 999999,
            };

            expect(resource.setupTimeMinutes).toBe(120);
            expect(resource.averageContainersPerHour).toBe(100);
            expect(resource.containersPerTrip).toBe(50);
            expect(resource.averageSpeedKmh).toBe(80);
            expect(resource.otherGenericValue).toBe(999999);
        });
    });

    describe('Data Integrity', () => {
        it('should maintain immutability when creating copies', () => {
            const original: Resource = {
                code: 'RES-001',
                description: 'Original Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const copy = { ...original };
            copy.status = 'Inactive';

            expect(original.status).toBe('Active');
            expect(copy.status).toBe('Inactive');
        });

        it('should handle special characters in code', () => {
            const resource: Resource = {
                code: 'RES-A-001',
                description: 'Resource with special code',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            expect(resource.code).toBe('RES-A-001');
        });

        it('should preserve qualification requirements array independently', () => {
            const resource: Resource = {
                code: 'RES-001',
                description: 'Resource',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
                qualificationRequirements: ['License A'],
            };

            const copy = { ...resource };
            copy.qualificationRequirements = ['License B'];

            expect(resource.qualificationRequirements).toEqual(['License A']);
            expect(copy.qualificationRequirements).toEqual(['License B']);
        });

        it('should handle different time formats correctly', () => {
            const resource1: Resource = {
                code: 'RES-001',
                description: 'Resource 1',
                kind: 'Forklift',
                status: 'Active',
                setupTimeMinutes: 10,
                operationalWindowStart: '08:00',
                operationalWindowEnd: '18:00',
            };

            const resource2: Resource = {
                code: 'RES-002',
                description: 'Resource 2',
                kind: 'Crane',
                status: 'Active',
                setupTimeMinutes: 20,
                operationalWindowStart: '6:30',
                operationalWindowEnd: '22:45',
            };

            expect(resource1.operationalWindowStart).toBe('08:00');
            expect(resource2.operationalWindowStart).toBe('6:30');
        });
    });
});

