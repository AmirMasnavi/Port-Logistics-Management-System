// Custom errors for Vessel Type business logic

// A general error for Vessel Type use cases
export class VesselTypeServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VesselTypeServiceError';
    }
}

// A specific error for validation
export class VesselTypeValidationError extends VesselTypeServiceError {
    constructor(message: string) {
        super(message);
        this.name = 'VesselTypeValidationError';
    }
}

