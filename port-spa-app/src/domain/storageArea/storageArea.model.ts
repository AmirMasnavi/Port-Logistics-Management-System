export interface StorageArea {
    code: string; // public identifier, e.g. "YARD-3"
    type: string; // e.g. "Yard", "Warehouse"
    location: string; // e.g. "10, 10" or "(10, 10)"
    capacity: number;
    currentOccupancy: number;
}