// These DTOs (Data Transfer Objects) define the *exact shape*
// of the data we send to and receive from the API.

export interface StorageAreaCreateDto {
    type: string;
    location: string;
    capacity: number;
    currentOccupancy: number;
}

export interface StorageAreaUpdateDto {
    type: string;
    location: string;
    capacity: number;
    currentOccupancy: number;
}

