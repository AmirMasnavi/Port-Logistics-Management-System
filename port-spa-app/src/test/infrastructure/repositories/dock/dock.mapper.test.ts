import { describe, it, expect } from 'vitest';
import { DockMapper } from '../../../../infrastructure/repositories/dock/dock.mapper';

describe('DockMapper', () => {
    describe('toDomain', () => {
        it('should map simple API DTO to domain model', () => {
            const apiDto = {
                id: 'dock-001',
                name: 'Main Terminal',
                locationZone: 'North Port',
                locationSection: 'Section A',
                lengthInMeters: 300,
                depthInMeters: 15,
                maxDraftInMeters: 14,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: ['vt-001']
            };

            const result = DockMapper.toDomain(apiDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('dock-001');
            expect(result.name).toBe('Main Terminal');
            expect(result.locationZone).toBe('North Port');
            expect(result.locationSection).toBe('Section A');
            expect(result.lengthInMeters).toBe(300);
            expect(result.depthInMeters).toBe(15);
            expect(result.maxDraftInMeters).toBe(14);
            expect(result.numberOfSTSCranes).toBe(3);
            expect(result.allowedVesselTypeIds).toContain('vt-001');
        });

        it('should map API DTO with UUID id', () => {
            const apiDto = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Standard Dock',
                locationZone: 'East',
                locationSection: 'E1',
                lengthInMeters: 200,
                depthInMeters: 12,
                maxDraftInMeters: 10,
                numberOfSTSCranes: 2
            };

            const result = DockMapper.toDomain(apiDto);

            expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should preserve all numeric properties', () => {
            const apiDto = {
                id: 'dock-002',
                name: 'Pier 2',
                locationZone: 'West',
                locationSection: 'W2',
                lengthInMeters: 150.5,
                depthInMeters: 10.5,
                maxDraftInMeters: 9.5,
                numberOfSTSCranes: 1
            };

            const result = DockMapper.toDomain(apiDto);

            expect(typeof result.lengthInMeters).toBe('number');
            expect(typeof result.depthInMeters).toBe('number');
            expect(typeof result.maxDraftInMeters).toBe('number');
            expect(typeof result.numberOfSTSCranes).toBe('number');

            expect(result.lengthInMeters).toBe(150.5);
            expect(result.depthInMeters).toBe(10.5);
            expect(result.maxDraftInMeters).toBe(9.5);
            expect(result.numberOfSTSCranes).toBe(1);
        });

        it('should handle zero values correctly (e.g., no cranes)', () => {
            const apiDto = {
                id: 'dock-simple',
                name: 'Simple Pier',
                locationZone: 'Marina',
                locationSection: 'M1',
                lengthInMeters: 50,
                depthInMeters: 5,
                maxDraftInMeters: 4,
                numberOfSTSCranes: 0
            };

            const result = DockMapper.toDomain(apiDto);

            expect(result.numberOfSTSCranes).toBe(0);
        });

        it('should preserve special characters in strings', () => {
            const apiDto = {
                id: 'dock-special',
                name: 'Dock "Alpha" & Co.',
                locationZone: "O'Brien's Zone",
                locationSection: 'Section #1 (A)',
                lengthInMeters: 100,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 1
            };

            const result = DockMapper.toDomain(apiDto);

            expect(result.name).toBe('Dock "Alpha" & Co.');
            expect(result.locationZone).toBe("O'Brien's Zone");
            expect(result.locationSection).toBe('Section #1 (A)');
        });

        it('should handle optional allowedVesselTypeIds (undefined)', () => {
            const apiDto = {
                id: 'dock-no-types',
                name: 'Open Dock',
                locationZone: 'Zone',
                locationSection: 'Sec',
                lengthInMeters: 100,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 1
                // allowedVesselTypeIds is missing
            };

            const result = DockMapper.toDomain(apiDto);

            expect(result.allowedVesselTypeIds).toBeUndefined();
        });

        it('should handle optional allowedVesselTypeIds (empty array)', () => {
            const apiDto = {
                id: 'dock-empty-types',
                name: 'Restricted Dock',
                locationZone: 'Zone',
                locationSection: 'Sec',
                lengthInMeters: 100,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 1,
                allowedVesselTypeIds: []
            };

            const result = DockMapper.toDomain(apiDto);

            expect(Array.isArray(result.allowedVesselTypeIds)).toBe(true);
            expect(result.allowedVesselTypeIds).toHaveLength(0);
        });

        it('should map various dock configurations', () => {
            const configurations = [
                {
                    id: 'dock-small',
                    name: 'Small Dock',
                    locationZone: 'S',
                    locationSection: '1',
                    lengthInMeters: 100,
                    depthInMeters: 8,
                    maxDraftInMeters: 7,
                    numberOfSTSCranes: 1
                },
                {
                    id: 'dock-medium',
                    name: 'Medium Dock',
                    locationZone: 'M',
                    locationSection: '2',
                    lengthInMeters: 300,
                    depthInMeters: 15,
                    maxDraftInMeters: 13,
                    numberOfSTSCranes: 4
                },
                {
                    id: 'dock-large',
                    name: 'Large Dock',
                    locationZone: 'L',
                    locationSection: '3',
                    lengthInMeters: 500,
                    depthInMeters: 20,
                    maxDraftInMeters: 18,
                    numberOfSTSCranes: 8
                }
            ];

            configurations.forEach(config => {
                const result = DockMapper.toDomain(config);
                expect(result.id).toBe(config.id);
                expect(result.name).toBe(config.name);
                expect(result.lengthInMeters).toBe(config.lengthInMeters);
                expect(result.numberOfSTSCranes).toBe(config.numberOfSTSCranes);
            });
        });
    });

    describe('toDomainList', () => {
        it('should map empty array', () => {
            const apiDtoList: any[] = [];

            const result = DockMapper.toDomainList(apiDtoList);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should map single item array', () => {
            const apiDtoList = [
                {
                    id: 'dock-001',
                    name: 'Main Dock',
                    locationZone: 'Zone A',
                    locationSection: 'Sec 1',
                    lengthInMeters: 300,
                    depthInMeters: 15,
                    maxDraftInMeters: 14,
                    numberOfSTSCranes: 3
                }
            ];

            const result = DockMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('dock-001');
            expect(result[0].name).toBe('Main Dock');
        });

        it('should map multiple items array', () => {
            const apiDtoList = [
                {
                    id: 'dock-001',
                    name: 'Dock 1',
                    locationZone: 'Zone A',
                    locationSection: 'S1',
                    lengthInMeters: 300,
                    depthInMeters: 15,
                    maxDraftInMeters: 14,
                    numberOfSTSCranes: 3
                },
                {
                    id: 'dock-002',
                    name: 'Dock 2',
                    locationZone: 'Zone B',
                    locationSection: 'S2',
                    lengthInMeters: 200,
                    depthInMeters: 12,
                    maxDraftInMeters: 10,
                    numberOfSTSCranes: 2
                }
            ];

            const result = DockMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('dock-001');
            expect(result[1].id).toBe('dock-002');
            expect(result[0].name).toBe('Dock 1');
            expect(result[1].name).toBe('Dock 2');
        });

        it('should preserve order of items', () => {
            const apiDtoList = [
                {
                    id: 'dock-C',
                    name: 'Dock C',
                    locationZone: 'Z',
                    locationSection: '3',
                    lengthInMeters: 300,
                    depthInMeters: 15,
                    maxDraftInMeters: 14,
                    numberOfSTSCranes: 3
                },
                {
                    id: 'dock-A',
                    name: 'Dock A',
                    locationZone: 'X',
                    locationSection: '1',
                    lengthInMeters: 100,
                    depthInMeters: 10,
                    maxDraftInMeters: 9,
                    numberOfSTSCranes: 1
                }
            ];

            const result = DockMapper.toDomainList(apiDtoList);

            expect(result[0].id).toBe('dock-C');
            expect(result[1].id).toBe('dock-A');
        });

        it('should handle large arrays', () => {
            const apiDtoList = Array.from({ length: 50 }, (_, i) => ({
                id: `dock-${i}`,
                name: `Dock ${i}`,
                locationZone: `Zone ${i}`,
                locationSection: `Sec ${i}`,
                lengthInMeters: 100 + i,
                depthInMeters: 10,
                maxDraftInMeters: 9,
                numberOfSTSCranes: 1
            }));

            const result = DockMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(50);
            expect(result[0].id).toBe('dock-0');
            expect(result[49].id).toBe('dock-49');
            expect(result[25].lengthInMeters).toBe(125);
        });

        it('should create independent domain objects', () => {
            const apiDtoList = [
                {
                    id: 'dock-001',
                    name: 'Dock 1',
                    locationZone: 'Zone A',
                    locationSection: 'S1',
                    lengthInMeters: 300,
                    depthInMeters: 15,
                    maxDraftInMeters: 14,
                    numberOfSTSCranes: 3
                },
                {
                    id: 'dock-002',
                    name: 'Dock 2',
                    locationZone: 'Zone B',
                    locationSection: 'S2',
                    lengthInMeters: 200,
                    depthInMeters: 12,
                    maxDraftInMeters: 10,
                    numberOfSTSCranes: 2
                }
            ];

            const result = DockMapper.toDomainList(apiDtoList);

            // Modificar um objeto para garantir independência
            result[0].name = 'Modified Dock';

            expect(result[0].name).toBe('Modified Dock');
            expect(result[1].name).toBe('Dock 2');
            expect(result[1].name).not.toBe(result[0].name);
        });
    });
});