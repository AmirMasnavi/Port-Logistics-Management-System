// DTOs for VVE API
export interface CreateVveDto {
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string; // ISO string
    notes?: string;
}

export interface UpdateVveDto {
    status?: string;
    actualDepartureTime?: string; // ISO string
    notes?: string;
}

export interface VveResponseDto {
    vveId: string;
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string;
    actualDepartureTime?: string;
    status: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
}
