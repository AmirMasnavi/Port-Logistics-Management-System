// This is the data we receive
export interface VesselType {
    id: string;
    name: string;
    description: string;
    capacity: number;
    maxRows: number;
    maxBays: number;
    maxTiers: number;
    modelPath?: string;
}

// This is the data we send when creating a new one
// Based on the backend DTO, ID is not required
export interface VesselTypeCreateDto {
    id: string;
    name: string;
    description: string;
    capacity: number;
    maxRows: number;
    maxBays: number;
    maxTiers: number;
}

// --- Types for the 3D visualization ---

// An element of the port layout returned by the PortLayout API
export interface LayoutElement {
    type: 'dock' | 'yard' | 'land' | 'water' | 'building' | string;
    id: string;
    name?: string;
    position: [number, number, number];
    size: [number, number, number];
}

// The overall layout shape
export interface PortLayout {
    elements: LayoutElement[];
}

// Vessel visit DTO (simplified to the fields used by the visualization)
export interface VesselVisit {
    id: string;
    vesselImo: string;
    assignedDockId?: string | null;
    status?: string;
}

// Resource DTO (cranes, etc.)
export interface VisualizationResource {
    id: string;
    code: string;
    kind: string; // e.g., 'STS Crane', 'Yard Crane'
    assignedArea?: string | null; // id of LayoutElement (dock or yard)
}

// Renderable objects used by the 3D scene
export interface RenderableVessel {
    id: string;
    imo: string;
    name: string;
    position: [number, number, number];
    size: [number, number, number];  
    modelUrl?: string; // Optional GLTF/OBJ model path
    rotation?: [number, number, number]; // optional Euler rotation in radians [x,y,z]
    
}

export interface RenderableResource {
    id: string; // id of the area where resource is placed (assignedArea)
    code: string;
    kind: string;
    position: [number, number, number];
    size: [number, number, number];
    modelUrl?: string; //  Optional GLTF/OBJ model path
}

// --- Vessel Visit Notification (New) ---

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
    id: string; // Guid
    name: string;
    nationality: string;
    isSafetyOfficer: boolean;
}

export interface DecisionLogEntry {
    id: number;
    timestamp: string; // DateTime
    officerId: string;
    outcome: 'Approved' | 'Rejected' | 'Reopened';
    reason: string | null;
}

// This is the main data structure we GET from the API
export interface VesselVisitNotification {
    id: string; // Guid (internal ID, kept for backward compatibility)
    businessId: string; // New: Business identifier like "VVN-123456789"
    status: 'InProgress' | 'Submitted' | 'Approved' | 'Rejected';
    estimatedArrival: string; // DateTime
    estimatedDeparture: string; // DateTime
    vesselImo: string;
    // `submittedBy` now holds the representative's display name (e.g. "Ana Silva").
    // Internal IDs (GUIDs) are not exposed by the API here to avoid leaking DB identifiers.
    submittedBy: string;
    assignedDockId: string | null;
    cargo: Cargo;
    crewMembers: CrewMember[];
    decisionLog: DecisionLogEntry[];
}

// --- DTOs for Sending Data (New) ---

export interface CreateContainerDto {
    containerCode: string;
    position: string;
}

export interface CreateCargoDto {
    description: string;
    weight: number;
    containers: CreateContainerDto[];
}

export interface CreateCrewMemberDto {
    name: string;
    nationality: string;
    isSafetyOfficer: boolean;
}

// DTO for POST /api/notifications
export interface CreateVvnDto {
    estimatedArrival: string;
    estimatedDeparture: string;
    vesselImo: string;
    representativeCitizenId: string; // Changed from representativeId (GUID) to CitizenId (e.g., "12345678Z")
    cargo: CreateCargoDto;
    crewMembers: CreateCrewMemberDto[];
}

// DTO for PATCH /api/notifications/{id}/approve
export interface ApproveVvnDto {
    officerId: string;
    dockId: string;
}

// DTO for PATCH /api/notifications/{id}/reject
export interface RejectVvnDto {
    officerId: string;
    reason: string;
}


export interface Dock {
    id: string;
    name: string;
    locationZone: string;
    locationSection: string;
    lengthInMeters: number;
    depthInMeters: number;
    maxDraftInMeters: number;
    numberOfSTSCranes: number;
    allowedVesselTypeIds?: string[];
}
        
export interface DockCreateDto {
    id: string;
    name: string;
    locationZone: string;
    locationSection: string;
    lengthInMeters: number;
    depthInMeters: number;
    maxDraftInMeters: number;
    numberOfSTSCranes: number;
    allowedVesselTypeIds?: string[];
}

// --- Storage Area types (Port Facilities) ---
export interface StorageArea {
    code: string; // public identifier, e.g. "YARD-3"
    type: string; // e.g. "Yard", "Warehouse"
    location: string; // e.g. "10, 10" or "(10, 10)"
    capacity: number;
    currentOccupancy: number;
}

export interface StorageAreaCreateDto {
    type: string;
    location: string;
    capacity: number;
    currentOccupancy: number;
}

// --- Resource types (Application Resources) ---
export interface Resource {
    code: string;
    description: string;
    kind: string;
    assignedArea?: string | null;
    status: string;
    setupTimeMinutes: number;
    operationalWindowStart: string;
    operationalWindowEnd: string;
    qualificationRequirements?: string[] | null;
    averageContainersPerHour?: number | null;
    containersPerTrip?: number | null;
    averageSpeedKmh?: number | null;
    otherUnit?: string | null;
    otherGenericValue?: number | null;
}
