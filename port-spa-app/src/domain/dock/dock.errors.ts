// Custom errors for Dock business logic

// A general error for Dock use cases
export class DockServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DockServiceError';
    }
}

// A specific error for validation
export class DockValidationError extends DockServiceError {
    constructor(message: string) {
        super(message);
        this.name = 'DoockValidationError';
    }
}

