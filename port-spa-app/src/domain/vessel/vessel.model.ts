// src/domain/vessel/vessel.model.ts
export interface Vessel {
    id: string; 
    imoNumber: string; // O identificador de negócio
    name: string;
    operator: string;  // Changed from 'owner' to match backend
    vesselTypeId: string;
    createdAt: string;
}