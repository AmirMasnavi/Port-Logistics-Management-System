import { describe, it, expect } from 'vitest';
import type { VesselType } from '../../../domain/vesselType/vesselType.model';

describe('VesselType Domain Model', () => {
    describe('VesselType', () => {
        it('should have correct structure with all required properties', () => {
            const vesselType: VesselType = {
                id: 'vt-001',
                name: 'Container Ship',
                description: 'Large container vessel for cargo transport',
                capacity: 5000,
                maxRows: 10,
                maxBays: 20,
                maxTiers: 8
            };

            expect(vesselType).toHaveProperty('id');
            expect(vesselType).toHaveProperty('name');
            expect(vesselType).toHaveProperty('description');
            expect(vesselType).toHaveProperty('capacity');
            expect(vesselType).toHaveProperty('maxRows');
            expect(vesselType).toHaveProperty('maxBays');
            expect(vesselType).toHaveProperty('maxTiers');
            expect(typeof vesselType.id).toBe('string');
            expect(typeof vesselType.name).toBe('string');
            expect(typeof vesselType.description).toBe('string');
            expect(typeof vesselType.capacity).toBe('number');
            expect(typeof vesselType.maxRows).toBe('number');
            expect(typeof vesselType.maxBays).toBe('number');
            expect(typeof vesselType.maxTiers).toBe('number');
        });

        it('should support optional modelPath property', () => {
            const vesselType: VesselType = {
                id: 'vt-002',
                name: 'Tanker',
                description: 'Oil tanker vessel',
                capacity: 3000,
                maxRows: 8,
                maxBays: 15,
                maxTiers: 6,
                modelPath: '/models/tanker.glb'
            };

            expect(vesselType).toHaveProperty('modelPath');
            expect(vesselType.modelPath).toBe('/models/tanker.glb');
            expect(typeof vesselType.modelPath).toBe('string');
        });

        it('should work without optional modelPath', () => {
            const vesselType: VesselType = {
                id: 'vt-003',
                name: 'Bulk Carrier',
                description: 'Bulk cargo carrier',
                capacity: 7000,
                maxRows: 12,
                maxBays: 25,
                maxTiers: 10
            };

            expect(vesselType.modelPath).toBeUndefined();
        });

        it('should support small vessel types', () => {
            const smallVessel: VesselType = {
                id: 'vt-004',
                name: 'Small Cargo Ship',
                description: 'Small vessel for light cargo',
                capacity: 100,
                maxRows: 2,
                maxBays: 4,
                maxTiers: 3
            };

            expect(smallVessel.capacity).toBe(100);
            expect(smallVessel.maxRows).toBe(2);
            expect(smallVessel.maxBays).toBe(4);
            expect(smallVessel.maxTiers).toBe(3);
        });

        it('should support large vessel types', () => {
            const largeVessel: VesselType = {
                id: 'vt-005',
                name: 'Ultra Large Container Ship',
                description: 'Ultra large container vessel with maximum capacity',
                capacity: 24000,
                maxRows: 30,
                maxBays: 50,
                maxTiers: 15,
                modelPath: '/models/ulcs.glb'
            };

            expect(largeVessel.capacity).toBe(24000);
            expect(largeVessel.maxRows).toBe(30);
            expect(largeVessel.maxBays).toBe(50);
            expect(largeVessel.maxTiers).toBe(15);
        });

        it('should support various vessel type names', () => {
            const vesselTypeNames = [
                'Container Ship',
                'Tanker',
                'Bulk Carrier',
                'Ro-Ro Ship',
                'Cruise Ship',
                'Ferry',
                'Cargo Ship'
            ];

            vesselTypeNames.forEach(name => {
                const vesselType: VesselType = {
                    id: 'vt-test',
                    name,
                    description: `Test description for ${name}`,
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                };

                expect(vesselType.name).toBe(name);
            });
        });

        it('should support different capacity values', () => {
            const capacities = [100, 1000, 5000, 10000, 24000];

            capacities.forEach(capacity => {
                const vesselType: VesselType = {
                    id: 'vt-test',
                    name: 'Test Vessel',
                    description: 'Test description',
                    capacity,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                };

                expect(vesselType.capacity).toBe(capacity);
                expect(vesselType.capacity).toBeGreaterThan(0);
            });
        });

        it('should support different row, bay, and tier configurations', () => {
            const configurations = [
                { maxRows: 5, maxBays: 10, maxTiers: 4 },
                { maxRows: 10, maxBays: 20, maxTiers: 8 },
                { maxRows: 15, maxBays: 30, maxTiers: 12 },
                { maxRows: 30, maxBays: 50, maxTiers: 15 }
            ];

            configurations.forEach(config => {
                const vesselType: VesselType = {
                    id: 'vt-test',
                    name: 'Test Vessel',
                    description: 'Test description',
                    capacity: 5000,
                    ...config
                };

                expect(vesselType.maxRows).toBe(config.maxRows);
                expect(vesselType.maxBays).toBe(config.maxBays);
                expect(vesselType.maxTiers).toBe(config.maxTiers);
            });
        });

        it('should support descriptive vessel type descriptions', () => {
            const vesselType: VesselType = {
                id: 'vt-006',
                name: 'Container Ship',
                description: 'Large container vessel designed for efficient cargo transport with advanced loading systems and climate control',
                capacity: 8000,
                maxRows: 15,
                maxBays: 30,
                maxTiers: 10
            };

            expect(vesselType.description.length).toBeGreaterThan(50);
            expect(vesselType.description).toContain('container');
        });

        it('should maintain all properties in a complete vessel type', () => {
            const completeVesselType: VesselType = {
                id: 'vt-007',
                name: 'Modern Container Ship',
                description: 'State-of-the-art container vessel with advanced automation',
                capacity: 12000,
                maxRows: 18,
                maxBays: 35,
                maxTiers: 12,
                modelPath: '/models/modern-container.glb'
            };

            const properties = [
                'id',
                'name',
                'description',
                'capacity',
                'maxRows',
                'maxBays',
                'maxTiers',
                'modelPath'
            ];

            properties.forEach(prop => {
                expect(completeVesselType).toHaveProperty(prop);
            });

            expect(Object.keys(completeVesselType)).toHaveLength(8);
        });

        it('should support vessel types with minimum values', () => {
            const minimalVessel: VesselType = {
                id: 'vt-008',
                name: 'Minimal Vessel',
                description: 'Minimal configuration',
                capacity: 1,
                maxRows: 1,
                maxBays: 1,
                maxTiers: 1
            };

            expect(minimalVessel.capacity).toBeGreaterThanOrEqual(1);
            expect(minimalVessel.maxRows).toBeGreaterThanOrEqual(1);
            expect(minimalVessel.maxBays).toBeGreaterThanOrEqual(1);
            expect(minimalVessel.maxTiers).toBeGreaterThanOrEqual(1);
        });

        it('should support different ID formats', () => {
            const idFormats = [
                'vt-001',
                'vessel-type-123',
                'VT001',
                'abc123',
                '12345'
            ];

            idFormats.forEach(id => {
                const vesselType: VesselType = {
                    id,
                    name: 'Test Vessel',
                    description: 'Test description',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                };

                expect(vesselType.id).toBe(id);
                expect(typeof vesselType.id).toBe('string');
            });
        });

        it('should support model paths with various formats', () => {
            const modelPaths = [
                '/models/vessel.glb',
                '/assets/3d/container-ship.gltf',
                'https://example.com/models/ship.glb',
                './models/tanker.obj'
            ];

            modelPaths.forEach(modelPath => {
                const vesselType: VesselType = {
                    id: 'vt-test',
                    name: 'Test Vessel',
                    description: 'Test description',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8,
                    modelPath
                };

                expect(vesselType.modelPath).toBe(modelPath);
            });
        });
    });
});

