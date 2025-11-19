// Custom errors for vessel business logic

// A general error for vessel use cases
export class VesselServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VesselServiceError';
    }
}

// A specific error for validation
export class VesselValidationError extends VesselServiceError {
    constructor(message: string) {
        super(message);
        this.name = 'VesselValidationError';
    }
}

