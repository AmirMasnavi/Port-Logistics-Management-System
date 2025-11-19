// DTOs (Data Transfer Objects) for Dock
// These define the exact shape of data sent to and received from the API

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

export interface UpdateDockDto {
    name: string;
    locationZone: string;
    locationSection: string;
    lengthInMeters: number;
    depthInMeters: number;
    maxDraftInMeters: number;
    numberOfSTSCranes: number;
    allowedVesselTypeIds?: string[];
}

