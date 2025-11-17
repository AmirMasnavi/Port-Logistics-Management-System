// This is the "Recipe".
// These are your pure business entities. They have no API or React logic.
// We move the core interfaces from src/types.ts here.

export interface Container {
    id: number;
    containerCode: string;
    position: string;
}

export interface Cargo {
    id: number;
    description: string;
    weight: number;
    containers: Container[];
}

export interface CrewMember {
    id: string;
    name: string;
    nationality: string;
    isSafetyOfficer: boolean;
}

export interface DecisionLogEntry {
    id: number;
    timestamp: string;
    officerId: string;
    outcome: 'Approved' | 'Rejected' | 'Reopened';
    reason: string | null;
}

export interface VesselVisitNotification {
    id: string;
    businessId: string;
    status: 'InProgress' | 'Submitted' | 'Approved' | 'Rejected';
    estimatedArrival: string;
    estimatedDeparture: string;
    vesselImo: string;
    submittedBy: string;
    assignedDockId: string | null;
    cargo: Cargo;
    crewMembers: CrewMember[];
    decisionLog: DecisionLogEntry[];
}