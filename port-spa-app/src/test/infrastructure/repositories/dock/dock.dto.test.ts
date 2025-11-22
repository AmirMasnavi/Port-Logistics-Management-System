import { describe, it, expect } from 'vitest';
import type {
    DockCreateDto,
    UpdateDockDto
} from '../../../../infrastructure/repositories/dock/dock.dto';

describe('Dock DTOs', () => {

    // --- Testes para Criação (Tudo obrigatório, exceto allowedVesselTypeIds) ---
    describe('DockCreateDto', () => {
        it('should have correct structure', () => {
            const dto: DockCreateDto = {
                id: 'dock-001',
                name: 'Main Terminal Dock',
                locationZone: 'North Zone',
                locationSection: 'Section A',
                lengthInMeters: 300,
                depthInMeters: 15,
                maxDraftInMeters: 14,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: ['vt-001', 'vt-002']
            };

            expect(dto).toHaveProperty('id');
            expect(dto).toHaveProperty('name');
            expect(dto).toHaveProperty('locationZone');
            expect(dto).toHaveProperty('locationSection');
            expect(dto).toHaveProperty('lengthInMeters');
            expect(dto).toHaveProperty('depthInMeters');
            expect(dto).toHaveProperty('maxDraftInMeters');
            expect(dto).toHaveProperty('numberOfSTSCranes');
            expect(dto).toHaveProperty('allowedVesselTypeIds');

            expect(typeof dto.id).toBe('string');
            expect(typeof dto.name).toBe('string');
            expect(typeof dto.locationZone).toBe('string');
            expect(typeof dto.locationSection).toBe('string');
            expect(typeof dto.lengthInMeters).toBe('number');
            expect(typeof dto.depthInMeters).toBe('number');
            expect(typeof dto.maxDraftInMeters).toBe('number');
            expect(typeof dto.numberOfSTSCranes).toBe('number');
            expect(Array.isArray(dto.allowedVesselTypeIds)).toBe(true);
        });

        it('should accept UUID format id', () => {
            const dto: DockCreateDto = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Standard Dock',
                locationZone: 'East',
                locationSection: 'E1',
                lengthInMeters: 200,
                depthInMeters: 12,
                maxDraftInMeters: 10,
                numberOfSTSCranes: 2
            };

            expect(dto.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should accept various dock names', () => {
            const names = [
                'Container Terminal A',
                'Bulk Cargo Pier',
                'RoRo Ramp 1',
                'Liquid Bulk Jetty',
                'General Cargo Dock'
            ];

            names.forEach(name => {
                const dto: DockCreateDto = {
                    id: 'd-test',
                    name,
                    locationZone: 'Zone',
                    locationSection: 'Sec',
                    lengthInMeters: 100,
                    depthInMeters: 10,
                    maxDraftInMeters: 8,
                    numberOfSTSCranes: 1
                };
                expect(dto.name).toBe(name);
            });
        });

        it('should accept various length values', () => {
            const lengths = [50, 100, 250, 400, 600];

            lengths.forEach(length => {
                const dto: DockCreateDto = {
                    id: 'd-test',
                    name: 'Test Dock',
                    locationZone: 'Zone',
                    locationSection: 'Sec',
                    lengthInMeters: length,
                    depthInMeters: 10,
                    maxDraftInMeters: 8,
                    numberOfSTSCranes: 1
                };
                expect(dto.lengthInMeters).toBe(length);
            });
        });

        it('should accept zero cranes (e.g. RoRo or simple pier)', () => {
            const dto: DockCreateDto = {
                id: 'd-simple',
                name: 'Simple Pier',
                locationZone: 'Marina',
                locationSection: 'M1',
                lengthInMeters: 50,
                depthInMeters: 5,
                maxDraftInMeters: 4,
                numberOfSTSCranes: 0
            };

            expect(dto.numberOfSTSCranes).toBe(0);
        });

        it('should accept various depth/draft configurations', () => {
            const configurations = [
                { depthInMeters: 10, maxDraftInMeters: 9 },
                { depthInMeters: 15, maxDraftInMeters: 14 },
                { depthInMeters: 20, maxDraftInMeters: 18 },
                { depthInMeters: 25, maxDraftInMeters: 22 }
            ];

            configurations.forEach(config => {
                const dto: DockCreateDto = {
                    id: 'd-test',
                    name: 'Test Dock',
                    locationZone: 'Zone',
                    locationSection: 'Sec',
                    lengthInMeters: 200,
                    numberOfSTSCranes: 2,
                    ...config
                };
                expect(dto.depthInMeters).toBe(config.depthInMeters);
                expect(dto.maxDraftInMeters).toBe(config.maxDraftInMeters);
            });
        });

        it('should accept special characters in location fields', () => {
            const dto: DockCreateDto = {
                id: 'd-special',
                name: 'Dock #1',
                locationZone: "Zone 'Alpha' & Beta",
                locationSection: 'Section-A/1',
                lengthInMeters: 150,
                depthInMeters: 12,
                maxDraftInMeters: 10,
                numberOfSTSCranes: 1
            };

            expect(dto.locationZone).toContain("'Alpha'");
            expect(dto.locationSection).toContain('/');
        });

        it('should support optional allowedVesselTypeIds', () => {
            const dtoWithoutTypes: DockCreateDto = {
                id: 'd-no-types',
                name: 'Open Dock',
                locationZone: 'Zone',
                locationSection: 'Sec',
                lengthInMeters: 100,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 1
            };

            expect(dtoWithoutTypes.allowedVesselTypeIds).toBeUndefined();

            const dtoWithTypes: DockCreateDto = {
                ...dtoWithoutTypes,
                allowedVesselTypeIds: ['vt-1', 'vt-2']
            };

            expect(dtoWithTypes.allowedVesselTypeIds).toHaveLength(2);
            expect(dtoWithTypes.allowedVesselTypeIds).toContain('vt-1');
        });
    });

    // --- Testes para Update (Tudo deve ser opcional) ---
    describe('UpdateDockDto', () => {
        it('should allow all fields to be optional', () => {
            const dto: UpdateDockDto = {};
            expect(Object.keys(dto).length).toBe(0);
        });

        it('should accept only name update', () => {
            const dto: UpdateDockDto = {
                name: 'Updated Dock Name'
            };

            expect(dto).toHaveProperty('name');
            expect(dto.name).toBe('Updated Dock Name');
            expect(dto.locationZone).toBeUndefined();
            expect(dto.lengthInMeters).toBeUndefined();
        });

        it('should accept only location update', () => {
            const dto: UpdateDockDto = {
                locationZone: 'New Zone',
                locationSection: 'New Section'
            };

            expect(dto.locationZone).toBe('New Zone');
            expect(dto.locationSection).toBe('New Section');
            expect(dto.name).toBeUndefined();
        });

        it('should accept only dimension update (length/depth)', () => {
            const dto: UpdateDockDto = {
                lengthInMeters: 350,
                depthInMeters: 18
            };

            expect(dto.lengthInMeters).toBe(350);
            expect(dto.depthInMeters).toBe(18);
            expect(dto.maxDraftInMeters).toBeUndefined();
        });

        it('should accept only crane count update', () => {
            const dto: UpdateDockDto = {
                numberOfSTSCranes: 5
            };

            expect(dto.numberOfSTSCranes).toBe(5);
            expect(dto.name).toBeUndefined();
        });

        it('should accept partial dimension updates', () => {
            const dto: UpdateDockDto = {
                maxDraftInMeters: 16
            };

            expect(dto.maxDraftInMeters).toBe(16);
            expect(dto.depthInMeters).toBeUndefined();
        });

        it('should accept allowed vessel types update', () => {
            const dto: UpdateDockDto = {
                allowedVesselTypeIds: ['vt-new-1', 'vt-new-2']
            };

            expect(dto.allowedVesselTypeIds).toHaveLength(2);
            expect(dto.allowedVesselTypeIds).toContain('vt-new-1');
        });

        it('should accept multiple fields update', () => {
            const dto: UpdateDockDto = {
                name: 'Renamed Dock',
                numberOfSTSCranes: 4,
                lengthInMeters: 400
            };

            expect(dto.name).toBe('Renamed Dock');
            expect(dto.numberOfSTSCranes).toBe(4);
            expect(dto.lengthInMeters).toBe(400);
            expect(dto.locationZone).toBeUndefined();
        });

        it('should accept all fields update', () => {
            const dto: UpdateDockDto = {
                name: 'Completely Updated Dock',
                locationZone: 'Updated Zone',
                locationSection: 'Updated Section',
                lengthInMeters: 500,
                depthInMeters: 20,
                maxDraftInMeters: 18,
                numberOfSTSCranes: 6,
                allowedVesselTypeIds: ['vt-A', 'vt-B']
            };

            expect(dto.name).toBe('Completely Updated Dock');
            expect(dto.locationZone).toBe('Updated Zone');
            expect(dto.locationSection).toBe('Updated Section');
            expect(dto.lengthInMeters).toBe(500);
            expect(dto.depthInMeters).toBe(20);
            expect(dto.maxDraftInMeters).toBe(18);
            expect(dto.numberOfSTSCranes).toBe(6);
            expect(dto.allowedVesselTypeIds).toHaveLength(2);
        });

        it('should accept zero values in updates', () => {
            const dto: UpdateDockDto = {
                numberOfSTSCranes: 0
            };

            expect(dto.numberOfSTSCranes).toBe(0);
        });
    });
});