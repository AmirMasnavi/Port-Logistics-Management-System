import { describe, it, expect } from 'vitest';
import { VesselTypeMapper } from '../../../../infrastructure/repositories/vesselType/vesselType.mapper';

describe('VesselTypeMapper', () => {
    describe('toDomain', () => {
        it('should map simple API DTO to domain model', () => {
            const apiDto = {
                id: 'vtype-001',
                name: 'Container Ship',
                description: 'Large cargo container vessel',
                capacity: 5000,
                maxRows: 10,
                maxBays: 20,
                maxTiers: 8
            };

            const result = VesselTypeMapper.toDomain(apiDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('vtype-001');
            expect(result.name).toBe('Container Ship');
            expect(result.description).toBe('Large cargo container vessel');
            expect(result.capacity).toBe(5000);
            expect(result.maxRows).toBe(10);
            expect(result.maxBays).toBe(20);
            expect(result.maxTiers).toBe(8);
        });

        it('should map API DTO with UUID id', () => {
            const apiDto = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Bulk Carrier',
                description: 'Large bulk cargo vessel',
                capacity: 8000,
                maxRows: 12,
                maxBays: 24,
                maxTiers: 10
            };

            const result = VesselTypeMapper.toDomain(apiDto);

            expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should preserve all numeric properties', () => {
            const apiDto = {
                id: 'vtype-002',
                name: 'Tanker',
                description: 'Oil tanker vessel',
                capacity: 15000,
                maxRows: 1,
                maxBays: 1,
                maxTiers: 1
            };

            const result = VesselTypeMapper.toDomain(apiDto);

            expect(typeof result.capacity).toBe('number');
            expect(typeof result.maxRows).toBe('number');
            expect(typeof result.maxBays).toBe('number');
            expect(typeof result.maxTiers).toBe('number');
            expect(result.capacity).toBe(15000);
            expect(result.maxRows).toBe(1);
            expect(result.maxBays).toBe(1);
            expect(result.maxTiers).toBe(1);
        });

        it('should handle zero values correctly', () => {
            const apiDto = {
                id: 'vtype-empty',
                name: 'Empty Vessel',
                description: 'Vessel with no cargo capacity',
                capacity: 0,
                maxRows: 0,
                maxBays: 0,
                maxTiers: 0
            };

            const result = VesselTypeMapper.toDomain(apiDto);

            expect(result.capacity).toBe(0);
            expect(result.maxRows).toBe(0);
            expect(result.maxBays).toBe(0);
            expect(result.maxTiers).toBe(0);
        });

        it('should preserve special characters in strings', () => {
            const apiDto = {
                id: 'vtype-special',
                name: 'Vessel "Special" & Co.',
                description: "O'Brien's Container Vessel (Type A-1)",
                capacity: 3000,
                maxRows: 8,
                maxBays: 16,
                maxTiers: 6
            };

            const result = VesselTypeMapper.toDomain(apiDto);

            expect(result.name).toBe('Vessel "Special" & Co.');
            expect(result.description).toBe("O'Brien's Container Vessel (Type A-1)");
        });

        it('should handle long descriptions', () => {
            const longDescription = 'This is a very large container ship designed for transoceanic cargo transport. It features advanced navigation systems, efficient fuel consumption, and can carry thousands of containers across multiple decks.';

            const apiDto = {
                id: 'vtype-long',
                name: 'Mega Container Ship',
                description: longDescription,
                capacity: 20000,
                maxRows: 20,
                maxBays: 40,
                maxTiers: 16
            };

            const result = VesselTypeMapper.toDomain(apiDto);

            expect(result.description).toBe(longDescription);
            expect(result.description.length).toBeGreaterThan(50);
        });

        it('should map various vessel type configurations', () => {
            const configurations = [
                {
                    id: 'vtype-small',
                    name: 'Small Container',
                    description: 'Small container vessel',
                    capacity: 1000,
                    maxRows: 5,
                    maxBays: 10,
                    maxTiers: 4
                },
                {
                    id: 'vtype-medium',
                    name: 'Medium Container',
                    description: 'Medium container vessel',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                },
                {
                    id: 'vtype-large',
                    name: 'Large Container',
                    description: 'Large container vessel',
                    capacity: 10000,
                    maxRows: 15,
                    maxBays: 30,
                    maxTiers: 12
                }
            ];

            configurations.forEach(config => {
                const result = VesselTypeMapper.toDomain(config);
                expect(result.id).toBe(config.id);
                expect(result.name).toBe(config.name);
                expect(result.capacity).toBe(config.capacity);
                expect(result.maxRows).toBe(config.maxRows);
                expect(result.maxBays).toBe(config.maxBays);
                expect(result.maxTiers).toBe(config.maxTiers);
            });
        });

        it('should create distinct domain objects for different DTOs', () => {
            const apiDto1 = {
                id: 'vtype-001',
                name: 'Container Ship',
                description: 'First vessel type',
                capacity: 5000,
                maxRows: 10,
                maxBays: 20,
                maxTiers: 8
            };

            const apiDto2 = {
                id: 'vtype-002',
                name: 'Bulk Carrier',
                description: 'Second vessel type',
                capacity: 8000,
                maxRows: 12,
                maxBays: 24,
                maxTiers: 10
            };

            const result1 = VesselTypeMapper.toDomain(apiDto1);
            const result2 = VesselTypeMapper.toDomain(apiDto2);

            expect(result1.id).not.toBe(result2.id);
            expect(result1.name).not.toBe(result2.name);
            expect(result1.capacity).not.toBe(result2.capacity);
        });
    });

    describe('toDomainList', () => {
        it('should map empty array', () => {
            const apiDtoList: any[] = [];

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should map single item array', () => {
            const apiDtoList = [
                {
                    id: 'vtype-001',
                    name: 'Container Ship',
                    description: 'Large cargo container vessel',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                }
            ];

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('vtype-001');
            expect(result[0].name).toBe('Container Ship');
        });

        it('should map multiple items array', () => {
            const apiDtoList = [
                {
                    id: 'vtype-001',
                    name: 'Container Ship',
                    description: 'Container vessel',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                },
                {
                    id: 'vtype-002',
                    name: 'Bulk Carrier',
                    description: 'Bulk cargo vessel',
                    capacity: 8000,
                    maxRows: 12,
                    maxBays: 24,
                    maxTiers: 10
                },
                {
                    id: 'vtype-003',
                    name: 'Tanker',
                    description: 'Oil tanker',
                    capacity: 15000,
                    maxRows: 1,
                    maxBays: 1,
                    maxTiers: 1
                }
            ];

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('vtype-001');
            expect(result[1].id).toBe('vtype-002');
            expect(result[2].id).toBe('vtype-003');
            expect(result[0].name).toBe('Container Ship');
            expect(result[1].name).toBe('Bulk Carrier');
            expect(result[2].name).toBe('Tanker');
        });

        it('should preserve order of items', () => {
            const apiDtoList = [
                {
                    id: 'vtype-003',
                    name: 'Third Type',
                    description: 'Third',
                    capacity: 3000,
                    maxRows: 8,
                    maxBays: 16,
                    maxTiers: 6
                },
                {
                    id: 'vtype-001',
                    name: 'First Type',
                    description: 'First',
                    capacity: 1000,
                    maxRows: 5,
                    maxBays: 10,
                    maxTiers: 4
                },
                {
                    id: 'vtype-002',
                    name: 'Second Type',
                    description: 'Second',
                    capacity: 2000,
                    maxRows: 6,
                    maxBays: 12,
                    maxTiers: 5
                }
            ];

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            expect(result[0].id).toBe('vtype-003');
            expect(result[1].id).toBe('vtype-001');
            expect(result[2].id).toBe('vtype-002');
        });

        it('should map all properties for each item', () => {
            const apiDtoList = [
                {
                    id: 'vtype-001',
                    name: 'Container Ship',
                    description: 'Container vessel',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                },
                {
                    id: 'vtype-002',
                    name: 'Bulk Carrier',
                    description: 'Bulk cargo vessel',
                    capacity: 8000,
                    maxRows: 12,
                    maxBays: 24,
                    maxTiers: 10
                }
            ];

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            result.forEach((item, index) => {
                expect(item.id).toBe(apiDtoList[index].id);
                expect(item.name).toBe(apiDtoList[index].name);
                expect(item.description).toBe(apiDtoList[index].description);
                expect(item.capacity).toBe(apiDtoList[index].capacity);
                expect(item.maxRows).toBe(apiDtoList[index].maxRows);
                expect(item.maxBays).toBe(apiDtoList[index].maxBays);
                expect(item.maxTiers).toBe(apiDtoList[index].maxTiers);
            });
        });

        it('should handle large arrays', () => {
            const apiDtoList = Array.from({ length: 100 }, (_, i) => ({
                id: `vtype-${i}`,
                name: `Vessel Type ${i}`,
                description: `Description ${i}`,
                capacity: 1000 * (i + 1),
                maxRows: 5 + i,
                maxBays: 10 + i,
                maxTiers: 4 + i
            }));

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(100);
            expect(result[0].id).toBe('vtype-0');
            expect(result[99].id).toBe('vtype-99');
            expect(result[50].capacity).toBe(51000);
        });

        it('should create independent domain objects', () => {
            const apiDtoList = [
                {
                    id: 'vtype-001',
                    name: 'Container Ship',
                    description: 'Container vessel',
                    capacity: 5000,
                    maxRows: 10,
                    maxBays: 20,
                    maxTiers: 8
                },
                {
                    id: 'vtype-002',
                    name: 'Bulk Carrier',
                    description: 'Bulk cargo vessel',
                    capacity: 8000,
                    maxRows: 12,
                    maxBays: 24,
                    maxTiers: 10
                }
            ];

            const result = VesselTypeMapper.toDomainList(apiDtoList);

            // Modify one result to ensure they're independent
            result[0].name = 'Modified Name';

            expect(result[0].name).toBe('Modified Name');
            expect(result[1].name).toBe('Bulk Carrier');
            expect(result[1].name).not.toBe(result[0].name);
        });
    });
});

