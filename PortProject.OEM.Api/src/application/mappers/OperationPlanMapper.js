import { OperationPlanResponseDto } from '../dtos/OperationPlanDto.js';

export class OperationPlanMapper {
    /**
     * Convert persistence model to response DTO
     * @param {Object} model - Mongoose model instance
     */
    static toResponseDto(model) {
        return new OperationPlanResponseDto({
            planId: model.planId,
            date: model.date,
            algorithm: model.algorithm,
            geneticParams: model.geneticParams,
            createdBy: model.createdBy,
            status: model.status,
            createdAt: model.createdAt,
            scheduledTasksCount: model.scheduledTasks ? model.scheduledTasks.length : 0,
            metrics: model.metrics
        });
    }

    /**
     * Convert array of models to list of DTOs
     */
    static toListDto(models) {
        return models.map(model => this.toResponseDto(model));
    }
}