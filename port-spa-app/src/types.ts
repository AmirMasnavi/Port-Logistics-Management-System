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