export class IncidentValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IncidentValidationError';
    }
}

export class IncidentNotFoundError extends Error {
    constructor(incidentId: string) {
        super(`Incident with ID '${incidentId}' not found`);
        this.name = 'IncidentNotFoundError';
    }
}

