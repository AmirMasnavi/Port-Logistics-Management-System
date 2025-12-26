export class ComplementaryTaskCategoryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ComplementaryTaskCategoryValidationError';
    }
}
export class ComplementaryTaskCategoryNotFoundError extends Error {
    constructor(categoryId: string) {
        super(`Complementary Task Category with ID '${categoryId}' not found`);
        this.name = 'ComplementaryTaskCategoryNotFoundError';
    }
}