import { describe, it, expect } from 'vitest';
import type {
    CreateVesselTypeDto,
    UpdateVesselTypeDto
} from '../../../../infrastructure/repositories/vesselType/vesselType.dto';

describe('VesselType DTOs', () => {
    describe('CreateVesselTypeDto', () => {
        it('should have correct structure', () => {
            const dto: CreateVesselTypeDto = {
                id: 'vtype-001',
                name: 'Container Ship',
                description: 'Large cargo container vessel',
                capacity: 5000,
                maxRows: 10,
                maxBays: 20,
                maxTiers: 8
            };

            expect(dto).toHaveProperty('id');
            expect(dto).toHaveProperty('name');
            expect(dto).toHaveProperty('description');
            expect(dto).toHaveProperty('capacity');
            expect(dto).toHaveProperty('maxRows');
            expect(dto).toHaveProperty('maxBays');
            expect(dto).toHaveProperty('maxTiers');
            expect(typeof dto.id).toBe('string');
            expect(typeof dto.name).toBe('string');
            expect(typeof dto.description).toBe('string');
            expect(typeof dto.capacity).toBe('number');
            expect(typeof dto.maxRows).toBe('number');
            expect(typeof dto.maxBays).toBe('number');
            expect(typeof dto.maxTiers).toBe('number');
        });

        it('should accept UUID format id', () => {
            const dto: CreateVesselTypeDto = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Bulk Carrier',
                description: 'Large bulk cargo vessel',
                capacity: 8000,
                maxRows: 12,
                maxBays: 24,
                maxTiers: 10
            };

            expect(dto.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should accept various vessel type names', () => {
            const names = [
                'Container Ship',
                'Bulk Carrier',
                'Tanker',
                'Ro-Ro Vessel',
                'General Cargo',
                'Passenger Ship'
            ];

            names.forEach(name => {
                const dto: CreateVesselTypeDto = {
                    id: 'vtype-test',
                    name,
                    description: 'Test description',
                    capacity: 1000,
                    maxRows: 5,
                    maxBays: 10,
                    maxTiers: 5
                };
                expect(dto.name).toBe(name);
            });
        });

        it('should accept various capacity values', () => {
            const capacities = [1000, 5000, 10000, 20000, 50000];

            capacities.forEach(capacity => {
                const dto: CreateVesselTypeDto = {
                    id: 'vtype-test',
                    name: 'Test Vessel',
                    description: 'Test description',
                    capacity,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                };
                expect(dto.capacity).toBe(capacity);
            });
        });

        it('should accept zero capacity', () => {
            const dto: CreateVesselTypeDto = {
                id: 'vtype-empty',
                name: 'Empty Vessel',
                description: 'Vessel with no cargo capacity',
                capacity: 0,
                maxRows: 0,
                maxBays: 0,
                maxTiers: 0
            };

            expect(dto.capacity).toBe(0);
            expect(dto.maxRows).toBe(0);
            expect(dto.maxBays).toBe(0);
            expect(dto.maxTiers).toBe(0);
        });

        it('should accept various dimension configurations', () => {
            const configurations = [
                { maxRows: 5, maxBays: 10, maxTiers: 4 },
                { maxRows: 10, maxBays: 20, maxTiers: 8 },
                { maxRows: 15, maxBays: 30, maxTiers: 12 },
                { maxRows: 20, maxBays: 40, maxTiers: 16 }
            ];

            configurations.forEach(config => {
                const dto: CreateVesselTypeDto = {
                    id: 'vtype-test',
                    name: 'Test Vessel',
                    description: 'Test description',
                    capacity: 5000,
                    ...config
                };
                expect(dto.maxRows).toBe(config.maxRows);
                expect(dto.maxBays).toBe(config.maxBays);
                expect(dto.maxTiers).toBe(config.maxTiers);
            });
        });

        it('should accept long descriptions', () => {
            const longDescription = 'This is a very large container ship designed for transoceanic cargo transport. It features advanced navigation systems, efficient fuel consumption, and can carry thousands of containers across multiple decks.';

            const dto: CreateVesselTypeDto = {
                id: 'vtype-long',
                name: 'Mega Container Ship',
                description: longDescription,
                capacity: 20000,
                maxRows: 20,
                maxBays: 40,
                maxTiers: 16
            };

            expect(dto.description).toBe(longDescription);
            expect(dto.description.length).toBeGreaterThan(50);
        });

        it('should accept special characters in name and description', () => {
            const dto: CreateVesselTypeDto = {
                id: 'vtype-special',
                name: 'Vessel Type "Special" & Co.',
                description: "O'Brien's Shipping - Container Vessel (Type A-1)",
                capacity: 3000,
                maxRows: 8,
                maxBays: 16,
                maxTiers: 6
            };

            expect(dto.name).toContain('"Special"');
            expect(dto.description).toContain("O'Brien");
        });

        it('should support multiple distinct vessel types', () => {
            const dto1: CreateVesselTypeDto = {
                id: 'vtype-001',
                name: 'Small Container',
                description: 'Small container vessel',
                capacity: 1000,
                maxRows: 5,
                maxBays: 10,
                maxTiers: 4
            };

            const dto2: CreateVesselTypeDto = {
                id: 'vtype-002',
                name: 'Large Tanker',
                description: 'Large oil tanker',
                capacity: 15000,
                maxRows: 1,
                maxBays: 1,
                maxTiers: 1
            };

            expect(dto1.id).not.toBe(dto2.id);
            expect(dto1.name).not.toBe(dto2.name);
            expect(dto1.capacity).not.toBe(dto2.capacity);
        });
    });

    describe('UpdateVesselTypeDto', () => {
        it('should allow all fields to be optional', () => {
            const dto: UpdateVesselTypeDto = {};

            expect(Object.keys(dto).length).toBe(0);
        });

        it('should accept only name update', () => {
            const dto: UpdateVesselTypeDto = {
                name: 'Updated Vessel Name'
            };

            expect(dto).toHaveProperty('name');
            expect(dto.name).toBe('Updated Vessel Name');
            expect(dto.description).toBeUndefined();
            expect(dto.capacity).toBeUndefined();
        });

        it('should accept only description update', () => {
            const dto: UpdateVesselTypeDto = {
                description: 'Updated description for vessel type'
            };

            expect(dto).toHaveProperty('description');
            expect(dto.description).toBe('Updated description for vessel type');
            expect(dto.name).toBeUndefined();
        });

        it('should accept only capacity update', () => {
            const dto: UpdateVesselTypeDto = {
                capacity: 7500
            };

            expect(dto).toHaveProperty('capacity');
            expect(dto.capacity).toBe(7500);
            expect(dto.name).toBeUndefined();
        });

        it('should accept dimension updates', () => {
            const dto: UpdateVesselTypeDto = {
                maxRows: 12,
                maxBays: 24,
                maxTiers: 10
            };

            expect(dto.maxRows).toBe(12);
            expect(dto.maxBays).toBe(24);
            expect(dto.maxTiers).toBe(10);
            expect(dto.name).toBeUndefined();
        });

        it('should accept partial dimension updates', () => {
            const dto: UpdateVesselTypeDto = {
                maxRows: 15
            };

            expect(dto.maxRows).toBe(15);
            expect(dto.maxBays).toBeUndefined();
            expect(dto.maxTiers).toBeUndefined();
        });

        it('should accept multiple fields update', () => {
            const dto: UpdateVesselTypeDto = {
                name: 'Updated Name',
                description: 'Updated description',
                capacity: 12000
            };

            expect(dto.name).toBe('Updated Name');
            expect(dto.description).toBe('Updated description');
            expect(dto.capacity).toBe(12000);
            expect(dto.maxRows).toBeUndefined();
        });

        it('should accept all fields update', () => {
            const dto: UpdateVesselTypeDto = {
                name: 'Completely Updated Vessel',
                description: 'All fields have been updated',
                capacity: 9000,
                maxRows: 11,
                maxBays: 22,
                maxTiers: 9
            };

            expect(dto.name).toBe('Completely Updated Vessel');
            expect(dto.description).toBe('All fields have been updated');
            expect(dto.capacity).toBe(9000);
            expect(dto.maxRows).toBe(11);
            expect(dto.maxBays).toBe(22);
            expect(dto.maxTiers).toBe(9);
        });

        it('should accept zero values in updates', () => {
            const dto: UpdateVesselTypeDto = {
                capacity: 0,
                maxRows: 0,
                maxBays: 0,
                maxTiers: 0
            };

            expect(dto.capacity).toBe(0);
            expect(dto.maxRows).toBe(0);
            expect(dto.maxBays).toBe(0);
            expect(dto.maxTiers).toBe(0);
        });

        it('should support updating to different capacity ranges', () => {
            const capacities = [500, 2000, 5000, 10000, 25000];

            capacities.forEach(capacity => {
                const dto: UpdateVesselTypeDto = {
                    capacity
                };
                expect(dto.capacity).toBe(capacity);
            });
        });
    });
});

