// Domain Errors for VVE

export class IncidentTypeServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IncidentTypeServiceError';
    }
}

export class IncidentTypeValidationError extends IncidentTypeServiceError {
    constructor(message: string) {
        super(message);
        this.name = 'IncidentTypeValidationError';
    }
}

export class IncidentTypeNotFoundError extends IncidentTypeServiceError {
    constructor(vveId: string) {
        super(`VVE '${vveId}' not found`);
        this.name = 'IncidentTypeNotFoundError';
    }
}

