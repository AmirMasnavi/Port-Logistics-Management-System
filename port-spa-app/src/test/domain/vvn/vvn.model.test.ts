import { describe, it, expect } from 'vitest';
import type {
    Container,
    Cargo,
    CrewMember,
    DecisionLogEntry,
    VesselVisitNotification
} from '../../../domain/vvn/vvn.model';

describe('VVN Domain Models', () => {
    describe('Container', () => {
        it('should have correct structure', () => {
            const container: Container = {
                id: 1,
                containerCode: 'ABCD1234567',
                position: 'A1'
            };

            expect(container).toHaveProperty('id');
            expect(container).toHaveProperty('containerCode');
            expect(container).toHaveProperty('position');
            expect(typeof container.id).toBe('number');
            expect(typeof container.containerCode).toBe('string');
            expect(typeof container.position).toBe('string');
        });

        it('should allow valid container codes', () => {
            const container: Container = {
                id: 1,
                containerCode: 'MSCU1234567',
                position: 'B2'
            };

            expect(container.containerCode).toMatch(/^[A-Z]{4}\d{7}$/);
        });
    });

    describe('Cargo', () => {
        it('should have correct structure with empty containers', () => {
            const cargo: Cargo = {
                id: 1,
                description: 'General cargo',
                weight: 1000,
                containers: []
            };

            expect(cargo).toHaveProperty('id');
            expect(cargo).toHaveProperty('description');
            expect(cargo).toHaveProperty('weight');
            expect(cargo).toHaveProperty('containers');
            expect(Array.isArray(cargo.containers)).toBe(true);
        });

        it('should support multiple containers', () => {
            const cargo: Cargo = {
                id: 2,
                description: 'Electronics',
                weight: 5000,
                containers: [
                    { id: 1, containerCode: 'ABCD1234567', position: 'A1' },
                    { id: 2, containerCode: 'EFGH7654321', position: 'B2' }
                ]
            };

            expect(cargo.containers).toHaveLength(2);
            expect(cargo.weight).toBeGreaterThan(0);
        });

        it('should allow zero weight cargo', () => {
            const cargo: Cargo = {
                id: 3,
                description: 'Empty return',
                weight: 0,
                containers: []
            };

            expect(cargo.weight).toBe(0);
        });
    });

    describe('CrewMember', () => {
        it('should have correct structure', () => {
            const crewMember: CrewMember = {
                id: '123',
                name: 'John Doe',
                nationality: 'USA',
                isSafetyOfficer: false
            };

            expect(crewMember).toHaveProperty('id');
            expect(crewMember).toHaveProperty('name');
            expect(crewMember).toHaveProperty('nationality');
            expect(crewMember).toHaveProperty('isSafetyOfficer');
            expect(typeof crewMember.isSafetyOfficer).toBe('boolean');
        });

        it('should support safety officer flag', () => {
            const safetyOfficer: CrewMember = {
                id: '456',
                name: 'Jane Smith',
                nationality: 'UK',
                isSafetyOfficer: true
            };

            expect(safetyOfficer.isSafetyOfficer).toBe(true);
        });
    });

    describe('DecisionLogEntry', () => {
        it('should have correct structure for approval', () => {
            const entry: DecisionLogEntry = {
                id: 1,
                timestamp: '2025-11-20T10:00:00Z',
                officerId: 'officer123',
                outcome: 'Approved',
                reason: null
            };

            expect(entry).toHaveProperty('id');
            expect(entry).toHaveProperty('timestamp');
            expect(entry).toHaveProperty('officerId');
            expect(entry).toHaveProperty('outcome');
            expect(entry).toHaveProperty('reason');
            expect(entry.reason).toBeNull();
        });

        it('should have correct structure for rejection with reason', () => {
            const entry: DecisionLogEntry = {
                id: 2,
                timestamp: '2025-11-20T11:00:00Z',
                officerId: 'officer456',
                outcome: 'Rejected',
                reason: 'Missing safety certificates'
            };

            expect(entry.outcome).toBe('Rejected');
            expect(entry.reason).toBeTruthy();
            expect(typeof entry.reason).toBe('string');
        });

        it('should support all outcome types', () => {
            const outcomes: Array<'Approved' | 'Rejected' | 'Reopened'> = [
                'Approved',
                'Rejected',
                'Reopened'
            ];

            outcomes.forEach(outcome => {
                const entry: DecisionLogEntry = {
                    id: 1,
                    timestamp: '2025-11-20T10:00:00Z',
                    officerId: 'officer789',
                    outcome,
                    reason: outcome === 'Rejected' ? 'Test reason' : null
                };

                expect(entry.outcome).toBe(outcome);
            });
        });
    });

    describe('VesselVisitNotification', () => {
        it('should have correct structure with all properties', () => {
            const vvn: VesselVisitNotification = {
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

            expect(vvn).toHaveProperty('id');
            expect(vvn).toHaveProperty('businessId');
            expect(vvn).toHaveProperty('status');
            expect(vvn).toHaveProperty('estimatedArrival');
            expect(vvn).toHaveProperty('estimatedDeparture');
            expect(vvn).toHaveProperty('vesselImo');
            expect(vvn).toHaveProperty('submittedBy');
            expect(vvn).toHaveProperty('assignedDockId');
            expect(vvn).toHaveProperty('assignedDockName');
            expect(vvn).toHaveProperty('cargo');
            expect(vvn).toHaveProperty('crewMembers');
            expect(vvn).toHaveProperty('decisionLog');
        });

        it('should support all status types', () => {
            const statuses: Array<'InProgress' | 'Submitted' | 'Approved' | 'Rejected'> = [
                'InProgress',
                'Submitted',
                'Approved',
                'Rejected'
            ];

            statuses.forEach(status => {
                const vvn: VesselVisitNotification = {
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

                expect(vvn.status).toBe(status);
            });
        });

        it('should support approved notification with dock assignment', () => {
            const vvn: VesselVisitNotification = {
                id: '2',
                businessId: 'VVN-2025-002',
                status: 'Approved',
                estimatedArrival: '2025-11-25T08:00:00Z',
                estimatedDeparture: '2025-11-26T18:00:00Z',
                vesselImo: 'IMO7654321',
                submittedBy: 'rep456',
                assignedDockId: 'dock1',
                assignedDockName: 'Dock A',
                cargo: { id: 2, description: 'Test', weight: 2000, containers: [] },
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
            };

            expect(vvn.status).toBe('Approved');
            expect(vvn.assignedDockId).toBeTruthy();
            expect(vvn.assignedDockName).toBe('Dock A');
            expect(vvn.crewMembers).toHaveLength(1);
            expect(vvn.decisionLog).toHaveLength(1);
        });

        it('should support complete vessel visit with all details', () => {
            const vvn: VesselVisitNotification = {
                id: '3',
                businessId: 'VVN-2025-003',
                status: 'Submitted',
                estimatedArrival: '2025-12-01T06:00:00Z',
                estimatedDeparture: '2025-12-03T20:00:00Z',
                vesselImo: 'IMO9876543',
                submittedBy: 'rep789',
                assignedDockId: null,
                assignedDockName: null,
                cargo: {
                    id: 3,
                    description: 'Electronics and machinery',
                    weight: 15000,
                    containers: [
                        { id: 1, containerCode: 'MSCU1234567', position: 'A1' },
                        { id: 2, containerCode: 'MSCU7654321', position: 'A2' },
                        { id: 3, containerCode: 'HLCU9999999', position: 'B1' }
                    ]
                },
                crewMembers: [
                    { id: '1', name: 'Captain Smith', nationality: 'UK', isSafetyOfficer: true },
                    { id: '2', name: 'First Mate Jones', nationality: 'USA', isSafetyOfficer: false },
                    { id: '3', name: 'Engineer Chen', nationality: 'China', isSafetyOfficer: false }
                ],
                decisionLog: []
            };

            expect(vvn.cargo.containers).toHaveLength(3);
            expect(vvn.crewMembers).toHaveLength(3);
            expect(vvn.crewMembers.filter(c => c.isSafetyOfficer)).toHaveLength(1);
            expect(vvn.cargo.weight).toBe(15000);
        });
    });
});

