import { describe, it, expect } from 'vitest';
import type { Dock } from '../../../domain/dock/dock.model';

describe('Dock Domain Model', () => {
    describe('Dock', () => {
        it('should have correct structure with all required properties', () => {
            const dock: Dock = {
                id: 'd-001',
                name: 'Dock A',
                locationZone: 'North Port',
                locationSection: 'Section 1',
                lengthInMeters: 300,
                depthInMeters: 15,
                maxDraftInMeters: 14,
                numberOfSTSCranes: 2
            };

            expect(dock).toHaveProperty('id');
            expect(dock).toHaveProperty('name');
            expect(dock).toHaveProperty('locationZone');
            expect(dock).toHaveProperty('locationSection');
            expect(dock).toHaveProperty('lengthInMeters');
            expect(dock).toHaveProperty('depthInMeters');
            expect(dock).toHaveProperty('maxDraftInMeters');
            expect(dock).toHaveProperty('numberOfSTSCranes');

            expect(typeof dock.id).toBe('string');
            expect(typeof dock.name).toBe('string');
            expect(typeof dock.locationZone).toBe('string');
            expect(typeof dock.locationSection).toBe('string');
            expect(typeof dock.lengthInMeters).toBe('number');
            expect(typeof dock.depthInMeters).toBe('number');
            expect(typeof dock.maxDraftInMeters).toBe('number');
            expect(typeof dock.numberOfSTSCranes).toBe('number');
        });

        it('should support optional allowedVesselTypeIds property', () => {
            const dock: Dock = {
                id: 'd-002',
                name: 'Container Terminal',
                locationZone: 'East Zone',
                locationSection: 'E-2',
                lengthInMeters: 400,
                depthInMeters: 18,
                maxDraftInMeters: 16,
                numberOfSTSCranes: 4,
                allowedVesselTypeIds: ['vt-001', 'vt-002']
            };

            expect(dock).toHaveProperty('allowedVesselTypeIds');
            expect(Array.isArray(dock.allowedVesselTypeIds)).toBe(true);
            expect(dock.allowedVesselTypeIds).toContain('vt-001');
            expect(dock.allowedVesselTypeIds).toHaveLength(2);
        });

        it('should work without optional allowedVesselTypeIds', () => {
            const dock: Dock = {
                id: 'd-003',
                name: 'General Cargo Dock',
                locationZone: 'South Zone',
                locationSection: 'S-1',
                lengthInMeters: 200,
                depthInMeters: 10,
                maxDraftInMeters: 9,
                numberOfSTSCranes: 1
            };

            expect(dock.allowedVesselTypeIds).toBeUndefined();
        });

        it('should support small docks', () => {
            const smallDock: Dock = {
                id: 'd-004',
                name: 'Small Pier',
                locationZone: 'Marina',
                locationSection: 'M-1',
                lengthInMeters: 50,
                depthInMeters: 5,
                maxDraftInMeters: 4,
                numberOfSTSCranes: 0
            };

            expect(smallDock.lengthInMeters).toBe(50);
            expect(smallDock.depthInMeters).toBe(5);
            expect(smallDock.maxDraftInMeters).toBe(4);
            expect(smallDock.numberOfSTSCranes).toBe(0);
        });

        it('should support large docks', () => {
            const largeDock: Dock = {
                id: 'd-005',
                name: 'Mega Terminal',
                locationZone: 'Deep Water Zone',
                locationSection: 'DW-1',
                lengthInMeters: 500,
                depthInMeters: 25,
                maxDraftInMeters: 22,
                numberOfSTSCranes: 8,
                allowedVesselTypeIds: ['vt-mega', 'vt-ulcs']
            };

            expect(largeDock.lengthInMeters).toBe(500);
            expect(largeDock.depthInMeters).toBe(25);
            expect(largeDock.maxDraftInMeters).toBe(22);
            expect(largeDock.numberOfSTSCranes).toBe(8);
        });

        it('should support various dock names and locations', () => {
            const locations = [
                { name: 'North Terminal', zone: 'North', section: 'A1' },
                { name: 'South Pier', zone: 'South', section: 'B2' },
                { name: 'Liquid Bulk Dock', zone: 'West', section: 'C3' },
                { name: 'RoRo Ramp', zone: 'East', section: 'D4' }
            ];

            locations.forEach(loc => {
                const dock: Dock = {
                    id: 'd-test',
                    name: loc.name,
                    locationZone: loc.zone,
                    locationSection: loc.section,
                    lengthInMeters: 200,
                    depthInMeters: 15,
                    maxDraftInMeters: 14,
                    numberOfSTSCranes: 2
                };

                expect(dock.name).toBe(loc.name);
                expect(dock.locationZone).toBe(loc.zone);
                expect(dock.locationSection).toBe(loc.section);
            });
        });

        it('should support different dimension configurations', () => {
            const dimensions = [
                { len: 100, depth: 8, draft: 7, cranes: 1 },
                { len: 250, depth: 14, draft: 12, cranes: 3 },
                { len: 400, depth: 20, draft: 18, cranes: 6 },
                { len: 600, depth: 30, draft: 28, cranes: 10 }
            ];

            dimensions.forEach(dim => {
                const dock: Dock = {
                    id: 'd-test',
                    name: 'Test Dock',
                    locationZone: 'Test Zone',
                    locationSection: 'T-1',
                    lengthInMeters: dim.len,
                    depthInMeters: dim.depth,
                    maxDraftInMeters: dim.draft,
                    numberOfSTSCranes: dim.cranes
                };

                expect(dock.lengthInMeters).toBe(dim.len);
                expect(dock.depthInMeters).toBe(dim.depth);
                expect(dock.maxDraftInMeters).toBe(dim.draft);
                expect(dock.numberOfSTSCranes).toBe(dim.cranes);
            });
        });

        it('should maintain all properties in a complete dock object', () => {
            const completeDock: Dock = {
                id: 'd-007',
                name: 'Complete Dock',
                locationZone: 'Central Hub',
                locationSection: 'H-1',
                lengthInMeters: 350,
                depthInMeters: 16,
                maxDraftInMeters: 15,
                numberOfSTSCranes: 5,
                allowedVesselTypeIds: ['vt-1', 'vt-2', 'vt-3']
            };

            const properties = [
                'id',
                'name',
                'locationZone',
                'locationSection',
                'lengthInMeters',
                'depthInMeters',
                'maxDraftInMeters',
                'numberOfSTSCranes',
                'allowedVesselTypeIds'
            ];

            properties.forEach(prop => {
                expect(completeDock).toHaveProperty(prop);
            });

            expect(Object.keys(completeDock)).toHaveLength(9);
        });

        it('should support different ID formats', () => {
            const idFormats = [
                'd-001',
                'dock-123',
                'DOCK001',
                'zone-a-dock-1',
                '12345'
            ];

            idFormats.forEach(id => {
                const dock: Dock = {
                    id,
                    name: 'Test Dock',
                    locationZone: 'Zone',
                    locationSection: 'Section',
                    lengthInMeters: 100,
                    depthInMeters: 10,
                    maxDraftInMeters: 9,
                    numberOfSTSCranes: 1
                };

                expect(dock.id).toBe(id);
                expect(typeof dock.id).toBe('string');
            });
        });

        it('should handle allowedVesselTypeIds array configurations', () => {
            const configs = [
                [], // Empty array
                ['vt-single'], // Single item
                ['vt-1', 'vt-2', 'vt-3'] // Multiple items
            ];

            configs.forEach(types => {
                const dock: Dock = {
                    id: 'd-test',
                    name: 'Test Dock',
                    locationZone: 'Zone',
                    locationSection: 'Section',
                    lengthInMeters: 100,
                    depthInMeters: 10,
                    maxDraftInMeters: 9,
                    numberOfSTSCranes: 1,
                    allowedVesselTypeIds: types
                };

                expect(dock.allowedVesselTypeIds).toEqual(types);
                expect(Array.isArray(dock.allowedVesselTypeIds)).toBe(true);
            });
        });
    });
});