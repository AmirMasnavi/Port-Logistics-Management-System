export class ComplementaryTaskValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ComplementaryTaskValidationError';
    }
}

export class ComplementaryTaskNotFoundError extends Error {
    constructor(taskId: string) {
        super(`Complementary Task with ID '${taskId}' not found`);
        this.name = 'ComplementaryTaskNotFoundError';
    }
}
