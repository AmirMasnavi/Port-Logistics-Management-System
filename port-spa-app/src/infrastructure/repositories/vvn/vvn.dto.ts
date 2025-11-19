// These DTOs (Data Transfer Objects) define the *exact shape*
// of the data we send to and receive from the API.
// We move them from src/types.ts (now src/domain/vvn/vvn.model.ts)

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

export interface CreateVvnDto {
    estimatedArrival: string;
    estimatedDeparture: string;
    vesselImo: string;
    representativeCitizenId: string;
    cargo: CreateCargoDto;
    crewMembers: CreateCrewMemberDto[];
}

export interface ApproveVvnDto {
    officerId: string;
    dockName: string;
}

export interface RejectVvnDto {
    officerId: string;
    reason: string;
}