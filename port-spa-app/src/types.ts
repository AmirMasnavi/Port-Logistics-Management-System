// This is the data we receive
export interface VesselType {
    id: string;
    name: string;
    description: string;
    capacity: number;
    maxRows: number;
    maxBays: number;
    maxTiers: number;
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
export interface Resource {
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
}

export interface RenderableResource {
    id: string; // id of the area where resource is placed (assignedArea)
    code: string;
    kind: string;
    position: [number, number, number];
    size: [number, number, number];
}
