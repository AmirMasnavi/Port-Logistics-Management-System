// src/infrastructure/repositories/vessel/vessel.dto.ts
export interface CreateVesselDto {
    imoNumber: string;
    name: string;
    operator: string;  // Changed from 'owner' to match backend
    vesselTypeId: string;
}

export interface UpdateVesselDto {
    name?: string;
    operator?: string;  // Changed from 'owner' to match backend
    vesselTypeId?: string;
}