/**
 * DTO for creating a new Operation Plan
 */
export class CreateOperationPlanDto {
    constructor({ date, algorithm, geneticParams, scheduledTasks, totalDelay, executionTimeMs }) {
        this.date = date;
        this.algorithm = algorithm;
        this.geneticParams = geneticParams;
        this.scheduledTasks = scheduledTasks;
        this.totalDelay = totalDelay;
        this.executionTimeMs = executionTimeMs;
    }

    validate() {
        const errors = [];

        if (!this.date) {
            errors.push('Target date is required');
        }

        if (!this.algorithm) {
            errors.push('Algorithm type is required');
        }

        if (!this.scheduledTasks || !Array.isArray(this.scheduledTasks) || this.scheduledTasks.length === 0) {
            errors.push('Scheduled tasks are required and must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * DTO for Operation Plan response
 */
export class OperationPlanResponseDto {
    constructor({
                    planId,
                    date,
                    algorithm,
                    geneticParams,
                    createdBy,
                    status,
                    createdAt,
                    scheduledTasksCount,
                    metrics
                }) {
        this.planId = planId;
        this.date = date;
        this.algorithm = algorithm;
        this.geneticParams = geneticParams;
        this.createdBy = createdBy;
        this.status = status;
        this.createdAt = createdAt;
        this.scheduledTasksCount = scheduledTasksCount;
        this.metrics = metrics;
    }
}