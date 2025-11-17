// This is a great idea.
// We can define custom errors for our business logic.

// A general error for our VVN use cases
export class VvnServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VvnServiceError';
    }
}

// A specific error for validation
export class VvnValidationError extends VvnServiceError {
    constructor(message: string) {
        super(message);
        this.name = 'VvnValidationError';
    }
}