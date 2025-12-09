// Domain Errors for VVE

export class VveServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VveServiceError';
    }
}

export class VveValidationError extends VveServiceError {
    constructor(message: string) {
        super(message);
        this.name = 'VveValidationError';
    }
}

export class VveNotFoundError extends VveServiceError {
    constructor(vveId: string) {
        super(`VVE '${vveId}' not found`);
        this.name = 'VveNotFoundError';
    }
}

export class VvnNotFoundError extends VveServiceError {
    constructor(vvnId: string) {
        super(`VVN '${vvnId}' not found or invalid`);
        this.name = 'VvnNotFoundError';
    }
}

