import { describe, it, expect } from 'vitest';
import { VesselMapper } from '../../../../infrastructure/repositories/vessel/vessel.mapper';

describe('VesselMapper', () => {
    describe('toDomain', () => {
        it('should map simple API DTO to domain model', () => {
            const apiDto = {
                id: 'vessel-001',
                imoNumber: 'IMO1234567',
                name: 'Cargo Ship Alpha',
                operator: 'Maritime Transport Co.',
                vesselTypeId: 'vtype-001',
                createdAt: '2024-01-15T10:30:00Z'
            };

            const result = VesselMapper.toDomain(apiDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('vessel-001');
            expect(result.imoNumber).toBe('IMO1234567');
            expect(result.name).toBe('Cargo Ship Alpha');
            expect(result.operator).toBe('Maritime Transport Co.');
            expect(result.vesselTypeId).toBe('vtype-001');
            expect(result.createdAt).toBe('2024-01-15T10:30:00Z');
        });

        it('should map API DTO with UUID id', () => {
            const apiDto = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                imoNumber: 'IMO9876543',
                name: 'Container Vessel Beta',
                operator: 'Global Shipping Lines',
                vesselTypeId: '660e8400-e29b-41d4-a716-446655440000',
                createdAt: '2024-03-20T14:45:30Z'
            };

            const result = VesselMapper.toDomain(apiDto);

            expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(result.vesselTypeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should preserve all string properties', () => {
            const apiDto = {
                id: 'vessel-002',
                imoNumber: 'IMO1111111',
                name: 'Test Vessel',
                operator: 'Test Operator',
                vesselTypeId: 'vtype-002',
                createdAt: '2024-02-10T08:15:00Z'
            };

            const result = VesselMapper.toDomain(apiDto);

            expect(typeof result.id).toBe('string');
            expect(typeof result.imoNumber).toBe('string');
            expect(typeof result.name).toBe('string');
            expect(typeof result.operator).toBe('string');
            expect(typeof result.vesselTypeId).toBe('string');
            expect(typeof result.createdAt).toBe('string');
        });

        it('should preserve special characters in strings', () => {
            const apiDto = {
                id: 'vessel-special',
                imoNumber: 'IMO4444444',
                name: 'Vessel "Special" & Characters - Test',
                operator: "O'Brien Maritime Ltd.",
                vesselTypeId: 'vtype-special',
                createdAt: '2024-04-10T16:30:00Z'
            };

            const result = VesselMapper.toDomain(apiDto);

            expect(result.name).toBe('Vessel "Special" & Characters - Test');
            expect(result.operator).toBe("O'Brien Maritime Ltd.");
        });

        it('should handle various IMO number formats', () => {
            const imoNumbers = ['IMO1234567', 'IMO9876543', 'IMO1111111'];

            imoNumbers.forEach(imo => {
                const apiDto = {
                    id: 'vessel-test',
                    imoNumber: imo,
                    name: 'Test Vessel',
                    operator: 'Test Operator',
                    vesselTypeId: 'vtype-001',
                    createdAt: '2024-01-01T00:00:00Z'
                };

                const result = VesselMapper.toDomain(apiDto);
                expect(result.imoNumber).toBe(imo);
            });
        });

        it('should preserve ISO 8601 date format', () => {
            const apiDto = {
                id: 'vessel-date',
                imoNumber: 'IMO3333333',
                name: 'Date Test Vessel',
                operator: 'Date Test Operator',
                vesselTypeId: 'vtype-date',
                createdAt: '2024-06-15T12:00:00.000Z'
            };

            const result = VesselMapper.toDomain(apiDto);

            expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(new Date(result.createdAt).toString()).not.toBe('Invalid Date');
        });

        it('should map various vessel configurations', () => {
            const configurations = [
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1111111',
                    name: 'Container Ship',
                    operator: 'Container Operator',
                    vesselTypeId: 'vtype-container',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO2222222',
                    name: 'Bulk Carrier',
                    operator: 'Bulk Operator',
                    vesselTypeId: 'vtype-bulk',
                    createdAt: '2024-02-01T00:00:00Z'
                },
                {
                    id: 'vessel-003',
                    imoNumber: 'IMO3333333',
                    name: 'Oil Tanker',
                    operator: 'Tanker Operator',
                    vesselTypeId: 'vtype-tanker',
                    createdAt: '2024-03-01T00:00:00Z'
                }
            ];

            configurations.forEach(config => {
                const result = VesselMapper.toDomain(config);
                expect(result.id).toBe(config.id);
                expect(result.imoNumber).toBe(config.imoNumber);
                expect(result.name).toBe(config.name);
                expect(result.operator).toBe(config.operator);
                expect(result.vesselTypeId).toBe(config.vesselTypeId);
            });
        });

        it('should create distinct domain objects for different DTOs', () => {
            const apiDto1 = {
                id: 'vessel-001',
                imoNumber: 'IMO1111111',
                name: 'First Vessel',
                operator: 'First Operator',
                vesselTypeId: 'vtype-001',
                createdAt: '2024-01-01T00:00:00Z'
            };

            const apiDto2 = {
                id: 'vessel-002',
                imoNumber: 'IMO2222222',
                name: 'Second Vessel',
                operator: 'Second Operator',
                vesselTypeId: 'vtype-002',
                createdAt: '2024-02-01T00:00:00Z'
            };

            const result1 = VesselMapper.toDomain(apiDto1);
            const result2 = VesselMapper.toDomain(apiDto2);

            expect(result1.id).not.toBe(result2.id);
            expect(result1.imoNumber).not.toBe(result2.imoNumber);
            expect(result1.name).not.toBe(result2.name);
        });
    });

    describe('toDomainList', () => {
        it('should map empty array', () => {
            const apiDtoList: any[] = [];

            const result = VesselMapper.toDomainList(apiDtoList);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should map single item array', () => {
            const apiDtoList = [
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1234567',
                    name: 'Cargo Ship Alpha',
                    operator: 'Maritime Transport Co.',
                    vesselTypeId: 'vtype-001',
                    createdAt: '2024-01-15T10:30:00Z'
                }
            ];

            const result = VesselMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('vessel-001');
            expect(result[0].imoNumber).toBe('IMO1234567');
            expect(result[0].name).toBe('Cargo Ship Alpha');
        });

        it('should map multiple items array', () => {
            const apiDtoList = [
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1111111',
                    name: 'Container Ship',
                    operator: 'Container Operator',
                    vesselTypeId: 'vtype-container',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO2222222',
                    name: 'Bulk Carrier',
                    operator: 'Bulk Operator',
                    vesselTypeId: 'vtype-bulk',
                    createdAt: '2024-02-01T00:00:00Z'
                },
                {
                    id: 'vessel-003',
                    imoNumber: 'IMO3333333',
                    name: 'Oil Tanker',
                    operator: 'Tanker Operator',
                    vesselTypeId: 'vtype-tanker',
                    createdAt: '2024-03-01T00:00:00Z'
                }
            ];

            const result = VesselMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('vessel-001');
            expect(result[1].id).toBe('vessel-002');
            expect(result[2].id).toBe('vessel-003');
            expect(result[0].name).toBe('Container Ship');
            expect(result[1].name).toBe('Bulk Carrier');
            expect(result[2].name).toBe('Oil Tanker');
        });

        it('should preserve order of items', () => {
            const apiDtoList = [
                {
                    id: 'vessel-003',
                    imoNumber: 'IMO3333333',
                    name: 'Third Vessel',
                    operator: 'Third Operator',
                    vesselTypeId: 'vtype-003',
                    createdAt: '2024-03-01T00:00:00Z'
                },
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1111111',
                    name: 'First Vessel',
                    operator: 'First Operator',
                    vesselTypeId: 'vtype-001',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO2222222',
                    name: 'Second Vessel',
                    operator: 'Second Operator',
                    vesselTypeId: 'vtype-002',
                    createdAt: '2024-02-01T00:00:00Z'
                }
            ];

            const result = VesselMapper.toDomainList(apiDtoList);

            expect(result[0].id).toBe('vessel-003');
            expect(result[1].id).toBe('vessel-001');
            expect(result[2].id).toBe('vessel-002');
        });

        it('should map all properties for each item', () => {
            const apiDtoList = [
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1111111',
                    name: 'Container Ship',
                    operator: 'Container Operator',
                    vesselTypeId: 'vtype-container',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO2222222',
                    name: 'Bulk Carrier',
                    operator: 'Bulk Operator',
                    vesselTypeId: 'vtype-bulk',
                    createdAt: '2024-02-01T00:00:00Z'
                }
            ];

            const result = VesselMapper.toDomainList(apiDtoList);

            result.forEach((item, index) => {
                expect(item.id).toBe(apiDtoList[index].id);
                expect(item.imoNumber).toBe(apiDtoList[index].imoNumber);
                expect(item.name).toBe(apiDtoList[index].name);
                expect(item.operator).toBe(apiDtoList[index].operator);
                expect(item.vesselTypeId).toBe(apiDtoList[index].vesselTypeId);
                expect(item.createdAt).toBe(apiDtoList[index].createdAt);
            });
        });

        it('should handle large arrays', () => {
            const apiDtoList = Array.from({ length: 100 }, (_, i) => ({
                id: `vessel-${i}`,
                imoNumber: `IMO${1000000 + i}`,
                name: `Vessel ${i}`,
                operator: `Operator ${i}`,
                vesselTypeId: `vtype-${i}`,
                createdAt: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T00:00:00Z`
            }));

            const result = VesselMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(100);
            expect(result[0].id).toBe('vessel-0');
            expect(result[99].id).toBe('vessel-99');
            expect(result[50].imoNumber).toBe('IMO1000050');
        });

        it('should create independent domain objects', () => {
            const apiDtoList = [
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1111111',
                    name: 'Container Ship',
                    operator: 'Container Operator',
                    vesselTypeId: 'vtype-container',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO2222222',
                    name: 'Bulk Carrier',
                    operator: 'Bulk Operator',
                    vesselTypeId: 'vtype-bulk',
                    createdAt: '2024-02-01T00:00:00Z'
                }
            ];

            const result = VesselMapper.toDomainList(apiDtoList);

            // Modify one result to ensure they're independent
            result[0].name = 'Modified Name';

            expect(result[0].name).toBe('Modified Name');
            expect(result[1].name).toBe('Bulk Carrier');
            expect(result[1].name).not.toBe(result[0].name);
        });

        it('should handle vessels with various IMO numbers', () => {
            const apiDtoList = [
                {
                    id: 'vessel-001',
                    imoNumber: 'IMO1234567',
                    name: 'Vessel A',
                    operator: 'Operator A',
                    vesselTypeId: 'vtype-001',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 'vessel-002',
                    imoNumber: 'IMO9876543',
                    name: 'Vessel B',
                    operator: 'Operator B',
                    vesselTypeId: 'vtype-002',
                    createdAt: '2024-02-01T00:00:00Z'
                },
                {
                    id: 'vessel-003',
                    imoNumber: 'IMO5555555',
                    name: 'Vessel C',
                    operator: 'Operator C',
                    vesselTypeId: 'vtype-003',
                    createdAt: '2024-03-01T00:00:00Z'
                }
            ];

            const result = VesselMapper.toDomainList(apiDtoList);

            expect(result[0].imoNumber).toBe('IMO1234567');
            expect(result[1].imoNumber).toBe('IMO9876543');
            expect(result[2].imoNumber).toBe('IMO5555555');
        });
    });
});

