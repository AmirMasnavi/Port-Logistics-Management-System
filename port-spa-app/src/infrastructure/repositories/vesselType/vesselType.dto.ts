// DTOs (Data Transfer Objects) for Vessel Type
// These define the exact shape of data sent to and received from the API

export interface CreateVesselTypeDto {
    id: string;
    name: string;
    description: string;
    capacity: number;
    maxRows: number;
    maxBays: number;
    maxTiers: number;
}

export interface UpdateVesselTypeDto {
    name?: string;
    description?: string;
    capacity?: number;
    maxRows?: number;
    maxBays?: number;
    maxTiers?: number;
}

