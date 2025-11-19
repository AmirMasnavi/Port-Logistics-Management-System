// Domain Model for Vessel Type
// This is the pure business entity with no API or React logic

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

