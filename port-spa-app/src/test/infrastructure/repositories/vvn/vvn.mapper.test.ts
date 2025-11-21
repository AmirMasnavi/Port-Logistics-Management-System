import { describe, it, expect } from 'vitest';
import { VvnMapper } from '../../../../infrastructure/repositories/vvn/vvn.mapper';
describe('VvnMapper', () => {
    describe('toDomain', () => {
        it('should map simple API DTO to domain model', () => {
            const apiDto = {
                id: '1',
                businessId: 'VVN-2025-001',
                status: 'InProgress',
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                submittedBy: 'rep123',
                assignedDockId: null,
                assignedDockName: null,
                cargo: {
                    id: 1,
                    description: 'Test cargo',
                    weight: 1000,
                    containers: []
                },
                crewMembers: [],
                decisionLog: []
            };

            const result = VvnMapper.toDomain(apiDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('1');
            expect(result.businessId).toBe('VVN-2025-001');
            expect(result.status).toBe('InProgress');
            expect(result.vesselImo).toBe('IMO1234567');
        });

        it('should map complete API DTO with all nested objects', () => {
            const apiDto = {
                id: '2',
                businessId: 'VVN-2025-002',
                status: 'Approved',
                estimatedArrival: '2025-12-01T06:00:00Z',
                estimatedDeparture: '2025-12-03T20:00:00Z',
                vesselImo: 'IMO9876543',
                submittedBy: 'rep456',
                assignedDockId: 'dock1',
                assignedDockName: 'Dock A',
                cargo: {
                    id: 2,
                    description: 'Electronics and machinery',
                    weight: 15000,
                    containers: [
                        { id: 1, containerCode: 'MSCU1234567', position: 'A1' },
                        { id: 2, containerCode: 'MSCU7654321', position: 'A2' }
                    ]
                },
                crewMembers: [
                    { id: '1', name: 'Captain Smith', nationality: 'UK', isSafetyOfficer: true },
                    { id: '2', name: 'First Mate', nationality: 'USA', isSafetyOfficer: false }
                ],
                decisionLog: [
                    {
                        id: 1,
                        timestamp: '2025-11-20T12:00:00Z',
                        officerId: 'officer123',
                        outcome: 'Approved',
                        reason: null
                    }
                ]
            };

            const result = VvnMapper.toDomain(apiDto);

            expect(result.id).toBe('2');
            expect(result.businessId).toBe('VVN-2025-002');
            expect(result.status).toBe('Approved');
            expect(result.assignedDockName).toBe('Dock A');
            expect(result.cargo.containers).toHaveLength(2);
            expect(result.crewMembers).toHaveLength(2);
            expect(result.decisionLog).toHaveLength(1);
        });

        it('should preserve all status types', () => {
            const statuses = ['InProgress', 'Submitted', 'Approved', 'Rejected'];

            statuses.forEach(status => {
                const apiDto = {
                    id: '1',
                    businessId: 'VVN-2025-001',
                    status,
                    estimatedArrival: '2025-11-25T08:00:00Z',
                    estimatedDeparture: '2025-11-26T18:00:00Z',
                    vesselImo: 'IMO1234567',
                    submittedBy: 'rep123',
                    assignedDockId: null,
                    assignedDockName: null,
                    cargo: { id: 1, description: 'Test', weight: 100, containers: [] },
                    crewMembers: [],
                    decisionLog: []
                };

                const result = VvnMapper.toDomain(apiDto);
                expect(result.status).toBe(status);
            });
        });

        it('should handle null dock assignment', () => {
            const apiDto = {
                id: '3',
                businessId: 'VVN-2025-003',
                status: 'Submitted',
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                submittedBy: 'rep789',
                assignedDockId: null,
                assignedDockName: null,
                cargo: { id: 3, description: 'Test', weight: 100, containers: [] },
                crewMembers: [],
                decisionLog: []
            };

            const result = VvnMapper.toDomain(apiDto);

            expect(result.assignedDockId).toBeNull();
            expect(result.assignedDockName).toBeNull();
        });

        it('should preserve cargo details', () => {
            const apiDto = {
                id: '4',
                businessId: 'VVN-2025-004',
                status: 'InProgress',
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                submittedBy: 'rep123',
                assignedDockId: null,
                assignedDockName: null,
                cargo: {
                    id: 4,
                    description: 'Heavy machinery parts',
                    weight: 25000,
                    containers: [
                        { id: 1, containerCode: 'MSCU1111111', position: 'A1' },
                        { id: 2, containerCode: 'MSCU2222222', position: 'A2' },
                        { id: 3, containerCode: 'MSCU3333333', position: 'B1' }
                    ]
                },
                crewMembers: [],
                decisionLog: []
            };

            const result = VvnMapper.toDomain(apiDto);

            expect(result.cargo.id).toBe(4);
            expect(result.cargo.description).toBe('Heavy machinery parts');
            expect(result.cargo.weight).toBe(25000);
            expect(result.cargo.containers).toHaveLength(3);
            expect(result.cargo.containers[0].containerCode).toBe('MSCU1111111');
        });

        it('should preserve crew member details', () => {
            const apiDto = {
                id: '5',
                businessId: 'VVN-2025-005',
                status: 'InProgress',
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                submittedBy: 'rep123',
                assignedDockId: null,
                assignedDockName: null,
                cargo: { id: 5, description: 'Test', weight: 100, containers: [] },
                crewMembers: [
                    { id: '1', name: 'Captain', nationality: 'UK', isSafetyOfficer: true },
                    { id: '2', name: 'First Mate', nationality: 'USA', isSafetyOfficer: false },
                    { id: '3', name: 'Engineer', nationality: 'Germany', isSafetyOfficer: false }
                ],
                decisionLog: []
            };

            const result = VvnMapper.toDomain(apiDto);

            expect(result.crewMembers).toHaveLength(3);
            expect(result.crewMembers[0].name).toBe('Captain');
            expect(result.crewMembers[0].isSafetyOfficer).toBe(true);
            expect(result.crewMembers[1].isSafetyOfficer).toBe(false);
        });

        it('should preserve decision log', () => {
            const apiDto = {
                id: '6',
                businessId: 'VVN-2025-006',
                status: 'Rejected',
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO1234567',
                submittedBy: 'rep123',
                assignedDockId: null,
                assignedDockName: null,
                cargo: { id: 6, description: 'Test', weight: 100, containers: [] },
                crewMembers: [],
                decisionLog: [
                    {
                        id: 1,
                        timestamp: '2025-11-20T10:00:00Z',
                        officerId: 'officer123',
                        outcome: 'Rejected',
                        reason: 'Missing safety certificates'
                    },
                    {
                        id: 2,
                        timestamp: '2025-11-21T10:00:00Z',
                        officerId: 'officer456',
                        outcome: 'Reopened',
                        reason: null
                    }
                ]
            };

            const result = VvnMapper.toDomain(apiDto);

            expect(result.decisionLog).toHaveLength(2);
            expect(result.decisionLog[0].outcome).toBe('Rejected');
            expect(result.decisionLog[0].reason).toBe('Missing safety certificates');
            expect(result.decisionLog[1].outcome).toBe('Reopened');
            expect(result.decisionLog[1].reason).toBeNull();
        });
    });

    describe('toDomainList', () => {
        it('should map empty array', () => {
            const apiDtoList: any[] = [];
            const result = VvnMapper.toDomainList(apiDtoList);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should map single item array', () => {
            const apiDtoList = [
                {
                    id: '1',
                    businessId: 'VVN-2025-001',
                    status: 'InProgress',
                    estimatedArrival: '2025-11-25T08:00:00Z',
                    estimatedDeparture: '2025-11-26T18:00:00Z',
                    vesselImo: 'IMO1234567',
                    submittedBy: 'rep123',
                    assignedDockId: null,
                    assignedDockName: null,
                    cargo: { id: 1, description: 'Test', weight: 100, containers: [] },
                    crewMembers: [],
                    decisionLog: []
                }
            ];

            const result = VvnMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
            expect(result[0].businessId).toBe('VVN-2025-001');
        });

        it('should map multiple items', () => {
            const apiDtoList = [
                {
                    id: '1',
                    businessId: 'VVN-2025-001',
                    status: 'InProgress',
                    estimatedArrival: '2025-11-25T08:00:00Z',
                    estimatedDeparture: '2025-11-26T18:00:00Z',
                    vesselImo: 'IMO1111111',
                    submittedBy: 'rep123',
                    assignedDockId: null,
                    assignedDockName: null,
                    cargo: { id: 1, description: 'Test 1', weight: 100, containers: [] },
                    crewMembers: [],
                    decisionLog: []
                },
                {
                    id: '2',
                    businessId: 'VVN-2025-002',
                    status: 'Submitted',
                    estimatedArrival: '2025-11-26T08:00:00Z',
                    estimatedDeparture: '2025-11-27T18:00:00Z',
                    vesselImo: 'IMO2222222',
                    submittedBy: 'rep456',
                    assignedDockId: null,
                    assignedDockName: null,
                    cargo: { id: 2, description: 'Test 2', weight: 200, containers: [] },
                    crewMembers: [],
                    decisionLog: []
                },
                {
                    id: '3',
                    businessId: 'VVN-2025-003',
                    status: 'Approved',
                    estimatedArrival: '2025-11-27T08:00:00Z',
                    estimatedDeparture: '2025-11-28T18:00:00Z',
                    vesselImo: 'IMO3333333',
                    submittedBy: 'rep789',
                    assignedDockId: 'dock1',
                    assignedDockName: 'Dock A',
                    cargo: { id: 3, description: 'Test 3', weight: 300, containers: [] },
                    crewMembers: [],
                    decisionLog: []
                }
            ];

            const result = VvnMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(3);
            expect(result[0].businessId).toBe('VVN-2025-001');
            expect(result[1].businessId).toBe('VVN-2025-002');
            expect(result[2].businessId).toBe('VVN-2025-003');
            expect(result[0].status).toBe('InProgress');
            expect(result[1].status).toBe('Submitted');
            expect(result[2].status).toBe('Approved');
        });

        it('should preserve all properties for each item', () => {
            const apiDtoList = [
                {
                    id: '1',
                    businessId: 'VVN-2025-001',
                    status: 'Approved',
                    estimatedArrival: '2025-11-25T08:00:00Z',
                    estimatedDeparture: '2025-11-26T18:00:00Z',
                    vesselImo: 'IMO1234567',
                    submittedBy: 'rep123',
                    assignedDockId: 'dock1',
                    assignedDockName: 'Dock A',
                    cargo: {
                        id: 1,
                        description: 'Electronics',
                        weight: 5000,
                        containers: [
                            { id: 1, containerCode: 'MSCU1234567', position: 'A1' }
                        ]
                    },
                    crewMembers: [
                        { id: '1', name: 'Captain', nationality: 'USA', isSafetyOfficer: true }
                    ],
                    decisionLog: [
                        {
                            id: 1,
                            timestamp: '2025-11-20T12:00:00Z',
                            officerId: 'officer123',
                            outcome: 'Approved',
                            reason: null
                        }
                    ]
                }
            ];

            const result = VvnMapper.toDomainList(apiDtoList);

            expect(result[0].cargo.containers).toHaveLength(1);
            expect(result[0].crewMembers).toHaveLength(1);
            expect(result[0].decisionLog).toHaveLength(1);
            expect(result[0].assignedDockName).toBe('Dock A');
        });

        it('should handle mixed statuses in list', () => {
            const statuses = ['InProgress', 'Submitted', 'Approved', 'Rejected'];
            const apiDtoList = statuses.map((status, index) => ({
                id: String(index + 1),
                businessId: `VVN-2025-00${index + 1}`,
                status,
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: `IMO${index}${index}${index}${index}${index}${index}${index}`,
                submittedBy: `rep${index}`,
                assignedDockId: null,
                assignedDockName: null,
                cargo: { id: index + 1, description: 'Test', weight: 100, containers: [] },
                crewMembers: [],
                decisionLog: []
            }));

            const result = VvnMapper.toDomainList(apiDtoList);

            expect(result).toHaveLength(4);
            statuses.forEach((status, index) => {
                expect(result[index].status).toBe(status);
            });
        });
    });
});
